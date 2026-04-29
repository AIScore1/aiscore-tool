import * as cheerio from 'cheerio';
import { CrawlResult, TechnicalSEOResult } from '../types';

const SECURITY_HEADERS = [
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'permissions-policy',
  'referrer-policy',
  'strict-transport-security',
];

export function scoreTechnicalSEO(crawl: CrawlResult): TechnicalSEOResult {
  const pages = crawl.pages;
  const homepage = pages[0];
  const $home = homepage ? cheerio.load(homepage.html) : null;

  // Crawlability (15)
  let crawlability = 0;
  if (crawl.robotsTxt) crawlability += 3;
  if (crawl.sitemapFound) crawlability += 4;
  // Avg internal links
  const internalLinkCounts: number[] = [];
  for (const p of pages) {
    const $ = cheerio.load(p.html);
    let count = 0;
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      try {
        const abs = new URL(href, p.url);
        if (abs.hostname === new URL(p.url).hostname) count++;
      } catch {}
    });
    internalLinkCounts.push(count);
  }
  const avgInternal = internalLinkCounts.length
    ? internalLinkCounts.reduce((a, b) => a + b, 0) / internalLinkCounts.length
    : 0;
  if (avgInternal > 3) crawlability += 5;
  if (crawl.brokenLinks.length === 0) crawlability += 3;

  // Indexability (12)
  let indexability = 0;
  let canonicalAll = pages.length > 0;
  let ogAll = pages.length > 0;
  for (const p of pages) {
    const $ = cheerio.load(p.html);
    if (!$('link[rel="canonical"]').attr('href')) canonicalAll = false;
    if (!$('meta[property="og:title"]').attr('content')) ogAll = false;
  }
  if (canonicalAll) indexability += 6;
  if (ogAll) indexability += 6;

  // Security (10)
  let security = 0;
  const isHttps = homepage?.url.startsWith('https://');
  if (isHttps) security += 6;
  if (homepage) {
    for (const h of SECURITY_HEADERS) {
      if (homepage.headers[h]) security += 0.67;
    }
  }
  security = Math.round(security * 10) / 10;

  // URL Structure (8)
  let urlStructure = 0;
  const lower = pages.every((p) => p.url === p.url.toLowerCase());
  const noUnderscores = pages.every((p) => !p.url.split('?')[0].includes('_'));
  const noExcessParams = pages.every((p) => {
    try {
      return Array.from(new URL(p.url).searchParams).length <= 2;
    } catch {
      return true;
    }
  });
  const shallowDepth = pages.every((p) => {
    try {
      return new URL(p.url).pathname.split('/').filter(Boolean).length <= 3;
    } catch {
      return true;
    }
  });
  if (lower) urlStructure += 2;
  if (noUnderscores) urlStructure += 2;
  if (noExcessParams) urlStructure += 2;
  if (shallowDepth) urlStructure += 2;

  // Mobile (6)
  let mobile = 0;
  if ($home && $home('meta[name="viewport"]').attr('content')) mobile += 3;
  // Approx no horizontal scroll — heuristic: viewport is set + responsive class hints
  if ($home && /max-width|responsive|mobile/i.test(homepage?.html || '')) mobile += 3;

  // Core Web Vitals (15)
  let cwv = 0;
  if (homepage && homepage.bytes < 100_000) cwv += 5;
  if (homepage) {
    const $ = cheerio.load(homepage.html);
    const blockingScripts = $('head script[src]:not([async]):not([defer])').length;
    if (blockingScripts === 0) cwv += 5;
  }
  // Compression
  if (homepage?.headers['content-encoding']?.match(/(gzip|br|deflate)/i)) cwv += 5;

  // SSR (15)
  let ssr = 0;
  if (homepage) {
    const $ = cheerio.load(homepage.html);
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    if (bodyText.length > 500) ssr += 15;
  }

  // Page Speed (12)
  const avgRT = pages.length
    ? pages.reduce((a, p) => a + p.responseTimeMs, 0) / pages.length
    : 9999;
  let pageSpeed = 2;
  if (avgRT < 200) pageSpeed = 12;
  else if (avgRT < 500) pageSpeed = 9;
  else if (avgRT < 1000) pageSpeed = 6;
  else if (avgRT < 2000) pageSpeed = 4;

  const total = Math.round(
    crawlability + indexability + security + urlStructure + mobile + cwv + ssr + pageSpeed
  );

  return {
    total: Math.min(100, total),
    crawlability: Math.round(crawlability),
    indexability,
    security,
    urlStructure,
    mobile,
    coreWebVitals: cwv,
    ssr,
    pageSpeed,
    details: {
      avgInternal,
      avgResponseTimeMs: avgRT,
      sitemapFound: crawl.sitemapFound,
      hasRobotsTxt: !!crawl.robotsTxt,
      isHttps,
    },
  };
}
