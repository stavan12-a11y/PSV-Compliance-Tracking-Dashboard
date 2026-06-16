# Steam Trap Management

A lightweight preventive-maintenance (PM) tracker for industrial steam traps —
the devices on steam piping that discharge condensate while preventing steam
loss. When they fail (blowing, blocked, leaking, cycling) they waste energy and
damage downstream equipment. Plants run hundreds of them on recurring inspection
schedules; this app digitizes that program.

Open the dashboard → immediately see what's broken, what's overdue, and what's
coming up, sorted by urgency.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- File-backed JSON store (`.data/db.json`), auto-seeded on first boot — no
  external database or native dependencies required
- IBM Plex Sans / IBM Plex Mono, plain CSS design system

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

On first boot the store seeds a realistic demo dataset (6 equipment assets, 16
traps, full PM history) so the dashboard is useful immediately. Reset it any time
from **Settings → Reset Demo Data**.

## Data model

```
Equipment  (e.g. "Boiler 1")        name, area, is_running
   └── Traps  (many per equipment)  tag, type, location, parent equipment
          └── PM Records            date, status, issue type, technician, notes
```

A trap's *current state* (last PM date, status, issue type) is always derived
from its most recent PM record — records are append-only.

### Enums

- **Trap types:** Float & Thermostatic, Inverted Bucket, Thermodynamic,
  Thermostatic, Bimetallic
- **Status:** Working, Issue
- **Issue types:** Blowing, Blocked, Leak, Cycling

## Business rules

- **PM-equipment gating** — a PM can only be recorded while the parent equipment
  is running. Enforced in the API (`409`) *and* the UI (disabled controls).
- **Issue type required** when status = Issue on a PM record.
- **Next PM date = last PM date + trap-type interval.** Pure interval math, no
  install-date/lifecycle logic.
- **PM intervals are configurable per trap type at runtime**; changes immediately
  recompute next-PM for every trap of that type (next-PM is derived on read).
- **Priority per trap** drives sort + the dashboard queue:
  `Issue → Overdue → Upcoming (≤14 days) → Never inspected → Healthy`.

## Features

- **Dashboard** — 4 KPIs (Total Traps, Active Issues, Overdue PM, Healthy), a
  Top-10 priority action queue, and an equipment roll-up.
- **Equipment** — list with trap/issue/overdue counts; create, delete, and toggle
  running state inline; detail page with breadcrumbs, a stopped-equipment warning
  banner, and a priority-sorted trap inventory.
- **Traps** — All-Traps page with priority filter chips (All / Issues / Overdue /
  Upcoming / Healthy) + search; detail page with full metadata and a vertical
  inspection-history timeline; add / delete trap.
- **PM Entry** — modal from trap detail, Working ↔ Issue toggle, issue-type select
  that appears only when needed, technician + notes; submit disabled when the
  equipment is stopped.
- **Settings** — edit PM interval per trap type; reset demo data.
- **Reporting** — CSV export of full PM history; CSV export of KPIs + current trap
  snapshot.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET/POST` | `/api/equipment` | roll-up list / create |
| `GET/PATCH/DELETE` | `/api/equipment/[id]` | detail / toggle-running / delete (cascades) |
| `GET/POST` | `/api/traps` | priority-sorted list / create |
| `GET/DELETE` | `/api/traps/[id]` | detail + records / delete |
| `POST` | `/api/traps/[id]/pm` | record a PM (gated on running equipment) |
| `GET/PATCH` | `/api/trap-types` | read / update PM intervals |
| `GET` | `/api/dashboard` | KPIs + queue + roll-up |
| `POST` | `/api/reset` | re-seed demo data |
| `GET` | `/api/export/pm-history` | PM history CSV |
| `GET` | `/api/export/snapshot` | KPIs + trap snapshot CSV |

## Project layout

```
app/            routes (pages + API handlers)
components/     client components (managers, modals, badges)
lib/            types, JSON store, business logic, seed data, CSV helpers
```
