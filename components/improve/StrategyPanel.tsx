'use client';
import { DownloadButton } from '../ui/DownloadButton';

export function StrategyPanel({ strategy }: { strategy: string }) {
  return (
    <div className="grid gap-4">
      <div className="flex gap-2">
        <DownloadButton
          filename="content-strategy.md"
          text={strategy}
          mime="text/markdown"
          label="Download .md"
        />
      </div>
      <div className="border border-gray-200 rounded-lg p-4 prose max-w-none">
        <pre className="text-sm whitespace-pre-wrap leading-relaxed font-sans">{strategy}</pre>
      </div>
    </div>
  );
}
