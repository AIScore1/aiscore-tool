# 🗄️ Supabase Setup — 5 Minutes

Your AI Score app is now configured to use Supabase for permanent data persistence. No more data loss on restart.

## Step 1: Create Supabase Account (1 min)

1. Go to **https://supabase.com**
2. Click **"Sign Up"** (use any email)
3. Create account → confirm email

## Step 2: Create Project (2 min)

1. Click **"New Project"**
2. Fill in:
   - **Name**: `aiscore-internal` (or any name)
   - **Database password**: Create a strong password (you won't need this again, but save it)
   - **Region**: Choose closest to you (or US East for speed)
3. Click **"Create new project"** and wait 2-3 minutes for it to provision

## Step 3: Get API Credentials (1 min)

Once your project is ready:

1. Go to **Project Settings** (gear icon, bottom left)
2. Click **"API"** in the left sidebar
3. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJh...`)

## Step 4: Create Database Schema (1 min)

1. In Supabase, click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. Open this file: `docs/schema.sql` in your editor
4. Copy **all** the SQL code
5. Paste into Supabase SQL editor
6. Click **"Run"** (or Ctrl+Enter)
   - You should see ✓ success messages
   - Tables created: `audits`, `improvements`, `leads`, `api_usage`, `credit_balance`

## Step 5: Configure Environment (30 seconds)

In `.env.local`, add these two lines:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

(Replace with the values you copied in Step 3)

## Step 6: Restart App (30 seconds)

```bash
npm run dev
```

The app will now:
- ✅ Save audits to Supabase (not memory)
- ✅ Keep leads permanently (never expire)
- ✅ Track all API calls in the database
- ✅ Remember credit balance across restarts

## Verify It Works

1. Run a GEO audit
2. Restart your dev server: `Ctrl+C`, then `npm run dev`
3. Go to Leads tab — your leads are **still there** ✓

## Costs

**Free forever** (unless you exceed):
- 500 MB database size
- 2 GB bandwidth/month

For internal tool usage, you'll use ~10 MB and 50 MB/month (well within limits).

## Next Steps (Optional)

After you're comfortable with Supabase:
- Go to **Project Settings → Database** to set backups
- Go to **SQL Editor** to write custom queries to audit your data
- Set up **Row Level Security (RLS)** if you want to add users later

---

## Troubleshooting

### "SUPABASE_URL not configured"
Make sure you added both variables to `.env.local` and restarted the dev server.

### "Relational query error"
The schema.sql didn't run. Try again in Supabase SQL Editor — make sure you see green ✓ checkmarks.

### "Rate limit error"
You've hit Supabase free tier bandwidth limit (unlikely for internal use). Upgrade to paid tier or reduce data logging.

---

Questions? The schema is self-documenting in `docs/schema.sql`. All tables use JSONB for flexibility — you can store any JSON in the `data` column.
