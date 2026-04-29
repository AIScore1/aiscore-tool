import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getImprovement } from '@/lib/store';

export const runtime = 'nodejs';
export const maxDuration = 60;

const INSTRUCTIONS = `IMPLEMENTATION GUIDE — AI Score (aiscore.co.za)

robots.txt and llms.txt
Upload both files to the root folder of your website (the same level as your
homepage). Your hosting control panel or web developer can do this in under
5 minutes. It is a simple file upload.

Meta tags and schema
Paste the HTML into the <head> section of your website. Most website builders
have a setting called "Custom code injection" or "Header code" — paste there
and it applies automatically to all pages.

FAQ page
Your web developer can publish faq-page.html as a new page at /faq on your
website in under one hour. The HTML can also be pasted into most page builders.

Total implementation time: 1–3 hours.
No specialist knowledge required beyond basic website access.
Questions? Email found@aiscore.co.za`;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const r = await getImprovement(id);
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const zip = new JSZip();

  // 01 — Quick wins
  zip.file('01-quick-wins/robots.txt', r.quickWins.robotsTxt);
  zip.file('01-quick-wins/llms.txt', r.quickWins.llmsTxt);
  zip.file('01-quick-wins/meta-tags.html', r.quickWins.metaTags);
  zip.file('01-quick-wins/INSTRUCTIONS.txt', INSTRUCTIONS);

  // 02 — Schema
  for (const s of r.schemas) {
    const slug = slugify(s.label || s.type);
    zip.file(`02-schema/${slug}-schema.json`, s.code);
  }
  zip.file('02-schema/INSTRUCTIONS.txt', INSTRUCTIONS);

  // 03 — FAQ Hub
  zip.file('03-faq-hub/faq-page.html', r.faqHub.htmlPage);
  zip.file('03-faq-hub/faq-schema.json', r.faqHub.schemaJsonLd);
  zip.file('03-faq-hub/INSTRUCTIONS.txt', INSTRUCTIONS);

  // 04 — Articles
  r.articles.forEach((a, i) => {
    zip.file(`04-articles/article-${i + 1}-${slugify(a.title)}.md`, a.content);
  });
  const schedule = r.articles
    .map(
      (a, i) =>
        `## Article ${i + 1}: ${a.title}\nTarget query: ${a.targetQuery}\nMode: ${a.mode}\nWord count: ${a.wordCount}\nPublished: ${a.published ? 'yes' : 'no'}\n`
    )
    .join('\n---\n\n');
  zip.file('04-articles/publishing-schedule.md', schedule);

  // 05 — Brand voice
  zip.file('05-brand-voice/brand-voice-document.md', r.brandVoice);
  zip.file(
    '05-brand-voice/ai-content-system-prompt.txt',
    extractSystemPrompt(r.brandVoice)
  );

  // 06 — Strategy
  zip.file('06-strategy/pillar-cluster-strategy.md', r.contentStrategy);

  // 07 — Prompt library
  const promptsTxt = r.promptLibrary
    .map(
      (p) =>
        `=== ${p.title} ===\n\n${p.prompt}\n\n--- Usage notes ---\n${p.usageNotes}\n\n`
    )
    .join('\n\n');
  zip.file('07-prompt-library/prompt-library.txt', promptsTxt);

  const uint8array = await zip.generateAsync({ type: 'uint8array' });
  const buffer = Buffer.from(uint8array);
  const filename = `aiscore-${slugify(r.profile.businessName)}-${new Date()
    .toISOString()
    .split('T')[0]}.zip`;
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function extractSystemPrompt(doc: string): string {
  const idx = doc.search(/##?\s*\d?\.?\s*AI Content System Prompt/i);
  if (idx === -1) return doc.slice(0, 1500);
  const remainder = doc.slice(idx);
  const lines = remainder.split('\n');
  const out: string[] = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    if (/^#\s/.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out.join('\n').trim();
}
