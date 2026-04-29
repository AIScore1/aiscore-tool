'use client';
import { useEffect, useState } from 'react';
import { ApiCall, CreditBalance } from '@/lib/types';
import { ProgressBar } from '../ui/ProgressBar';

interface State {
  balance: CreditBalance;
  calls: ApiCall[];
  breakdown: Record<string, { count: number; zar: number }>;
  totals: { callsThisSession: number; totalSpentZAR: number; totalSpentUSD: number };
}

export function ApiUsagePanel() {
  const [data, setData] = useState<State | null>(null);
  const [creditInput, setCreditInput] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch('/api/api-usage');
    setData(await res.json());
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  if (!data) return <div className="text-sm text-brand-gray-dark">Loading…</div>;

  const usedPct = data.balance.initialCreditsUSD > 0
    ? Math.min(100, (data.balance.spentUSD / data.balance.initialCreditsUSD) * 100)
    : 0;
  const lowBalance = data.balance.initialCreditsUSD > 0 && data.balance.remainingUSD < 10;

  const updateCredits = async () => {
    const usd = Number(creditInput);
    if (!usd || isNaN(usd)) return;
    setSaving(true);
    await fetch('/api/api-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creditsUSD: usd }),
    });
    setCreditInput('');
    await load();
    setSaving(false);
  };

  return (
    <div className="grid gap-4">
      <div className="card">
        <h3 className="font-semibold mb-2">Credit balance</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="grow">
            <label className="label">Anthropic credit balance (USD)</label>
            <div className="flex gap-2">
              <input
                className="input max-w-[180px]"
                type="number"
                placeholder="e.g. 100"
                value={creditInput}
                onChange={(e) => setCreditInput(e.target.value)}
              />
              <button onClick={updateCredits} className="btn-primary" disabled={saving}>
                Update balance
              </button>
            </div>
            <div className="hint">Enter the dollar value shown in your Anthropic console.</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stat label="Credits added" value={`R ${data.balance.initialCreditsZAR.toFixed(2)}`} />
          <Stat label="Used" value={`R ${data.balance.spentZAR.toFixed(2)}`} accent="#EF9F27" />
          <Stat
            label="Remaining"
            value={`R ${data.balance.remainingZAR.toFixed(2)}`}
            accent={lowBalance ? '#E24B4A' : '#29a871'}
          />
        </div>
        <div className="mt-3">
          <ProgressBar percent={usedPct} color={lowBalance ? '#E24B4A' : '#29a871'} />
        </div>
        {lowBalance && (
          <div className="mt-3 p-3 rounded bg-red-50 text-red-700 text-sm">
            Less than $10 remaining. Top up before generating more packs.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(data.breakdown).map(([k, v]) => (
          <div key={k} className="card">
            <div className="text-xs text-brand-gray-dark">{k}</div>
            <div className="text-lg font-semibold">R {v.zar.toFixed(2)}</div>
            <div className="text-xs text-brand-gray-dark">{v.count} calls</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Capacity estimate</h3>
        <div className="text-sm text-brand-gray-dark">
          At ~R4.00 per Foundation pack, your remaining budget supports approximately{' '}
          <strong className="text-brand-black">
            {Math.floor(data.balance.remainingZAR / 4)}
          </strong>{' '}
          more improvement packs.
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-gray-light text-xs text-brand-gray-dark uppercase">
            <tr>
              <th className="text-left p-3">Time</th>
              <th className="text-left p-3">Model</th>
              <th className="text-left p-3">Task</th>
              <th className="text-right p-3">Tokens In</th>
              <th className="text-right p-3">Tokens Out</th>
              <th className="text-right p-3">Cost (ZAR)</th>
              <th className="text-left p-3">Client</th>
            </tr>
          </thead>
          <tbody>
            {data.calls.length === 0 && (
              <tr>
                <td className="p-6 text-center text-brand-gray-dark" colSpan={7}>
                  No API calls yet this session.
                </td>
              </tr>
            )}
            {data.calls.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="p-3 text-xs text-brand-gray-dark whitespace-nowrap">
                  {new Date(c.timestamp).toLocaleTimeString()}
                </td>
                <td className="p-3 capitalize">{c.model}</td>
                <td className="p-3">{c.task}</td>
                <td className="p-3 text-right">{c.tokensIn}</td>
                <td className="p-3 text-right">{c.tokensOut}</td>
                <td className="p-3 text-right">R {c.costZAR.toFixed(3)}</td>
                <td className="p-3 text-xs text-brand-gray-dark">{c.clientName ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = '#1d1d1f' }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-xs text-brand-gray-dark uppercase">{label}</div>
      <div className="text-2xl font-semibold" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}
