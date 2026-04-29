'use client';
import { useEffect, useState } from 'react';
import { ArticleOutput } from '@/lib/types';
import { CopyButton } from '../ui/CopyButton';
import { DownloadButton } from '../ui/DownloadButton';

interface ClientItem {
  id: string;
  businessName: string;
  date: string;
}

interface ArticleSlot {
  title: string;
  targetQuery: string;
  mode: 'full' | 'outline';
}

export function RetainerTab() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [count, setCount] = useState(4);
  const [slots, setSlots] = useState<ArticleSlot[]>(makeSlots(4));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<ArticleOutput[]>([]);

  useEffect(() => {
    fetch('/api/articles')
      .then((r) => r.json())
      .then((d) => setClients(d.clients ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSlots((prev) => {
      const next = makeSlots(count);
      for (let i = 0; i < Math.min(prev.length, next.length); i++) next[i] = prev[i];
      return next;
    });
  }, [count]);

  const submit = async () => {
    if (!selected) {
      setError('Select a client first');
      return;
    }
    setLoading(true);
    setError(null);
    setGenerated([]);
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          improvementId: selected,
          articles: slots.map((s) => ({
            title: s.title || undefined,
            targetQuery: s.targetQuery || undefined,
            mode: s.mode,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Generation failed');
      } else {
        setGenerated(data.articles ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 max-w-4xl mx-auto">
      <div className="card">
        <h2 className="text-xl font-semibold mb-1">Generate retainer articles</h2>
        <p className="text-sm text-brand-gray-dark mb-4">
          Manual monthly content generation for active retainer clients. Uses each client&apos;s saved
          brand voice + business profile.
        </p>
        <div className="grid gap-3">
          <div>
            <label className="label">Client</label>
            <select
              className="input"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">— select —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessName} (saved {new Date(c.date).toLocaleDateString()})
                </option>
              ))}
            </select>
            {clients.length === 0 && (
              <div className="hint">
                Generate an Improvement Pack first (Improve tab). Saved profiles persist for 4 hours.
              </div>
            )}
          </div>
          <div>
            <label className="label">Article count</label>
            <input
              className="input w-24"
              type="number"
              min={1}
              max={12}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(12, Number(e.target.value))))}
            />
          </div>
          <div className="grid gap-3">
            {slots.map((s, n) => (
              <div key={n} className="border border-gray-200 rounded p-3 grid gap-2">
                <div className="text-xs text-brand-gray-dark">Article {n + 1}</div>
                <input
                  className="input"
                  placeholder="Title or brief (leave blank for auto-suggest)"
                  maxLength={100}
                  value={s.title}
                  onChange={(e) =>
                    setSlots((p) =>
                      p.map((x, i) => (i === n ? { ...x, title: e.target.value } : x))
                    )
                  }
                />
                <input
                  className="input"
                  placeholder="Target query (optional)"
                  value={s.targetQuery}
                  onChange={(e) =>
                    setSlots((p) =>
                      p.map((x, i) => (i === n ? { ...x, targetQuery: e.target.value } : x))
                    )
                  }
                />
                <div className="flex gap-3 text-sm">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name={`mode-${n}`}
                      checked={s.mode === 'full'}
                      onChange={() =>
                        setSlots((p) => p.map((x, i) => (i === n ? { ...x, mode: 'full' } : x)))
                      }
                    />
                    Full Article
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name={`mode-${n}`}
                      checked={s.mode === 'outline'}
                      onChange={() =>
                        setSlots((p) =>
                          p.map((x, i) => (i === n ? { ...x, mode: 'outline' } : x))
                        )
                      }
                    />
                    Structured Outline
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button onClick={submit} disabled={loading} className="btn-primary">
            {loading ? 'Generating…' : `Generate ${count} article${count === 1 ? '' : 's'}`}
          </button>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      </div>

      {generated.length > 0 && (
        <div className="grid gap-3">
          <h3 className="font-semibold">Generated</h3>
          {generated.map((a, n) => {
            const slug = a.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
              .slice(0, 50);
            return (
              <div key={a.id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{a.title}</h4>
                    <div className="text-xs text-brand-gray-dark">
                      target: {a.targetQuery} · {a.mode} · {a.wordCount} words
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <CopyButton text={a.content} />
                    <DownloadButton
                      filename={`${slug}.md`}
                      text={a.content}
                      mime="text/markdown"
                    />
                  </div>
                </div>
                <details>
                  <summary className="cursor-pointer text-sm text-brand-teal">Read</summary>
                  <pre className="bg-brand-gray-light p-3 rounded text-sm whitespace-pre-wrap leading-relaxed mt-2 max-h-80 overflow-auto font-sans">
                    {a.content}
                  </pre>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function makeSlots(n: number): ArticleSlot[] {
  return Array.from({ length: n }, () => ({ title: '', targetQuery: '', mode: 'full' as const }));
}
