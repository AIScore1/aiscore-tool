# AI Score — Internal GEO Tool
aiscore.co.za | found@aiscore.co.za

## Five tabs
1. GEO Audit — 50-page crawl, 6-module scoring, 4 AI calls, PDF report
2. AI Visibility Improver — all Foundation package deliverables (FAQ, articles, brand voice, strategy, prompts)
3. Generate Articles — retainer content, manually triggered, 1–12 articles
4. Leads — all leads from public audit widget, status tracking, CSV export
5. API Usage — credit balance, per-call cost log, usage breakdown

## Public endpoint
`/api/public-audit` — powers aiscore.co.za self-serve score widget
Crawls homepage + competitor homepage. No AI calls. Returns scored JSON + fires emails.
CORS restricted to aiscore.co.za (override with `PUBLIC_AUDIT_ORIGIN`). Rate limited: 3/min, 20/day per IP.

## Environment variables
| Var | Purpose |
|-----|---------|
| `ANTHROPIC_API_KEY` | from console.anthropic.com — required for audits + improvement packs |
| `RESEND_API_KEY` | from resend.com — required for transactional email (verify aiscore.co.za first) |
| `OPERATOR_EMAIL` | found@aiscore.co.za — operator notification recipient |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | international format (27XXXXXXXXX), no plus |
| `NEXT_PUBLIC_CALENDLY_URL` | booking link shown in score reports |
| `NEXT_PUBLIC_APP_URL` | base URL for operator dashboard links in lead emails |
| `MAILERLITE_API_KEY` | optional — Day 2 + Day 5 follow-up automation |
| `PUBLIC_AUDIT_ORIGIN` | CORS allow-list for the public widget (defaults to https://aiscore.co.za) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (from supabase.com dashboard) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (from supabase.com dashboard) |

## 🔴 CRITICAL: Supabase OAuth Configuration

**This is critical for production deployments. Misconfiguration will cause authentication to fail.**

### Production Deployment (https://aiscoreapp.netlify.app)
Before deploying to production, Supabase must be correctly configured:

1. **Site URL** — MUST match your production domain
   - Go to: Supabase Dashboard → Authentication → URL Configuration
   - Set **Site URL** to: `https://aiscoreapp.netlify.app` (NOT localhost, NOT http://)
   - ⚠️ **COMMON MISTAKE**: This defaults to `http://localhost:3000` and must be explicitly changed

2. **Redirect URLs** — Must include both dev and prod
   - Add: `http://localhost:3000/auth/callback` (development)
   - Add: `https://aiscoreapp.netlify.app/auth/callback` (production)

3. **Environment Variables** in Netlify
   - Go to: Netlify Dashboard → Site Settings → Build & Deploy → Environment
   - Set `NEXT_PUBLIC_SUPABASE_URL` = your production Supabase URL
   - Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your production Supabase key
   - ✓ These are already configured in Netlify; verify they match your Supabase project

### Development (localhost:3000)
- Supabase Site URL: `http://localhost:3000`
- Supabase Redirect URL: `http://localhost:3000/auth/callback`
- Environment: Use `.env.local` with dev Supabase credentials

### What happens if Site URL is wrong?
- ❌ User clicks "Sign in with Google"
- ❌ Supabase redirects to Site URL after OAuth instead of your production domain
- ❌ Results in: "ERR_CONNECTION_REFUSED" or browser trying to reach wrong domain
- ✓ Always verify Site URL before deploying

### Pre-Deployment Checklist
Before pushing to production:
- [ ] Verify Supabase **Site URL** = `https://aiscoreapp.netlify.app`
- [ ] Verify Supabase **Redirect URLs** include production callback
- [ ] Verify Netlify environment variables are set
- [ ] Test login locally (`npm run dev`) before deploying
- [ ] After deploy, test login on production URL

## Run
```bash
npm install
npm run dev   # http://localhost:3000
```

## Models
- Haiku (`claude-haiku-4-5-20251001`): citability scoring, schema generation, topic selection, prompt library
- Sonnet (`claude-sonnet-4-20250514`): executive summary, action plan, E-E-A-T narrative, FAQs, brand voice, articles, strategy

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
  3. Lead added to MailerLite (if `MAILERLITE_API_KEY` set) for Day 2 + Day 5 follow-up

MailerLite integration (`lib/email.ts → addToMailerLite`):
- POST to `https://connect.mailerlite.com/api/subscribers`
- Sends fields: email, name, phone, domain, score, competitor_score, sector, temperature
- Adds subscriber to `Public Audit Leads` group (create this group manually in MailerLite)
- Build automations in MailerLite using these fields/groups for Day 2 + Day 5 emails

## Lead temperature
Hot: score gap ≥20 pts + sweet-spot score (35–65) + high-converting sector
Warm: moderate gap or good sector match
Cold: small gap, high existing score, or low-converting sector

## Data persistence
Leads: never expire (export CSV regularly — no database, lost on restart)
Audits + Improvements: expire after 4 hours
API usage log: kept for session (max 500 entries)
Credit balance: kept for session (re-enter on restart)

> **Add a database before going live with paying customers.** The in-memory store is fine for the operator-only workflow today, but lead loss on server restart is a real risk. Recommended: Postgres/Supabase, swap `lib/store.ts` to use it.

## Scoring formula
```
GEO Score = (Citability×0.25) + (Brand Authority×0.20) + (E-E-A-T×0.20)
          + (Technical SEO×0.15) + (Schema Markup×0.10) + (Platform Readiness×0.10)
```

## Brand colours
Teal `#29a871` · Black `#1d1d1f` · Blue `#0071e3` · White `#fbfbfd`
Score scale: <35 red `#E24B4A` · 35–54 orange `#EF9F27` · 55–69 amber `#BA7517` · 70–84 green `#29a871` · 85+ emerald `#1D9E75`

## Where things live
- `lib/crawler.ts` — sitemap discovery, page fetch, lite + full crawl
- `lib/modules/*` — six scoring modules (technical, schema, eeat, ai-crawlers, brand-authority, citability)
- `lib/scoring.ts` — platform scores, GEO formula, grade, issue extraction
- `lib/sector-benchmarks.ts` — sector detection + average score lookup
- `lib/generators/*` — programmatic + AI generators
- `lib/email.ts` — Resend score report, operator notification, MailerLite
- `lib/store.ts` — in-memory store (audits, improvements, leads, API usage, credit balance)
- `lib/anthropic.ts` — single call helper that logs every call to the API usage store
- `app/api/*` — route handlers (audit, public-audit, improve, articles, leads, api-usage, pdf, download)
- `components/*` — five-tab shell + per-tab UI

## Build order (matches the original spec)
1. lib/types → lib/store → lib/crawler → lib/sector-benchmarks
2. lib/modules/* → lib/scoring
3. lib/generators/* → lib/email
4. app/api/audit → audit UI
5. app/api/public-audit → curl test (POST {url, competitorUrl, name, email}) → verify emails
6. AI generators → app/api/improve → improve UI
7. app/api/articles → retainer UI
8. app/api/leads → LeadsPanel
9. app/api/api-usage → ApiUsagePanel
10. app/api/pdf + app/api/download
11. AppShell + branding pass
12. `npm run build` and end-to-end test
