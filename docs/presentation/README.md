# PSV Dashboard Presentation

## Download the PowerPoint

**File path in this repository:**

```
docs/presentation/PSV-Dashboard-Overview.pptx
```

Open that file in Microsoft PowerPoint, Google Slides (upload), or Apple Keynote.

## What's inside

- Title slide with Texas A&M maroon branding and app logo
- Purpose, data hierarchy, and compliance rules
- **Live app screenshots** (dashboard, KPI modal, equipment, location, PSV detail)
- Excel reporting, key enhancements, and where to find the live site

## Regenerate the deck

```bash
# 1. Install Python dependency (one time)
pip install python-pptx

# 2. Optional: refresh screenshots from local preview
npm install
npm run build
npm run preview
# In another terminal:
node scripts/capture-presentation-screenshots.mjs

# 3. Build the PowerPoint
python3 scripts/generate_dashboard_ppt.py
```

Output is written to `docs/presentation/PSV-Dashboard-Overview.pptx`.

## Assets

| Folder | Contents |
|--------|----------|
| `docs/presentation/assets/` | App logo (`logo.png`) |
| `docs/presentation/screenshots/` | UI screenshots used in slides |

## Live application

https://reliability-and-compliance-dashboar.vercel.app/
