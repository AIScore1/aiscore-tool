import { NextRequest } from 'next/server';
import { BusinessProfile, ImprovementResult } from '@/lib/types';
import { generateRobotsTxt } from '@/lib/generators/robots-txt';
import { generateLlmsTxt } from '@/lib/generators/llms-txt';
import { generateOgTags } from '@/lib/generators/og-tags';
import { generateSchemas } from '@/lib/generators/schema-generator';
import { generateFAQs } from '@/lib/generators/faq-generator';
import {
  extractSystemPrompt,
  generateBrandVoice,
} from '@/lib/generators/brand-voice-generator';
import {
  generateFullArticle,
  generateOutlineArticle,
  suggestTopics,
} from '@/lib/generators/article-generator';
import { generateContentStrategy } from '@/lib/generators/strategy-generator';
import { generatePromptLibrary } from '@/lib/generators/prompt-library-generator';
import { defaultExpiry, saveImprovement } from '@/lib/store';

export const runtime = 'nodejs';
export const maxDuration = 600;

interface ImproveBody {
  profile: BusinessProfile;
  topicTitles?: string[];
  articleModes?: ('full' | 'outline')[];
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ImproveBody;
  if (!body?.profile?.businessName || !body?.profile?.url) {
    return new Response(JSON.stringify({ error: 'profile required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const profile: BusinessProfile = {
    ...body.profile,
    domain: body.profile.domain || extractDomain(body.profile.url),
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (d: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(d)}\n\n`));
      try {
        send({ type: 'progress', percent: 5, message: 'Generating Quick Wins files...' });
        const robotsTxt = generateRobotsTxt(profile.domain);
        const llmsTxt = generateLlmsTxt(profile);
        const metaTags = generateOgTags(profile);

        send({ type: 'progress', percent: 15, message: 'Generating Schema markup...' });
        const schemas = await generateSchemas(profile, []);

        send({ type: 'progress', percent: 30, message: 'Generating Brand Voice document...' });
        const brandVoice = await generateBrandVoice(profile);
        const systemPrompt = extractSystemPrompt(brandVoice);

        send({ type: 'progress', percent: 45, message: 'Generating FAQ Hub (25 Q&As)...' });
        const faqHub = await generateFAQs(profile);

        send({ type: 'progress', percent: 60, message: 'Selecting article topics...' });
        const topics = body.topicTitles?.length
          ? body.topicTitles.map((t) => ({ title: t, targetQuery: t, rationale: '' }))
          : await suggestTopics(profile, 4);

        const modes = body.articleModes ?? topics.map(() => 'full' as const);
        const articles = [];
        for (let i = 0; i < topics.length; i++) {
          const t = topics[i];
          const mode = modes[i] ?? 'full';
          send({
            type: 'progress',
            percent: 60 + Math.floor(((i + 1) / topics.length) * 20),
            message: `Generating article ${i + 1}/${topics.length}: ${t.title}`,
          });
          const article =
            mode === 'full'
              ? await generateFullArticle(profile, systemPrompt, t.title, t.targetQuery)
              : await generateOutlineArticle(profile, t.title, t.targetQuery);
          articles.push(article);
        }

        send({ type: 'progress', percent: 85, message: 'Generating Content Strategy...' });
        const contentStrategy = await generateContentStrategy(
          profile,
          articles.map((a) => a.title)
        );

        send({ type: 'progress', percent: 92, message: 'Generating Prompt Library...' });
        const promptLibrary = await generatePromptLibrary(profile, brandVoice);

        send({ type: 'progress', percent: 98, message: 'Saving pack...' });
        const id = `imp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const result: ImprovementResult = {
          id,
          profile,
          generatedAt: new Date().toISOString(),
          expiresAt: defaultExpiry(),
          quickWins: { robotsTxt, llmsTxt, metaTags },
          schemas,
          faqHub,
          articles,
          brandVoice,
          contentStrategy,
          promptLibrary,
        };
        await saveImprovement(result);

        send({ type: 'progress', percent: 100, message: 'Pack complete.' });
        send({ type: 'done', data: result });
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

function extractDomain(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
