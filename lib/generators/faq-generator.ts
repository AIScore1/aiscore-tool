import { BusinessProfile } from '../types';
import { extractJson, run } from '../anthropic';

const SYSTEM = `You are a GEO content expert for South African SMEs. Every FAQ answer must be:
self-contained, answer-first, and engineered for AI citation. Be specific to this
exact business. No generic content. South African context throughout.`;

export interface FAQResult {
  faqs: { question: string; answer: string }[];
  htmlPage: string;
  schemaJsonLd: string;
}

export async function generateFAQs(profile: BusinessProfile): Promise<FAQResult> {
  const user = `Generate 25 FAQ Q&As for ${profile.businessName} (${profile.sector}, ${profile.location}).
Services: ${profile.services.join(', ')} | Customers: ${profile.targetCustomers} | Tone: ${profile.tonePreference}
Unique difference: ${profile.uniqueDifference} | Best result: ${profile.proofPoints}
Top customer question: ${profile.primaryProblem} | Notes: ${profile.meetingNotes}

Requirements:
- Questions mirror actual AI query phrasing ("best", "how to", "cost of", "vs", "near me")
- At least 8 questions include location (e.g. "best accountant in Sandton")
- Include: comparison, process, trust, pricing, and "vs competitor" questions
- Each answer: 80–150 words, answer-first, business name mentioned naturally
- At least one specific fact, number, or rand amount per answer
- South African context throughout (SARS, rand pricing, SA laws, local areas)
- Questions must be specific to THIS business — not copyable by any competitor

Return ONLY: {"faqs":[{"question":"...","answer":"..."},...]} — exactly 25 items`;

  const text = await run({
    model: 'sonnet',
    task: 'FAQ hub generation',
    system: SYSTEM,
    user,
    maxTokens: 8000,
    clientName: profile.businessName,
  });

  const parsed = extractJson<{ faqs: { question: string; answer: string }[] }>(text);
  const faqs = parsed?.faqs ?? [];

  const htmlPage = renderFAQPage(profile.businessName, faqs);
  const schemaJsonLd = renderFAQSchema(faqs);

  return { faqs, htmlPage, schemaJsonLd };
}

export function renderFAQPage(businessName: string, faqs: { question: string; answer: string }[]): string {
  const items = faqs
    .map(
      (f, i) => `  <details class="faq-item" ${i === 0 ? 'open' : ''}>
    <summary>${escapeHtml(f.question)}</summary>
    <div class="answer">${escapeHtml(f.answer).replace(/\n/g, '<br>')}</div>
  </details>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en-ZA">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>FAQs — ${escapeHtml(businessName)}</title>
<style>
  body { font-family: -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif; max-width: 800px; margin: 0 auto; padding: 32px 20px; color: #1d1d1f; }
  h1 { font-size: 28px; margin-bottom: 24px; }
  .faq-item { border-bottom: 1px solid #e5e5e7; padding: 16px 0; }
  .faq-item summary { cursor: pointer; font-size: 18px; font-weight: 600; padding: 8px 0; }
  .faq-item summary:hover { color: #29a871; }
  .answer { padding: 12px 0 4px; line-height: 1.6; color: #424245; }
</style>
</head>
<body>
<h1>Frequently asked questions</h1>
${items}
</body>
</html>`;
}

export function renderFAQSchema(faqs: { question: string; answer: string }[]): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
  return `<script type="application/ld+json">
${JSON.stringify(data, null, 2)}
</script>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
