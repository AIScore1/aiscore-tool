import { BusinessProfile } from '../types';
import { run } from '../anthropic';

const SYSTEM = `You are a brand strategist. Your output is the master content reference for this client.
Make it specific to THIS business. No generic advice. No filler.`;

export async function generateBrandVoice(profile: BusinessProfile): Promise<string> {
  const user = `Create a brand voice document.
Business: ${profile.businessName} | Sector: ${profile.sector} | Location: ${profile.location}
Services: ${profile.services.join(', ')} | Client description (Q1): ${profile.clientDescription}
Unique difference (Q2): ${profile.uniqueDifference} | Tone (Q3): ${profile.tonePreference}
Best result (Q4): ${profile.proofPoints} | Top question (Q5): ${profile.primaryProblem}
Notes: ${profile.meetingNotes}

Sections:
1. Brand Voice Summary (3 sentences — the essence of this brand)
2. Tone & Personality (4 adjectives + 2-sentence explanation each)
3. Writing Style Guide (sentence length, vocabulary level, SA references, technical terms)
4. Do Say / Don't Say (10 pairs with real examples for this business)
5. Key Phrases (10 phrases that feel authentically like this brand)
6. Never Use (10 generic phrases to eliminate from all content)
7. Origin Story Template (100 words, bracketed variables for client to customise)
8. AI Content System Prompt — MOST IMPORTANT SECTION
   A complete, ready-to-use Claude system prompt that encodes this brand voice.
   Must be comprehensive enough that any Claude conversation using it produces
   on-brand content without further instruction. Minimum 200 words.

Format: clean markdown. Specific throughout.`;

  return run({
    model: 'sonnet',
    task: 'Brand voice generation',
    system: SYSTEM,
    user,
    maxTokens: 5000,
    clientName: profile.businessName,
  });
}

export function extractSystemPrompt(brandVoiceDoc: string): string {
  // Find section "AI Content System Prompt" and return content after it
  const idx = brandVoiceDoc.search(/##?\s*\d?\.?\s*AI Content System Prompt/i);
  if (idx === -1) return brandVoiceDoc.slice(0, 1500);
  const remainder = brandVoiceDoc.slice(idx);
  // Find next H1/H2 heading after that or end of doc
  const lines = remainder.split('\n');
  const out: string[] = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    if (/^#\s/.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out.join('\n').trim();
}
