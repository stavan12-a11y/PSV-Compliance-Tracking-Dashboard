# PSV Tracking Dashboard

A Pressure Safety Valve (PSV) compliance tracking dashboard for the **Texas A&M
University – Utilities & Energy Services** department.

The app tracks every relief valve across the site, when each was installed, and
when it is due for its **3-year recertification** (measured from the last
**installation** date — not the service date). It is currently seeded with mock
data; real data can be loaded later by replacing the seed in
`src/data/mockData.ts`.

## Tech stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) (Texas A&M maroon theme)
- [React Router](https://reactrouter.com/) for navigation
- [lucide-react](https://lucide.dev/) icons
- State is persisted to the browser's `localStorage`, so edits survive refreshes.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
npm run lint     # run ESLint
```

## How it's organized (navigation)

The data hierarchy is **Site → Equipment → Location → PSV (serial number)**.

1. **Dashboard (front page)**
   - Site-wide KPIs: total PSVs, installed, in inventory, out for service,
     due soon (≤ 90 days), overdue, and overall compliance rate.
   - Middle: a grid of **equipment** cards.
   - Right: an **Urgency & History** panel with two tabs — *Due Dates*
     (upcoming/overdue recertifications) and *History* (every change recorded).
   - Add/edit equipment from here.

2. **Equipment page** (click an equipment card)
   - The same KPI set, scoped to that piece of equipment.
   - A list of **locations**. Each row shows which **S/N is installed right now**
     and its upcoming due date / compliance state.
   - Equipment-scoped Urgency & History panel. Add/edit locations here.

3. **Location page** (click a location)
   - A **faceplate** for each PSV assigned to the location (typically two: one
     installed, one spare in inventory or out for service).
   - Each faceplate has **Installed / Out for Service / In Inventory** toggle
     buttons. Toggling prompts for the effective **date**, which is recorded with
     the status change in the PSV's history.
   - Add/edit PSVs here.

4. **PSV detail page** (click a faceplate)
   - Full **datasheet** (make, model, type, set pressure, capacity, orifice,
     sizes, materials, National Board number, etc.).
   - **History** timeline of install / service / inventory events. The
     recertification due date is computed as **last install date + 3 years**.
   - Every history entry is **editable / deletable** to correct mistakes, and you
     can add new entries.

## Key compliance rules

- **Due date = most recent install date + 3 years** (`RECERT_INTERVAL_YEARS`).
- A PSV is flagged **Due Soon** within 90 days of its due date (`DUE_SOON_DAYS`)
  and **Overdue** once the due date passes.
- Only **installed** PSVs contribute a live due date; spares (inventory / out for
  service) are tracked but not counted against compliance until installed.

Both thresholds live in `src/utils/dates.ts`.

## Going live (deploying a shareable URL)

The app is a static Vite build, so it deploys anywhere that serves static files.
Config for single-page-app routing is already included (`vercel.json`,
`netlify.toml`, `public/_redirects`).

**Easiest — Vercel or Netlify (free tier):**

1. Push this repo to GitHub (already done).
2. Create an account at [vercel.com](https://vercel.com) or [netlify.com](https://netlify.com) and **“Import / Add new project”** from the GitHub repo.
3. Framework auto-detects as **Vite**. Build command `npm run build`, output dir `dist`. Deploy.
4. You get a URL like `psv-dashboard.vercel.app` that rebuilds automatically on every push.

> Note on data: in this version each browser stores its own data locally
> (`localStorage`). A hosted URL makes the app reachable by everyone, but it does
> **not** yet share one common dataset between users or require sign-in. For a true
> shared, multi-user, authenticated tool, the next step is a backend (e.g.
> Supabase/Firebase) with login + roles — see the PR discussion.

## Importing your data

Use **Data → Import data…** in the header:

1. **Download the Excel template** and fill one row per PSV (equipment and
   locations are created automatically from the names/tags; status, install date,
   and the “serviced on site” flag are supported).
2. **Upload** the `.xlsx`/`.csv`. You'll see a summary, then choose **Replace all
   data** or **Add to existing data**.
3. **JSON backup**: export a complete, lossless backup of everything (including
   full history) and restore it later or on another machine.

## Exporting reports to Excel

Use the **Export Excel** button on the dashboard (whole site) or on an equipment
page (scoped to that equipment) to download a multi-sheet `.xlsx` workbook:

- **PSV Register** — every PSV with equipment/location, status, datasheet, last
  install/service dates, due date, days remaining, and compliance state.
- **Compliance Summary** — per-equipment counts plus a site total row.
- **Due & Overdue** — installed PSVs sorted by urgency.
- **History Log** — every recorded change.

The Excel library is loaded on demand (only when you export) to keep the app
fast on first load.

## Replacing the mock data

All seed data lives in `src/data/mockData.ts`. Replace the `equipment`,
`locations`, and `psvs` arrays (or call `replaceData(...)` from the store) with
real records. Use the **Reset Data** button in the header to restore the seed at
any time.
