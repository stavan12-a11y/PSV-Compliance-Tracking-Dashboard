#!/usr/bin/env python3
"""Generate leadership presentation for the UES Steam Safety Management Program."""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "docs" / "presentation" / "assets"
SCREENSHOTS = ROOT / "docs" / "presentation" / "screenshots"
OUTPUT = ROOT / "docs" / "presentation" / "Steam-Safety-Management-Program.pptx"
LEGACY_OUTPUT = ROOT / "docs" / "presentation" / "PSV-Dashboard-Overview.pptx"

MAROON = RGBColor(0x50, 0x00, 0x00)
DARK = RGBColor(0x1E, 0x29, 0x3B)
GRAY = RGBColor(0x64, 0x74, 0x8B)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
ACCENT = RGBColor(0xB8, 0x3A, 0x3A)
LIGHT = RGBColor(0xFC, 0xE7, 0xE7)
MUTED = RGBColor(0x94, 0xA3, 0xB8)


def set_slide_bg(slide, rgb: RGBColor) -> None:
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = rgb


def add_header(slide, title: str, subtitle: str = "") -> None:
    header = slide.shapes.add_textbox(Inches(0.7), Inches(0.38), Inches(12), Inches(0.65))
    hp = header.text_frame.paragraphs[0]
    hp.text = title
    hp.font.size = Pt(26)
    hp.font.bold = True
    hp.font.color.rgb = MAROON

    if subtitle:
        sp = slide.shapes.add_textbox(Inches(0.7), Inches(0.95), Inches(12), Inches(0.4))
        s = sp.text_frame.paragraphs[0]
        s.text = subtitle
        s.font.size = Pt(13)
        s.font.color.rgb = GRAY

    line_y = 1.35 if subtitle else 1.05
    line = slide.shapes.add_shape(1, Inches(0.7), Inches(line_y), Inches(11.9), Inches(0.03))
    line.fill.solid()
    line.fill.fore_color.rgb = ACCENT
    line.line.fill.background()


def add_title_slide(prs: Presentation) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, MAROON)

    logo = ASSETS / "logo.png"
    if logo.exists():
        slide.shapes.add_picture(str(logo), Inches(6.15), Inches(0.75), width=Inches(1.0))

    title = slide.shapes.add_textbox(Inches(0.7), Inches(1.85), Inches(11.9), Inches(1.4))
    p = title.text_frame.paragraphs[0]
    p.text = "Steam Safety Management Program"
    p.font.size = Pt(40)
    p.font.bold = True
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.CENTER

    sub = slide.shapes.add_textbox(Inches(0.7), Inches(3.2), Inches(11.9), Inches(0.9))
    sp = sub.text_frame.paragraphs[0]
    sp.text = "Pressure Safety Valve (PSV) Compliance · Data · Maintenance Strategy"
    sp.font.size = Pt(20)
    sp.font.color.rgb = LIGHT
    sp.alignment = PP_ALIGN.CENTER

    org = slide.shapes.add_textbox(Inches(0.7), Inches(4.1), Inches(11.9), Inches(0.6))
    op = org.text_frame.paragraphs[0]
    op.text = "Texas A&M University · Utilities & Energy Services"
    op.font.size = Pt(18)
    op.font.color.rgb = RGBColor(0xE8, 0xC4, 0xC4)
    op.alignment = PP_ALIGN.CENTER

    presenter = slide.shapes.add_textbox(Inches(0.7), Inches(5.5), Inches(11.9), Inches(0.5))
    pp = presenter.text_frame.paragraphs[0]
    pp.text = "Leadership Briefing · Reliability & Compliance"
    pp.font.size = Pt(14)
    pp.font.color.rgb = MUTED
    pp.alignment = PP_ALIGN.CENTER


def add_section_slide(prs: Presentation, title: str, subtitle: str = "") -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, MAROON)

    box = slide.shapes.add_textbox(Inches(0.9), Inches(2.8), Inches(11.5), Inches(1.2))
    p = box.text_frame.paragraphs[0]
    p.text = title
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.CENTER

    if subtitle:
        sbox = slide.shapes.add_textbox(Inches(0.9), Inches(3.9), Inches(11.5), Inches(1))
        sp = sbox.text_frame.paragraphs[0]
        sp.text = subtitle
        sp.font.size = Pt(18)
        sp.font.color.rgb = LIGHT
        sp.alignment = PP_ALIGN.CENTER


def add_bullet_slide(
    prs: Presentation,
    title: str,
    bullets: list[str],
    subtitle: str = "",
    font_size: int = 17,
) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    add_header(slide, title, subtitle)

    top = 1.55 if subtitle else 1.3
    body = slide.shapes.add_textbox(Inches(0.85), Inches(top), Inches(11.9), Inches(5.8))
    tf = body.text_frame
    tf.word_wrap = True
    for i, bullet in enumerate(bullets):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = bullet
        p.font.size = Pt(font_size)
        p.font.color.rgb = DARK
        p.space_after = Pt(8)


def add_two_column_slide(
    prs: Presentation,
    title: str,
    left_title: str,
    left: list[str],
    right_title: str,
    right: list[str],
    subtitle: str = "",
) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    add_header(slide, title, subtitle)

    for col_x, col_title, items in (
        (0.7, left_title, left),
        (6.75, right_title, right),
    ):
        label = slide.shapes.add_textbox(Inches(col_x), Inches(1.35), Inches(5.8), Inches(0.35))
        lp = label.text_frame.paragraphs[0]
        lp.text = col_title
        lp.font.size = Pt(14)
        lp.font.bold = True
        lp.font.color.rgb = MAROON

        box = slide.shapes.add_textbox(Inches(col_x), Inches(1.7), Inches(5.9), Inches(5.2))
        tf = box.text_frame
        tf.word_wrap = True
        for i, item in enumerate(items):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.text = item
            p.font.size = Pt(15)
            p.font.color.rgb = DARK
            p.space_after = Pt(6)


def add_journey_slide(prs: Presentation) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    add_header(slide, "Program Development Path", "From field discovery to a sustainable maintenance program")

    phases = [
        ("1", "Field Data\nCollection", "Site walks, nameplate\nphotos, valve verification"),
        ("2", "Master Excel\nRegister", "Comprehensive master file\nfor sorting & analysis"),
        ("3", "Digital\nDashboard", "Live compliance tracking\n& operational visibility"),
        ("4", "Maintenance\nStrategy", "Code-based PM program\n& spare-pool planning"),
    ]

    start_x = 0.55
    width = 2.95
    gap = 0.35
    for i, (num, title, desc) in enumerate(phases):
        x = start_x + i * (width + gap)
        card = slide.shapes.add_shape(1, Inches(x), Inches(1.55), Inches(width), Inches(4.8))
        card.fill.solid()
        card.fill.fore_color.rgb = RGBColor(0xFD, 0xF8, 0xF8)
        card.line.color.rgb = ACCENT

        num_box = slide.shapes.add_textbox(Inches(x + 0.15), Inches(1.75), Inches(0.55), Inches(0.45))
        np = num_box.text_frame.paragraphs[0]
        np.text = num
        np.font.size = Pt(22)
        np.font.bold = True
        np.font.color.rgb = MAROON

        title_box = slide.shapes.add_textbox(Inches(x + 0.15), Inches(2.25), Inches(width - 0.3), Inches(1.1))
        tp = title_box.text_frame.paragraphs[0]
        tp.text = title
        tp.font.size = Pt(16)
        tp.font.bold = True
        tp.font.color.rgb = DARK

        desc_box = slide.shapes.add_textbox(Inches(x + 0.15), Inches(3.45), Inches(width - 0.3), Inches(2.5))
        dp = desc_box.text_frame.paragraphs[0]
        dp.text = desc
        dp.font.size = Pt(13)
        dp.font.color.rgb = GRAY

        if i < len(phases) - 1:
            arrow = slide.shapes.add_textbox(Inches(x + width + 0.05), Inches(3.5), Inches(0.3), Inches(0.4))
            ap = arrow.text_frame.paragraphs[0]
            ap.text = "→"
            ap.font.size = Pt(22)
            ap.font.color.rgb = ACCENT


def add_screenshot_slide(prs: Presentation, title: str, image_name: str, caption: str) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    add_header(slide, title)

    image_path = SCREENSHOTS / image_name
    if image_path.exists():
        slide.shapes.add_picture(str(image_path), Inches(0.7), Inches(1.25), width=Inches(12.0))

    cap = slide.shapes.add_textbox(Inches(0.7), Inches(6.85), Inches(12), Inches(0.45))
    cp = cap.text_frame.paragraphs[0]
    cp.text = caption
    cp.font.size = Pt(12)
    cp.font.color.rgb = GRAY
    cp.alignment = PP_ALIGN.CENTER


def build() -> Path:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # --- Opening ---------------------------------------------------------------
    add_title_slide(prs)

    add_bullet_slide(
        prs,
        "Executive Summary",
        [
            "Built an end-to-end Steam Safety Management Program for UES boiler and steam systems",
            "Started with field verification — walking units, photographing nameplates, confirming installed valves",
            "Organized findings into a master Excel register, then a live compliance dashboard",
            "Authored a formal PSV/SRV Maintenance Strategy aligned to ASME, NBIC, API RP 576, and Texas code",
            "Outcome: one reliable system of record, proactive due-date management, and a defendable maintenance program",
        ],
        font_size=18,
    )

    add_bullet_slide(
        prs,
        "Why Leadership Should Care",
        [
            "Boiler PSVs are code-required safety devices — missed recertification creates regulatory and operational risk",
            "Before this work, valve status, spare coverage, and due dates were difficult to see across the fleet",
            "Unplanned failures and last-minute testing drive cost, outages, and audit exposure",
            "A structured program reduces surprises, supports TDLR/NBIC expectations, and improves capital planning",
            "This is reliability work that protects people, equipment, and compliance standing",
        ],
    )

    add_bullet_slide(
        prs,
        "Regulatory & Standards Foundation",
        [
            "ASME Section I — boiler safety valve design, capacity, and manual-lift requirements",
            "NBIC Part 2 — in-service inspection and maximum 3-year test intervals",
            "API RP 576 — industry best practice for inspection, testing, and repair of relief devices",
            "16 TAC Chapter 65 & Texas Health & Safety Code Ch. 755 — state boiler program requirements",
            "Maintenance Strategy document ties every PM activity back to these references",
        ],
        subtitle="Program decisions are code-informed, not ad hoc",
    )

    add_section_slide(prs, "Building the Program", "Field data → Master register → Dashboard → Maintenance strategy")

    add_journey_slide(prs)

    # --- Phase 1: Field ------------------------------------------------------------
    add_bullet_slide(
        prs,
        "Phase 1 — Field Data Collection",
        [
            "Walked boiler rooms and steam systems to locate every relief valve and protected point",
            "Captured nameplate photos: serial number, set pressure (CDTP), orifice, manufacturer, NB number",
            "Verified what was actually installed vs. what drawings or records showed",
            "Documented whether a spare existed, valve orientation, discharge path, and visible condition issues",
            "Flagged gaps: missing spares, illegible nameplates, weeping seats, isolation concerns",
        ],
        subtitle="Ground truth before any database or dashboard",
    )

    add_two_column_slide(
        prs,
        "What We Captured in the Field",
        "Equipment & location context",
        [
            "Boiler / HRSG / commercial unit identity",
            "Protected location (steam drum, economizer, etc.)",
            "Position on the system",
            "Installed vs. spare status",
        ],
        "Valve identity & condition",
        [
            "Serial number & manufacturer",
            "Set pressure and capacity",
            "National Board number",
            "Nameplate photo evidence",
            "Visible leakage, corrosion, or damage",
        ],
    )

    # --- Phase 2: Excel -----------------------------------------------------------
    add_bullet_slide(
        prs,
        "Phase 2 — Master Excel Register",
        [
            "Built a comprehensive Excel master file as the first system of record",
            "Sorted and normalized field data across equipment, locations, and serial numbers",
            "Tracked install dates, service history, spare availability, and recert due dates",
            "Assigned Inventory IDs and position-oriented tags for procurement and CMMS use",
            "Used Excel to validate completeness before investing in a digital platform",
            "Master file still supports bulk reporting and leadership reviews",
        ],
        subtitle="The bridge between field discovery and digital management",
    )

    # --- Phase 3: Dashboard -------------------------------------------------------
    add_section_slide(prs, "Phase 3 — Digital Compliance Dashboard", "Operational visibility for the whole fleet")

    add_bullet_slide(
        prs,
        "Dashboard Capabilities",
        [
            "Site-wide KPIs: Total PSVs, Installed, Out for Service, Overdue, Compliant %",
            "Equipment → Location → PSV hierarchy matching how operators think about the plant",
            "Automatic 3-year due-date calculation from install or on-site service history",
            "Inventory ID visible on locations, KPI views, and exports",
            "Status history and separate repair/overhaul history per valve",
            "Excel report download: All PSVs, Installed, Out for Service, Overdue, Upcoming Due",
        ],
        subtitle="reliability-and-compliance-dashboar.vercel.app",
    )

    add_screenshot_slide(
        prs,
        "Dashboard — Fleet Compliance at a Glance",
        "01-dashboard.png",
        "Leadership and operators can immediately see compliance posture and drill into equipment",
    )

    add_screenshot_slide(
        prs,
        "KPI Drill-Down",
        "02-kpi-modal.png",
        "Click any KPI to see the exact valves driving that metric — serial, inventory ID, due date, status",
    )

    add_screenshot_slide(
        prs,
        "Equipment & Location Views",
        "03-equipment.png",
        "Scoped view per boiler with location-level inventory ID and installed valve due dates",
    )

    add_screenshot_slide(
        prs,
        "Valve Record Detail",
        "05-psv-detail.png",
        "Full datasheet, compliance clock, status history, and repair/overhaul log in one place",
    )

    # --- Phase 4: Maintenance Strategy --------------------------------------------
    add_section_slide(prs, "Phase 4 — Maintenance Strategy", "Formal PSV/SRV program document for UES operations")

    add_bullet_slide(
        prs,
        "PM Intervals & Triggers",
        [
            "Formal pop test & overhaul (Setpoint): every 3 years — code minimum (NBIC Part 2, ASME Sec. I, 16 TAC Ch. 65)",
            "Visual field walkdown: semi-annually — eyes-on check for weeping, corrosion, discharge issues (API RP 576)",
            "Manual lever test: annual only if management approves — PG-73.1.3 allows but seat-damage risk exists",
            "Condition-based inspection: immediately on leakage, chattering, actuation, or visible damage",
            "Strategy distinguishes planned PM from emergency response",
        ],
        subtitle="Maximum intervals shown — UES should complete before due date",
    )

    add_two_column_slide(
        prs,
        "Testing Methods — Send-Out vs. In-Place",
        "Send-out (preferred when spare exists)",
        [
            "Valve removed; spare installed",
            "Full bench overhaul at Setpoint shop",
            "Internal inspection, lapping, spring check",
            "Complete condition assessment",
            "Lower seat-damage risk",
        ],
        "In-place (when no spare exists)",
        [
            "Setpoint tests on live system",
            "Equivalent certification issued",
            "Functional lift test only — no disassembly",
            "Higher seat-damage risk on older valves",
            "Interim measure until spare acquired",
        ],
        subtitle="Long-term goal: spare coverage for all valves to enable send-out testing fleet-wide",
    )

    add_bullet_slide(
        prs,
        "Pre-Test Field Checklist (Highlights)",
        [
            "Valve body/bonnet — no active corrosion or mechanical damage",
            "Discharge stack — clear, supported, no standing water",
            "Nameplate legible — record set pressure, serial, orifice, manufacture year",
            "No seat weeping at inlet; lifting lever free if equipped",
            "Confirm valve not inadvertently isolated",
            "Checklist completed before every removal or in-place test — filed in CMMS work order",
        ],
        subtitle="Section 4.1 of Maintenance Strategy",
    )

    add_bullet_slide(
        prs,
        "Valve Identification & Labeling System",
        [
            "Position Tag (fixed point): EQUIPMENT – LOCATION – SERVICE – VALVE TYPE – SEQUENCE",
            "Example: B012-SD-STM-SV-001B (Boiler B012, Steam Drum, Steam service, Safety Valve, point 001B)",
            "Inventory ID — warehouse/stock identifier used on physical tags and in dashboard",
            "Physical two-sided tag on valve body: Position Tag, service, inventory ID, location, serial number",
            "Links field equipment to CMMS, Setpoint paperwork, dashboard, and spare pool tracking",
        ],
        subtitle="Section 8 of Maintenance Strategy",
    )

    add_bullet_slide(
        prs,
        "Overhaul vs. Repair vs. Replace",
        [
            "Overhaul: full disassembly, seat lapping, spring inspection, certified pop test — bundled with 3-year send-out",
            "Repair: limited-scope fix (e.g., seat lapping, spring) — must be VR-stamp work with re-test before return",
            "Replace when: body damage, obsolete design, economics favor new valve, or high-criticality risk",
            "Spares in storage >5 years: re-test before installation per API RP 576 guidance",
            "Decision criteria documented so procurement and operations align on the same rules",
        ],
    )

    add_bullet_slide(
        prs,
        "Commercial 125 psi Boiler Strategy",
        [
            "Current practice: replace-and-discard (~16+ valves/year) — simple but recurring cost",
            "Alternative: test-and-reuse with a shared spare pool — mirrors high-pressure boiler program",
            "Illustrative savings: ~40% unit-cost reduction after pool is built (pending actual quotes)",
            "Staggered 3-year rotation groups spread workload and cost evenly across years",
            "Variability pooling: shared spare inventory covers more locations than one spare per site",
            "Recommendation: pilot on 3–5 valves, validate costs and turnaround before fleet-wide change",
        ],
        subtitle="Section 7 of Maintenance Strategy — management decision framework",
    )

    add_bullet_slide(
        prs,
        "Highest-Impact Program Improvements",
        [
            "Acquire spares for valves currently without a designated spare — enables full bench testing",
            "Rank valves by criticality (pressure, capacity, consequence of failure) to prioritize capital",
            "Adopt semi-annual visual walkdowns as standard UES practice between formal tests",
            "Keep dashboard and master register as the single source of truth for due dates and status",
            "Management decision needed on routine manual lever testing — risk vs. PG-73.1.3 compliance",
        ],
    )

    add_two_column_slide(
        prs,
        "Program Outcomes & Value Delivered",
        "Operational value",
        [
            "Complete valve inventory across steam systems",
            "Visible compliance status by equipment and site",
            "Traceable history for audits and incidents",
            "Faster planning for Setpoint outages and swaps",
            "Reduced reliance on memory and scattered files",
        ],
        "Strategic value",
        [
            "Code-aligned maintenance strategy document",
            "Foundation for CMMS integration and spare pooling",
            "Data to support capital requests for spares",
            "Leadership-ready reporting via dashboard & Excel",
            "Sustainable program ownership within UES",
        ],
    )

    add_bullet_slide(
        prs,
        "Recommended Next Steps",
        [
            "Leadership endorsement of the Maintenance Strategy and PM frequencies",
            "Decision on manual lever testing policy (Section 3 — management choice)",
            "Approve spare-acquisition prioritization for no-spare locations",
            "Pilot test-and-reuse for commercial 125 psi valves (Section 7.5)",
            "Continue populating dashboard with remaining field discoveries",
            "Integrate Position Tags and Inventory IDs fleet-wide on physical valve tags",
        ],
        font_size=17,
    )

    add_section_slide(prs, "Discussion", "Steam Safety Management Program · Texas A&M UES · Reliability & Compliance")

    prs.save(OUTPUT)
    # Keep legacy filename as a copy for existing links
    prs.save(LEGACY_OUTPUT)
    return OUTPUT


if __name__ == "__main__":
    path = build()
    print(f"Created: {path}")
