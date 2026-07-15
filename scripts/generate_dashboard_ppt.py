#!/usr/bin/env python3
"""Generate a PowerPoint overview of the PSV Compliance Tracking Dashboard."""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "docs" / "presentation" / "assets"
SCREENSHOTS = ROOT / "docs" / "presentation" / "screenshots"
OUTPUT = ROOT / "docs" / "presentation" / "PSV-Dashboard-Overview.pptx"

MAROON = RGBColor(0x50, 0x00, 0x00)
DARK = RGBColor(0x1E, 0x29, 0x3B)
GRAY = RGBColor(0x64, 0x74, 0x8B)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
ACCENT = RGBColor(0xB8, 0x3A, 0x3A)
LIGHT = RGBColor(0xFC, 0xE7, 0xE7)


def set_slide_bg(slide, rgb: RGBColor) -> None:
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = rgb


def add_header(slide, title: str) -> None:
    header = slide.shapes.add_textbox(Inches(0.7), Inches(0.4), Inches(12), Inches(0.7))
    hp = header.text_frame.paragraphs[0]
    hp.text = title
    hp.font.size = Pt(26)
    hp.font.bold = True
    hp.font.color.rgb = MAROON

    line = slide.shapes.add_shape(1, Inches(0.7), Inches(1.05), Inches(11.9), Inches(0.03))
    line.fill.solid()
    line.fill.fore_color.rgb = ACCENT
    line.line.fill.background()


def add_title_slide(prs: Presentation) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, MAROON)

    logo = ASSETS / "logo.png"
    if logo.exists():
        slide.shapes.add_picture(str(logo), Inches(6.15), Inches(0.9), width=Inches(1.0))

    title = slide.shapes.add_textbox(Inches(0.8), Inches(2.0), Inches(11.5), Inches(1.2))
    p = title.text_frame.paragraphs[0]
    p.text = "PSV Compliance Tracking Dashboard"
    p.font.size = Pt(38)
    p.font.bold = True
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.CENTER

    sub = slide.shapes.add_textbox(Inches(0.8), Inches(3.2), Inches(11.5), Inches(0.8))
    sp = sub.text_frame.paragraphs[0]
    sp.text = "Texas A&M University · Utilities & Energy Services"
    sp.font.size = Pt(22)
    sp.font.color.rgb = LIGHT
    sp.alignment = PP_ALIGN.CENTER

    foot = slide.shapes.add_textbox(Inches(0.8), Inches(4.2), Inches(11.5), Inches(0.6))
    fp = foot.text_frame.paragraphs[0]
    fp.text = "Reliability & Compliance · Pressure Safety Valve Program"
    fp.font.size = Pt(14)
    fp.font.color.rgb = RGBColor(0xE8, 0xC4, 0xC4)
    fp.alignment = PP_ALIGN.CENTER

    url = slide.shapes.add_textbox(Inches(0.8), Inches(6.2), Inches(11.5), Inches(0.5))
    up = url.text_frame.paragraphs[0]
    up.text = "reliability-and-compliance-dashboar.vercel.app"
    up.font.size = Pt(13)
    up.font.color.rgb = LIGHT
    up.alignment = PP_ALIGN.CENTER


def add_bullet_slide(prs: Presentation, title: str, bullets: list[str]) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    add_header(slide, title)

    body = slide.shapes.add_textbox(Inches(0.9), Inches(1.3), Inches(11.8), Inches(5.7))
    tf = body.text_frame
    tf.word_wrap = True
    for i, bullet in enumerate(bullets):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = bullet
        p.font.size = Pt(18)
        p.font.color.rgb = DARK
        p.space_after = Pt(10)


def add_screenshot_slide(
    prs: Presentation,
    title: str,
    image_name: str,
    caption: str,
) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    add_header(slide, title)

    image_path = SCREENSHOTS / image_name
    if image_path.exists():
        slide.shapes.add_picture(str(image_path), Inches(0.7), Inches(1.25), width=Inches(12.0))
    else:
        missing = slide.shapes.add_textbox(Inches(0.9), Inches(2.5), Inches(11), Inches(1))
        missing.text_frame.paragraphs[0].text = f"Screenshot missing: {image_name}"

    cap = slide.shapes.add_textbox(Inches(0.7), Inches(6.85), Inches(12), Inches(0.45))
    cp = cap.text_frame.paragraphs[0]
    cp.text = caption
    cp.font.size = Pt(12)
    cp.font.color.rgb = GRAY
    cp.alignment = PP_ALIGN.CENTER


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
        sbox = slide.shapes.add_textbox(Inches(0.9), Inches(3.6), Inches(11.5), Inches(1.2))
        sp = sbox.text_frame.paragraphs[0]
        sp.text = subtitle
        sp.font.size = Pt(18)
        sp.font.color.rgb = GRAY


def build() -> Path:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

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
            "Automatically calculate 3-year recertification due dates",
            "Surface overdue and upcoming-due valves before compliance gaps",
            "Single source of truth for audits, swaps, and Excel reporting",
        ],
    )

    add_bullet_slide(
        prs,
        "Data Hierarchy",
        [
            "Site → Equipment → Location → PSV (serial number)",
            "Equipment: boilers, HRSGs, vessels, and other protected assets",
            "Location: each relief-valve mounting point on that equipment",
            "PSV: serial number, inventory ID, datasheet, status & history",
            "Typical location: one installed valve + one spare",
        ],
    )

    add_screenshot_slide(
        prs,
        "Dashboard — Site Overview",
        "01-dashboard.png",
        "KPI cards (Total, Installed, Out for Service, Overdue, Compliant %), equipment grid, and urgency panel",
    )

    add_screenshot_slide(
        prs,
        "Clickable KPI Filter",
        "02-kpi-modal.png",
        "Click any KPI to open a compact list with serial, inventory ID, equipment, location, status, due date, and compliance",
    )

    add_screenshot_slide(
        prs,
        "Equipment Page",
        "03-equipment.png",
        "Scoped KPIs, location list with inventory ID and installed valve due dates, urgency/history panel",
    )

    add_screenshot_slide(
        prs,
        "Location Page",
        "04-location.png",
        "PSV faceplates for installed valve and spare with quick status controls",
    )

    add_screenshot_slide(
        prs,
        "PSV Detail Page",
        "05-psv-detail.png",
        "Datasheet, inventory ID, compliance facts, side-by-side status history and repair/overhaul history",
    )

    add_bullet_slide(
        prs,
        "Compliance Rules",
        [
            "Due date = last install date + 3 years (or last on-site service for no-spare valves)",
            "Due Soon: within 90 days of recert due date",
            "Overdue: past the due date",
            "Compliant % = (compliant + due soon) ÷ monitored installed valves",
            "Inventory / out-for-service spares excluded until installed",
        ],
    )

    add_bullet_slide(
        prs,
        "Excel Reporting",
        [
            "Download Excel Report → PSV-Full-Report-*.xlsx (5 sheets)",
            "1. All PSVs  2. Installed  3. Out for Service  4. Overdue  5. Upcoming Due",
            "Full register columns: equipment, location, serial, inventory ID, datasheet, dates, compliance",
            "Separate from PSV-Import-Template.xlsx (blank template for adding new rows)",
        ],
    )

    add_bullet_slide(
        prs,
        "Key Enhancements Delivered",
        [
            "Inventory ID on PSVs, locations, KPI modal, and all Excel exports",
            "Repair / overhaul history separate from status history",
            "Status history shows install/inventory changes only",
            "Clickable KPI cards with wider detail modal",
            "Compliant % includes due-soon valves",
            "Excel export rebuilt with 5 focused sheets",
        ],
    )

    add_bullet_slide(
        prs,
        "Where to Find Everything",
        [
            "Live app: reliability-and-compliance-dashboar.vercel.app",
            "This presentation: docs/presentation/PSV-Dashboard-Overview.pptx",
            "GitHub repo: PSV-Compliance-Tracking-Dashboard (main branch)",
            "Regenerate deck: python3 scripts/generate_dashboard_ppt.py",
            "Refresh screenshots: npm run preview then node scripts/capture-presentation-screenshots.mjs",
        ],
    )

    add_section_slide(prs, "Questions?", "PSV Compliance Tracking Dashboard · Texas A&M UES")

    prs.save(OUTPUT)
    return OUTPUT


if __name__ == "__main__":
    path = build()
    print(f"Created: {path}")
