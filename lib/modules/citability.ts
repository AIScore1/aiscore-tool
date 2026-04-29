import * as cheerio from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';
import { CitabilityBlock, CitabilityResult, CrawlResult } from '../types';
import { calcCost, logApiCall } from '../store';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const MAX_BLOCKS = 30;
const BATCH_SIZE = 6;

interface RawBlock {
  heading: string;
  content: string;
}

function extractBlocks(crawl: CrawlResult): RawBlock[] {
  const blocks: RawBlock[] = [];
  for (const p of crawl.pages) {
    if (blocks.length >= MAX_BLOCKS) break;
    const $ = cheerio.load(p.html);
    $('h2, h3').each((_, el) => {
      if (blocks.length >= MAX_BLOCKS) return false;
      const heading = $(el).text().trim();
      if (!heading) return;
      let content = '';
      let cur = $(el).next();
      let safety = 0;
      while (cur.length && !/^h[1-6]$/i.test(cur.get(0)?.tagName || '') && safety < 6) {
        content += ' ' + cur.text();
        cur = cur.next();
        safety++;
      }
      content = content.replace(/\s+/g, ' ').trim();
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      if (wordCount >= 20) {
        blocks.push({ heading, content: content.slice(0, 1200) });
      }
      return undefined;
    });
  }
  return blocks.slice(0, MAX_BLOCKS);
}

const SYSTEM_PROMPT = `You are a GEO expert scoring content blocks for AI citation potential.
Return ONLY valid JSON array. No markdown. No explanation.`;

export async function scoreCitability(
  crawl: CrawlResult,
  clientName?: string
): Promise<CitabilityResult> {
  const blocks = extractBlocks(crawl);
  if (blocks.length === 0) {
    return { total: 30, blocks: [], averageStatDensity: 0 };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback heuristic when no API key configured
    return heuristicCitability(blocks);
  }

  const anthropic = new Anthropic({ apiKey });
  const scored: CitabilityBlock[] = [];

  for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
    const batch = blocks.slice(i, i + BATCH_SIZE);
    const userPrompt = `Domain: ${crawl.domain}. Score these ${batch.length} content blocks.
Blocks: ${JSON.stringify(batch)}

Score each 0–100:
answer_quality: Does it directly answer a user AI query? Rate specificity and completeness.
self_containment: Can AI extract it without needing surrounding context?
structural_readability: Clear structure, logical flow, scannable?
statistical_density: Data points per 100 words. 0=none, 100=highly data-rich.
uniqueness: Is this proprietary/original or generic filler?

Return ONLY:
[{"heading":"...","answer_quality":N,"self_containment":N,"structural_readability":N,
"statistical_density":N,"uniqueness":N,"weighted_total":N,"weakness":"one sentence"},...]`;

    try {
      const res = await anthropic.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });
      const inTokens = res.usage?.input_tokens ?? 0;
      const outTokens = res.usage?.output_tokens ?? 0;
      const { usd, zar } = calcCost('haiku', inTokens, outTokens);
      await logApiCall({
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        model: 'haiku',
        task: 'Citability scoring',
        tokensIn: inTokens,
        tokensOut: outTokens,
        costUSD: usd,
        costZAR: zar,
        clientName,
      });
      const text = res.content
        .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
        .map((c) => c.text)
        .join('');
      const json = extractJsonArray(text);
      if (Array.isArray(json)) {
        for (let j = 0; j < json.length && j < batch.length; j++) {
          const item = json[j] as Partial<CitabilityBlock>;
          scored.push({
            heading: batch[j].heading,
            content: batch[j].content,
            answer_quality: clamp(item.answer_quality),
            self_containment: clamp(item.self_containment),
            structural_readability: clamp(item.structural_readability),
            statistical_density: clamp(item.statistical_density),
            uniqueness: clamp(item.uniqueness),
            weighted_total:
              item.weighted_total ??
              weightedAvg(
                clamp(item.answer_quality),
                clamp(item.self_containment),
                clamp(item.structural_readability),
                clamp(item.statistical_density),
                clamp(item.uniqueness)
              ),
            weakness: item.weakness ?? '',
          });
        }
      }
    } catch (e) {
      // Skip batch on error
    }
  }

  if (scored.length === 0) return heuristicCitability(blocks);

  const total = Math.round(
    scored.reduce((a, b) => a + b.weighted_total, 0) / scored.length
  );
  const averageStatDensity = Math.round(
    scored.reduce((a, b) => a + b.statistical_density, 0) / scored.length
  );
  return { total, blocks: scored, averageStatDensity };
}

function clamp(n: number | undefined): number {
  if (typeof n !== 'number' || isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function weightedAvg(aq: number, sc: number, sr: number, sd: number, u: number): number {
  return Math.round(aq * 0.3 + sc * 0.25 + sr * 0.2 + sd * 0.15 + u * 0.1);
}

function extractJsonArray(text: string): unknown[] | null {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    const json = JSON.parse(cleaned);
    return Array.isArray(json) ? json : null;
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
    return null;
  }
}

function heuristicCitability(blocks: RawBlock[]): CitabilityResult {
  const scored: CitabilityBlock[] = blocks.map((b) => {
    const wc = b.content.split(/\s+/).filter(Boolean).length;
    const stats = (b.content.match(/\d+(\.\d+)?\s?(%|pts?|R\d|m|k|years?)/gi) || []).length;
    const sd = Math.min(100, Math.round((stats / Math.max(wc, 1)) * 1000));
    const aq = wc > 60 ? 60 : 40;
    const sc = wc > 80 ? 65 : 45;
    const sr = /^[A-Z]/.test(b.heading) ? 60 : 50;
    const u = 50;
    return {
      heading: b.heading,
      content: b.content,
      answer_quality: aq,
      self_containment: sc,
      structural_readability: sr,
      statistical_density: sd,
      uniqueness: u,
      weighted_total: weightedAvg(aq, sc, sr, sd, u),
      weakness: 'Heuristic-scored (no API key configured).',
    };
  });
  const total = scored.length
    ? Math.round(scored.reduce((a, b) => a + b.weighted_total, 0) / scored.length)
    : 30;
  const averageStatDensity = scored.length
    ? Math.round(scored.reduce((a, b) => a + b.statistical_density, 0) / scored.length)
    : 0;
  return { total, blocks: scored, averageStatDensity };
}
