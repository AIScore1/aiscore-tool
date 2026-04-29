'use client';
import { CopyButton } from '../ui/CopyButton';
import { DownloadButton } from '../ui/DownloadButton';

export function SchemaPanel({
  schemas,
}: {
  schemas: { type: string; label: string; code: string }[];
}) {
  if (!schemas.length) {
    return <div className="text-sm text-brand-gray-dark">No schema generated.</div>;
  }
  return (
    <div className="grid gap-4">
      <div className="text-sm text-brand-gray-dark p-3 bg-brand-gray-light rounded">
        Paste each block into the <code>&lt;head&gt;</code> of the relevant page, or use your
        site&apos;s custom code injection setting to apply globally.
      </div>
      {schemas.map((s, n) => (
        <div key={n} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">{s.label || s.type}</h3>
            <div className="flex gap-2">
              <CopyButton text={s.code} />
              <DownloadButton
                filename={`${slugify(s.label || s.type)}.json`}
                text={s.code}
                mime="application/json"
              />
            </div>
          </div>
          <pre className="bg-brand-gray-light text-xs p-3 rounded overflow-x-auto">{s.code}</pre>
        </div>
      ))}
    </div>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
