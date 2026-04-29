import { BusinessProfile } from '../types';
import { extractJson, run } from '../anthropic';

interface PromptItem {
  title: string;
  prompt: string;
  usageNotes: string;
}

const SYSTEM = `You are a senior prompt engineer. Output is a reusable prompt library for one specific
South African SME. Be specific, not generic. Return ONLY valid JSON.`;

export async function generatePromptLibrary(
  profile: BusinessProfile,
  brandVoiceSummary: string
): Promise<PromptItem[]> {
  const user = `Create a reusable prompt library.
Brand voice summary: ${brandVoiceSummary.slice(0, 1500)}
Business: ${profile.businessName} | Sector: ${profile.sector} | Location: ${profile.location}

Generate 6 prompts:
1. Master Brand Voice Prompt — system prompt for all AI content generation
2. Monthly Article Prompt — with slots [TOPIC], [QUERY], [MONTH]
3. FAQ Generator Prompt — for adding new FAQ pairs over time
4. LinkedIn Post Series — turn one article into 5 LinkedIn posts
5. Email Campaign — 4-email nurture sequence for new leads
6. Monthly Report Commentary — add strategic insight to GEO score reports

Each prompt: title, full ready-to-use prompt text, usage notes (2 sentences).
Return JSON: {"prompts":[{"title":"...","prompt":"...","usageNotes":"..."}]}`;

  const text = await run({
    model: 'haiku',
    task: 'Prompt library generation',
    system: SYSTEM,
    user,
    maxTokens: 4000,
    clientName: profile.businessName,
  });
  const parsed = extractJson<{ prompts: PromptItem[] }>(text);
  return parsed?.prompts ?? [];
}
