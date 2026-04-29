# Supabase Setup Guide for AI Score

## 1. Create Supabase Project

1. Go to https://supabase.com and sign up (free tier is sufficient)
2. Create a new project:
   - Choose a project name (e.g., "aiscore-internal")
   - Choose a region closest to you
   - Set a strong database password
3. Wait for the project to be provisioned (2-3 minutes)

## 2. Get Connection String

Once your project is ready:
1. Go to Project Settings → Database
2. Copy the "Connection string" (with `[YOUR-PASSWORD]` replaced with your actual password)
3. It will look like: `postgresql://postgres:[password]@[host]:[port]/postgres`

## 3. Add to Environment

In `.env.local`, add:
```
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/postgres
```

## 4. Run Schema Setup

In the terminal, run:
```bash
npm run setup:db
```

This will:
- Create all necessary tables (audits, improvements, leads, api_usage)
- Set up proper indexes for performance
- Configure expiry timestamps

## 5. Verify Setup

You can verify in Supabase dashboard:
- Go to SQL Editor
- Run: `SELECT * FROM pg_tables WHERE schemaname = 'public';`
- You should see: audits, improvements, leads, api_usage, credit_balance

## Tables Schema

### audits
- id (UUID, PK)
- data (JSONB) — entire audit report
- domain (text) — for quick lookup
- expires_at (timestamp) — auto-delete after 4 hours
- created_at (timestamp)

### improvements
- id (UUID, PK)
- data (JSONB) — entire improvement result
- expires_at (timestamp)
- created_at (timestamp)

### leads
- id (UUID, PK)
- data (JSONB) — entire lead object
- created_at (timestamp)

### api_usage
- id (text, PK)
- data (JSONB) — API call record
- timestamp (timestamp)

### credit_balance
- id (serial, PK)
- initial_credits_usd (numeric)
- spent_usd (numeric)
- last_updated (timestamp)

## Costs

Supabase free tier includes:
- 500 MB database size
- 2 GB bandwidth/month
- Good for internal use — no charges unless you exceed limits

For the AI Score tool usage, you'll easily stay within free limits.

## Notes

- Data expires automatically after 4 hours (handled by database triggers)
- Leads never expire (no expiry set)
- All data is JSON stored in JSONB columns for flexibility
- Indexes on domain and timestamp fields for performance
