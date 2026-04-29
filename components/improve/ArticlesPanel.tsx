'use client';
import { useState } from 'react';
import { ArticleOutput } from '@/lib/types';
import { CopyButton } from '../ui/CopyButton';
import { DownloadButton } from '../ui/DownloadButton';

interface Props {
  articles: ArticleOutput[];
  businessName: string;
}

export function ArticlesPanel({ articles, businessName }: Props) {
  const [list, setList] = useState(articles);

  if (!list.length) {
    return <div className="text-sm text-brand-gray-dark">No articles generated yet.</div>;
  }

  const togglePublished = (id: string) => {
    setList((prev) => prev.map((a) => (a.id === id ? { ...a, published: !a.published } : a)));
  };

  return (
    <div className="grid gap-4">
      {list.map((a, n) => {
        const slug = a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
        return (
          <div key={a.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start gap-3 mb-2">
              <div>
                <div className="text-xs text-brand-gray-dark">Article {n + 1} · target: {a.targetQuery}</div>
                <h3 className="font-semibold">{a.title}</h3>
                <div className="text-xs text-brand-gray-dark mt-1">
                  <span className="inline-block bg-brand-gray-light px-2 py-0.5 rounded">{a.mode === 'full' ? 'Full Article' : 'Outline'}</span>
                  <span className="inline-block bg-brand-gray-light px-2 py-0.5 rounded ml-2">{a.wordCount} words</span>
                </div>
              </div>
              <label className="text-xs flex items-center gap-1.5 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={a.published}
                  onChange={() => togglePublished(a.id)}
                />
                Published ✓
              </label>
            </div>
            <details>
              <summary className="cursor-pointer text-sm text-brand-teal mb-2">Read full article</summary>
              <div className="prose max-w-none whitespace-pre-wrap text-sm leading-relaxed mt-2 max-h-[420px] overflow-auto bg-brand-gray-light p-3 rounded">
                {a.content}
              </div>
            </details>
            <div className="flex gap-2 mt-3">
              <CopyButton text={a.content} />
              <DownloadButton
                filename={`${slug}.md`}
                text={a.content}
                mime="text/markdown"
              />
            </div>
          </div>
        );
      })}
      <div className="text-xs text-brand-gray-dark mt-2">
        Publishing schedule for <strong>{businessName}</strong> — one article per week recommended.
      </div>
    </div>
  );
}
