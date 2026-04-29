'use client';
import { CopyButton } from '../ui/CopyButton';
import { DownloadButton } from '../ui/DownloadButton';
import { extractSystemPrompt } from '@/lib/generators/brand-voice-generator';

export function BrandVoicePanel({ doc }: { doc: string }) {
  const systemPrompt = extractSystemPrompt(doc);
  return (
    <div className="grid gap-4">
      <div className="flex gap-2">
        <DownloadButton
          filename="brand-voice.md"
          text={doc}
          mime="text/markdown"
          label="Download .md"
        />
      </div>
      <div className="border border-gray-200 rounded-lg p-4 bg-brand-teal/5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">AI Content System Prompt</h3>
          <CopyButton text={systemPrompt} label="Copy System Prompt" />
        </div>
        <pre className="text-xs whitespace-pre-wrap leading-relaxed">{systemPrompt}</pre>
      </div>
      <div className="border border-gray-200 rounded-lg p-4 prose max-w-none">
        <pre className="text-sm whitespace-pre-wrap leading-relaxed font-sans">{doc}</pre>
      </div>
    </div>
  );
}
