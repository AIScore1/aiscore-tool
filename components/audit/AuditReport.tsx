'use client';
import { AuditReport as Report } from '@/lib/types';
import { ScoreGauge } from '../ui/ScoreGauge';
import { ProgressBar } from '../ui/ProgressBar';
import { scoreColor } from '@/lib/scoring';
import { Download, RefreshCw } from 'lucide-react';

export function AuditReport({ report, onNew }: { report: Report; onNew: () => void }) {
  return (
    <div className="grid gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">{report.domain}</h2>
          <div className="text-xs text-brand-gray-dark">
            Audit {report.id.slice(-8)} · {new Date(report.generatedAt).toLocaleString()} ·{' '}
            {report.pagesCrawled} pages
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/pdf?id=${report.id}`}
            className="btn-secondary inline-flex items-center gap-1.5"
            target="_blank"
            rel="noreferrer"
          >
            <Download size={14} />
            PDF
          </a>
          <button onClick={onNew} className="btn-primary inline-flex items-center gap-1.5">
            <RefreshCw size={14} />
            New audit
          </button>
        </div>
      </div>

      <div className="card flex items-center gap-6">
        <div>
          <ScoreGauge score={report.geoScore} />
          <div className="text-sm font-medium" style={{ color: scoreColor(report.geoScore) }}>
            {report.grade}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
          <CategoryCell label="Citability" v={report.categoryScores.citability} max={100} />
          <CategoryCell label="Brand authority" v={report.categoryScores.brandAuthority} max={100} />
          <CategoryCell label="E-E-A-T" v={report.categoryScores.eeat} max={100} />
          <CategoryCell label="Technical SEO" v={report.categoryScores.technicalSEO} max={100} />
          <CategoryCell label="Schema markup" v={report.categoryScores.schemaMarkup} max={100} />
          <CategoryCell label="Platform readiness" v={report.categoryScores.platformReadiness} max={100} />
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Executive summary</h3>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{report.executiveSummary}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Critical findings</h3>
          {report.findings.critical.length === 0 ? (
            <div className="text-sm text-brand-gray-dark">No critical issues.</div>
          ) : (
            <ul className="space-y-2">
              {report.findings.critical.map((i, n) => (
                <li key={n} className="text-sm">
                  <strong className="text-red-600">{i.title}</strong>
                  <div className="text-brand-gray-dark">{i.description}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Action plan — Quick wins</h3>
          <ul className="space-y-2">
            {report.actionPlan.quickWins.map((a, n) => (
              <li key={n} className="text-sm">
                <strong>{a.action}</strong>
                <div className="text-brand-gray-dark">
                  {a.expected_impact} · {a.effort} effort · +{a.estimated_points} pts
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Projected scores</h3>
        <div className="grid grid-cols-4 gap-3">
          {report.actionPlan.projectedScores.map((p, n) => (
            <div key={n} className="text-center">
              <div className="text-xs text-brand-gray-dark">{p.timeline}</div>
              <div
                className="text-2xl font-semibold"
                style={{ color: scoreColor(p.score) }}
              >
                {p.score}
              </div>
              <div className="text-xs text-brand-gray-dark">{p.phase}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">E-E-A-T + platform analysis</h3>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{report.eeatNarrative}</div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Schema code (ready to paste)</h3>
        {report.schemaCode.schemas.length === 0 ? (
          <div className="text-sm text-brand-gray-dark">No schema code generated.</div>
        ) : (
          <div className="space-y-3">
            {report.schemaCode.schemas.map((s, n) => (
              <details key={n} className="border border-gray-200 rounded p-3">
                <summary className="font-medium cursor-pointer">{s.label || s.type}</summary>
                <pre className="mt-2 text-xs overflow-x-auto bg-brand-gray-light p-2 rounded">
                  {s.code}
                </pre>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryCell({ label, v }: { label: string; v: number; max: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span style={{ color: scoreColor(v), fontWeight: 600 }}>{v}</span>
      </div>
      <ProgressBar percent={v} color={scoreColor(v)} />
    </div>
  );
}
