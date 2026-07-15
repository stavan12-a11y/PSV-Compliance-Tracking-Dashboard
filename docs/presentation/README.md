# Steam Safety Management Program — Presentation

## Download the PowerPoint

**Primary file (leadership briefing):**

```
docs/presentation/Steam-Safety-Management-Program.pptx
```

A copy is also saved as `PSV-Dashboard-Overview.pptx` for backward compatibility.

Open in Microsoft PowerPoint, Google Slides (upload), or Apple Keynote.

## What this deck covers

This is a **leadership briefing**, not just a dashboard demo. It tells the full story:

1. **Field data collection** — site walks, nameplate photos, valve verification  
2. **Master Excel register** — comprehensive master file for sorting and analysis  
3. **Digital compliance dashboard** — live tracking with screenshots  
4. **PSV/SRV Maintenance Strategy** — PM intervals, send-out vs in-place testing, spare pooling, valve ID system, commercial boiler strategy  

Content is drawn from the UES Maintenance Strategy document and the dashboard work completed in this repository.

## Slide outline (~24 slides)

| Section | Topics |
|--------|--------|
| Opening | Title, executive summary, why leadership should care, regulatory foundation |
| Program path | 4-phase journey: Field → Excel → Dashboard → Strategy |
| Field & Excel | What was captured on site, master register role |
| Dashboard | Capabilities + 4 app screenshots |
| Maintenance Strategy | PM intervals, testing methods, checklists, valve ID, overhaul/repair/replace, 125 psi strategy, improvements |
| Close | Outcomes, recommended next steps, discussion |

## Regenerate the deck

```bash
pip install python-pptx
npm run presentation
```

Optional — refresh dashboard screenshots first:

```bash
npm run build && npm run preview
# separate terminal:
npm run presentation:screenshots
npm run presentation
```

## Assets

| Path | Contents |
|------|----------|
| `docs/presentation/assets/logo.png` | App shield logo |
| `docs/presentation/screenshots/` | Dashboard UI screenshots |

## Live dashboard

https://reliability-and-compliance-dashboar.vercel.app/

## Source document

Maintenance Strategy content incorporated from `PSV_Maintenance_Strategy_v3` (UES PSV/SRV program document).
