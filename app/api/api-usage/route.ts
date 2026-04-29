import { NextRequest, NextResponse } from 'next/server';
import {
  allApiCalls,
  getApiCalls,
  getCreditBalance,
  updateCreditBalance,
} from '@/lib/store';

export const runtime = 'nodejs';

export async function GET() {
  const calls = await getApiCalls(50);
  const all = await allApiCalls();
  const balance = await getCreditBalance();

  // Breakdown by task category
  const breakdown = aggregate(all);

  return NextResponse.json({
    balance,
    calls,
    breakdown,
    totals: {
      callsThisSession: all.length,
      totalSpentZAR: balance.spentZAR,
      totalSpentUSD: balance.spentUSD,
    },
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { creditsUSD?: number };
  if (typeof body.creditsUSD !== 'number') {
    return NextResponse.json({ error: 'creditsUSD required' }, { status: 400 });
  }
  await updateCreditBalance(body.creditsUSD);
  return NextResponse.json({ balance: await getCreditBalance() });
}

function aggregate(calls: Awaited<ReturnType<typeof allApiCalls>>) {
  const groups: Record<string, { count: number; zar: number }> = {};
  for (const c of calls) {
    const key = mapTask(c.task);
    if (!groups[key]) groups[key] = { count: 0, zar: 0 };
    groups[key].count += 1;
    groups[key].zar += c.costZAR;
  }
  return groups;
}

function mapTask(task: string): string {
  const lower = task.toLowerCase();
  if (lower.includes('citability') || lower.includes('audit') || lower.includes('action plan') || lower.includes('e-e-a-t') || lower.includes('executive')) {
    return 'Full audits';
  }
  if (
    lower.includes('faq') ||
    lower.includes('brand voice') ||
    lower.includes('schema') ||
    lower.includes('strategy') ||
    lower.includes('prompt library')
  )
    return 'Improvement packs';
  if (lower.includes('article')) return 'Retainer articles';
  return 'Other';
}
