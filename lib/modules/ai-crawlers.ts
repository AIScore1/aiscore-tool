import { AICrawlersResult, CrawlResult } from '../types';

const CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'PerplexityBot',
  'Google-Extended',
  'GoogleOther',
  'Applebot-Extended',
  'Amazonbot',
  'FacebookBot',
  'CCBot',
  'anthropic-ai',
  'Bytespider',
  'cohere-ai',
];

interface RobotsRule {
  agent: string;
  disallow: string[];
  allow: string[];
}

function parseRobots(txt: string): RobotsRule[] {
  const lines = txt.split(/\r?\n/);
  const rules: RobotsRule[] = [];
  let current: RobotsRule | null = null;
  for (const raw of lines) {
    const line = raw.split('#')[0].trim();
    if (!line) continue;
    const [keyRaw, ...rest] = line.split(':');
    const key = keyRaw.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (key === 'user-agent') {
      if (current) rules.push(current);
      current = { agent: value, disallow: [], allow: [] };
    } else if (current) {
      if (key === 'disallow') current.disallow.push(value);
      else if (key === 'allow') current.allow.push(value);
    }
  }
  if (current) rules.push(current);
  return rules;
}

function isCrawlerWelcome(rules: RobotsRule[], crawler: string): boolean {
  // Find specific rule for this crawler. If none, fall back to '*' behaviour.
  const lower = crawler.toLowerCase();
  const specific = rules.find((r) => r.agent.toLowerCase() === lower);
  if (specific) {
    // Blocked if disallow has '/'
    return !specific.disallow.includes('/');
  }
  const wildcard = rules.find((r) => r.agent === '*');
  if (wildcard) return !wildcard.disallow.includes('/');
  // No robots rules = welcomed
  return true;
}

export function scoreAICrawlers(crawl: CrawlResult): AICrawlersResult {
  const robots = crawl.robotsTxt ? parseRobots(crawl.robotsTxt) : [];
  const welcomed: string[] = [];
  const blocked: string[] = [];
  for (const c of CRAWLERS) {
    if (isCrawlerWelcome(robots, c)) welcomed.push(c);
    else blocked.push(c);
  }

  const hasLlmsTxt = !!crawl.llmsTxt;
  const llmsTxtValid =
    !!crawl.llmsTxt &&
    crawl.llmsTxt.includes('#') &&
    /^##\s+/m.test(crawl.llmsTxt);

  // Score: % welcomed × 70 + 20 (llms.txt) + 10 (valid)
  const pctWelcomed = welcomed.length / CRAWLERS.length;
  let score = pctWelcomed * 70;
  if (hasLlmsTxt) score += 20;
  if (llmsTxtValid) score += 10;

  return {
    total: Math.round(Math.min(100, score)),
    welcomedCrawlers: welcomed,
    blockedCrawlers: blocked,
    hasLlmsTxt,
    llmsTxtValid,
  };
}

export function aiCrawlerAccessPercent(result: AICrawlersResult): number {
  return Math.round((result.welcomedCrawlers.length / CRAWLERS.length) * 100);
}

export const AI_CRAWLERS_LIST = CRAWLERS;
