import { NextRequest, NextResponse } from 'next/server';
import { getAudit } from '@/lib/store';
import { scoreColor } from '@/lib/scoring';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const audit = await getAudit(id);
  if (!audit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const html = renderAuditHtml(audit);

  // Try puppeteer for PDF; fall back to HTML if not available
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
    await browser.close();
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="aiscore-audit-${audit.domain}.pdf"`,
      },
    });
  } catch (e) {
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

function renderAuditHtml(audit: Awaited<ReturnType<typeof getAudit>>): string {
  if (!audit) return '<html><body>Audit not found</body></html>';
  const c = audit.categoryScores;
  const color = scoreColor(audit.geoScore);
  const gradeColor = audit.geoScore >= 85 ? '#1D9E75' : audit.geoScore >= 70 ? '#29a871' : audit.geoScore >= 55 ? '#BA7517' : audit.geoScore >= 35 ? '#EF9F27' : '#E24B4A';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>AI Score audit — ${audit.domain}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif;
  color: #1d1d1f;
  line-height: 1.6;
  background: #fbfbfd;
}
.page-break { page-break-after: always; }
.header {
  background: linear-gradient(135deg, #29a871 0%, #1D9E75 100%);
  color: #fff;
  padding: 48px 40px;
  border-bottom: 4px solid #0071e3;
}
.logo { font-size: 16px; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 24px; }
.header-title { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
.header-subtitle { font-size: 14px; opacity: 0.9; }
.section {
  padding: 40px;
  margin: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.section-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1d1d1f;
  border-bottom: 3px solid #29a871;
  padding-bottom: 12px;
}
.score-card {
  background: linear-gradient(135deg, #f9fafb 0%, #fbfbfd 100%);
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  border: 2px solid #e0e0e2;
  margin-bottom: 24px;
}
.score-big {
  font-size: 72px;
  font-weight: 700;
  color: ${gradeColor};
  margin: 12px 0;
  line-height: 1;
}
.score-big span { font-size: 24px; color: #6e6e73; }
.grade {
  color: #6e6e73;
  font-size: 16px;
  font-weight: 500;
  margin-top: 8px;
}
.scores-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 24px;
}
.score-item {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #29a871;
}
.score-label {
  font-size: 12px;
  color: #6e6e73;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  font-weight: 600;
}
.score-value {
  font-size: 28px;
  font-weight: 700;
  color: #1d1d1f;
}
.summary-box {
  background: linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%);
  padding: 24px;
  border-radius: 8px;
  border-left: 4px solid #0071e3;
  line-height: 1.8;
  color: #1d1d1f;
  white-space: pre-wrap;
}
.issue {
  padding: 16px;
  margin-bottom: 12px;
  border-left: 4px solid #e0e0e2;
  background: #fbfbfd;
  border-radius: 4px;
}
.issue:hover { background: #f5f5f7; }
.severity {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  margin-right: 12px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.crit { background: #E24B4A; }
.high { background: #EF9F27; }
.med { background: #BA7517; }
.issue-title {
  font-weight: 600;
  color: #1d1d1f;
  margin-top: 8px;
  font-size: 14px;
}
.issue-description {
  color: #6e6e73;
  font-size: 13px;
  margin-top: 6px;
  line-height: 1.5;
}
.action-group { margin-bottom: 24px; }
.action-group h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e0e0e2;
}
.action-list {
  list-style: none;
}
.action-list li {
  padding: 12px;
  margin-bottom: 8px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
  border-left: 3px solid #29a871;
}
.action-title {
  font-weight: 600;
  color: #1d1d1f;
}
.action-impact {
  color: #6e6e73;
  font-size: 12px;
  margin-top: 4px;
}
.cta-section {
  background: linear-gradient(135deg, #29a871 0%, #1D9E75 100%);
  color: #fff;
  padding: 32px;
  border-radius: 12px;
  text-align: center;
  margin: 20px;
  margin-bottom: 0;
}
.cta-section h2 {
  font-size: 20px;
  margin-bottom: 12px;
  font-weight: 700;
}
.cta-section p {
  font-size: 13px;
  opacity: 0.95;
  margin-bottom: 12px;
}
.footer {
  background: #1d1d1f;
  color: #fbfbfd;
  padding: 24px;
  text-align: center;
  font-size: 11px;
}
.footer-content {
  max-width: 800px;
  margin: 0 auto;
}
.footer-link {
  color: #0071e3;
  text-decoration: none;
}
pre {
  white-space: pre-wrap;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  background: #f5f5f7;
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #29a871;
}
.meta-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  font-size: 12px;
  color: #6e6e73;
  margin-top: 12px;
}
.no-issues {
  color: #1D9E75;
  font-style: italic;
  padding: 16px;
  background: #f0fdf4;
  border-radius: 6px;
  border-left: 4px solid #1D9E75;
}
</style></head>
<body>

<div class="header">
  <div class="logo">AI SCORE — GEO AUDIT</div>
  <div class="header-title">Your AI Search Readiness Report</div>
  <div class="header-subtitle">${audit.domain} · ${new Date(audit.generatedAt).toDateString()}</div>
</div>

<div class="section">
  <div class="score-card">
    <div style="font-size: 12px; color: #6e6e73; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 8px;">Your GEO Score</div>
    <div class="score-big">${audit.geoScore}<span> / 100</span></div>
    <div class="grade">Rating: ${audit.grade}</div>
  </div>

  <div class="scores-grid">
    <div class="score-item"><div class="score-label">Citability</div><div class="score-value">${c.citability}</div></div>
    <div class="score-item"><div class="score-label">Brand Authority</div><div class="score-value">${c.brandAuthority}</div></div>
    <div class="score-item"><div class="score-label">E-E-A-T</div><div class="score-value">${c.eeat}</div></div>
    <div class="score-item"><div class="score-label">Technical SEO</div><div class="score-value">${c.technicalSEO}</div></div>
    <div class="score-item"><div class="score-label">Schema Markup</div><div class="score-value">${c.schemaMarkup}</div></div>
    <div class="score-item"><div class="score-label">Platform Ready</div><div class="score-value">${c.platformReadiness}</div></div>
  </div>

  <div class="meta-info">
    <div>📊 Pages Crawled: ${audit.pagesCrawled}</div>
    <div>📅 Report Date: ${new Date(audit.generatedAt).toLocaleDateString()}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">📋 Executive Summary</div>
  <div class="summary-box">${escapeHtml(audit.executiveSummary)}</div>
</div>

<div class="section">
  <div class="section-title">🔍 Key Findings</div>
  ${renderIssues(audit.findings.critical, 'crit', 'CRITICAL')}
  ${renderIssues(audit.findings.high, 'high', 'HIGH')}
  ${renderIssues(audit.findings.medium, 'med', 'MEDIUM')}
  ${audit.findings.critical.length === 0 && audit.findings.high.length === 0 && audit.findings.medium.length === 0 ? '<div class="no-issues">✓ No major issues found</div>' : ''}
</div>

<div class="section">
  <div class="section-title">🎯 Action Plan</div>
  ${renderActions('⚡ Quick Wins', audit.actionPlan.quickWins)}
  ${renderActions('📈 Medium-term Actions', audit.actionPlan.mediumTermActions)}
  ${renderActions('🚀 Strategic Initiatives', audit.actionPlan.strategicInitiatives)}
</div>

<div class="section">
  <div class="section-title">🎓 E-E-A-T + Platform Analysis</div>
  <div class="summary-box">${escapeHtml(audit.eeatNarrative)}</div>
</div>

<div class="cta-section">
  <h2>Ready to improve your GEO score?</h2>
  <p>Our AI Visibility Improver package delivers all the implementation templates, brand voice guidelines, content strategy, and custom prompts you need to implement these findings immediately.</p>
  <p style="margin-top: 16px; font-size: 12px;">
    📧 Contact us at <span style="font-weight: 600;">found@aiscore.co.za</span> to discuss your personalized improvement plan
  </p>
</div>

<div class="footer">
  <div class="footer-content">
    <strong>AI Score</strong> — Powered by advanced AI analysis<br>
    <a href="https://aiscore.co.za" class="footer-link">aiscore.co.za</a> · <a href="mailto:found@aiscore.co.za" class="footer-link">found@aiscore.co.za</a><br>
    <span style="margin-top: 12px; display: block; opacity: 0.7;">This report is confidential and proprietary. Generated ${new Date(audit.generatedAt).toLocaleString()}</span>
  </div>
</div>

</body></html>`;
}

function renderIssues(
  issues: { severity: string; title: string; description: string }[],
  cls: string,
  label: string
): string {
  if (!issues.length) return '';
  return issues
    .map(
      (i) => `<div class="issue"><span class="severity ${cls}">${label}</span><strong>${escapeHtml(
        i.title
      )}</strong><div style="color:#6e6e73;font-size:14px;margin-top:4px;">${escapeHtml(
        i.description
      )}</div></div>`
    )
    .join('');
}

function renderActions(
  label: string,
  items: { action: string; expected_impact: string; effort: string }[]
): string {
  if (!items?.length) return '';
  return `<h3 style="margin:16px 0 8px;font-size:15px;">${label}</h3><ul>${items
    .map(
      (a) => `<li><strong>${escapeHtml(a.action)}</strong> — <span style="color:#6e6e73;">${escapeHtml(
        a.expected_impact || ''
      )} (${a.effort})</span></li>`
    )
    .join('')}</ul>`;
}

function escapeHtml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
