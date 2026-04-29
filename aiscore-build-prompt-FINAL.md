# CLAUDE CODE BUILD PROMPT — V2 FINAL
## AI Score — GEO Audit + AI Visibility Improver + Lead Engine
## aiscore.co.za · Internal operator tool + public-facing lite audit endpoint
### Paste this entire document into Claude Code

---

## CONTEXT

This is an internal tool for the **AI Score** team (aiscore.co.za). The operator fills
in all forms from client meeting notes or from data the client submitted via the website.
This tool is NEVER used directly by clients.

The app has five tabs + one public endpoint:
- **Tab 1 — GEO Audit**: Full 50-page crawl, 6-dimension scoring, branded PDF report.
- **Tab 2 — AI Visibility Improver**: All Foundation package deliverables from profile inputs.
- **Tab 3 — Generate Articles**: Retainer content generation, manually triggered.
- **Tab 4 — Leads**: All leads from public audit widget. Status tracking, temperature scoring, CSV export.
- **Tab 5 — API Usage**: Credit balance tracking, per-call cost log, usage breakdown.
- **Public endpoint `/api/public-audit`**: Powers the self-serve score widget on aiscore.co.za.
  This is the primary sales conversion mechanism — no AI calls, instant, free to run.

---

## TECH STACK

```
Next.js 14 (App Router, TypeScript)
Tailwind CSS
axios + cheerio          — crawling + HTML parsing
xml2js                   — sitemap parsing
@anthropic-ai/sdk        — Claude API
resend                   — transactional email (score reports + notifications)
puppeteer                — PDF export
jszip                    — ZIP download
lucide-react             — icons
```

Install:
```bash
npx create-next-app@latest aiscore-tool --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd aiscore-tool
npm install axios cheerio xml2js @anthropic-ai/sdk resend puppeteer jszip lucide-react
npm install --save-dev @types/xml2js
```

`.env.local`:
```
ANTHROPIC_API_KEY=your_anthropic_key_here
RESEND_API_KEY=your_resend_key_here
OPERATOR_EMAIL=found@aiscore.co.za
NEXT_PUBLIC_WHATSAPP_NUMBER=27XXXXXXXXX
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/aiscore/free-audit
```

---

## MODEL USAGE — CONFIRMED SPLIT

| Task | Model | Reason |
|------|-------|--------|
| Public lite audit | No AI | Pure crawl + programmatic scoring |
| Citability scoring (batched) | Haiku | Structured JSON, no creativity needed |
| Schema code generation | Haiku | Templated structured output |
| Topic selection for articles | Haiku | Short structured JSON |
| Prompt library generation | Haiku | Templated, structured |
| Executive summary (audit) | Sonnet | Client-facing narrative |
| Action plan (audit) | Sonnet | Strategic recommendations |
| E-E-A-T + platform narrative | Sonnet | Nuanced client-facing analysis |
| FAQ hub (25 Q&As) | Sonnet | Client publishes this — quality critical |
| Brand voice document | Sonnet | Core deliverable, highly specific |
| Articles (full) | Sonnet | Published content — quality non-negotiable |
| Content strategy | Sonnet | Strategic, client-facing |

Rule: Haiku for anything structured/scored/templated. Sonnet for anything a client reads.

---

## API COST REFERENCE (for API Usage tab calculations)

Exchange rate: $1 = R18.50
Haiku: $0.80 input / $4.00 output per million tokens
Sonnet: $3.00 input / $15.00 output per million tokens

| Action | Approx cost ZAR |
|--------|----------------|
| Public lite audit | R0 |
| Full internal audit | ~R1.50 |
| Quick Wins generation | R0 (programmatic) |
| Foundation improvement pack | ~R4.00 |
| Monthly retainer (4 articles) | ~R2.50 |

---

## FILE STRUCTURE

```
aiscore-tool/
├── CLAUDE.md
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          ← Five-tab shell
│   ├── globals.css
│   └── api/
│       ├── audit/route.ts                ← POST: full internal GEO audit (SSE)
│       ├── public-audit/route.ts         ← POST: lite public audit (JSON response)
│       ├── improve/route.ts              ← POST: improvement pack generation (SSE)
│       ├── articles/route.ts             ← POST: retainer article generation
│       ├── leads/route.ts                ← GET/POST/PATCH: lead management
│       ├── api-usage/route.ts            ← GET/POST: usage log + credit tracking
│       ├── pdf/route.ts                  ← GET: PDF export
│       └── download/route.ts             ← GET: ZIP export
├── lib/
│   ├── types.ts
│   ├── crawler.ts
│   ├── store.ts                          ← In-memory store (audits, improvements, leads, usage)
│   ├── email.ts                          ← Resend email functions
│   ├── sector-benchmarks.ts              ← Sector average scores lookup
│   ├── modules/
│   │   ├── technical-seo.ts
│   │   ├── schema-markup.ts
│   │   ├── eeat.ts
│   │   ├── ai-crawlers.ts
│   │   ├── brand-authority.ts
│   │   └── citability.ts
│   ├── scoring.ts
│   └── generators/
│       ├── robots-txt.ts
│       ├── llms-txt.ts
│       ├── og-tags.ts
│       ├── schema-generator.ts
│       ├── faq-generator.ts
│       ├── brand-voice-generator.ts
│       ├── article-generator.ts
│       ├── strategy-generator.ts
│       └── prompt-library-generator.ts
└── components/
    ├── AppShell.tsx
    ├── audit/
    │   ├── AuditForm.tsx
    │   ├── AuditProgress.tsx
    │   └── AuditReport.tsx
    ├── improve/
    │   ├── ImprovementForm.tsx
    │   ├── ImprovementProgress.tsx
    │   ├── ImprovementDashboard.tsx
    │   ├── QuickWinsPanel.tsx
    │   ├── SchemaPanel.tsx
    │   ├── FAQPanel.tsx
    │   ├── ArticlesPanel.tsx
    │   ├── BrandVoicePanel.tsx
    │   ├── StrategyPanel.tsx
    │   └── PromptLibraryPanel.tsx
    ├── retainer/
    │   └── ArticleGeneratorPanel.tsx
    ├── leads/
    │   └── LeadsPanel.tsx
    ├── usage/
    │   └── ApiUsagePanel.tsx
    └── ui/
        ├── ScoreGauge.tsx
        ├── ScoreBadge.tsx
        ├── CopyButton.tsx
        ├── DownloadButton.tsx
        └── ProgressBar.tsx
```

---

## PUBLIC LITE AUDIT ENDPOINT (app/api/public-audit/route.ts)

This powers the self-serve score widget on aiscore.co.za. No Claude API calls.
Crawls homepage + competitor homepage only. Returns scored JSON in ~30 seconds.

### Flow
1. Prospect submits: name, email, phone (optional), their URL, competitor URL (optional)
2. Crawl both homepages simultaneously
3. Run 6 scoring modules on each
4. Calculate sector average benchmark from lib/sector-benchmarks.ts
5. Save lead to in-memory leads store
6. Fire two emails via Resend (score report to prospect + notification to operator)
7. Return full scored JSON to frontend for display
8. Add MailerLite contact to nurture sequence

### Input
```typescript
interface PublicAuditInput {
  name: string;              // required
  email: string;             // required
  phone?: string;            // optional
  url: string;               // required — their site
  competitorUrl?: string;    // optional — Option B: prospect enters their real competitor
}
```

### Output
```typescript
interface PublicAuditResult {
  reportId: string;          // e.g. GEO-20260428-4821
  generatedAt: string;       // ISO date
  expiresAt: string;         // generatedAt + 30 days
  prospect: {
    domain: string;
    geoScore: number;
    grade: string;           // AI Invisible / Needs Work / Good / Excellent
    categoryScores: CategoryScores;
    topIssues: Issue[];      // top 3, each with severity/title/description
    quickWins: string[];     // top 3 plain-language wins
    aiCrawlerAccess: number; // % of 14 crawlers welcomed
    hasLlmsTxt: boolean;
    hasSchema: boolean;
  };
  competitor?: {             // null if no competitor URL provided
    domain: string;
    geoScore: number;
    grade: string;
    categoryScores: CategoryScores;
  };
  sectorBenchmark: {
    sector: string;          // auto-detected from homepage content
    averageScore: number;    // from sector-benchmarks.ts
    label: string;           // e.g. "Professional services in South Africa"
  };
  projectedScores: {
    afterQuickWins: number;  // estimated score after Quick Wins Pack
    afterFoundation: number; // estimated score after full Foundation build
  };
}
```

### Sector benchmark detection
Detect sector from homepage content keywords. Map to average scores:
```typescript
// lib/sector-benchmarks.ts
export const SECTOR_BENCHMARKS: Record<string, {label: string, avg: number}> = {
  legal:            { label: 'Legal services in South Africa',          avg: 52 },
  accounting:       { label: 'Accounting & finance in South Africa',    avg: 49 },
  healthcare:       { label: 'Healthcare practices in South Africa',    avg: 44 },
  realestate:       { label: 'Real estate in South Africa',             avg: 55 },
  education:        { label: 'Education & training in South Africa',    avg: 47 },
  hospitality:      { label: 'Hospitality in South Africa',             avg: 51 },
  ecommerce:        { label: 'E-commerce in South Africa',              avg: 58 },
  construction:     { label: 'Construction in South Africa',            avg: 41 },
  default:          { label: 'SMEs in South Africa',                    avg: 49 },
};
```
Detection: scan homepage text for keyword matches. Default to 'default' if unclear.

### Projected score calculation
```
afterQuickWins = min(prospectScore + 18, 72)
afterFoundation = min(prospectScore + 38, 91)
```

### Rate limiting + spam prevention
```typescript
// Per IP limits
const RATE_LIMITS = {
  perMinute: 3,      // 3 audits per minute per IP
  perDay: 20,        // 20 audits per day per IP
};

// Domain validation before crawling
// - Must resolve to a real HTTP response
// - Reject: localhost, 127.0.0.1, 192.168.x.x, .local, example.com
// - Reject if URL returns non-HTML content type
// - Reject if homepage is under 500 bytes (placeholder/parked domain)

// After 3 submissions from same IP in 30 minutes: return CAPTCHA_REQUIRED flag
// Frontend must show simple math CAPTCHA before allowing next submission
```

### CORS headers
```typescript
{
  'Access-Control-Allow-Origin': 'https://aiscore.co.za',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
```

### Error handling
Always return a result. If crawl fails:
```json
{ "error": "We could not reach this website. Please check the URL and try again.", "geoScore": null }
```

---

## SCORE REPORT DISPLAY (frontend widget on aiscore.co.za)

The score report shown to prospects after submitting must feel like a professional
audit document, not just a number. Build a `ScoreReport` React component that the
aiscore.co.za website can embed. Export it from the public-audit API as a self-contained
HTML page option OR document the component props so the website can render it.

### Report sections (in order):

**1. Report header**
- Report ID (e.g. #GEO-20260428-4821)
- Domain audited
- Date generated
- "Valid for 30 days" badge

**2. Score comparison cards (side by side)**
- Left card: prospect domain, large score number, colour-coded grade badge, score bar
- Right card: competitor domain (if provided), same layout, teal accent border
- Score colours: <35 red | 35–54 orange | 55–69 yellow | 70–84 green | 85+ bright green
- Grade labels: Critical — AI Invisible | Poor — Rarely Cited | Fair — Inconsistent |
  Good — Regularly Cited | Excellent — Highly Cited

**3. Plain-English impact statement**
Red alert box. Text example:
"When a potential client asks ChatGPT 'best attorney in Sandton,' [competitor] appears
in the answer. You don't. They are receiving AI-referred clients that should be yours."
(Omit this box if no competitor provided. Replace with sector benchmark statement instead.)

**4. Sector benchmark bar**
"[Sector label] average: [avg]/100 · You scored: [score]/100"
Visual bar showing their position vs the average.

**5. Score breakdown — 6 dimensions**
Table with dual progress bars per row (prospect bar + competitor bar overlaid).
Columns: Dimension | You | Them (if competitor provided)
Rows: Technical SEO | Schema markup | E-E-A-T signals | AI citability |
      Brand authority | Platform readiness

**6. Top 3 critical gaps**
Severity badge (CRITICAL red / HIGH orange / MEDIUM yellow) + title + 2-sentence description.
Each description must reference what the competitor has that the prospect is missing.

**7. Score progression — what fixing looks like**
Three-step visual: Today [score] → After Quick Wins [+18] → After Full Build [+38]
Text: "Our Quick Wins Pack (R3,500) fixes your technical issues in 48 hours."

**8. 30-day validity notice**
"This report is valid until [date]. AI search rankings change monthly."

**9. CTA bar (teal background)**
Left: "This report has been sent to [email]. Our team will be in touch within 24 hours."
Right: Two buttons side by side:
  - "Book a call →" → links to NEXT_PUBLIC_CALENDLY_URL
  - "Chat on WhatsApp →" → links to wa.me/NEXT_PUBLIC_WHATSAPP_NUMBER

---

## EMAIL SYSTEM (lib/email.ts — via Resend)

Three email functions. All send from found@aiscore.co.za via Resend API.

### Email 1: Score report to prospect (fires immediately on audit completion)

```typescript
export async function sendScoreReport(lead: Lead, result: PublicAuditResult): Promise<void>
```

Subject: `Your AI Visibility Score: {score}/100 — here's what your competitor is doing differently`

HTML email content (branded, matches website design):
- AI Score logo + teal header bar
- Report ID + date
- Score comparison (prospect vs competitor) — same visual as web widget but email-safe HTML
- Top 3 critical gaps (text format, no CSS dependencies)
- Score progression (Today → Quick Wins → Full Build)
- Two CTAs: "Book a free consultation" (Calendly) + "Chat on WhatsApp"
- Footer: found@aiscore.co.za | aiscore.co.za | "Report valid for 30 days"
- Plain text fallback included

### Email 2: Operator notification (fires immediately, same time as Email 1)

```typescript
export async function sendLeadNotification(lead: Lead, result: PublicAuditResult): Promise<void>
```

To: found@aiscore.co.za
Subject: `🔥 New lead: {name} — {domain} scored {score}/100 (competitor: {competitorScore}/100)`

Plain HTML, fast to read:
- Name, email, phone
- Their domain + score + grade
- Competitor domain + score (if provided)
- Sector + benchmark comparison
- Temperature badge (Hot/Warm/Cold — see lead scoring below)
- Top 3 gaps (one line each)
- Direct link: "View in leads dashboard →" → links to internal app URL
- Note: "Follow up within 24 hours for best conversion rate"

### Email 3: Day 2 follow-up (triggered manually OR via MailerLite automation)

This email is NOT sent by the app directly. Instead:
- On lead creation, add contact to MailerLite via their API
- Tag with sector and temperature
- MailerLite automation handles Day 2 + Day 5 emails
- Document the MailerLite integration steps in CLAUDE.md

MailerLite integration (lib/email.ts):
```typescript
export async function addToMailerLite(lead: Lead, result: PublicAuditResult): Promise<void> {
  // POST to https://connect.mailerlite.com/api/subscribers
  // Fields: email, name, phone, fields.domain, fields.score,
  //         fields.competitor_score, fields.sector, fields.temperature
  // Groups: add to "Public Audit Leads" group
  // Note: MAILERLITE_API_KEY in .env.local (add when ready, skip if not set)
}
```

### Email template design rules
- Max width 600px, white background, teal (#29a871) header
- All colours inline (email clients strip <style> tags)
- No web fonts — use Arial, Helvetica, sans-serif
- Score numbers in large bold text with colour coding
- Every email has both HTML and plain text versions
- Test with: resend.com/emails testing tool before going live

---

## LEAD MANAGEMENT (Tab 4)

### Lead data model
```typescript
interface Lead {
  id: string;                    // UUID
  createdAt: string;             // ISO timestamp
  reportId: string;              // e.g. GEO-20260428-4821
  reportExpiresAt: string;       // +30 days from createdAt
  name: string;
  email: string;
  phone?: string;
  domain: string;
  competitorDomain?: string;
  geoScore: number;
  competitorScore?: number;
  sector: string;
  sectorAverage: number;
  scoreGap: number;              // competitorScore - geoScore (if competitor provided)
  temperature: 'hot' | 'warm' | 'cold';
  status: 'new' | 'contacted' | 'audit_sent' | 'proposal' | 'client' | 'lost';
  notes: string;                 // operator adds notes manually
  categoryScores: CategoryScores;
  topIssues: Issue[];
}
```

### Lead temperature scoring (auto-calculated on creation)
```typescript
function calculateTemperature(lead: Lead): 'hot' | 'warm' | 'cold' {
  let points = 0;

  // Score gap vs competitor (bigger gap = hotter lead)
  if (lead.scoreGap >= 20) points += 3;
  else if (lead.scoreGap >= 10) points += 2;
  else if (lead.scoreGap > 0) points += 1;

  // Their own score (sweet spot = needs help but has a real site)
  if (lead.geoScore >= 35 && lead.geoScore <= 65) points += 2;
  else if (lead.geoScore < 35) points += 1;

  // High-converting sectors
  const hotSectors = ['legal', 'accounting', 'healthcare', 'realestate'];
  if (hotSectors.includes(lead.sector)) points += 2;

  // Phone number provided (higher intent)
  if (lead.phone) points += 1;

  if (points >= 6) return 'hot';
  if (points >= 3) return 'warm';
  return 'cold';
}
```

### Tab 4 UI — Leads Panel

**Summary row at top:**
Four stat cards: Total Leads | Hot Leads | Warm Leads | Converted (status = 'client')

**Filter bar:**
- Filter by temperature (All / Hot / Warm / Cold)
- Filter by status (All / New / Contacted / Audit Sent / Proposal / Client / Lost)
- Filter by sector
- Sort by: Date (newest first) | Score (lowest first) | Gap (largest first)
- [Export CSV] button — exports all visible leads

**Leads table columns:**
| Temperature | Name | Domain | Score | vs Competitor | Sector | Status | Date | Actions |

- Temperature: coloured badge — 🔥 Hot (red) / ◎ Warm (orange) / · Cold (gray)
- Score: coloured number matching score colour scale
- vs Competitor: "+27 pts behind" in red, or "No competitor" in gray
- Status: dropdown — operator changes directly in table
- Actions: [View Report] [Add Note] [Mark as Client]

**Lead detail drawer (slides in from right on row click):**
- Full report data: all 6 category scores, top 3 issues
- Notes textarea (operator fills in after calls)
- Status history log
- Links: [Open their website] [Open competitor website] [Send WhatsApp]
- Report expiry countdown

**Storage:** Leads persist in lib/store.ts leadStore Map. Do NOT expire leads
(unlike audits which expire after 4 hours). Leads persist for the session.
Note in CLAUDE.md: leads will be lost on server restart — recommend exporting CSV regularly
until a database is added.

---

## API USAGE TAB (Tab 5)

### Usage data model
```typescript
interface ApiCall {
  id: string;
  timestamp: string;
  model: 'haiku' | 'sonnet';
  task: string;               // e.g. "Citability scoring", "Brand voice generation"
  tokensIn: number;
  tokensOut: number;
  costUSD: number;
  costZAR: number;
  clientName?: string;        // if triggered during an improvement pack
}

interface CreditBalance {
  initialCreditsUSD: number;  // operator enters this manually
  initialCreditsZAR: number;
  spentUSD: number;           // sum of all ApiCall.costUSD
  spentZAR: number;
  remainingUSD: number;
  remainingZAR: number;
  lastUpdated: string;
}
```

### Tab 5 UI — API Usage Panel

**Credit balance section:**
- Input field: "Enter your Anthropic credit balance (USD)" — operator updates when topping up
- [Update Balance] button
- Three metric cards: Credits Added | Credits Used (ZAR) | Credits Remaining (ZAR)
- Progress bar: used vs total
- Alert banner (red) when remaining < $10 / R185

**Cost breakdown cards (this month):**
- Full audits: count + total ZAR
- Improvement packs: count + total ZAR
- Retainer articles: count + total ZAR
- Total this month: ZAR

**Estimated remaining capacity:**
"At current usage rate, your credits will last approximately X more days."
"You can run approximately: [N] more full audits | [N] more improvement packs"

**Call log table (last 50 calls):**
| Time | Model | Task | Tokens In | Tokens Out | Cost (ZAR) | Client |

**Logging: every Claude API call in the app must log to apiUsageStore:**
```typescript
// After every Anthropic API call, call this:
export function logApiCall(call: Omit<ApiCall, 'id' | 'timestamp'>): void
```

---

## MODULE 1: FULL GEO AUDIT (Tab 1 — internal use)

### Scoring formula
```
GEO Score = (Citability×0.25) + (Brand Authority×0.20) + (E-E-A-T×0.20)
           + (Technical SEO×0.15) + (Schema Markup×0.10) + (Platform Readiness×0.10)
```

Grades: ≥85 Excellent | ≥70 Good | ≥55 Fair | ≥35 Poor | <35 Critical

### Technical SEO (lib/modules/technical-seo.ts) — max 100
- Crawlability (15): robots.txt +3, sitemap +4, avg internal links >3 +5, no broken links +3
- Indexability (12): canonical on all pages +6, OG tags present +6
- Security (10): HTTPS +6, each security header +0.67
  Headers checked: CSP, X-Frame-Options, X-Content-Type-Options,
  Permissions-Policy, Referrer-Policy, Strict-Transport-Security
- URL Structure (8): lowercase +2, hyphens not underscores +2, no excess params +2, depth ≤3 +2
- Mobile (6): viewport meta +3, no horizontal scroll +3
- Core Web Vitals (15): HTML <100KB +5, no render-blocking scripts +5, compression +5
- SSR (15): content in raw HTML (not JS-rendered) +15
- Page Speed (12): <200ms +12 | 200–500ms +9 | 500ms–1s +6 | 1–2s +4 | 2s+ +2

### Schema Markup (lib/modules/schema-markup.ts) — base 5 if no schema detected
Organization +25, Service +20, LocalBusiness +15, FAQPage +15, WebSite +10,
BreadcrumbList +10, VideoObject +5, each sameAs link +2. Cap 100.

### AI Crawlers (lib/modules/ai-crawlers.ts)
Fetch /robots.txt. Check 14 crawlers:
GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended,
GoogleOther, Applebot-Extended, Amazonbot, FacebookBot, CCBot, anthropic-ai,
Bytespider, cohere-ai.
Also check /llms.txt: exists + valid format (has # and at least one section heading).

### E-E-A-T (lib/modules/eeat.ts) — four pillars each max 25
- Experience: avg words >1500 +10, first-person language +5, case studies +5, testimonials +5
- Expertise: author bylines +8, credentials/certifications +8, H2 count >5 +5, citations +4
- Authoritativeness: external links >5 +8, trust badges +5, industry terms +5, org mentions +7
- Trustworthiness: HTTPS +8, privacy policy link +5, email+phone +5, physical address +4, badges +3

### Brand Authority (lib/modules/brand-authority.ts)
```
Brand Authority = (YouTube×0.25) + (Reddit×0.25) + (Wikipedia×0.20)
               + (LinkedIn×0.15) + (GitHub×0.15)
```
- YouTube: HEAD youtube.com/@{brand} → found=60, not found=10
- Reddit: GET reddit.com/search.json?q={brand}&limit=25
  → 0 results=10 | 1–3=40 | 4–10=60 | 11–20=75 | 20+=85
- Wikipedia: Wikipedia API → not found=0 | found=60+
- LinkedIn: HEAD linkedin.com/company/{brand} → 200=60 | else=35 (anti-bot baseline)
- GitHub: GitHub search API → 0=30 | 1–3=50 | 4+=70
Apply 0.85 multiplier penalty if Wikipedia = 0.

### Citability (lib/modules/citability.ts) — Haiku API, batched 6 blocks per call
Extract H2/H3 headings + following paragraph text (min 20 words). Cap 30 blocks total.
Formula per block: (AQ×0.30) + (SC×0.25) + (SR×0.20) + (SD×0.15) + (U×0.10)

Haiku system prompt:
```
You are a GEO expert scoring content blocks for AI citation potential.
Return ONLY valid JSON array. No markdown. No explanation.
```

Haiku user prompt per batch:
```
Domain: {domain}. Score these {n} content blocks.
Blocks: {JSON array of {heading, content}}

Score each 0–100:
answer_quality: Does it directly answer a user AI query? Rate specificity and completeness.
self_containment: Can AI extract it without needing surrounding context?
structural_readability: Clear structure, logical flow, scannable?
statistical_density: Data points per 100 words. 0=none, 100=highly data-rich.
uniqueness: Is this proprietary/original or generic filler?

Return ONLY:
[{"heading":"...","answer_quality":N,"self_containment":N,"structural_readability":N,
"statistical_density":N,"uniqueness":N,"weighted_total":N,"weakness":"one sentence"},...]
```

### Platform Readiness scores (lib/scoring.ts)
```
Google AI Overviews = (schema×0.4) + (technical×0.3) + (eeat×0.2) + (10 if sitemap exists)
ChatGPT = 40 + (20 if GPTBot allowed) + (15 if avg words>1000) + (15 if llms.txt) + (10 if date metadata)
Perplexity = 30 + (20 if Reddit>60) + (20 if stat density avg>30) + (15 if date metadata) + (15 if citability avg>60)
Gemini = (schema×0.4) + (10 if Wikipedia present) + (15 if YouTube>70) + (15 if eeat>60)
Bing Copilot = 30 + (25 if sitemap) + (20 if Organization schema) + (15 if canonical tags)
Platform Readiness = average of 5 platform scores
```

### Audit AI calls (4 total — Sonnet for all)

**Call 1 — Executive Summary:**
```
System: You are a GEO analyst for South African businesses. Be clear, direct, no jargon.

User: Write an executive summary for this audit.
Domain: {domain} | Business type: {businessType} | Overall score: {score}/100 ({grade})
Pages crawled: {n} | Date: {date}
Scores: Citability {c} | Brand Authority {b} | E-E-A-T {e} | Technical {t} | Schema {s} | Platform {p}
Critical findings: {list} | High priority: {list}

Write 3 paragraphs (3–4 sentences each):
1. What this score means in plain English for this specific business
2. The 2–3 most critical gaps blocking AI citations right now
3. The single highest-impact opportunity available in the next 30 days
Tone: professional but encouraging. Never use the word "leverage".
```

**Call 2 — Action Plan (JSON output):**
```
System: GEO implementation expert. Be specific. Every action must be immediately actionable.
Return ONLY valid JSON. No markdown. No explanation outside the JSON.

User: Generate a prioritised action plan.
Findings: {findingsJSON} | Scores: {scoresJSON}

{
  "quickWins": [max 5 items, low effort, implementable this week],
  "mediumTermActions": [max 5 items, next 30 days],
  "strategicInitiatives": [max 3 items, next 90 days],
  "projectedScores": [
    {"phase":"Current","timeline":"Now","score":N,"improvement":0},
    {"phase":"After Quick Wins","timeline":"2 weeks","score":N,"improvement":N},
    {"phase":"After Medium-Term","timeline":"6 weeks","score":N,"improvement":N},
    {"phase":"After Strategic","timeline":"3 months","score":N,"improvement":N}
  ]
}

Each action item: {"action":"exact step","expected_impact":"specific outcome","effort":"low|medium|high","estimated_points":N}
```

**Call 3 — Schema Code (Haiku — structured output):**
```
System: Generate valid JSON-LD only. No markdown. No explanation.

User: Generate Schema.org markup for {domain}.
Business: {businessName} | Sector: {sector} | Location: {location}
Services: {services} | Social profiles found during crawl: {links}

Generate these schema types: Organization (with sameAs), LocalBusiness (or sector subtype),
Service (one per service listed), WebSite+SearchAction, BreadcrumbList.

Return ONLY:
{"schemas":[{"type":"...","label":"display name","code":"...full json-ld string..."},...]
```

**Call 4 — E-E-A-T + Platform Narrative (Sonnet):**
```
User: Analyse E-E-A-T signals and platform readiness.
Domain: {domain}
E-E-A-T: Experience {e}/25 | Expertise {ex}/25 | Authoritativeness {a}/25 | Trustworthiness {t}/25
Platforms: Google AIO {g} | ChatGPT {c} | Perplexity {p} | Gemini {ge} | Bing Copilot {b}
Brand presence: {brandPresenceJSON}

Write:
1. E-E-A-T analysis (2 paragraphs): what signals exist and what is critically missing
2. Per-platform analysis (1 paragraph each for all 5): current readiness, primary blocker, priority fix
3. Brand authority gaps (1 paragraph): which platforms need attention first and why
```

### Audit SSE progress events
```
0%  → "Starting audit..."
5%  → "Reading sitemap..."
15% → "Found {n} pages to crawl"
20%–70% → "Crawling page {n} of {m}: {url}"
72% → "Analysing technical SEO..."
76% → "Checking schema markup..."
80% → "Evaluating E-E-A-T signals..."
83% → "Checking AI crawler access..."
86% → "Researching brand authority..."
88% → "Scoring content citability..."
90% → "Running AI analysis (1/4)..."
92% → "Running AI analysis (2/4)..."
94% → "Running AI analysis (3/4)..."
96% → "Running AI analysis (4/4)..."
98% → "Calculating final scores..."
100% → "Audit complete."
```

---

## MODULE 2: AI VISIBILITY IMPROVER (Tab 2 — internal use)

### Business Profile Form (operator fills in)
- Business Name (required)
- Website URL (required)
- Sector dropdown: Professional Services | Healthcare | Real Estate |
  Education & Training | Hospitality | E-commerce | Technology | Other
- Primary city/region (required)
- Services (textarea — one per line)
- Target customers (textarea)
- Top 3 competitors (3 text inputs, optional)
- Meeting notes (textarea — paste anything from call or their website submission)

### Brand Voice Questionnaire (5 questions)
```
Q1: "How would their best client describe what they do in one sentence?"
    Hint: "e.g. They help us keep more of what we earn"

Q2: "What do they do that no competitor does?"
    (300 chars)

Q3: Tone (radio, pick one):
    ○ Authoritative & precise
    ○ Warm & approachable
    ○ Friendly & direct
    ○ Playful & bold

Q4: "Best result for a client — one sentence:"
    Hint: "e.g. Saved a Cape Town retailer R1.2m in SARS penalties"

Q5: "The #1 question customers ask before hiring them:"
    (150 chars)
```

[Generate AI Visibility Pack] → Takes 3–5 minutes → 7-tab dashboard

---

## QUICK WINS GENERATORS (programmatic — zero API cost)

### robots.txt (lib/generators/robots-txt.ts)
```typescript
export function generateRobotsTxt(domain: string): string {
  return `# robots.txt — Generated by AI Score (aiscore.co.za)
# Generated: ${new Date().toISOString().split('T')[0]}

User-agent: *
Allow: /

# AI Crawlers — All Welcomed
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GoogleOther
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: FacebookBot
Allow: /

User-agent: CCBot
Allow: /

User-agent: Bytespider
Allow: /

User-agent: cohere-ai
Allow: /

Sitemap: https://${domain}/sitemap.xml`;
}
```

### llms.txt (lib/generators/llms-txt.ts)
```typescript
export function generateLlmsTxt(profile: BusinessProfile): string {
  const today = new Date().toISOString().split('T')[0];
  return `# llms.txt — ${profile.businessName}
# Generated by AI Score (aiscore.co.za) — ${today}

${profile.businessName} is a South African ${profile.sector} business based in ${profile.location}.

## Services
${profile.services.map(s => `- ${s}`).join('\n')}

## Target customers
${profile.targetCustomers}

## Resources
- About: https://${profile.domain}/about
- Services: https://${profile.domain}/services
- FAQ: https://${profile.domain}/faq
- Contact: https://${profile.domain}/contact

## Policy
Content may be cited by AI systems with attribution to ${profile.domain}.
Contact: ${profile.contactEmail || 'see website'}`;
}
```

### OG + canonical + date tags (lib/generators/og-tags.ts)
Generate HTML snippet containing:
- og:title, og:description, og:url, og:image (placeholder), og:locale (en_ZA)
- twitter:card, twitter:title, twitter:description
- link rel="canonical"
- meta name="article:modified_time" (today's date)
- Comments explaining what each tag does

---

## SCHEMA GENERATOR (Haiku)

One API call. Input: full business profile. Output: 5 schema types as JSON-LD strings.
Types: Organization (with sameAs array), LocalBusiness (or sector subtype if available
e.g. LegalService, MedicalBusiness), Service (one per service), WebSite+SearchAction,
BreadcrumbList.
Return as JSON array: [{type, label, code}]

---

## FAQ HUB GENERATOR (Sonnet)

System prompt:
```
You are a GEO content expert for South African SMEs. Every FAQ answer must be:
self-contained, answer-first, and engineered for AI citation. Be specific to this
exact business. No generic content. South African context throughout.
```

User prompt:
```
Generate 25 FAQ Q&As for {businessName} ({sector}, {location}).
Services: {services} | Customers: {targetCustomers} | Tone: {tone}
Unique difference: {uniqueDifference} | Best result: {proofPoints}
Top customer question: {primaryProblem} | Notes: {meetingNotes}

Requirements:
- Questions mirror actual AI query phrasing ("best", "how to", "cost of", "vs", "near me")
- At least 8 questions include location (e.g. "best accountant in Sandton")
- Include: comparison, process, trust, pricing, and "vs competitor" questions
- Each answer: 80–150 words, answer-first, business name mentioned naturally
- At least one specific fact, number, or rand amount per answer
- South African context throughout (SARS, rand pricing, SA laws, local areas)
- Questions must be specific to THIS business — not copyable by any competitor

Return ONLY: {"faqs":[{"question":"...","answer":"..."},...]} — exactly 25 items
```

Post-generation:
- Produce HTML accordion page (styled, client can paste directly into their website)
- Produce FAQPage JSON-LD schema block
- Universal implementation note (no CMS-specific instructions)

---

## BRAND VOICE GENERATOR (Sonnet)

System prompt:
```
You are a brand strategist. Your output is the master content reference for this client.
Make it specific to THIS business. No generic advice. No filler.
```

User prompt:
```
Create a brand voice document.
Business: {businessName} | Sector: {sector} | Location: {location}
Services: {services} | Client description (Q1): {clientDescription}
Unique difference (Q2): {uniqueDifference} | Tone (Q3): {tonePreference}
Best result (Q4): {proofPoints} | Top question (Q5): {primaryProblem}
Notes: {meetingNotes}

Sections:
1. Brand Voice Summary (3 sentences — the essence of this brand)
2. Tone & Personality (4 adjectives + 2-sentence explanation each)
3. Writing Style Guide (sentence length, vocabulary level, SA references, technical terms)
4. Do Say / Don't Say (10 pairs with real examples for this business)
5. Key Phrases (10 phrases that feel authentically like this brand)
6. Never Use (10 generic phrases to eliminate from all content)
7. Origin Story Template (100 words, bracketed variables for client to customise)
8. AI Content System Prompt — MOST IMPORTANT SECTION
   A complete, ready-to-use Claude system prompt that encodes this brand voice.
   Must be comprehensive enough that any Claude conversation using it produces
   on-brand content without further instruction. Minimum 200 words.

Format: clean markdown. Specific throughout.
```

---

## ARTICLE GENERATOR (Haiku for topics, Sonnet for content)

### Topic selection (Haiku):
```
Generate {n} article topics for {businessName} ({sector}, {location}).
Services: {services} | Competitors: {competitors} | Already planned: {existing}
Return: {"topics":[{"title":"...","targetQuery":"...","rationale":"..."}]}
```

### Mode A — Full Article (Sonnet, ~1,200–1,400 words):
```
System: {BRAND_VOICE_SYSTEM_PROMPT}
Writing for {businessName} — South African {sector} in {location}.
Produce citation-optimised content. Be specific and original. South African context.

User: Write a citation-optimised article.
Title: {title} | Target query: {targetQuery}
Business: {businessName} | Location: {location}
Services: {services} | Best result: {proofPoints} | Tone: {tonePreference}

Requirements:
- 1,100–1,400 words
- H2/H3 structure throughout
- First paragraph directly and completely answers the title query
- At least 3 specific numbers, statistics, or rand amounts
- South African context (rand pricing, SA regulations, local area references)
- Business name mentioned 4–6 times naturally — not forced
- 5–7 FAQ section at end (each FAQ answer is citation-ready)
- No filler — every paragraph earns its place
- Specific, relevant CTA at end
Format: clean markdown
```

### Mode B — Structured Outline (Haiku, ~300 words):
```
Generate an article outline.
Title: {title} | Target query: {targetQuery}
Business: {businessName} | Location: {location}

Output (markdown):
- Meta description (max 150 chars)
- Target AI query
- Recommended word count
- H2 sections (5–7), each with: heading, 3 bullet points of content to cover,
  1 key stat or fact to include, suggested word count for that section
- FAQ section: 5 questions to include
- CTA recommendation
- GEO note: why this article will be cited by AI engines
```

### Article panel UI
Per-article mode toggle: [Full Article] [Structured Outline] — default Full Article
Selections persist. "Regenerate" button when mode changes.
Preview: first 200 words shown inline. "Read full article" expands.

---

## CONTENT STRATEGY GENERATOR (Sonnet)

```
System: GEO content strategist for South African SMEs. Be specific and actionable.

User: Create a 90-day pillar-cluster content strategy.
Business: {businessName} | Sector: {sector} | Location: {location}
Services: {services} | Customers: {targetCustomers} | Competitors: {competitors}
Articles already generated: {articleTitles}

Sections:
1. Three pillar topics — broad themes that capture the main AI queries in this
   sector and location. Each: topic name, primary target query, rationale,
   5 cluster article titles, competitive gap this business can own.

2. 12-week content calendar — continuing after the 4 initial articles.
   Markdown table: Week | Article title | Pillar | Target query | Why this sequence

3. Quick win topics — 3 niche topics for AI citations within 30 days.
   (Specific, local, low competition.)

4. Competitor gap analysis — what each competitor is NOT covering that this
   business can own immediately.

Format: clean markdown with tables. Specific to this business throughout.
```

---

## PROMPT LIBRARY GENERATOR (Haiku)

```
Create a reusable prompt library.
Brand voice summary: {first200wordsOfBrandVoiceDoc}
Business: {businessName} | Sector: {sector} | Location: {location}

Generate 6 prompts:
1. Master Brand Voice Prompt — system prompt for all AI content generation
2. Monthly Article Prompt — with slots [TOPIC], [QUERY], [MONTH]
3. FAQ Generator Prompt — for adding new FAQ pairs over time
4. LinkedIn Post Series — turn one article into 5 LinkedIn posts
5. Email Campaign — 4-email nurture sequence for new leads
6. Monthly Report Commentary — add strategic insight to GEO score reports

Each prompt: title, full ready-to-use prompt text, usage notes (2 sentences).
Return JSON: {"prompts":[{"title":"...","prompt":"...","usageNotes":"..."}]}
```

---

## IMPROVEMENT DASHBOARD — 7 tabs

### Tab 1: Quick Wins
Three file cards: robots.txt | llms.txt | Meta tags (OG + canonical + date)
Each: code block, copy button, download button.
Universal implementation note:
```
robots.txt and llms.txt go in the root folder of your website — same level as your homepage.
Any web developer or hosting provider can upload these in under 5 minutes.
Meta tags: paste the HTML snippet into the <head> section of every page.
In most website builders, find "Custom code" or "Header injection" in site settings.
```

### Tab 2: Schema Markup
One card per schema type. Code block + copy button per schema.
Universal note: paste into <head> or site's custom code injection setting.

### Tab 3: FAQ Hub
25 Q&As in expandable accordion (full preview).
[Download FAQ page HTML] [Download FAQPage Schema JSON-LD]
Universal note: publish faq-page.html as /faq on their site.

### Tab 4: Articles
4 article cards. Each: title, target query, word count badge, mode badge,
mode toggle (switch + regenerate), preview (expandable), copy/download .md,
"Mark published ✓" checkbox.
Publishing schedule table below articles.

### Tab 5: Brand Voice
Full document in reader view. Clean typography, easy to read.
"AI Content System Prompt" in highlighted box with [Copy System Prompt] button.
[Download as PDF] [Download .md]

### Tab 6: Content Strategy
3 pillar cards + 12-week calendar table + quick win topics + competitor gap analysis.
[Download .md]

### Tab 7: Prompt Library
6 prompt cards: title, usage notes, full prompt text, [Copy] button.
[Download all prompts as .txt]

**Download All:** "Download Complete AI Visibility Pack" → ZIP

---

## MODULE 3: RETAINER ARTICLE GENERATOR (Tab 3)

Manual monthly content generation for active retainer clients.

### UI
Client dropdown: lists all saved improvement profiles by business name.
(Selecting auto-loads brand voice system prompt + business profile.)
Article count: number input, default 4, range 1–12.

Per article slot:
- Title or brief (textarea, 100 chars)
- Target query (text input — optional, AI generates if blank)
- Mode toggle: [Full Article] [Structured Outline]

[Generate {n} Articles] button

Output: same article card design as Tab 2.
Each: preview, copy, download .md, "Mark published ✓"

---

## ZIP EXPORT STRUCTURE (app/api/download/route.ts)

Filename: `aiscore-{businessName}-{YYYY-MM-DD}.zip`

```
01-quick-wins/
  robots.txt
  llms.txt
  meta-tags.html
  INSTRUCTIONS.txt

02-schema/
  organization-schema.json
  local-business-schema.json
  service-schemas.json
  faq-schema.json
  website-schema.json
  INSTRUCTIONS.txt

03-faq-hub/
  faq-page.html
  faq-schema.json
  INSTRUCTIONS.txt

04-articles/
  article-1-{slug}.md
  article-2-{slug}.md
  article-3-{slug}.md
  article-4-{slug}.md
  publishing-schedule.md

05-brand-voice/
  brand-voice-document.md
  ai-content-system-prompt.txt

06-strategy/
  pillar-cluster-strategy.md

07-prompt-library/
  prompt-library.txt
```

INSTRUCTIONS.txt (universal — no CMS-specific steps):
```
IMPLEMENTATION GUIDE — AI Score (aiscore.co.za)

robots.txt and llms.txt
Upload both files to the root folder of your website (the same level as your
homepage). Your hosting control panel or web developer can do this in under
5 minutes. It is a simple file upload.

Meta tags and schema
Paste the HTML into the <head> section of your website. Most website builders
have a setting called "Custom code injection" or "Header code" — paste there
and it applies automatically to all pages.

FAQ page
Your web developer can publish faq-page.html as a new page at /faq on your
website in under one hour. The HTML can also be pasted into most page builders.

Total implementation time: 1–3 hours.
No specialist knowledge required beyond basic website access.
Questions? Email found@aiscore.co.za
```

---

## APP SHELL (app/page.tsx)

Five tabs:
```
┌──────────────────────────────────────────────────────────────┐
│  [AI Score logo]                            aiscore.co.za    │
├──────────────────────────────────────────────────────────────┤
│  [GEO Audit] [Improve] [Articles] [Leads 🔥3] [API Usage]   │
└──────────────────────────────────────────────────────────────┘
```

- Leads tab shows a badge count of unread Hot leads (red dot)
- All tabs maintain state during the session (no data lost when switching tabs)

---

## CRAWLER (lib/crawler.ts)

```
User-Agent: AIScore-GEO-Audit/1.0 (found@aiscore.co.za)
Timeout: 10s per page
Delay: 100ms between requests
Concurrency: max 5 simultaneous
On error: skip page, log, continue
Sitemap discovery: /sitemap.xml → /sitemap_index.xml → robots.txt Sitemap: directive
Max pages: 50 (full internal audit) | 2 (public lite audit: prospect + competitor)
```

---

## IN-MEMORY STORE (lib/store.ts)

```typescript
const auditStore = new Map<string, AuditReport>();        // expires: 4 hours
const improvementStore = new Map<string, ImprovementResult>(); // expires: 4 hours
const leadStore = new Map<string, Lead>();                // never expires
const apiUsageStore: ApiCall[] = [];                      // never expires, max 500 entries
let creditBalance: CreditBalance = {
  initialCreditsUSD: 0,
  initialCreditsZAR: 0,
  spentUSD: 0,
  spentZAR: 0,
  remainingUSD: 0,
  remainingZAR: 0,
  lastUpdated: new Date().toISOString(),
};

export function listImprovements(): {id: string, businessName: string, date: string}[]
export function logApiCall(call: Omit<ApiCall, 'id' | 'timestamp'>): void
export function updateCreditBalance(usd: number): void
export function addLead(lead: Lead): void
export function updateLeadStatus(id: string, status: Lead['status']): void
export function updateLeadNotes(id: string, notes: string): void
export function getLeads(): Lead[]
export function exportLeadsCSV(): string
```

---

## BRANDING

```css
:root {
  --brand-teal: #29a871;
  --brand-black: #1d1d1f;
  --brand-blue: #0071e3;
  --brand-white: #fbfbfd;
  --brand-gray-light: #f5f5f7;
  --brand-gray-dark: #6e6e73;
}
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif;
```

Score colour scale: <35 #E24B4A | 35–54 #EF9F27 | 55–69 #BA7517 | 70–84 #29a871 | 85+ #1D9E75
Primary buttons: background #29a871, white text, border-radius 8px.
All score numbers use the colour scale — never plain black.

AI Score logo (SVG inline):
```svg
<svg width="120" height="32" viewBox="0 0 120 32">
  <text x="0" y="24" font-family="SF Pro Display, Helvetica Neue, sans-serif"
        font-size="22" font-weight="600" fill="#29a871">AI</text>
  <text x="32" y="24" font-family="SF Pro Display, Helvetica Neue, sans-serif"
        font-size="22" font-weight="400" fill="#1d1d1f">Score</text>
</svg>
```

---

## CLAUDE.md

```markdown
# AI Score — Internal GEO Tool
aiscore.co.za | found@aiscore.co.za

## Five tabs
1. GEO Audit — 50-page crawl, 6-module scoring, 4 AI calls, PDF report
2. AI Visibility Improver — all Foundation package deliverables (FAQ, articles, brand voice, strategy, prompts)
3. Generate Articles — retainer content, manually triggered, 1–12 articles
4. Leads — all leads from public audit widget, status tracking, CSV export
5. API Usage — credit balance, per-call cost log, usage breakdown

## Public endpoint
/api/public-audit — powers aiscore.co.za self-serve score widget
Crawls homepage + competitor homepage. No AI calls. Returns scored JSON + fires emails.
CORS restricted to aiscore.co.za. Rate limited: 3/min, 20/day per IP.

## Environment variables required
ANTHROPIC_API_KEY — from console.anthropic.com
RESEND_API_KEY — from resend.com (verify aiscore.co.za domain first)
OPERATOR_EMAIL — found@aiscore.co.za
NEXT_PUBLIC_WHATSAPP_NUMBER — your WhatsApp number in international format (27XXXXXXXXX)
NEXT_PUBLIC_CALENDLY_URL — your Calendly booking link
MAILERLITE_API_KEY — optional, add when ready for email automation

## Run
npm run dev → http://localhost:3000

## Models
Haiku (claude-haiku-4-5-20251001): citability scoring, schema generation, topic selection, prompt library
Sonnet (claude-sonnet-4-20250514): executive summary, action plan, E-E-A-T narrative, FAQs, brand voice, articles, strategy

## Costs (ZAR at R18.50/USD)
Full internal audit: ~R1.50 | Improvement pack: ~R4.00 | Retainer articles (4): ~R2.50
Public lite audit: R0 | Quick Wins generation: R0

## Article modes
Full Article: 1,100–1,400 words, ready to publish (Sonnet)
Structured Outline: ~300 words, for a writer to complete (Haiku)
Operator selects per article. Default: Full Article.

## Email flow (via Resend)
On public audit completion:
  1. Score report → prospect email (HTML, branded)
  2. Lead notification → found@aiscore.co.za (plain HTML, fast to read)
  3. Lead added to MailerLite (if MAILERLITE_API_KEY set) for Day 2 + Day 5 follow-up

## Lead temperature
Hot: score gap ≥20 pts + sweet-spot score (35–65) + high-converting sector
Warm: moderate gap or good sector match
Cold: small gap, high existing score, or low-converting sector

## Data persistence
Leads: never expire (export CSV regularly — no database, lost on restart)
Audits + Improvements: expire after 4 hours
API usage log: kept for session (max 500 entries)
Credit balance: kept for session (re-enter on restart)

## Scoring formula
GEO Score = Citability(25%) + Brand Authority(20%) + E-E-A-T(20%)
          + Technical SEO(15%) + Schema Markup(10%) + Platform Readiness(10%)

## Brand colours
Teal #29a871 · Black #1d1d1f · Blue #0071e3 · White #fbfbfd
```

---

## BUILD ORDER

1.  `lib/types.ts` — all interfaces and types
2.  `lib/store.ts` — all store functions
3.  `lib/crawler.ts` — crawler + sitemap discovery
4.  `lib/sector-benchmarks.ts` — sector average scores
5.  `lib/modules/` — all 6 scoring modules
6.  `lib/scoring.ts` — platform scores + GEO formula
7.  `lib/generators/` — all programmatic generators (robots, llms, og-tags)
8.  `lib/email.ts` — Resend email functions (score report + operator notification)
9.  `app/api/audit/route.ts` — full internal audit SSE
10. Audit UI components → test: run full audit on https://aiscore.co.za ✓
11. `app/api/public-audit/route.ts` — lite audit + lead capture + email trigger
12. Test public audit with curl: POST {url, competitorUrl, name, email} → verify emails fire ✓
13. All AI generators (schema, FAQ, brand voice, articles, strategy, prompts)
14. `app/api/improve/route.ts` — full improvement pack SSE
15. Improvement UI (7-tab dashboard) → test with sample SA business profile ✓
16. `app/api/articles/route.ts` — retainer article generation
17. Retainer Article Generator tab → test ✓
18. `app/api/leads/route.ts` + `components/leads/LeadsPanel.tsx` → test lead appears after public audit ✓
19. `app/api/api-usage/route.ts` + `components/usage/ApiUsagePanel.tsx` → test cost logs appear ✓
20. `app/api/pdf/route.ts` — PDF export
21. `app/api/download/route.ts` — ZIP export
22. Five-tab AppShell with Hot leads badge on Leads tab
23. Branding pass — AI Score colours, logo, score colour scale throughout
24. `npm run build` — fix all TypeScript errors
25. End-to-end test:
    - Public audit → lead appears in Tab 4 → emails received ✓
    - Full audit (Tab 1) → PDF downloads ✓
    - Improvement pack (Tab 2) → ZIP downloads ✓
    - Retainer articles (Tab 3) → markdown downloads ✓
    - API Usage (Tab 5) → costs logged for all above calls ✓
```
