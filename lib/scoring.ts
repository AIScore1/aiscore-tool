import {
  AICrawlersResult,
  BrandAuthorityResult,
  CategoryScores,
  CitabilityResult,
  CrawlResult,
  EEATResult,
  Issue,
  PlatformScores,
  SchemaMarkupResult,
  TechnicalSEOResult,
} from './types';

export function platformScores(input: {
  schema: SchemaMarkupResult;
  technical: TechnicalSEOResult;
  eeat: EEATResult;
  crawl: CrawlResult;
  aiCrawlers: AICrawlersResult;
  citability: CitabilityResult;
  brand: BrandAuthorityResult;
}): PlatformScores {
  const { schema, technical, eeat, crawl, aiCrawlers, citability, brand } = input;
  const sitemap = crawl.sitemapFound ? 1 : 0;
  const llms = aiCrawlers.hasLlmsTxt ? 1 : 0;
  const homepage = crawl.pages[0];
  const html = homepage?.html?.toLowerCase() || '';
  const dateMeta = /article:modified_time|article:published_time|datepublished|datemodified/.test(html) ? 1 : 0;
  const avgWords =
    crawl.pages.reduce((a, p) => a + p.text.split(/\s+/).filter(Boolean).length, 0) /
    Math.max(crawl.pages.length, 1);
  const canonicalAll = crawl.pages.every((p) => /<link[^>]+rel=["']canonical["']/i.test(p.html));

  const googleAIO = Math.round(
    schema.total * 0.4 + technical.total * 0.3 + eeat.total * 0.2 + (sitemap ? 10 : 0)
  );
  const chatgpt = Math.round(
    40 +
      (aiCrawlers.welcomedCrawlers.includes('GPTBot') ? 20 : 0) +
      (avgWords > 1000 ? 15 : 0) +
      (llms ? 15 : 0) +
      (dateMeta ? 10 : 0)
  );
  const perplexity = Math.round(
    30 +
      (brand.reddit > 60 ? 20 : 0) +
      (citability.averageStatDensity > 30 ? 20 : 0) +
      (dateMeta ? 15 : 0) +
      (citability.total > 60 ? 15 : 0)
  );
  const gemini = Math.round(
    schema.total * 0.4 +
      (brand.wikipedia > 0 ? 10 : 0) +
      (brand.youtube > 70 ? 15 : 0) +
      (eeat.total > 60 ? 15 : 0)
  );
  const bingCopilot = Math.round(
    30 +
      (sitemap ? 25 : 0) +
      (schema.schemasFound.includes('Organization') ? 20 : 0) +
      (canonicalAll ? 15 : 0)
  );

  const total = Math.round((googleAIO + chatgpt + perplexity + gemini + bingCopilot) / 5);

  return {
    googleAIO: Math.min(100, googleAIO),
    chatgpt: Math.min(100, chatgpt),
    perplexity: Math.min(100, perplexity),
    gemini: Math.min(100, gemini),
    bingCopilot: Math.min(100, bingCopilot),
    total: Math.min(100, total),
  };
}

export function geoScore(scores: CategoryScores): number {
  const total =
    scores.citability * 0.25 +
    scores.brandAuthority * 0.2 +
    scores.eeat * 0.2 +
    scores.technicalSEO * 0.15 +
    scores.schemaMarkup * 0.1 +
    scores.platformReadiness * 0.1;
  return Math.round(total);
}

export function grade(score: number): string {
  if (score >= 85) return 'Excellent — Highly Cited';
  if (score >= 70) return 'Good — Regularly Cited';
  if (score >= 55) return 'Fair — Inconsistent';
  if (score >= 35) return 'Poor — Rarely Cited';
  return 'Critical — AI Invisible';
}

export function shortGrade(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Fair';
  if (score >= 35) return 'Poor';
  return 'Critical';
}

export function scoreColor(score: number): string {
  if (score < 35) return '#E24B4A';
  if (score < 55) return '#EF9F27';
  if (score < 70) return '#BA7517';
  if (score < 85) return '#29a871';
  return '#1D9E75';
}

export function buildIssues(input: {
  technical: TechnicalSEOResult;
  schema: SchemaMarkupResult;
  eeat: EEATResult;
  aiCrawlers: AICrawlersResult;
  brand: BrandAuthorityResult;
  citability: CitabilityResult;
  crawl: CrawlResult;
}): { critical: Issue[]; high: Issue[]; medium: Issue[]; topThree: Issue[] } {
  const issues: Issue[] = [];

  if (!input.crawl.robotsTxt) {
    issues.push({
      severity: 'CRITICAL',
      title: 'No robots.txt file',
      description:
        'AI crawlers default to skipping sites without explicit access rules. Without robots.txt, ChatGPT, Claude, and Perplexity will not reliably index your content.',
    });
  }
  if (!input.aiCrawlers.hasLlmsTxt) {
    issues.push({
      severity: 'HIGH',
      title: 'No llms.txt file',
      description:
        'llms.txt tells AI assistants what your site is about and which content to cite. Sites without it are systematically under-cited by ChatGPT and Claude.',
    });
  }
  if (input.schema.schemasFound.length === 0) {
    issues.push({
      severity: 'CRITICAL',
      title: 'No structured data (schema markup)',
      description:
        'AI engines rely on Schema.org markup to understand who you are, what you offer, and where you operate. Without it, you appear as undifferentiated text.',
    });
  } else if (!input.schema.schemasFound.includes('Organization')) {
    issues.push({
      severity: 'HIGH',
      title: 'Missing Organization schema',
      description:
        'Organization schema is the foundational record AI engines use to identify you. Without it, your business is invisible to AI knowledge graphs.',
    });
  }
  if (input.eeat.trustworthiness < 15) {
    issues.push({
      severity: 'HIGH',
      title: 'Weak trust signals',
      description:
        'AI engines weight trust heavily — privacy policy, contact details, address, security headers all factor in. Yours are below the threshold for citation.',
    });
  }
  if (input.brand.wikipedia === 0) {
    issues.push({
      severity: 'MEDIUM',
      title: 'No Wikipedia presence',
      description:
        'Wikipedia is a primary trust signal for AI engines. A page (or even a citation in a related article) materially boosts citation rates.',
    });
  }
  if (input.citability.total < 50) {
    issues.push({
      severity: 'HIGH',
      title: 'Low content citability',
      description:
        'Your content does not directly answer the questions customers ask AI assistants. Self-contained, fact-rich, answer-first content is required.',
    });
  }
  if (input.technical.security < 6) {
    issues.push({
      severity: 'MEDIUM',
      title: 'Missing security headers',
      description:
        'Security headers (CSP, HSTS, X-Frame-Options) are part of the trust footprint AI engines evaluate. Adding them is a low-effort, high-impact win.',
    });
  }
  if (!input.crawl.sitemapFound) {
    issues.push({
      severity: 'CRITICAL',
      title: 'No XML sitemap detected',
      description:
        'Without a sitemap, AI crawlers and search engines must discover your pages through links alone. Many pages will not be indexed at all.',
    });
  }
  if (!input.aiCrawlers.welcomedCrawlers.includes('GPTBot')) {
    issues.push({
      severity: 'CRITICAL',
      title: 'GPTBot is blocked or not allowed',
      description:
        'GPTBot powers ChatGPT search. If it cannot crawl your site, you will not appear in ChatGPT answers — full stop.',
    });
  }

  const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
  issues.sort((a, b) => order[a.severity] - order[b.severity]);
  const critical = issues.filter((i) => i.severity === 'CRITICAL');
  const high = issues.filter((i) => i.severity === 'HIGH');
  const medium = issues.filter((i) => i.severity === 'MEDIUM');
  const topThree = issues.slice(0, 3);
  return { critical, high, medium, topThree };
}

export function quickWinsFromIssues(issues: Issue[]): string[] {
  return issues.slice(0, 3).map((i) => i.title);
}

export function categoryScoresFrom(input: {
  technical: TechnicalSEOResult;
  schema: SchemaMarkupResult;
  eeat: EEATResult;
  citability: CitabilityResult;
  brand: BrandAuthorityResult;
  platform: PlatformScores;
}): CategoryScores {
  return {
    technicalSEO: input.technical.total,
    schemaMarkup: input.schema.total,
    eeat: input.eeat.total,
    citability: input.citability.total,
    brandAuthority: input.brand.total,
    platformReadiness: input.platform.total,
  };
}
