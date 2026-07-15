#!/usr/bin/env python3
"""Generate a PowerPoint overview of the PSV Compliance Tracking Dashboard."""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

MAROON = RGBColor(0x50, 0x00, 0x00)
DARK = RGBColor(0x1E, 0x29, 0x3B)
GRAY = RGBColor(0x64, 0x74, 0x8B)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
ACCENT = RGBColor(0xB8, 0x3A, 0x3A)

OUTPUT = Path(__file__).resolve().parent.parent / "PSV-Dashboard-Overview.pptx"


def set_slide_bg(slide, rgb: RGBColor) -> None:
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = rgb


def add_title_slide(prs: Presentation) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, MAROON)

    title = slide.shapes.add_textbox(Inches(0.8), Inches(2.2), Inches(11.5), Inches(1.2))
    tf = title.text_frame
    p = tf.paragraphs[0]
    p.text = "PSV Compliance Tracking Dashboard"
    p.font.size = Pt(40)
    p.font.bold = True
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.CENTER

    sub = slide.shapes.add_textbox(Inches(0.8), Inches(3.5), Inches(11.5), Inches(1))
    stf = sub.text_frame
    sp = stf.paragraphs[0]
    sp.text = "Texas A&M University · Utilities & Energy Services"
    sp.font.size = Pt(22)
    sp.font.color.rgb = RGBColor(0xFC, 0xE7, 0xE7)
    sp.alignment = PP_ALIGN.CENTER

    foot = slide.shapes.add_textbox(Inches(0.8), Inches(5.8), Inches(11.5), Inches(0.6))
    fp = foot.text_frame.paragraphs[0]
    fp.text = "Reliability & Compliance · Pressure Safety Valve Program"
    fp.font.size = Pt(14)
    fp.font.color.rgb = RGBColor(0xE8, 0xC4, 0xC4)
    fp.alignment = PP_ALIGN.CENTER


def add_section_slide(prs: Presentation, title: str, subtitle: str = "") -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)

    bar = slide.shapes.add_shape(1, Inches(0), Inches(0), Inches(13.33), Inches(0.15))
    bar.fill.solid()
    bar.fill.fore_color.rgb = MAROON
    bar.line.fill.background()

    box = slide.shapes.add_textbox(Inches(0.9), Inches(2.6), Inches(11.5), Inches(1.2))
    p = box.text_frame.paragraphs[0]
    p.text = title
    p.font.size = Pt(34)
    p.font.bold = True
    p.font.color.rgb = MAROON

    if subtitle:
        sbox = slide.shapes.add_textbox(Inches(0.9), Inches(3.6), Inches(11.5), Inches(1))
        sp = sbox.text_frame.paragraphs[0]
        sp.text = subtitle
        sp.font.size = Pt(18)
        sp.font.color.rgb = GRAY


def add_bullet_slide(prs: Presentation, title: str, bullets: list[str]) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)

    header = slide.shapes.add_textbox(Inches(0.7), Inches(0.45), Inches(12), Inches(0.8))
    hp = header.text_frame.paragraphs[0]
    hp.text = title
    hp.font.size = Pt(28)
    hp.font.bold = True
    hp.font.color.rgb = MAROON

    line = slide.shapes.add_shape(1, Inches(0.7), Inches(1.15), Inches(11.9), Inches(0.03))
    line.fill.solid()
    line.fill.fore_color.rgb = ACCENT
    line.line.fill.background()

    body = slide.shapes.add_textbox(Inches(0.9), Inches(1.45), Inches(11.8), Inches(5.5))
    tf = body.text_frame
    tf.word_wrap = True

    for i, bullet in enumerate(bullets):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = bullet
        p.level = 0
        p.font.size = Pt(18)
        p.font.color.rgb = DARK
        p.space_after = Pt(10)


def add_two_column_slide(prs: Presentation, title: str, left: list[str], right: list[str]) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)

    header = slide.shapes.add_textbox(Inches(0.7), Inches(0.45), Inches(12), Inches(0.8))
    hp = header.text_frame.paragraphs[0]
    hp.text = title
    hp.font.size = Pt(28)
    hp.font.bold = True
    hp.font.color.rgb = MAROON

    for col_x, items in ((0.7, left), (6.8, right)):
        box = slide.shapes.add_textbox(Inches(col_x), Inches(1.4), Inches(5.8), Inches(5.5))
        tf = box.text_frame
        for i, item in enumerate(items):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.text = item
            p.font.size = Pt(16)
            p.font.color.rgb = DARK
            p.space_after = Pt(8)


def build() -> Path:
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    add_title_slide(prs)

    add_bullet_slide(
        prs,
        "Purpose",
        [
            "Track every Pressure Safety Valve (PSV) across the plant in one place",
            "Know which valves are installed, in inventory, or out for service",
            "Automatically calculate 3-year recertification due dates from install/service history",
            "Surface overdue and upcoming-due valves before they become compliance gaps",
            "Give operators a single source of truth for audits, swaps, and reporting",
        ],
    )

    add_bullet_slide(
        prs,
        "Data Hierarchy",
        [
            "Site → Equipment → Location → PSV (serial number)",
            "Equipment: boilers, HRSGs, vessels, and other protected assets",
            "Location: each physical relief-valve mounting point on that equipment",
            "PSV: individual valve identified by serial number, with datasheet & history",
            "Typical location has two valves: one installed + one spare (inventory or OOS)",
        ],
    )

    add_two_column_slide(
        prs,
        "Dashboard (Front Page)",
        [
            "Site-wide KPI cards:",
            "• Total PSVs",
            "• Installed",
            "• Out for Service",
            "• Overdue",
            "• Compliant %",
            "",
            "Equipment grid with quick navigation",
            "Urgency panel: due dates & status changes",
        ],
        [
            "Click any KPI card to filter valves",
            "Compact modal lists matching PSVs with:",
            "• Serial number & tag",
            "• Inventory ID",
            "• Equipment & location",
            "• Status, due date, compliance",
            "",
            "Click a row to open full PSV detail",
        ],
    )

    add_bullet_slide(
        prs,
        "Equipment & Location Views",
        [
            "Equipment page: scoped KPIs, location list, and urgency/history panel",
            "Each location row shows name, tag, inventory ID, installed valve, and due date",
            "Location page: faceplate cards for every PSV at that mounting point",
            "Quick status toggles (Installed / Out for Service / Inventory) with dated history",
            "Add/edit equipment, locations, and PSVs from the UI",
        ],
    )

    add_two_column_slide(
        prs,
        "PSV Detail Page",
        [
            "Header: serial, inventory ID, tag, status, compliance",
            "Key facts: last install/service, recert due, days remaining",
            "Full datasheet: make, model, set pressure,",
            "capacity, sizes, service medium, NB number",
            "Export single-PSV Excel workbook",
        ],
        [
            "Status History (left panel):",
            "install / out-for-service / inventory changes only",
            "",
            "Repair / Overhaul History (right panel):",
            "separate log for shop work, vendor, work orders",
            "",
            "Both panels side-by-side with add/edit/delete",
        ],
    )

    add_bullet_slide(
        prs,
        "Compliance Rules",
        [
            "Due date = last install date + 3 years (or last on-site service date for no-spare valves)",
            "Due Soon: within 90 days of recert due date",
            "Overdue: past the due date",
            "Compliant % = (compliant + due soon) ÷ monitored installed valves",
            "Inventory and out-for-service spares do not count against the live compliance rate until installed",
        ],
    )

    add_bullet_slide(
        prs,
        "Excel Reporting",
        [
            "Download Excel Report from the dashboard or Data menu",
            "File: PSV-Full-Report-*.xlsx (5 sheets)",
            "1. All PSVs — complete register with datasheet & compliance fields",
            "2. Installed — currently installed valves only",
            "3. Out for Service — valves at vendor / recertification",
            "4. Overdue — past-due valves sorted by urgency",
            "5. Upcoming Due — due within 90 days",
            "Includes Inventory ID on every row · Equipment-scoped export also available",
        ],
    )

    add_two_column_slide(
        prs,
        "Data Management",
        [
            "Import: Excel/CSV template for bulk PSV entry",
            "Equipment & locations auto-created from names/tags",
            "JSON backup for full lossless restore",
            "",
            "Cloud mode (Supabase):",
            "shared live dataset for the whole team",
            "real-time sync across users",
        ],
        [
            "Local mode: browser storage for dev/demo",
            "Simple login gate for access control",
            "",
            "Production URL:",
            "reliability-and-compliance-dashboar.vercel.app",
            "",
            "Deployed via Vercel from GitHub main branch",
        ],
    )

    add_bullet_slide(
        prs,
        "Technology Stack",
        [
            "Frontend: React 18 + TypeScript + Vite",
            "Styling: Tailwind CSS (Texas A&M maroon theme)",
            "Routing: React Router · Icons: Lucide",
            "State: React Context with localStorage persistence",
            "Cloud: Supabase (auth + shared JSON state + realtime)",
            "Excel: SheetJS (xlsx) loaded on demand for exports/imports",
            "Hosting: Vercel static deployment with SPA routing",
        ],
    )

    add_bullet_slide(
        prs,
        "Key Enhancements Delivered",
        [
            "Inventory ID field — tracked on PSVs, locations, KPI modal, and all Excel exports",
            "Repair / overhaul history — separate from install/status history",
            "Status history filtered to status changes only (no datasheet noise)",
            "Clickable KPI cards with compact filter modal and wider detail columns",
            "Compliant % calculation fixed to include due-soon valves",
            "Excel export rebuilt: 5 focused sheets, distinct from import template",
            "Simplified location cards and side-by-side history panels on PSV detail",
        ],
    )

    add_section_slide(prs, "Questions?", "PSV Compliance Tracking Dashboard · Texas A&M UES")

    prs.save(OUTPUT)
    return OUTPUT


if __name__ == "__main__":
    path = build()
    print(f"Created: {path}")
