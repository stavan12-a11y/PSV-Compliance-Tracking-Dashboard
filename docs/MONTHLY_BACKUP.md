# Monthly Excel backup by email

**You do not need to write code.** This sends a full Excel + JSON backup of your dashboard data to your email on the **1st of every month**.

**Time to set up:** about 10 minutes.

---

## Can I do this without Resend?

**Yes.** Vercel cannot send email by itself — but you do **not** need a service like Resend. You can use **your existing Gmail or Outlook account** (SMTP). That is the recommended option if you already have email.

| Option | New account needed? | Best for |
|--------|---------------------|----------|
| **A. Gmail / Outlook (SMTP)** | No — use email you already have | Most people |
| **B. Resend** | Yes — free signup at resend.com | If SMTP is blocked at work |

---

## What you receive each month

Two attachments:

1. **Excel (`.xlsx`)** — readable reports (PSVs, history with notes, repairs, equipment, locations)
2. **JSON (`.json`)** — 100% complete backup for restore via **Data → Import data**

See the **Backup Info** tab in the Excel file for a full sheet-by-sheet guide.

---

## Option A — Gmail or Outlook (no Resend) — recommended

### Gmail setup

1. Sign in at **[myaccount.google.com](https://myaccount.google.com)**.
2. Turn on **2-Step Verification** (required for app passwords).
3. Go to **Security → App passwords** (search “App passwords” in account settings).
4. Create an app password for **Mail** → copy the 16-character password.

### Add these in Vercel (Production)

| Variable | Gmail example |
|----------|----------------|
| `BACKUP_EMAIL_TO` | `you@gmail.com` (where backups are delivered) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `you@gmail.com` |
| `SMTP_PASS` | the 16-character app password (not your normal password) |
| `SMTP_FROM` | `PSV Dashboard <you@gmail.com>` (optional) |
| `CRON_SECRET` | long random string (same style as `AUTH_SECRET`) |

**Do not set `RESEND_API_KEY`** if you use SMTP.

### Outlook / Microsoft 365

| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.office365.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your full email |
| `SMTP_PASS` | your password or app password (if your org requires it) |

> **Work email (@tamu.edu):** Some universities block SMTP from outside apps. If Gmail/Outlook personal email works but TAMU does not, use a personal Gmail for backups or try Option B.

---

## Option B — Resend (optional)

Only use this if SMTP does not work for you.

1. Sign up at **[resend.com](https://resend.com)** and create an API key (`re_...`).
2. In Vercel, set:

| Variable | Value |
|----------|-------|
| `BACKUP_EMAIL_TO` | your email |
| `RESEND_API_KEY` | `re_...` |
| `CRON_SECRET` | long random string |

On the free plan, Resend usually only delivers to the email you signed up with unless you verify a domain.

---

## Redeploy and test

1. **Deployments** → **⋯** → **Redeploy** after adding env vars.
2. Schedule: **9:00 AM US Central** on the 1st of each month.
3. Test now:

```bash
curl -X POST "https://YOUR-VERCEL-URL.vercel.app/api/cron/monthly-backup" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

You should get `{"ok":true,...}` and both files in your inbox within a minute.

---

## What to do with the files

- Save each month to OneDrive or a shared drive.
- Keep the **JSON** file for full restore; use **Excel** for reading and reports.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No email received | Check spam; confirm `BACKUP_EMAIL_TO` is correct |
| Gmail “Username and Password not accepted” | Use an **App Password**, not your normal Gmail password |
| `Unauthorized` when testing | `CRON_SECRET` must match the `Authorization: Bearer ...` header |
| Work email SMTP fails | Use personal Gmail SMTP or Resend |
| `No email sender configured` | Set SMTP vars **or** `RESEND_API_KEY`, then redeploy |

---

## Cost

| Piece | Cost |
|-------|------|
| Gmail / Outlook SMTP | Free (email you already have) |
| Resend (if used) | Free — 3,000 emails/month |
| Vercel cron | Free on Hobby plan |
