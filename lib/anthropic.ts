import Anthropic from '@anthropic-ai/sdk';
import { calcCost, logApiCall } from './store';

export const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
export const SONNET_MODEL = 'claude-sonnet-4-6';

export function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

interface RunOptions {
  model: 'haiku' | 'sonnet';
  task: string;
  system: string;
  user: string;
  maxTokens?: number;
  clientName?: string;
}

export async function run(opts: RunOptions): Promise<string> {
  const client = getClient();
  if (!client) throw new Error('ANTHROPIC_API_KEY not configured');
  const modelId = opts.model === 'haiku' ? HAIKU_MODEL : SONNET_MODEL;
  const res = await client.messages.create({
    model: modelId,
    max_tokens: opts.maxTokens ?? 2500,
    system: opts.system,
    messages: [{ role: 'user', content: opts.user }],
  });
  const inTokens = res.usage?.input_tokens ?? 0;
  const outTokens = res.usage?.output_tokens ?? 0;
  const { usd, zar } = calcCost(opts.model, inTokens, outTokens);
  await logApiCall({
    id: Math.random().toString(36).substring(7),
    timestamp: new Date().toISOString(),
    model: opts.model,
    task: opts.task,
    tokensIn: inTokens,
    tokensOut: outTokens,
    costUSD: usd,
    costZAR: zar,
    clientName: opts.clientName,
  });
  return res.content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text)
    .join('');
}

export function extractJson<T = unknown>(text: string): T | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const arr = cleaned.match(/\[[\s\S]*\]/);
    const obj = cleaned.match(/\{[\s\S]*\}/);
    const candidate = obj && arr ? (obj[0].length > arr[0].length ? obj[0] : arr[0]) : obj?.[0] ?? arr?.[0];
    if (candidate) {
      try {
        return JSON.parse(candidate) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
