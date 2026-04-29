import * as cheerio from 'cheerio';
import { CrawlResult, EEATResult } from '../types';

export function scoreEEAT(crawl: CrawlResult): EEATResult {
  const pages = crawl.pages;
  const homepage = pages[0];

  // Experience (25)
  let experience = 0;
  const wordCounts = pages.map((p) => p.text.split(/\s+/).filter(Boolean).length);
  const avgWords = wordCounts.length ? wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length : 0;
  if (avgWords > 1500) experience += 10;
  const allText = pages.map((p) => p.text).join(' ').toLowerCase();
  if (/\b(i|we|our team|i've|we've|in my|in our experience)\b/.test(allText)) experience += 5;
  if (/\bcase stud(y|ies)\b/.test(allText)) experience += 5;
  if (/\b(testimonial|client says|customer review|review[\s:])/.test(allText)) experience += 5;

  // Expertise (25)
  let expertise = 0;
  for (const p of pages) {
    const $ = cheerio.load(p.html);
    if ($('[rel="author"]').length || $('.author, .byline').length || $('[itemprop="author"]').length) {
      expertise += 8;
      break;
    }
  }
  if (/\b(certified|qualified|chartered|accredited|registered|member of|fellow of|cfa|cpa|llb|md\.|phd|mba)\b/.test(allText))
    expertise += 8;
  let h2Count = 0;
  for (const p of pages) {
    const $ = cheerio.load(p.html);
    h2Count += $('h2').length;
  }
  if (h2Count > 5) expertise += 5;
  if (/\b(study|research|according to|cited|reference)\b/.test(allText)) expertise += 4;

  // Authoritativeness (25)
  let authoritativeness = 0;
  let externalLinks = 0;
  for (const p of pages) {
    const $ = cheerio.load(p.html);
    $('a[href^="http"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      try {
        if (new URL(href).hostname !== new URL(p.url).hostname) externalLinks++;
      } catch {}
    });
  }
  if (externalLinks > 5) authoritativeness += 8;
  if (/\b(google reviews|trust pilot|trustpilot|hello peter|bbb|verified|accredited)\b/.test(allText))
    authoritativeness += 5;
  if (/\b(industry|sector|expert|leader|specialist|consultant)\b/.test(allText)) authoritativeness += 5;
  if (/\b(featured in|as seen in|mentioned in|news24|business day|fin24|moneyweb|bizcommunity)\b/.test(allText))
    authoritativeness += 7;

  // Trustworthiness (25)
  let trustworthiness = 0;
  if (homepage?.url.startsWith('https://')) trustworthiness += 8;
  if (/privacy[\s-]?policy|popi|popia/.test(allText)) trustworthiness += 5;
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.-]+/.test(allText);
  const hasPhone = /(\+27|0[1-9])[\s\-]?\d{2,3}[\s\-]?\d{3,4}[\s\-]?\d{3,4}/.test(allText);
  if (hasEmail && hasPhone) trustworthiness += 5;
  if (/\b(suite|address|street|road|avenue|cape town|sandton|johannesburg|durban|pretoria|stellenbosch|midrand)\b/i.test(
      allText
    ))
    trustworthiness += 4;
  if (/\b(secure|ssl|verified|guarantee|bbb|trust\s?(seal|mark))\b/.test(allText)) trustworthiness += 3;

  experience = Math.min(25, experience);
  expertise = Math.min(25, expertise);
  authoritativeness = Math.min(25, authoritativeness);
  trustworthiness = Math.min(25, trustworthiness);

  return {
    total: experience + expertise + authoritativeness + trustworthiness,
    experience,
    expertise,
    authoritativeness,
    trustworthiness,
    details: { avgWords, externalLinks, h2Count },
  };
}
