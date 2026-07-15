# Steam Safety Management Program — Presentation

## Download the PowerPoint (v3 — latest)

**Use this direct link** (downloads immediately — do NOT use the GitHub preview page):

**https://raw.githubusercontent.com/stavan12-a11y/PSV-Compliance-Tracking-Dashboard/cursor/psv-tracking-dashboard-81be/docs/presentation/UES-Steam-Safety-Program-v3.pptx**

**File in this repo:**

```
docs/presentation/UES-Steam-Safety-Program-v3.pptx
```

See also: [`DOWNLOAD.txt`](DOWNLOAD.txt) for version checks if your browser cached an older file.

### How to confirm you have v3 (not an old cached copy)

| Check | v3 (correct) | Old (wrong) |
|-------|----------------|-------------|
| **File size** | ~640 KB | ~590–600 KB |
| **Slide 1** | Four chips under title | Plain title only |
| **Slide 20** | Large Position Tag diagram `B012-SD-STM-SV-001B` | Text-only labeling bullets |
| **Most content slides** | Maroon-header **tables** | Plain bullet lists |

If it still looks old: **delete** any previous `.pptx` from Downloads, then open the link above in a **new incognito/private window**.

## What this deck covers

Leadership briefing for the full Steam Safety Management Program:

1. **Field data collection** — site walks, nameplate photos, valve verification  
2. **Master Excel register** — comprehensive master file for sorting and analysis  
3. **Digital compliance dashboard** — live tracking with screenshots  
4. **PSV/SRV Maintenance Strategy** — PM intervals, send-out vs in-place testing, spare pooling, valve ID system, commercial boiler strategy  

## Regenerate the deck

```bash
pip install python-pptx pillow
npm run presentation
```

The deck uses styled tables, screenshot callout panels, and a visual Position Tag diagram (`assets/tag-diagram.png`).

## Live dashboard

https://reliability-and-compliance-dashboar.vercel.app/
