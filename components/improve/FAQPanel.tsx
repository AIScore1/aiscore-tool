'use client';
import { useState } from 'react';
import { ImprovementResult } from '@/lib/types';
import { DownloadButton } from '../ui/DownloadButton';

export function FAQPanel({ faqHub }: { faqHub: ImprovementResult['faqHub'] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="grid gap-4">
      <div className="flex gap-2">
        <DownloadButton
          filename="faq-page.html"
          text={faqHub.htmlPage}
          mime="text/html"
          label="Download FAQ page HTML"
        />
        <DownloadButton
          filename="faq-schema.json"
          text={faqHub.schemaJsonLd}
          mime="application/ld+json"
          label="Download FAQPage Schema"
        />
      </div>
      <div className="text-sm text-brand-gray-dark p-3 bg-brand-gray-light rounded">
        Publish <code>faq-page.html</code> as <code>/faq</code> on the client&apos;s site. Paste the
        FAQPage schema in the same page&apos;s <code>&lt;head&gt;</code>.
      </div>
      <div className="grid gap-2">
        {faqHub.faqs.map((f, n) => (
          <div key={n} className="border border-gray-200 rounded-lg p-3">
            <button
              onClick={() => setOpen(open === n ? null : n)}
              className="w-full text-left font-medium flex justify-between items-center"
            >
              <span>{f.question}</span>
              <span className="text-brand-gray-dark text-xs">{open === n ? '−' : '+'}</span>
            </button>
            {open === n && (
              <div className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">{f.answer}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
