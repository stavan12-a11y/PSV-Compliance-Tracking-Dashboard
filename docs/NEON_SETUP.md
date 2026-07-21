# Move the dashboard from Supabase to Neon (free, no 7-day pause)

**You do not need to write code.** Follow these steps in order. The app code is already in the repo — you only create accounts and paste a few values into Vercel.

**Time:** about 20–30 minutes.

---

## What you are setting up

| Service | What it does | Cost |
|---------|----------------|------|
| **Neon** | Stores your PSV data (like Supabase database) | Free |
| **Vercel** | Hosts the website + small API (already using this) | Free |

Your team still opens the **same dashboard URL** and signs in with **username + password**.

---

## Step 1 — Create a Neon database (5 min)

1. Go to **[neon.tech](https://neon.tech)** and sign up (GitHub login is fine).
2. Click **New Project**.
   - Name: `ues-psv-dashboard` (or anything you like)
   - Region: pick one close to you (e.g. US East)
3. After creation, open **Dashboard → Connection details**.
4. Copy the **connection string** that starts with `postgresql://...`
   - Use the **pooled** connection string if Neon offers one (recommended for Vercel).

Keep this tab open — you will need the connection string in Step 3.

---

## Step 2 — Create the database table (2 min)

1. In Neon, open **SQL Editor**.
2. Open the file [`neon/schema.sql`](../neon/schema.sql) from this repo (or copy from GitHub).
3. Paste into the SQL Editor and click **Run**.

You should see “Success” — one table `app_state` is created.

---

## Step 3 — Add secrets in Vercel (10 min)

1. Go to **[vercel.com](https://vercel.com)** → your PSV dashboard project.
2. Open **Settings → Environment Variables**.
3. Add these variables (for **Production**, and optionally Preview):

| Variable name | Value | Notes |
|---------------|-------|-------|
| `VITE_CLOUD_MODE` | `true` | Turns on shared cloud mode |
| `DATABASE_URL` | `postgresql://...` from Step 1 | **Server only** — Neon connection string |
| `TEAM_USERNAME` | e.g. `ues-admin` | Login username for your team |
| `TEAM_PASSWORD` | choose a strong password | Login password — share via team password manager |
| `AUTH_SECRET` | long random string | See below |

**Generate AUTH_SECRET:** open [random.org/strings](https://www.random.org/strings/) and create one string of 32+ characters, or run this in any terminal:

```bash
openssl rand -base64 32
```

4. **Remove** old Supabase variables (if present):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

5. Go to **Deployments** → click **⋯** on the latest deployment → **Redeploy** (so new env vars take effect).

---

## Step 4 — Copy your data from Supabase (optional but recommended)

If you already have live data in Supabase, copy it once into Neon:

1. In **Supabase** → SQL Editor, run:
   ```sql
   select data from app_state where id = 'singleton';
   ```
2. Copy the JSON from the `data` column.
3. In **Neon** → SQL Editor, run (paste your JSON where indicated):
   ```sql
   insert into app_state (id, data, updated_at)
   values (
     'singleton',
     'PASTE_YOUR_JSON_HERE'::jsonb,
     now()
   )
   on conflict (id) do update
   set data = excluded.data,
       updated_at = excluded.updated_at;
   ```

If you skip this, the dashboard will start with sample seed data on first login (you can re-import from Excel).

---

## Step 5 — Test

1. Open your Vercel URL (e.g. `reliability-and-compliance-dashboar.vercel.app`).
2. Sign in with `TEAM_USERNAME` / `TEAM_PASSWORD`.
3. Confirm your PSV data appears.
4. Make a small edit, refresh the page — change should still be there.

---

## Handoff checklist (for when you leave the team)

Leave your team these items in a shared doc or password manager:

- [ ] Dashboard URL (Vercel link)
- [ ] Team username + password (`TEAM_USERNAME` / `TEAM_PASSWORD`)
- [ ] Neon project login (who owns the account)
- [ ] Vercel project login (who owns the account)
- [ ] This file: `docs/NEON_SETUP.md`

**No cron jobs. No Supabase pause.** The site keeps working as long as Vercel and Neon accounts stay active (both free at your scale).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| “Incorrect username or password” | Check `TEAM_USERNAME` and `TEAM_PASSWORD` in Vercel env vars; redeploy |
| Blank dashboard after login | Run `neon/schema.sql`; check `DATABASE_URL` is correct |
| Changes don’t appear for teammate | Normal — updates sync every ~20 seconds, or refresh the page |
| Still asking for email | Ensure `VITE_CLOUD_MODE=true`; redeploy |

---

## Need help?

Ask whoever maintains the GitHub repo to check the latest deployment logs in Vercel → **Functions** tab for `/api/auth/login` and `/api/data`.
