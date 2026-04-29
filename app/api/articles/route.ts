import { NextRequest, NextResponse } from 'next/server';
import {
  generateFullArticle,
  generateOutlineArticle,
  suggestTopics,
} from '@/lib/generators/article-generator';
import { extractSystemPrompt } from '@/lib/generators/brand-voice-generator';
import { getImprovement, listImprovements, saveImprovement } from '@/lib/store';
import { ArticleOutput } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 600;

interface RetainerBody {
  improvementId: string;
  articles: { title?: string; targetQuery?: string; mode: 'full' | 'outline' }[];
}

export async function GET() {
  return NextResponse.json({ clients: await listImprovements() });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RetainerBody;
  if (!body.improvementId || !Array.isArray(body.articles)) {
    return NextResponse.json({ error: 'improvementId and articles required' }, { status: 400 });
  }
  const improvement = await getImprovement(body.improvementId);
  if (!improvement) {
    return NextResponse.json({ error: 'Improvement profile not found or expired' }, { status: 404 });
  }
  const profile = improvement.profile;
  const systemPrompt = extractSystemPrompt(improvement.brandVoice);

  const titlesNeeded = body.articles.filter((a) => !a.title).length;
  let suggested: { title: string; targetQuery: string }[] = [];
  if (titlesNeeded > 0) {
    suggested = await suggestTopics(
      profile,
      titlesNeeded,
      improvement.articles.map((a) => a.title)
    );
  }
  const generated: ArticleOutput[] = [];
  let suggestionIdx = 0;
  for (const a of body.articles) {
    let title = a.title;
    let targetQuery = a.targetQuery;
    if (!title) {
      const s = suggested[suggestionIdx++];
      title = s?.title ?? `Article topic ${suggestionIdx}`;
      targetQuery = s?.targetQuery ?? title;
    }
    if (!targetQuery) targetQuery = title;
    const out =
      a.mode === 'full'
        ? await generateFullArticle(profile, systemPrompt, title, targetQuery)
        : await generateOutlineArticle(profile, title, targetQuery);
    generated.push(out);
  }
  improvement.articles.push(...generated);
  await saveImprovement(improvement);

  return NextResponse.json({ articles: generated });
}
