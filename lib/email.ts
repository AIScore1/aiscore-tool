import { Resend } from 'resend';
import { Lead, PublicAuditResult } from './types';
import { scoreColor } from './scoring';

const FROM = 'AI Score <found@aiscore.co.za>';

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const teal = '#29a871';
const black = '#1d1d1f';
const grayLight = '#f5f5f7';
const grayDark = '#6e6e73';

export async function sendScoreReport(lead: Lead, result: PublicAuditResult): Promise<void> {
  const r = client();
  if (!r) {
    console.warn('[email] RESEND_API_KEY not set — score report email skipped.');
    return;
  }
  const html = renderScoreReportEmail(lead, result);
  const text = renderScoreReportText(lead, result);
  await r.emails.send({
    from: FROM,
    to: [lead.email],
    subject: `Your AI Visibility Score: ${result.prospect.geoScore}/100 — here's what your competitor is doing differently`,
    html,
    text,
  });
}

export async function sendLeadNotification(
  lead: Lead,
  result: PublicAuditResult
): Promise<void> {
  const r = client();
  const operator = process.env.OPERATOR_EMAIL || 'found@aiscore.co.za';
  if (!r) {
    console.warn('[email] RESEND_API_KEY not set — lead notification email skipped.');
    return;
  }
  const tempEmoji = lead.temperature === 'hot' ? '🔥' : lead.temperature === 'warm' ? '◎' : '·';
  const subject = `${tempEmoji} New lead: ${lead.name} — ${lead.domain} scored ${result.prospect.geoScore}/100${result.competitor ? ` (competitor: ${result.competitor.geoScore}/100)` : ''}`;
  const html = renderOperatorEmail(lead, result);
  await r.emails.send({
    from: FROM,
    to: [operator],
    subject,
    html,
  });
}

export async function addToMailerLite(
  lead: Lead,
  result: PublicAuditResult
): Promise<void> {
  const key = process.env.MAILERLITE_API_KEY;
  if (!key) return;
  try {
    await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        email: lead.email,
        fields: {
          name: lead.name,
          phone: lead.phone || '',
          domain: lead.domain,
          score: result.prospect.geoScore,
          competitor_score: result.competitor?.geoScore ?? '',
          sector: lead.sector,
          temperature: lead.temperature,
        },
        groups: ['Public Audit Leads'],
      }),
    });
  } catch (e) {
    console.warn('[email] MailerLite add failed:', e);
  }
}

function renderScoreReportEmail(lead: Lead, result: PublicAuditResult): string {
  const yourColor = scoreColor(result.prospect.geoScore);
  const compColor = result.competitor ? scoreColor(result.competitor.geoScore) : grayDark;
  const calendly = process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://aiscore.co.za';
  const whatsapp = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}`;
  const compRow = result.competitor
    ? `<td width="50%" style="padding:0 8px;vertical-align:top;">
         <div style="background:${grayLight};border-radius:8px;padding:20px;border-left:4px solid ${teal};">
           <div style="color:${grayDark};font-size:12px;letter-spacing:0.5px;text-transform:uppercase;">${escapeHtml(result.competitor.domain)}</div>
           <div style="font-size:48px;font-weight:600;color:${compColor};margin:8px 0;">${result.competitor.geoScore}</div>
           <div style="font-size:13px;color:${black};">${result.competitor.grade}</div>
         </div>
       </td>`
    : '';

  const issues = result.prospect.topIssues
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;">
          <span style="display:inline-block;background:${severityColor(i.severity)};color:#fff;font-size:11px;padding:2px 8px;border-radius:4px;">${i.severity}</span>
        </td>
        <td style="padding:8px 0 8px 12px;">
          <div style="font-weight:600;color:${black};">${escapeHtml(i.title)}</div>
          <div style="color:${grayDark};font-size:14px;">${escapeHtml(i.description)}</div>
        </td>
      </tr>`
    )
    .join('');

  const nextScores = result.projectedScores;
  return `<!DOCTYPE html>
<html>
<body style="margin:0;background:${grayLight};font-family:Arial,Helvetica,sans-serif;color:${black};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${grayLight};">
  <tr><td align="center" style="padding:24px 12px;">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;">
      <tr><td style="background:${teal};padding:20px 24px;color:#fff;">
        <div style="font-size:22px;font-weight:600;">AI Score</div>
        <div style="font-size:13px;opacity:0.85;">aiscore.co.za</div>
      </td></tr>
      <tr><td style="padding:24px;">
        <div style="font-size:12px;color:${grayDark};">Report ${escapeHtml(result.reportId)} · ${new Date(result.generatedAt).toDateString()}</div>
        <h1 style="font-size:22px;color:${black};margin:8px 0 16px;">Your AI Visibility Score</h1>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="${result.competitor ? '50%' : '100%'}" style="padding:0 8px;vertical-align:top;">
              <div style="background:${grayLight};border-radius:8px;padding:20px;">
                <div style="color:${grayDark};font-size:12px;letter-spacing:0.5px;text-transform:uppercase;">${escapeHtml(result.prospect.domain)}</div>
                <div style="font-size:48px;font-weight:600;color:${yourColor};margin:8px 0;">${result.prospect.geoScore}</div>
                <div style="font-size:13px;color:${black};">${result.prospect.grade}</div>
              </div>
            </td>
            ${compRow}
          </tr>
        </table>

        ${
          result.competitor
            ? `<div style="background:#fff5f5;border:1px solid #ffd9d9;border-radius:8px;padding:16px;margin:20px 0;color:${black};">
                When a potential client asks ChatGPT a question in your sector, ${escapeHtml(result.competitor.domain)} appears in the answer. You don't. They are receiving AI-referred clients that should be yours.
              </div>`
            : `<div style="background:#fff8e6;border:1px solid #f3dc8a;border-radius:8px;padding:16px;margin:20px 0;color:${black};">
                ${escapeHtml(result.sectorBenchmark.label)} average: ${result.sectorBenchmark.averageScore}/100 — you scored ${result.prospect.geoScore}/100.
              </div>`
        }

        <h2 style="font-size:18px;color:${black};margin:24px 0 8px;">Top 3 critical gaps</h2>
        <table width="100%" cellpadding="0" cellspacing="0">${issues}</table>

        <h2 style="font-size:18px;color:${black};margin:24px 0 12px;">What fixing this looks like</h2>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" width="33%" style="padding:8px;">
              <div style="font-size:12px;color:${grayDark};">Today</div>
              <div style="font-size:28px;font-weight:600;color:${yourColor};">${result.prospect.geoScore}</div>
            </td>
            <td align="center" width="33%" style="padding:8px;">
              <div style="font-size:12px;color:${grayDark};">After Quick Wins</div>
              <div style="font-size:28px;font-weight:600;color:${scoreColor(nextScores.afterQuickWins)};">${nextScores.afterQuickWins}</div>
            </td>
            <td align="center" width="33%" style="padding:8px;">
              <div style="font-size:12px;color:${grayDark};">After Full Build</div>
              <div style="font-size:28px;font-weight:600;color:${scoreColor(nextScores.afterFoundation)};">${nextScores.afterFoundation}</div>
            </td>
          </tr>
        </table>

        <div style="background:${teal};border-radius:8px;padding:20px;margin:24px 0;color:#fff;">
          <div style="font-size:14px;margin-bottom:12px;">This report has been sent to ${escapeHtml(lead.email)}. Our team will be in touch within 24 hours.</div>
          <a href="${calendly}" style="display:inline-block;background:#fff;color:${teal};padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;margin-right:8px;">Book a call →</a>
          <a href="${whatsapp}" style="display:inline-block;background:#25D366;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;">Chat on WhatsApp →</a>
        </div>

        <div style="font-size:11px;color:${grayDark};text-align:center;margin-top:24px;">
          This report is valid until ${new Date(result.expiresAt).toDateString()}. AI search rankings change monthly.<br>
          AI Score · aiscore.co.za · found@aiscore.co.za
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function renderScoreReportText(lead: Lead, result: PublicAuditResult): string {
  return `AI Score — Your Visibility Report
Report ${result.reportId} · ${new Date(result.generatedAt).toDateString()}

Your domain: ${result.prospect.domain}
Score: ${result.prospect.geoScore}/100 — ${result.prospect.grade}
${result.competitor ? `Competitor: ${result.competitor.domain} — ${result.competitor.geoScore}/100 (${result.competitor.grade})` : ''}

Top 3 gaps:
${result.prospect.topIssues.map((i, n) => `${n + 1}. [${i.severity}] ${i.title}\n   ${i.description}`).join('\n')}

What fixing looks like:
Today: ${result.prospect.geoScore} → After Quick Wins: ${result.projectedScores.afterQuickWins} → After Full Build: ${result.projectedScores.afterFoundation}

Book a call: ${process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://aiscore.co.za'}
WhatsApp: https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}

Valid until ${new Date(result.expiresAt).toDateString()}.
AI Score · aiscore.co.za · found@aiscore.co.za`;
}

function renderOperatorEmail(lead: Lead, result: PublicAuditResult): string {
  const dashUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?tab=leads&lead=${lead.id}`;
  const yourColor = scoreColor(result.prospect.geoScore);
  const tempColor =
    lead.temperature === 'hot' ? '#E24B4A' : lead.temperature === 'warm' ? '#EF9F27' : '#6e6e73';
  return `<!DOCTYPE html>
<html><body style="font-family:Arial,Helvetica,sans-serif;color:${black};max-width:560px;margin:0 auto;padding:24px;">
<h2 style="color:${tempColor};margin:0 0 12px;">${lead.temperature.toUpperCase()} lead — ${escapeHtml(lead.name)}</h2>
<p style="margin:0 0 8px;">${escapeHtml(lead.email)}${lead.phone ? ' · ' + escapeHtml(lead.phone) : ''}</p>
<p style="margin:0 0 16px;color:${grayDark};">${escapeHtml(lead.domain)} → <strong style="color:${yourColor};">${result.prospect.geoScore}/100</strong>${
    result.competitor
      ? ` · vs ${escapeHtml(result.competitor.domain)} <strong>${result.competitor.geoScore}/100</strong>`
      : ''
  }</p>
<p style="margin:0 0 8px;"><strong>Sector:</strong> ${escapeHtml(result.sectorBenchmark.label)} (avg ${result.sectorBenchmark.averageScore})</p>
<p style="margin:0 0 12px;"><strong>Top gaps:</strong></p>
<ul>${result.prospect.topIssues.map((i) => `<li>[${i.severity}] ${escapeHtml(i.title)}</li>`).join('')}</ul>
<p style="margin:16px 0;"><a href="${dashUrl}" style="background:${teal};color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View in leads dashboard →</a></p>
<p style="font-size:12px;color:${grayDark};">Follow up within 24 hours for best conversion rate.</p>
</body></html>`;
}

function severityColor(s: string): string {
  if (s === 'CRITICAL') return '#E24B4A';
  if (s === 'HIGH') return '#EF9F27';
  return '#BA7517';
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
