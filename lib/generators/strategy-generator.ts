import { BusinessProfile } from '../types';
import { run } from '../anthropic';

const SYSTEM = `GEO content strategist for South African SMEs. Be specific and actionable.`;

export async function generateContentStrategy(
  profile: BusinessProfile,
  articleTitles: string[]
): Promise<string> {
  const user = `Create a 90-day pillar-cluster content strategy.
Business: ${profile.businessName} | Sector: ${profile.sector} | Location: ${profile.location}
Services: ${profile.services.join(', ')} | Customers: ${profile.targetCustomers} | Competitors: ${profile.competitors.join(', ')}
Articles already generated: ${articleTitles.join(', ') || 'none'}

Sections:
1. Three pillar topics — broad themes that capture the main AI queries in this
   sector and location. Each: topic name, primary target query, rationale,
   5 cluster article titles, competitive gap this business can own.

2. 12-week content calendar — continuing after the 4 initial articles.
   Markdown table: Week | Article title | Pillar | Target query | Why this sequence

3. Quick win topics — 3 niche topics for AI citations within 30 days.
   (Specific, local, low competition.)

4. Competitor gap analysis — what each competitor is NOT covering that this
   business can own immediately.

Format: clean markdown with tables. Specific to this business throughout.`;

  return run({
    model: 'sonnet',
    task: 'Content strategy generation',
    system: SYSTEM,
    user,
    maxTokens: 5000,
    clientName: profile.businessName,
  });
}
