# Steam Safety Management Program — Presentation

## Download

**Direct link (default branch — 12-slide condensed deck):**

https://raw.githubusercontent.com/stavan12-a11y/PSV-Compliance-Tracking-Dashboard/cursor/psv-tracking-dashboard-81be/docs/presentation/UES-Steam-Safety-Program.pptx

**File path:** `docs/presentation/UES-Steam-Safety-Program.pptx`

If your browser shows an older version, hard-refresh or append a cache-buster: `...UES-Steam-Safety-Program.pptx?v=20260716`

## Regenerate

```bash
pip install python-pptx pillow
npm run presentation:screenshots   # optional — refresh dashboard screenshots
npm run presentation
```

### Live dashboard screenshots

Production requires your Supabase login. Copy `.env.presentation.example` to `.env.presentation` and add your credentials:

```bash
cp .env.presentation.example .env.presentation
# edit .env.presentation with your email/password
npm run presentation:screenshots
npm run presentation
```

## Live dashboard

https://reliability-and-compliance-dashboar.vercel.app/
