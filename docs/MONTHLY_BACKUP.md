# Monthly Excel backup by email

**You do not need to write code.** This sends a full Excel backup of your dashboard data to your email on the **1st of every month** — so you always have a copy even if the free cloud database stops working someday.

**Time to set up:** about 10 minutes.

---

## What you get

Every month you receive an email with an `.xlsx` file containing:

- All PSVs (register with compliance dates)
- Installed / out for service / overdue / upcoming due sheets
- Full history log (every change)
- Repair history
- Equipment and locations lists

---

## Step 1 — Create a free Resend account (email sender)

1. Go to **[resend.com](https://resend.com)** and sign up.
   - Use the **same email address** where you want backups delivered (important on the free plan).
2. Open **API Keys** → **Create API Key**.
3. Copy the key (starts with `re_...`). You only see it once.

> **Free plan note:** Without verifying a custom domain, Resend sends from `onboarding@resend.dev` and delivers to the email you signed up with. That is fine for personal backups.

---

## Step 2 — Add variables in Vercel

Go to **[vercel.com](https://vercel.com)** → your dashboard project → **Settings → Environment Variables**.

Add these for **Production**:

| Variable | Value | Notes |
|----------|-------|-------|
| `BACKUP_EMAIL_TO` | your@email.com | Where monthly backups are sent |
| `RESEND_API_KEY` | `re_...` from Step 1 | Email service API key |
| `CRON_SECRET` | long random string | Protects the backup job — same as `AUTH_SECRET` style |

Optional:

| Variable | Value |
|----------|-------|
| `BACKUP_EMAIL_FROM` | `PSV Dashboard <onboarding@resend.dev>` (default) |

Generate `CRON_SECRET` the same way as `AUTH_SECRET` (32+ random characters).

---

## Step 3 — Redeploy

**Deployments** → latest deployment → **⋯** → **Redeploy**.

The cron schedule is already in the project: **9:00 AM US Central** on the 1st of each month (14:00 UTC).

---

## Step 4 — Test it now (optional)

After redeploy, run this once in a terminal (replace values):

```bash
curl -X POST "https://YOUR-VERCEL-URL.vercel.app/api/cron/monthly-backup" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

You should get `{"ok":true,...}` and receive the Excel file within a minute.

---

## What to do with the files

- Save each monthly email attachment to a shared drive or OneDrive folder.
- Name example: `PSV-Backups/2026-07/PSV-Dashboard-Backup_2026-07.xlsx`
- If you ever need to restore, use **Data → Import data** in the dashboard (JSON import for full restore, or use the Excel as a reference).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No email received | Check spam; confirm `BACKUP_EMAIL_TO` matches your Resend signup email (free plan) |
| `Unauthorized` when testing | `CRON_SECRET` must match the `Authorization: Bearer ...` header exactly |
| `RESEND_API_KEY is not configured` | Add the key in Vercel and redeploy |
| Email failed from Resend | Verify API key; on free plan, recipient must be your Resend account email |

---

## Cost

| Service | Cost |
|---------|------|
| Resend | Free — 3,000 emails/month (you need 1/month) |
| Vercel cron | Free on Hobby plan |
