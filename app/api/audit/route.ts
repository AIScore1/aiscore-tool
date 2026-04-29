import { NextRequest } from 'next/server';
import { crawlSite } from '@/lib/crawler';
import { scoreTechnicalSEO } from '@/lib/modules/technical-seo';
import { scoreSchemaMarkup } from '@/lib/modules/schema-markup';
import { scoreEEAT } from '@/lib/modules/eeat';
import { scoreAICrawlers } from '@/lib/modules/ai-crawlers';
import { scoreBrandAuthority } from '@/lib/modules/brand-authority';
import { scoreCitability } from '@/lib/modules/citability';
import {
  buildIssues,
  categoryScoresFrom,
  geoScore,
  grade,
  platformScores,
} from '@/lib/scoring';
import {
  generateActionPlan,
  generateAuditSchemaCode,
  generateEEATNarrative,
  generateExecutiveSummary,
} from '@/lib/generators/audit-narrative';
import { defaultExpiry, saveAudit } from '@/lib/store';
import { AuditReport } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface AuditRequest {
  url: string;
  businessName?: string;
  businessType?: string;
  sector?: string;
  location?: string;
  services?: string[];
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as AuditRequest;
  if (!body.url) {
    return new Response(JSON.stringify({ error: 'url required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      try {
        send({ type: 'progress', percent: 0, message: 'Starting audit...' });
        const crawl = await crawlSite(body.url, {
          maxPages: 50,
          onProgress: (info) => {
            if (info.phase === 'sitemap') {
              send({ type: 'progress', percent: 5, message: 'Reading sitemap...' });
            } else if (info.phase === 'crawl') {
              send({
                type: 'progress',
                percent: info.pct,
                message: info.url
                  ? `Crawling page ${info.current ?? '?'} of ${info.total ?? '?'}: ${info.url}`
                  : `Found ${info.total ?? '?'} pages to crawl`,
              });
            }
          },
        });

        send({ type: 'progress', percent: 72, message: 'Analysing technical SEO...' });
        const technical = scoreTechnicalSEO(crawl);
        send({ type: 'progress', percent: 76, message: 'Checking schema markup...' });
        const schema = scoreSchemaMarkup(crawl);
        send({ type: 'progress', percent: 80, message: 'Evaluating E-E-A-T signals...' });
        const eeat = scoreEEAT(crawl);
        send({ type: 'progress', percent: 83, message: 'Checking AI crawler access...' });
        const aiCrawlers = scoreAICrawlers(crawl);
        send({ type: 'progress', percent: 86, message: 'Researching brand authority...' });
        const brand = await scoreBrandAuthority(
          body.businessName || crawl.domain.split('.')[0]
        );
        send({ type: 'progress', percent: 88, message: 'Scoring content citability...' });
        const citability = await scoreCitability(crawl, body.businessName);

        const platform = platformScores({
          schema,
          technical,
          eeat,
          crawl,
          aiCrawlers,
          citability,
          brand,
        });
        const categoryScores = categoryScoresFrom({
          technical,
          schema,
          eeat,
          citability,
          brand,
          platform,
        });
        const score = geoScore(categoryScores);
        const issues = buildIssues({
          technical,
          schema,
          eeat,
          aiCrawlers,
          brand,
          citability,
          crawl,
        });

        send({ type: 'progress', percent: 90, message: 'Running AI analysis (1/4)...' });
        const executiveSummary = await generateExecutiveSummary({
          domain: crawl.domain,
          businessType: body.businessType ?? body.sector ?? 'business',
          score,
          grade: grade(score),
          pagesCrawled: crawl.pages.length,
          scores: categoryScores,
          critical: issues.critical,
          high: issues.high,
          clientName: body.businessName,
        });

        send({ type: 'progress', percent: 92, message: 'Running AI analysis (2/4)...' });
        const actionPlan = await generateActionPlan({
          findings: [...issues.critical, ...issues.high, ...issues.medium],
          scores: categoryScores,
          baseScore: score,
          clientName: body.businessName,
        });

        send({ type: 'progress', percent: 94, message: 'Running AI analysis (3/4)...' });
        const schemaCode = await generateAuditSchemaCode({
          domain: crawl.domain,
          businessName: body.businessName || crawl.domain,
          sector: body.sector || 'professional services',
          location: body.location || 'South Africa',
          services: body.services || [],
          socialLinks: extractSameAs(crawl),
          clientName: body.businessName,
        });

        send({ type: 'progress', percent: 96, message: 'Running AI analysis (4/4)...' });
        const eeatNarrative = await generateEEATNarrative({
          domain: crawl.domain,
          eeat,
          platforms: platform,
          brand,
          clientName: body.businessName,
        });

        send({ type: 'progress', percent: 98, message: 'Calculating final scores...' });

        const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const audit: AuditReport = {
          id,
          url: body.url,
          domain: crawl.domain,
          businessType: body.businessType ?? body.sector ?? 'business',
          generatedAt: new Date().toISOString(),
          expiresAt: defaultExpiry(),
          pagesCrawled: crawl.pages.length,
          geoScore: score,
          grade: grade(score),
          categoryScores,
          detail: {
            technicalSEO: technical,
            schemaMarkup: schema,
            eeat,
            aiCrawlers,
            brandAuthority: brand,
            citability,
            platformScores: platform,
          },
          findings: {
            critical: issues.critical,
            high: issues.high,
            medium: issues.medium,
          },
          executiveSummary,
          actionPlan,
          schemaCode,
          eeatNarrative,
        };
        await saveAudit(audit);

        send({ type: 'progress', percent: 100, message: 'Audit complete.' });
        send({ type: 'done', data: audit });
      } catch (err) {
        send({
          type: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

function extractSameAs(crawl: { pages: { html: string }[] }): string[] {
  const links = new Set<string>();
  const re = /https?:\/\/(?:www\.)?(linkedin|facebook|twitter|instagram|youtube|github)\.com[^\s"'<]+/gi;
  for (const p of crawl.pages) {
    let match;
    while ((match = re.exec(p.html)) !== null) links.add(match[0]);
  }
  return Array.from(links).slice(0, 10);
}
