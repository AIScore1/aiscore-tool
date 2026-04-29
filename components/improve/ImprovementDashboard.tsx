'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { ImprovementResult } from '@/lib/types';
import { QuickWinsPanel } from './QuickWinsPanel';
import { SchemaPanel } from './SchemaPanel';
import { FAQPanel } from './FAQPanel';
import { ArticlesPanel } from './ArticlesPanel';
import { BrandVoicePanel } from './BrandVoicePanel';
import { StrategyPanel } from './StrategyPanel';
import { PromptLibraryPanel } from './PromptLibraryPanel';

type SubTab = 'quick' | 'schema' | 'faq' | 'articles' | 'brand' | 'strategy' | 'prompts';

const TABS: { key: SubTab; label: string }[] = [
  { key: 'quick', label: 'Quick wins' },
  { key: 'schema', label: 'Schema' },
  { key: 'faq', label: 'FAQ Hub' },
  { key: 'articles', label: 'Articles' },
  { key: 'brand', label: 'Brand voice' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'prompts', label: 'Prompts' },
];

export function ImprovementDashboard({
  result,
  onNew,
}: {
  result: ImprovementResult;
  onNew: () => void;
}) {
  const [tab, setTab] = useState<SubTab>('quick');

  return (
    <div className="grid gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">{result.profile.businessName}</h2>
          <div className="text-xs text-brand-gray-dark">
            {result.profile.domain} · {result.profile.location} · Generated{' '}
            {new Date(result.generatedAt).toLocaleString()}
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/download?id=${result.id}`}
            className="btn-primary inline-flex items-center gap-1.5"
          >
            <Download size={14} />
            Download Complete AI Visibility Pack (ZIP)
          </a>
          <button onClick={onNew} className="btn-secondary">
            New profile
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto tab-row">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 ${
                tab === t.key
                  ? 'border-brand-teal text-brand-black font-semibold'
                  : 'border-transparent text-brand-gray-dark'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === 'quick' && (
            <QuickWinsPanel
              robotsTxt={result.quickWins.robotsTxt}
              llmsTxt={result.quickWins.llmsTxt}
              metaTags={result.quickWins.metaTags}
            />
          )}
          {tab === 'schema' && <SchemaPanel schemas={result.schemas} />}
          {tab === 'faq' && <FAQPanel faqHub={result.faqHub} />}
          {tab === 'articles' && (
            <ArticlesPanel articles={result.articles} businessName={result.profile.businessName} />
          )}
          {tab === 'brand' && <BrandVoicePanel doc={result.brandVoice} />}
          {tab === 'strategy' && <StrategyPanel strategy={result.contentStrategy} />}
          {tab === 'prompts' && <PromptLibraryPanel prompts={result.promptLibrary} />}
        </div>
      </div>
    </div>
  );
}
