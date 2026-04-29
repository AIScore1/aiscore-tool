import { NextRequest, NextResponse } from 'next/server';
import { crawlSiteLite } from '@/lib/crawler';
import { scoreTechnicalSEO } from '@/lib/modules/technical-seo';
import { scoreSchemaMarkup } from '@/lib/modules/schema-markup';
import { scoreEEAT } from '@/lib/modules/eeat';
import { aiCrawlerAccessPercent, scoreAICrawlers } from '@/lib/modules/ai-crawlers';
import { scoreBrandAuthority } from '@/lib/modules/brand-authority';
import { scoreCitability } from '@/lib/modules/citability';
import {
  buildIssues,
  categoryScoresFrom,
  geoScore,
  grade,
  platformScores,
  quickWinsFromIssues,
} from '@/lib/scoring';
import { detectSector, getBenchmark } from '@/lib/sector-benchmarks';
import { ipFromRequest, rateLimitCheck } from '@/lib/rate-limit';
import { addLead } from '@/lib/store';
import { calculateTemperature } from '@/lib/lead-temperature';
import { addToMailerLite, sendLeadNotification, sendScoreReport } from '@/lib/email';
import {
  CategoryScores,
  CitabilityResult,
  CrawlResult,
  Lead,
  PublicAuditInput,
  PublicAuditResult,
} from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.PUBLIC_AUDIT_ORIGIN || 'https://aiscore.co.za',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);
  const rate = rateLimitCheck(ip);
  if (!rate.allowed) {
    return NextResponse.json({ error: rate.reason }, { status: 429, headers: corsHeaders });
  }

  let body: PublicAuditInput;
  try {
    body = (await req.json()) as PublicAuditInput;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders });
  }

  if (!body.name || !body.email || !body.url) {
    return NextResponse.json(
      { error: 'name, email and url are required' },
      { status: 400, headers: corsHeaders }
    );
  }

  if (rate.captchaRequired && !body.captchaAnswer) {
    return NextResponse.json(
      { error: 'CAPTCHA_REQUIRED', captchaRequired: true },
      { status: 400, headers: corsHeaders }
    );
  }

  let prospectCrawl: CrawlResult;
  let competitorCrawl: CrawlResult | null = null;
  try {
    prospectCrawl = await crawlSiteLite(body.url);
  } catch (e) {
    return NextResponse.json(
      {
        error: 'We could not reach this website. Please check the URL and try again.',
        geoScore: null,
      },
      { status: 200, headers: corsHeaders }
    );
  }

  if (body.competitorUrl) {
    try {
      competitorCrawl = await crawlSiteLite(body.competitorUrl);
    } catch {
      competitorCrawl = null;
    }
  }

  const [prospectResult, competitorResult] = await Promise.all([
    scoreSite(prospectCrawl, prospectCrawl.domain),
    competitorCrawl ? scoreSite(competitorCrawl, competitorCrawl.domain) : Promise.resolve(null),
  ]);

  const sectorKey = detectSector(prospectCrawl.pages[0]?.text || '');
  const benchmark = getBenchmark(sectorKey);

  const projectedScores = {
    afterQuickWins: Math.min(prospectResult.score + 18, 72),
    afterFoundation: Math.min(prospectResult.score + 38, 91),
  };

  const reportId = generateReportId();
  const generatedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const result: PublicAuditResult = {
    reportId,
    generatedAt,
    expiresAt,
    prospect: {
      domain: prospectCrawl.domain,
      geoScore: prospectResult.score,
      grade: grade(prospectResult.score),
      categoryScores: prospectResult.categoryScores,
      topIssues: prospectResult.topIssues,
      quickWins: prospectResult.quickWins,
      aiCrawlerAccess: prospectResult.aiCrawlerAccess,
      hasLlmsTxt: prospectResult.hasLlmsTxt,
      hasSchema: prospectResult.hasSchema,
    },
    competitor: competitorResult
      ? {
          domain: competitorCrawl!.domain,
          geoScore: competitorResult.score,
          grade: grade(competitorResult.score),
          categoryScores: competitorResult.categoryScores,
        }
      : undefined,
    sectorBenchmark: {
      sector: sectorKey,
      averageScore: benchmark.avg,
      label: benchmark.label,
    },
    projectedScores,
  };

  const competitorScore = competitorResult?.score ?? 0;
  const scoreGap = competitorResult ? Math.max(0, competitorScore - prospectResult.score) : 0;

  const lead: Lead = {
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: generatedAt,
    reportId,
    reportExpiresAt: expiresAt,
    name: body.name.trim(),
    email: body.email.trim(),
    phone: body.phone?.trim() || undefined,
    domain: prospectCrawl.domain,
    competitorDomain: competitorCrawl?.domain,
    geoScore: prospectResult.score,
    competitorScore: competitorResult?.score,
    sector: sectorKey,
    sectorAverage: benchmark.avg,
    scoreGap,
    temperature: 'cold',
    status: 'new',
    notes: '',
    categoryScores: prospectResult.categoryScores,
    topIssues: prospectResult.topIssues,
    read: false,
  };
  lead.temperature = calculateTemperature(lead);
  await addLead(lead);

  // Fire-and-forget side effects
  Promise.allSettled([
    sendScoreReport(lead, result),
    sendLeadNotification(lead, result),
    addToMailerLite(lead, result),
  ]);

  return NextResponse.json(result, { status: 200, headers: corsHeaders });
}

interface SiteScore {
  score: number;
  categoryScores: CategoryScores;
  topIssues: PublicAuditResult['prospect']['topIssues'];
  quickWins: string[];
  aiCrawlerAccess: number;
  hasLlmsTxt: boolean;
  hasSchema: boolean;
}

async function scoreSite(crawl: CrawlResult, brandHint: string): Promise<SiteScore> {
  const technical = scoreTechnicalSEO(crawl);
  const schema = scoreSchemaMarkup(crawl);
  const eeat = scoreEEAT(crawl);
  const aiCrawlers = scoreAICrawlers(crawl);
  // Lite audit skips citability AI calls and brand authority lookups for speed and zero cost.
  const citability: CitabilityResult = { total: 50, blocks: [], averageStatDensity: 0 };
  const brand = await scoreBrandAuthority(deriveBrandName(brandHint));
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
  return {
    score,
    categoryScores,
    topIssues: issues.topThree,
    quickWins: quickWinsFromIssues(issues.topThree),
    aiCrawlerAccess: aiCrawlerAccessPercent(aiCrawlers),
    hasLlmsTxt: aiCrawlers.hasLlmsTxt,
    hasSchema: schema.schemasFound.length > 0,
  };
}

function deriveBrandName(domain: string): string {
  return domain.replace(/^www\./, '').split('.')[0].replace(/-/g, ' ');
}

function generateReportId(): string {
  const date = new Date();
  const ymd = date.toISOString().split('T')[0].replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `GEO-${ymd}-${rand}`;
}

