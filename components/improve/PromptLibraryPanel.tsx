'use client';
import { CopyButton } from '../ui/CopyButton';
import { DownloadButton } from '../ui/DownloadButton';

interface Prompt {
  title: string;
  prompt: string;
  usageNotes: string;
}

export function PromptLibraryPanel({ prompts }: { prompts: Prompt[] }) {
  if (!prompts.length) {
    return <div className="text-sm text-brand-gray-dark">No prompts generated.</div>;
  }
  const allText = prompts
    .map((p) => `=== ${p.title} ===\n\n${p.prompt}\n\n--- Usage notes ---\n${p.usageNotes}\n`)
    .join('\n\n');
  return (
    <div className="grid gap-4">
      <div className="flex gap-2">
        <DownloadButton
          filename="prompt-library.txt"
          text={allText}
          label="Download all prompts as .txt"
        />
      </div>
      {prompts.map((p, n) => (
        <div key={n} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-semibold">{p.title}</h3>
            <CopyButton text={p.prompt} />
          </div>
          <div className="text-xs text-brand-gray-dark mb-2">{p.usageNotes}</div>
          <pre className="text-xs bg-brand-gray-light p-3 rounded whitespace-pre-wrap">
            {p.prompt}
          </pre>
        </div>
      ))}
    </div>
  );
}
