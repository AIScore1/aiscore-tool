'use client';
import { useEffect, useMemo, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Lead } from '@/lib/types';
import { scoreColor } from '@/lib/scoring';

type Status = Lead['status'];
const STATUS: Status[] = ['new', 'contacted', 'audit_sent', 'proposal', 'client', 'lost'];

export function LeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tempFilter, setTempFilter] = useState<'all' | Lead['temperature']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [sort, setSort] = useState<'date' | 'score' | 'gap'>('date');
  const [open, setOpen] = useState<Lead | null>(null);

  const load = async () => {
    const res = await fetch('/api/leads');
    const data = await res.json();
    setLeads(data.leads ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  const sectors = useMemo(
    () => Array.from(new Set(leads.map((l) => l.sector))).sort(),
    [leads]
  );

  const filtered = useMemo(() => {
    let xs = leads.slice();
    if (tempFilter !== 'all') xs = xs.filter((l) => l.temperature === tempFilter);
    if (statusFilter !== 'all') xs = xs.filter((l) => l.status === statusFilter);
    if (sectorFilter !== 'all') xs = xs.filter((l) => l.sector === sectorFilter);
    if (sort === 'date') xs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === 'score') xs.sort((a, b) => a.geoScore - b.geoScore);
    if (sort === 'gap') xs.sort((a, b) => b.scoreGap - a.scoreGap);
    return xs;
  }, [leads, tempFilter, statusFilter, sectorFilter, sort]);

  const stats = {
    total: leads.length,
    hot: leads.filter((l) => l.temperature === 'hot').length,
    warm: leads.filter((l) => l.temperature === 'warm').length,
    converted: leads.filter((l) => l.status === 'client').length,
  };

  const updateStatus = async (id: string, status: Status) => {
    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  const updateNotes = async (id: string, notes: string) => {
    await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notes, read: true }),
    });
  };

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total leads" value={stats.total} />
        <Stat label="Hot" value={stats.hot} accent="#E24B4A" />
        <Stat label="Warm" value={stats.warm} accent="#EF9F27" />
        <Stat label="Converted" value={stats.converted} accent="#29a871" />
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            className="input w-auto"
            value={tempFilter}
            onChange={(e) => setTempFilter(e.target.value as 'all' | Lead['temperature'])}
          >
            <option value="all">All temperatures</option>
            <option value="hot">🔥 Hot</option>
            <option value="warm">◎ Warm</option>
            <option value="cold">· Cold</option>
          </select>
          <select
            className="input w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | Status)}
          >
            <option value="all">All statuses</option>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {humanStatus(s)}
              </option>
            ))}
          </select>
          <select
            className="input w-auto"
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
          >
            <option value="all">All sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="input w-auto"
            value={sort}
            onChange={(e) => setSort(e.target.value as 'date' | 'score' | 'gap')}
          >
            <option value="date">Newest first</option>
            <option value="score">Score (lowest first)</option>
            <option value="gap">Gap (largest first)</option>
          </select>
          <a
            href="/api/leads?format=csv"
            className="btn-secondary inline-flex items-center gap-1.5 ml-auto"
          >
            <Download size={14} />
            Export CSV
          </a>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-gray-light text-xs text-brand-gray-dark uppercase">
            <tr>
              <th className="text-left p-3">Temp</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Domain</th>
              <th className="text-left p-3">Score</th>
              <th className="text-left p-3">vs Comp</th>
              <th className="text-left p-3">Sector</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td className="p-6 text-center text-brand-gray-dark" colSpan={8}>
                  No leads yet. Public audits from aiscore.co.za appear here automatically.
                </td>
              </tr>
            )}
            {filtered.map((l) => (
              <tr
                key={l.id}
                onClick={() => setOpen(l)}
                className="border-t border-gray-100 hover:bg-brand-gray-light cursor-pointer"
              >
                <td className="p-3">{tempBadge(l.temperature)}</td>
                <td className="p-3">
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-brand-gray-dark">{l.email}</div>
                </td>
                <td className="p-3">{l.domain}</td>
                <td className="p-3">
                  <span style={{ color: scoreColor(l.geoScore), fontWeight: 600 }}>
                    {l.geoScore}
                  </span>
                </td>
                <td className="p-3 text-xs">
                  {l.competitorScore ? (
                    <span className="text-red-600">+{l.scoreGap} pts behind</span>
                  ) : (
                    <span className="text-brand-gray-dark">No competitor</span>
                  )}
                </td>
                <td className="p-3 text-xs capitalize">{l.sector}</td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <select
                    className="input"
                    value={l.status}
                    onChange={(e) => updateStatus(l.id, e.target.value as Status)}
                  >
                    {STATUS.map((s) => (
                      <option key={s} value={s}>
                        {humanStatus(s)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3 text-xs text-brand-gray-dark">
                  {new Date(l.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <LeadDrawer
          lead={open}
          onClose={() => setOpen(null)}
          onSaveNotes={async (notes) => {
            await updateNotes(open.id, notes);
            setOpen({ ...open, notes });
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, accent = '#1d1d1f' }: { label: string; value: number; accent?: string }) {
  return (
    <div className="card">
      <div className="text-xs text-brand-gray-dark uppercase tracking-wide">{label}</div>
      <div className="text-3xl font-semibold" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

function tempBadge(t: Lead['temperature']) {
  if (t === 'hot') return <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs">🔥 Hot</span>;
  if (t === 'warm') return <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs">◎ Warm</span>;
  return <span className="bg-gray-300 text-gray-700 px-2 py-0.5 rounded text-xs">· Cold</span>;
}

function humanStatus(s: Lead['status']) {
  return s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function LeadDrawer({
  lead,
  onClose,
  onSaveNotes,
}: {
  lead: Lead;
  onClose: () => void;
  onSaveNotes: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(lead.notes);
  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md h-full overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold">{lead.name}</h3>
            <div className="text-xs text-brand-gray-dark">{lead.email}</div>
            {lead.phone && <div className="text-xs text-brand-gray-dark">{lead.phone}</div>}
          </div>
          <button onClick={onClose} className="text-brand-gray-dark">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-3">
          <div className="card">
            <div className="text-xs text-brand-gray-dark mb-1">Score</div>
            <div className="flex gap-4 items-baseline">
              <span style={{ color: scoreColor(lead.geoScore), fontSize: 32, fontWeight: 600 }}>
                {lead.geoScore}
              </span>
              {lead.competitorScore && (
                <span className="text-sm text-brand-gray-dark">
                  vs {lead.competitorDomain}: {lead.competitorScore}
                </span>
              )}
            </div>
            <div className="text-xs text-brand-gray-dark mt-1">
              Sector: {lead.sector} (avg {lead.sectorAverage})
            </div>
          </div>

          <div className="card">
            <h4 className="font-semibold text-sm mb-2">Category scores</h4>
            <ul className="text-xs grid gap-1">
              <li>Citability: {lead.categoryScores.citability}</li>
              <li>Brand authority: {lead.categoryScores.brandAuthority}</li>
              <li>E-E-A-T: {lead.categoryScores.eeat}</li>
              <li>Technical SEO: {lead.categoryScores.technicalSEO}</li>
              <li>Schema: {lead.categoryScores.schemaMarkup}</li>
              <li>Platform readiness: {lead.categoryScores.platformReadiness}</li>
            </ul>
          </div>

          <div className="card">
            <h4 className="font-semibold text-sm mb-2">Top issues</h4>
            <ul className="space-y-2 text-xs">
              {lead.topIssues.map((i, n) => (
                <li key={n}>
                  <strong>[{i.severity}] {i.title}</strong>
                  <div className="text-brand-gray-dark">{i.description}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              onClick={() => onSaveNotes(notes)}
              className="btn-primary mt-2 text-xs"
            >
              Save notes
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`https://${lead.domain}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs"
            >
              Open their website ↗
            </a>
            {lead.competitorDomain && (
              <a
                href={`https://${lead.competitorDomain}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs"
              >
                Open competitor ↗
              </a>
            )}
            {lead.phone && (
              <a
                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs"
              >
                WhatsApp →
              </a>
            )}
          </div>

          <div className="text-xs text-brand-gray-dark">
            Report ID: {lead.reportId} · Expires{' '}
            {new Date(lead.reportExpiresAt).toDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
