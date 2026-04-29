import { extractJson, run } from '../anthropic';
import {
  ActionPlan,
  BrandAuthorityResult,
  CategoryScores,
  EEATResult,
  Issue,
  PlatformScores,
  SchemaCodeOutput,
} from '../types';

const SUMMARY_SYSTEM = `You are a GEO analyst for South African businesses. Be clear, direct, no jargon.`;

export async function generateExecutiveSummary(input: {
  domain: string;
  businessType: string;
  score: number;
  grade: string;
  pagesCrawled: number;
  scores: CategoryScores;
  critical: Issue[];
  high: Issue[];
  clientName?: string;
}): Promise<string> {
  const user = `Write an executive summary for this audit.
Domain: ${input.domain} | Business type: ${input.businessType} | Overall score: ${input.score}/100 (${input.grade})
Pages crawled: ${input.pagesCrawled} | Date: ${new Date().toISOString().split('T')[0]}
Scores: Citability ${input.scores.citability} | Brand Authority ${input.scores.brandAuthority} | E-E-A-T ${input.scores.eeat} | Technical ${input.scores.technicalSEO} | Schema ${input.scores.schemaMarkup} | Platform ${input.scores.platformReadiness}
Critical findings: ${input.critical.map((i) => i.title).join('; ') || 'none'} | High priority: ${input.high.map((i) => i.title).join('; ') || 'none'}

Write 3 paragraphs (3–4 sentences each):
1. What this score means in plain English for this specific business
2. The 2–3 most critical gaps blocking AI citations right now
3. The single highest-impact opportunity available in the next 30 days
Tone: professional but encouraging. Never use the word "leverage".`;

  return run({
    model: 'sonnet',
    task: 'Executive summary',
    system: SUMMARY_SYSTEM,
    user,
    maxTokens: 1500,
    clientName: input.clientName,
  });
}

const ACTION_SYSTEM = `GEO implementation expert. Be specific. Every action must be immediately actionable.
Return ONLY valid JSON. No markdown. No explanation outside the JSON.`;

export async function generateActionPlan(input: {
  findings: Issue[];
  scores: CategoryScores;
  baseScore: number;
  clientName?: string;
}): Promise<ActionPlan> {
  const user = `Generate a prioritised action plan.
Findings: ${JSON.stringify(input.findings)} | Scores: ${JSON.stringify(input.scores)}

{
  "quickWins": [max 5 items, low effort, implementable this week],
  "mediumTermActions": [max 5 items, next 30 days],
  "strategicInitiatives": [max 3 items, next 90 days],
  "projectedScores": [
    {"phase":"Current","timeline":"Now","score":${input.baseScore},"improvement":0},
    {"phase":"After Quick Wins","timeline":"2 weeks","score":N,"improvement":N},
    {"phase":"After Medium-Term","timeline":"6 weeks","score":N,"improvement":N},
    {"phase":"After Strategic","timeline":"3 months","score":N,"improvement":N}
  ]
}

Each action item: {"action":"exact step","expected_impact":"specific outcome","effort":"low|medium|high","estimated_points":N}`;

  const text = await run({
    model: 'sonnet',
    task: 'Action plan',
    system: ACTION_SYSTEM,
    user,
    maxTokens: 3000,
    clientName: input.clientName,
  });
  const parsed = extractJson<ActionPlan>(text);
  if (parsed) return parsed;
  return {
    quickWins: [],
    mediumTermActions: [],
    strategicInitiatives: [],
    projectedScores: [
      { phase: 'Current', timeline: 'Now', score: input.baseScore, improvement: 0 },
      {
        phase: 'After Quick Wins',
        timeline: '2 weeks',
        score: Math.min(100, input.baseScore + 15),
        improvement: 15,
      },
      {
        phase: 'After Medium-Term',
        timeline: '6 weeks',
        score: Math.min(100, input.baseScore + 28),
        improvement: 13,
      },
      {
        phase: 'After Strategic',
        timeline: '3 months',
        score: Math.min(100, input.baseScore + 38),
        improvement: 10,
      },
    ],
  };
}

const SCHEMA_SYSTEM = `Generate valid JSON-LD only. No markdown. No explanation.`;

export async function generateAuditSchemaCode(input: {
  domain: string;
  businessName: string;
  sector: string;
  location: string;
  services: string[];
  socialLinks: string[];
  clientName?: string;
}): Promise<SchemaCodeOutput> {
  const user = `Generate Schema.org markup for ${input.domain}.
Business: ${input.businessName} | Sector: ${input.sector} | Location: ${input.location}
Services: ${input.services.join(', ')} | Social profiles found during crawl: ${input.socialLinks.join(', ') || 'none'}

Generate these schema types: Organization (with sameAs), LocalBusiness (or sector subtype),
Service (one per service listed), WebSite+SearchAction, BreadcrumbList.

Return ONLY:
{"schemas":[{"type":"...","label":"display name","code":"...full json-ld string..."}]}`;

  const text = await run({
    model: 'haiku',
    task: 'Audit schema code',
    system: SCHEMA_SYSTEM,
    user,
    maxTokens: 3000,
    clientName: input.clientName,
  });
  const parsed = extractJson<SchemaCodeOutput>(text);
  return parsed ?? { schemas: [] };
}

export async function generateEEATNarrative(input: {
  domain: string;
  eeat: EEATResult;
  platforms: PlatformScores;
  brand: BrandAuthorityResult;
  clientName?: string;
}): Promise<string> {
  const user = `Analyse E-E-A-T signals and platform readiness.
Domain: ${input.domain}
E-E-A-T: Experience ${input.eeat.experience}/25 | Expertise ${input.eeat.expertise}/25 | Authoritativeness ${input.eeat.authoritativeness}/25 | Trustworthiness ${input.eeat.trustworthiness}/25
Platforms: Google AIO ${input.platforms.googleAIO} | ChatGPT ${input.platforms.chatgpt} | Perplexity ${input.platforms.perplexity} | Gemini ${input.platforms.gemini} | Bing Copilot ${input.platforms.bingCopilot}
Brand presence: ${JSON.stringify({ youtube: input.brand.youtube, reddit: input.brand.reddit, wikipedia: input.brand.wikipedia, linkedin: input.brand.linkedin, github: input.brand.github })}

Write:
1. E-E-A-T analysis (2 paragraphs): what signals exist and what is critically missing
2. Per-platform analysis (1 paragraph each for all 5): current readiness, primary blocker, priority fix
3. Brand authority gaps (1 paragraph): which platforms need attention first and why`;

  return run({
    model: 'sonnet',
    task: 'E-E-A-T + platform narrative',
    system: SUMMARY_SYSTEM,
    user,
    maxTokens: 3500,
    clientName: input.clientName,
  });
}

