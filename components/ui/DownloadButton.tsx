'use client';
import { Download } from 'lucide-react';

export function DownloadButton({
  filename,
  text,
  mime = 'text/plain',
  label = 'Download',
}: {
  filename: string;
  text: string;
  mime?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      className="btn-secondary inline-flex items-center gap-1.5"
      onClick={() => {
        const blob = new Blob([text], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      <Download size={14} />
      {label}
    </button>
  );
}
