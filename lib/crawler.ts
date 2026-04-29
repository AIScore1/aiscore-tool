import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';
import { CrawlResult, CrawledPage } from './types';

const USER_AGENT = 'AIScore-GEO-Audit/1.0 (found@aiscore.co.za)';
const TIMEOUT_MS = 10_000;
const REQUEST_DELAY_MS = 100;
const CONCURRENCY = 5;

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^192\.168\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /\.local$/i,
  /^example\.(com|org|net)$/i,
];

export function isPrivateHost(host: string): boolean {
  return PRIVATE_HOST_PATTERNS.some((p) => p.test(host));
}

export function normaliseUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  try {
    const u = new URL(url);
    return u.origin + u.pathname.replace(/\/$/, '') || u.origin;
  } catch {
    return input;
  }
}

export function getDomain(url: string): string {
  try {
    return new URL(normaliseUrl(url)).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

async function fetchPage(url: string): Promise<CrawledPage | null> {
  const start = Date.now();
  try {
    const res: AxiosResponse<string> = await axios.get(url, {
      timeout: TIMEOUT_MS,
      headers: { 'User-Agent': USER_AGENT },
      maxRedirects: 5,
      responseType: 'text',
      validateStatus: () => true,
    });
    const responseTimeMs = Date.now() - start;
    const html = typeof res.data === 'string' ? res.data : String(res.data);
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(res.headers)) {
      headers[k.toLowerCase()] = String(v);
    }
    const contentType = headers['content-type'] || '';
    if (res.status >= 400 || !contentType.includes('html')) return null;
    const $ = cheerio.load(html);
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const title = $('title').first().text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    return {
      url,
      status: res.status,
      html,
      text,
      title,
      metaDescription,
      responseTimeMs,
      headers,
      contentType,
      bytes: Buffer.byteLength(html, 'utf-8'),
    };
  } catch {
    return null;
  }
}

export async function fetchHomepage(input: string): Promise<CrawledPage | null> {
  const url = normaliseUrl(input);
  return fetchPage(url);
}

export async function fetchRobotsTxt(origin: string): Promise<string | null> {
  try {
    const res = await axios.get(origin + '/robots.txt', {
      timeout: TIMEOUT_MS,
      headers: { 'User-Agent': USER_AGENT },
      validateStatus: () => true,
      responseType: 'text',
    });
    if (res.status === 200 && typeof res.data === 'string') return res.data;
  } catch {}
  return null;
}

export async function fetchLlmsTxt(origin: string): Promise<string | null> {
  try {
    const res = await axios.get(origin + '/llms.txt', {
      timeout: TIMEOUT_MS,
      headers: { 'User-Agent': USER_AGENT },
      validateStatus: () => true,
      responseType: 'text',
    });
    if (res.status === 200 && typeof res.data === 'string' && res.data.length > 0) return res.data;
  } catch {}
  return null;
}

async function discoverSitemapUrls(origin: string, robotsTxt: string | null): Promise<string[]> {
  const candidates: string[] = [];
  if (robotsTxt) {
    const lines = robotsTxt.split('\n');
    for (const line of lines) {
      const m = line.match(/^\s*sitemap:\s*(\S+)/i);
      if (m) candidates.push(m[1].trim());
    }
  }
  candidates.push(origin + '/sitemap.xml', origin + '/sitemap_index.xml');
  return Array.from(new Set(candidates));
}

async function parseSitemap(url: string): Promise<string[]> {
  try {
    const res = await axios.get(url, {
      timeout: TIMEOUT_MS,
      headers: { 'User-Agent': USER_AGENT },
      validateStatus: () => true,
      responseType: 'text',
    });
    if (res.status !== 200 || typeof res.data !== 'string') return [];
    const parsed = await parseStringPromise(res.data, { explicitArray: false });
    const urls: string[] = [];
    if (parsed.urlset?.url) {
      const items = Array.isArray(parsed.urlset.url) ? parsed.urlset.url : [parsed.urlset.url];
      for (const item of items) {
        if (item?.loc) urls.push(typeof item.loc === 'string' ? item.loc : item.loc._);
      }
    } else if (parsed.sitemapindex?.sitemap) {
      const items = Array.isArray(parsed.sitemapindex.sitemap)
        ? parsed.sitemapindex.sitemap
        : [parsed.sitemapindex.sitemap];
      for (const item of items) {
        if (item?.loc) {
          const sub = await parseSitemap(typeof item.loc === 'string' ? item.loc : item.loc._);
          urls.push(...sub);
          if (urls.length > 200) break;
        }
      }
    }
    return urls;
  } catch {
    return [];
  }
}

async function pMap<T, R>(items: T[], fn: (item: T) => Promise<R>, concurrency: number): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx++;
      try {
        results[i] = await fn(items[i]);
      } catch {
        results[i] = undefined as unknown as R;
      }
      await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    }
  });
  await Promise.all(workers);
  return results;
}

export interface CrawlOptions {
  maxPages?: number;
  onProgress?: (info: { phase: string; pct: number; current?: number; total?: number; url?: string }) => void;
}

export async function crawlSite(rootUrl: string, opts: CrawlOptions = {}): Promise<CrawlResult> {
  const maxPages = opts.maxPages ?? 50;
  const onProgress = opts.onProgress ?? (() => {});

  const normalised = normaliseUrl(rootUrl);
  const u = new URL(normalised);
  const origin = u.origin;
  const domain = u.hostname.replace(/^www\./, '');

  if (isPrivateHost(u.hostname)) {
    throw new Error('Private/local host not allowed');
  }

  onProgress({ phase: 'sitemap', pct: 5 });
  const robotsTxt = await fetchRobotsTxt(origin);
  const llmsTxt = await fetchLlmsTxt(origin);
  const sitemapCandidates = await discoverSitemapUrls(origin, robotsTxt);
  let urls: string[] = [];
  let sitemapFound = false;
  for (const candidate of sitemapCandidates) {
    const urlsFromSitemap = await parseSitemap(candidate);
    if (urlsFromSitemap.length > 0) {
      urls = urlsFromSitemap;
      sitemapFound = true;
      break;
    }
  }

  // Always include homepage; dedupe and clamp.
  if (!urls.includes(normalised)) urls.unshift(normalised);
  urls = Array.from(new Set(urls)).slice(0, maxPages);

  // If sitemap discovery failed, fall back to homepage + crawled internal links.
  if (!sitemapFound) {
    const home = await fetchPage(normalised);
    const linked: string[] = [];
    if (home) {
      const $ = cheerio.load(home.html);
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        try {
          const abs = new URL(href, normalised).toString();
          if (new URL(abs).hostname.replace(/^www\./, '') === domain) {
            linked.push(abs.split('#')[0]);
          }
        } catch {}
      });
    }
    urls = Array.from(new Set([normalised, ...linked])).slice(0, maxPages);
  }

  onProgress({ phase: 'crawl', pct: 15, total: urls.length });

  const pages: CrawledPage[] = [];
  let processed = 0;

  await pMap(
    urls,
    async (url) => {
      const page = await fetchPage(url);
      processed++;
      const pct = 20 + Math.floor((processed / urls.length) * 50);
      onProgress({ phase: 'crawl', pct, current: processed, total: urls.length, url });
      if (page) pages.push(page);
    },
    CONCURRENCY
  );

  // Get homepage HTML — first page that matches origin or normalised
  const homepage =
    pages.find((p) => p.url === normalised) || pages.find((p) => p.url === origin) || pages[0];

  return {
    domain,
    pages,
    sitemapFound,
    robotsTxt,
    llmsTxt,
    brokenLinks: [],
    homepageHtml: homepage?.html ?? '',
  };
}

// Lite crawl for public audit — homepage only (or homepage + competitor)
export async function crawlSiteLite(rootUrl: string): Promise<CrawlResult> {
  const normalised = normaliseUrl(rootUrl);
  const u = new URL(normalised);
  const origin = u.origin;
  const domain = u.hostname.replace(/^www\./, '');
  if (isPrivateHost(u.hostname)) {
    throw new Error('Private/local host not allowed');
  }
  const home = await fetchPage(normalised);
  if (!home) throw new Error('Could not fetch homepage');
  if (home.bytes < 500) throw new Error('Homepage too small — likely placeholder');
  const robotsTxt = await fetchRobotsTxt(origin);
  const llmsTxt = await fetchLlmsTxt(origin);
  return {
    domain,
    pages: [home],
    sitemapFound: false,
    robotsTxt,
    llmsTxt,
    brokenLinks: [],
    homepageHtml: home.html,
  };
}
