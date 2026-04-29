'use client';
import { CopyButton } from '../ui/CopyButton';
import { DownloadButton } from '../ui/DownloadButton';

interface Props {
  robotsTxt: string;
  llmsTxt: string;
  metaTags: string;
}

export function QuickWinsPanel({ robotsTxt, llmsTxt, metaTags }: Props) {
  return (
    <div className="grid gap-4">
      <div className="text-sm text-brand-gray-dark p-3 bg-brand-gray-light rounded">
        <strong>Implementation:</strong> robots.txt and llms.txt go in the root folder of your
        website — same level as your homepage. Any web developer or hosting provider can upload
        these in under 5 minutes. Meta tags: paste the HTML snippet into the <code>&lt;head&gt;</code> section of every
        page. In most website builders, find &quot;Custom code&quot; or &quot;Header injection&quot; in site
        settings.
      </div>
      <FileCard title="robots.txt" body={robotsTxt} filename="robots.txt" />
      <FileCard title="llms.txt" body={llmsTxt} filename="llms.txt" />
      <FileCard title="Meta tags (OG + canonical + date)" body={metaTags} filename="meta-tags.html" />
    </div>
  );
}

function FileCard({ title, body, filename }: { title: string; body: string; filename: string }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex gap-2">
          <CopyButton text={body} />
          <DownloadButton filename={filename} text={body} />
        </div>
      </div>
      <pre className="bg-brand-gray-light text-xs p-3 rounded overflow-x-auto whitespace-pre-wrap">
        {body}
      </pre>
    </div>
  );
}
