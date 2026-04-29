import * as cheerio from 'cheerio';
import { CrawlResult, SchemaMarkupResult } from '../types';

const TYPE_POINTS: Record<string, number> = {
  Organization: 25,
  Service: 20,
  LocalBusiness: 15,
  FAQPage: 15,
  WebSite: 10,
  BreadcrumbList: 10,
  VideoObject: 5,
};

export function scoreSchemaMarkup(crawl: CrawlResult): SchemaMarkupResult {
  const found = new Set<string>();
  let sameAsCount = 0;

  for (const p of crawl.pages) {
    const $ = cheerio.load(p.html);
    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).contents().text();
      try {
        const json = JSON.parse(raw);
        const items = Array.isArray(json) ? json : json['@graph'] ? json['@graph'] : [json];
        for (const item of items) {
          if (typeof item !== 'object' || item === null) continue;
          const t = (item as { '@type'?: string | string[] })['@type'];
          if (Array.isArray(t)) t.forEach((x) => found.add(x));
          else if (typeof t === 'string') found.add(t);
          // sameAs detection
          const sa = (item as { sameAs?: string | string[] }).sameAs;
          if (Array.isArray(sa)) sameAsCount += sa.length;
          else if (typeof sa === 'string') sameAsCount += 1;
        }
      } catch {}
    });
    // Also detect microdata itemtype
    $('[itemtype]').each((_, el) => {
      const t = ($(el).attr('itemtype') || '').split('/').pop();
      if (t) found.add(t);
    });
  }

  // Detect LocalBusiness subtypes (LegalService, MedicalBusiness, Restaurant, etc.)
  const localBusinessSubs = [
    'LegalService',
    'MedicalBusiness',
    'Restaurant',
    'Dentist',
    'AccountingService',
    'RealEstateAgent',
    'EducationalOrganization',
    'Hotel',
  ];
  for (const sub of localBusinessSubs) {
    if (found.has(sub)) found.add('LocalBusiness');
  }

  let score = 0;
  for (const [type, points] of Object.entries(TYPE_POINTS)) {
    if (found.has(type)) score += points;
  }
  score += sameAsCount * 2;

  if (found.size === 0) score = 5; // base score if nothing detected

  return {
    total: Math.min(100, Math.round(score)),
    schemasFound: Array.from(found),
    details: { sameAsCount },
  };
}
