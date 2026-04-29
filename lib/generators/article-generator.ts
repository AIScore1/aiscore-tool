import { ArticleOutput, BusinessProfile } from '../types';
import { extractJson, run } from '../anthropic';

interface TopicSuggestion {
  title: string;
  targetQuery: string;
  rationale: string;
}

export async function suggestTopics(
  profile: BusinessProfile,
  count: number,
  existingTitles: string[] = []
): Promise<TopicSuggestion[]> {
  const user = `Generate ${count} article topics for ${profile.businessName} (${profile.sector}, ${profile.location}).
Services: ${profile.services.join(', ')} | Competitors: ${profile.competitors.join(', ')} | Already planned: ${existingTitles.join(', ') || 'none'}
Return: {"topics":[{"title":"...","targetQuery":"...","rationale":"..."}]}`;

  const text = await run({
    model: 'haiku',
    task: 'Article topic selection',
    system: 'You are a GEO content strategist. Return only valid JSON. No markdown.',
    user,
    maxTokens: 1500,
    clientName: profile.businessName,
  });
  const parsed = extractJson<{ topics: TopicSuggestion[] }>(text);
  return parsed?.topics ?? [];
}

export async function generateFullArticle(
  profile: BusinessProfile,
  brandVoiceSystemPrompt: string,
  title: string,
  targetQuery: string
): Promise<ArticleOutput> {
  const system = `${brandVoiceSystemPrompt}

Writing for ${profile.businessName} — South African ${profile.sector} in ${profile.location}.
Produce citation-optimised content. Be specific and original. South African context.`;

  const user = `Write a citation-optimised article.
Title: ${title} | Target query: ${targetQuery}
Business: ${profile.businessName} | Location: ${profile.location}
Services: ${profile.services.join(', ')} | Best result: ${profile.proofPoints} | Tone: ${profile.tonePreference}

Requirements:
- 1,100–1,400 words
- H2/H3 structure throughout
- First paragraph directly and completely answers the title query
- At least 3 specific numbers, statistics, or rand amounts
- South African context (rand pricing, SA regulations, local area references)
- Business name mentioned 4–6 times naturally — not forced
- 5–7 FAQ section at end (each FAQ answer is citation-ready)
- No filler — every paragraph earns its place
- Specific, relevant CTA at end
Format: clean markdown`;

  const content = await run({
    model: 'sonnet',
    task: 'Full article generation',
    system,
    user,
    maxTokens: 6000,
    clientName: profile.businessName,
  });
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return {
    id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    targetQuery,
    mode: 'full',
    content,
    wordCount,
    published: false,
  };
}

export async function generateOutlineArticle(
  profile: BusinessProfile,
  title: string,
  targetQuery: string
): Promise<ArticleOutput> {
  const user = `Generate an article outline.
Title: ${title} | Target query: ${targetQuery}
Business: ${profile.businessName} | Location: ${profile.location}

Output (markdown):
- Meta description (max 150 chars)
- Target AI query
- Recommended word count
- H2 sections (5–7), each with: heading, 3 bullet points of content to cover,
  1 key stat or fact to include, suggested word count for that section
- FAQ section: 5 questions to include
- CTA recommendation
- GEO note: why this article will be cited by AI engines`;
  const content = await run({
    model: 'haiku',
    task: 'Article outline generation',
    system:
      'You are a GEO content strategist. Output only clean markdown. Be specific to this business.',
    user,
    maxTokens: 1800,
    clientName: profile.businessName,
  });
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return {
    id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    targetQuery,
    mode: 'outline',
    content,
    wordCount,
    published: false,
  };
}
