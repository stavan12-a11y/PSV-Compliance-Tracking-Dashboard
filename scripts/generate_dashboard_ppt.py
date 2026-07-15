#!/usr/bin/env python3
"""Generate leadership presentation for the UES Steam Safety Management Program."""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "docs" / "presentation" / "assets"
SCREENSHOTS = ROOT / "docs" / "presentation" / "screenshots"
OUTPUT = ROOT / "docs" / "presentation" / "UES-Steam-Safety-Program.pptx"

MAROON = RGBColor(0x50, 0x00, 0x00)
DARK = RGBColor(0x1E, 0x29, 0x3B)
GRAY = RGBColor(0x64, 0x74, 0x8B)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
ACCENT = RGBColor(0xB8, 0x3A, 0x3A)
LIGHT = RGBColor(0xFC, 0xE7, 0xE7)
MUTED = RGBColor(0x94, 0xA3, 0xB8)
CREAM = RGBColor(0xFD, 0xF8, 0xF8)
SKY = RGBColor(0xE0, 0xF2, 0xFE)
GREEN_BG = RGBColor(0xEC, 0xFD, 0xF5)
AMBER_BG = RGBColor(0xFF, 0xFB, 0xEB)
TABLE_HEADER = MAROON
TABLE_ALT = RGBColor(0xF8, 0xFA, 0xFC)

# Section 4.1 — Pre-Test Visual Inspection (from PSV Maintenance Strategy v3)
FIELD_CHECKLIST_ROWS = [
    (
        "Valve body and bonnet",
        "No active corrosion, pitting, or mechanical damage; minor surface rust OK if no pitting",
    ),
    (
        "Discharge pipe / stack",
        "Clear and unobstructed; properly supported; no standing water; drip pocket if applicable",
    ),
    (
        "Drain / weep hole (if equipped)",
        "Open and unobstructed; no plugging or paint blockage",
    ),
    (
        "Body and bonnet bolting",
        "All fasteners present and intact; no visible cracks or corrosion",
    ),
    (
        "Nameplate legibility",
        "CDTP, serial number, orifice, and manufacture year legible — record in work order",
    ),
    (
        "Inlet / nozzle area",
        "No visible leakage or weeping at seat; dry mating surfaces",
    ),
    (
        "Test gag / lifting lever",
        "Free of obstructions; lever not locked or wired shut (if equipped)",
    ),
    (
        "Inlet isolation (if applicable)",
        "Valve in-line and not inadvertently isolated",
    ),
]


def set_slide_bg(slide, rgb: RGBColor) -> None:
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = rgb


def style_paragraph(paragraph, *, size=14, bold=False, color=DARK, align=None) -> None:
    paragraph.font.size = Pt(size)
    paragraph.font.bold = bold
    paragraph.font.color.rgb = color
    if align is not None:
        paragraph.alignment = align


def add_header(slide, title: str, subtitle: str = "") -> float:
    header = slide.shapes.add_textbox(Inches(0.65), Inches(0.32), Inches(12.1), Inches(0.65))
    hp = header.text_frame.paragraphs[0]
    hp.text = title
    style_paragraph(hp, size=28, bold=True, color=MAROON)

    line_y = 1.02
    if subtitle:
        sp = slide.shapes.add_textbox(Inches(0.65), Inches(0.9), Inches(12.1), Inches(0.38))
        s = sp.text_frame.paragraphs[0]
        s.text = subtitle
        style_paragraph(s, size=13, color=GRAY)
        line_y = 1.28

    line = slide.shapes.add_shape(1, Inches(0.65), Inches(line_y), Inches(12.0), Inches(0.04))
    line.fill.solid()
    line.fill.fore_color.rgb = ACCENT
    line.line.fill.background()
    return line_y + 0.12


def add_footer_bar(slide, text: str) -> None:
    bar = slide.shapes.add_shape(1, Inches(0), Inches(7.12), Inches(13.333), Inches(0.38))
    bar.fill.solid()
    bar.fill.fore_color.rgb = MAROON
    bar.line.fill.background()
    box = slide.shapes.add_textbox(Inches(0.65), Inches(7.16), Inches(12), Inches(0.28))
    p = box.text_frame.paragraphs[0]
    p.text = text
    style_paragraph(p, size=10, color=WHITE)


def add_title_slide(prs: Presentation) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, MAROON)

    accent = slide.shapes.add_shape(1, Inches(0), Inches(0), Inches(13.333), Inches(0.18))
    accent.fill.solid()
    accent.fill.fore_color.rgb = ACCENT
    accent.line.fill.background()

    logo = ASSETS / "logo.png"
    if logo.exists():
        slide.shapes.add_picture(str(logo), Inches(6.15), Inches(0.55), width=Inches(1.05))

    title = slide.shapes.add_textbox(Inches(0.7), Inches(1.75), Inches(11.9), Inches(1.4))
    style_paragraph(title.text_frame.paragraphs[0], size=42, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    title.text_frame.paragraphs[0].text = "Steam Safety Management Program"

    sub = slide.shapes.add_textbox(Inches(0.7), Inches(3.05), Inches(11.9), Inches(0.9))
    style_paragraph(sub.text_frame.paragraphs[0], size=20, color=LIGHT, align=PP_ALIGN.CENTER)
    sub.text_frame.paragraphs[0].text = "Pressure Safety Valve Compliance · Data · Maintenance Strategy"

    org = slide.shapes.add_textbox(Inches(0.7), Inches(3.95), Inches(11.9), Inches(0.6))
    style_paragraph(org.text_frame.paragraphs[0], size=18, color=RGBColor(0xE8, 0xC4, 0xC4), align=PP_ALIGN.CENTER)
    org.text_frame.paragraphs[0].text = "Texas A&M University · Utilities & Energy Services"

    chips = ["Field verified", "Excel master file", "Live dashboard", "Maintenance strategy"]
    chip_w = 2.55
    start_x = (13.333 - (chip_w * 4 + 0.2 * 3)) / 2
    for i, chip in enumerate(chips):
        x = start_x + i * (chip_w + 0.2)
        box = slide.shapes.add_shape(1, Inches(x), Inches(5.15), Inches(chip_w), Inches(0.48))
        box.fill.solid()
        box.fill.fore_color.rgb = RGBColor(0x6B, 0x1A, 0x1A)
        box.line.color.rgb = ACCENT
        tf = box.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.text = chip
        style_paragraph(p, size=12, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

    foot = slide.shapes.add_textbox(Inches(0.7), Inches(6.35), Inches(11.9), Inches(0.45))
    style_paragraph(foot.text_frame.paragraphs[0], size=13, color=MUTED, align=PP_ALIGN.CENTER)
    foot.text_frame.paragraphs[0].text = "Leadership Briefing · Reliability & Compliance"


def add_section_slide(prs: Presentation, title: str, subtitle: str = "") -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, MAROON)

    stripe = slide.shapes.add_shape(1, Inches(0), Inches(3.35), Inches(13.333), Inches(0.08))
    stripe.fill.solid()
    stripe.fill.fore_color.rgb = ACCENT
    stripe.line.fill.background()

    box = slide.shapes.add_textbox(Inches(0.9), Inches(2.55), Inches(11.5), Inches(1.2))
    style_paragraph(box.text_frame.paragraphs[0], size=38, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    box.text_frame.paragraphs[0].text = title

    if subtitle:
        sbox = slide.shapes.add_textbox(Inches(0.9), Inches(3.75), Inches(11.5), Inches(1))
        style_paragraph(sbox.text_frame.paragraphs[0], size=18, color=LIGHT, align=PP_ALIGN.CENTER)
        sbox.text_frame.paragraphs[0].text = subtitle


def add_stat_cards(slide, stats: list[tuple[str, str, str]], top: float = 1.45) -> None:
    width = 2.85
    gap = 0.28
    start_x = (13.333 - (width * len(stats) + gap * (len(stats) - 1))) / 2
    for i, (value, label, hint) in enumerate(stats):
        x = start_x + i * (width + gap)
        card = slide.shapes.add_shape(1, Inches(x), Inches(top), Inches(width), Inches(1.35))
        card.fill.solid()
        card.fill.fore_color.rgb = CREAM
        card.line.color.rgb = ACCENT

        vbox = slide.shapes.add_textbox(Inches(x), Inches(top + 0.18), Inches(width), Inches(0.55))
        style_paragraph(vbox.text_frame.paragraphs[0], size=30, bold=True, color=MAROON, align=PP_ALIGN.CENTER)
        vbox.text_frame.paragraphs[0].text = value

        lbox = slide.shapes.add_textbox(Inches(x), Inches(top + 0.72), Inches(width), Inches(0.3))
        style_paragraph(lbox.text_frame.paragraphs[0], size=12, bold=True, color=DARK, align=PP_ALIGN.CENTER)
        lbox.text_frame.paragraphs[0].text = label

        hbox = slide.shapes.add_textbox(Inches(x + 0.1), Inches(top + 1.0), Inches(width - 0.2), Inches(0.28))
        style_paragraph(hbox.text_frame.paragraphs[0], size=10, color=GRAY, align=PP_ALIGN.CENTER)
        hbox.text_frame.paragraphs[0].text = hint


def style_table_cell(cell, text: str, *, header: bool = False, alt: bool = False, size: int = 12) -> None:
    cell.text = text
    cell.vertical_anchor = MSO_ANCHOR.MIDDLE
    if header:
        cell.fill.solid()
        cell.fill.fore_color.rgb = TABLE_HEADER
    elif alt:
        cell.fill.solid()
        cell.fill.fore_color.rgb = TABLE_ALT
    else:
        cell.fill.background()

    for paragraph in cell.text_frame.paragraphs:
        style_paragraph(
            paragraph,
            size=size,
            bold=header,
            color=WHITE if header else DARK,
        )


def add_table_slide(
    prs: Presentation,
    title: str,
    headers: list[str],
    rows: list[list[str]],
    subtitle: str = "",
    col_widths: list[float] | None = None,
) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    top = add_header(slide, title, subtitle)

    n_rows = len(rows) + 1
    n_cols = len(headers)
    table_shape = slide.shapes.add_table(n_rows, n_cols, Inches(0.65), Inches(top), Inches(12.0), Inches(5.6))
    table = table_shape.table

    if col_widths:
        for idx, width in enumerate(col_widths):
            table.columns[idx].width = Inches(width)

    for col, header in enumerate(headers):
        style_table_cell(table.cell(0, col), header, header=True, size=12)

    for r, row in enumerate(rows, start=1):
        for c, value in enumerate(row):
            style_table_cell(table.cell(r, c), value, alt=r % 2 == 0, size=11)

    add_footer_bar(slide, "Texas A&M UES · Steam Safety Management Program")


def add_field_checklist_slide(prs: Presentation) -> None:
    """Render Section 4.1 as a field-ready inspection form with Pass / Fail / N/A columns."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    top = add_header(
        slide,
        "Pre-Test Visual Inspection — Field Checklist",
        "Section 4.1 · Complete before every removal or in-place test · File in CMMS work order",
    )

    headers = ["Checkpoint", "Accept / Reject criteria", "Pass", "Fail", "N/A"]
    rows = [[cp, crit, "☐", "☐", "☐"] for cp, crit in FIELD_CHECKLIST_ROWS]

    n_rows = len(rows) + 1
    n_cols = len(headers)
    table_top = top + 0.05
    table_h = 5.35
    table_shape = slide.shapes.add_table(
        n_rows, n_cols, Inches(0.65), Inches(table_top), Inches(12.0), Inches(table_h)
    )
    table = table_shape.table
    col_widths = [2.6, 7.0, 0.75, 0.75, 0.75]
    for idx, width in enumerate(col_widths):
        table.columns[idx].width = Inches(width)

    for col, header in enumerate(headers):
        style_table_cell(table.cell(0, col), header, header=True, size=11)

    for r, row in enumerate(rows, start=1):
        for c, value in enumerate(row):
            cell = table.cell(r, c)
            style_table_cell(cell, value, alt=r % 2 == 0, size=9 if c == 1 else 10)
            cell.text_frame.word_wrap = True
            if c >= 2:
                for p in cell.text_frame.paragraphs:
                    p.alignment = PP_ALIGN.CENTER

    note = slide.shapes.add_shape(1, Inches(0.65), Inches(6.62), Inches(12.0), Inches(0.42))
    note.fill.solid()
    note.fill.fore_color.rgb = AMBER_BG
    note.line.color.rgb = ACCENT
    tf = note.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = "Inspector: _________________________   Date: __________   WO #: __________   Equipment / Location: _________________________"
    style_paragraph(p, size=10, bold=True, color=DARK, align=PP_ALIGN.CENTER)

    add_footer_bar(slide, "Maintenance Strategy · Section 4.1")


def add_bullet_slide(
    prs: Presentation,
    title: str,
    bullets: list[str],
    subtitle: str = "",
    font_size: int = 16,
    icons: list[str] | None = None,
) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    top = add_header(slide, title, subtitle)

    for i, bullet in enumerate(bullets):
        y = top + 0.08 + i * 0.72
        marker = slide.shapes.add_shape(1, Inches(0.75), Inches(y + 0.08), Inches(0.18), Inches(0.18))
        marker.fill.solid()
        marker.fill.fore_color.rgb = ACCENT
        marker.line.fill.background()

        if icons and i < len(icons):
            ibox = slide.shapes.add_textbox(Inches(1.02), Inches(y - 0.02), Inches(0.45), Inches(0.35))
            style_paragraph(ibox.text_frame.paragraphs[0], size=16, color=MAROON)
            ibox.text_frame.paragraphs[0].text = icons[i]

        text_x = 1.45 if icons else 1.05
        box = slide.shapes.add_textbox(Inches(text_x), Inches(y), Inches(11.4), Inches(0.62))
        tf = box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = bullet
        style_paragraph(p, size=font_size, color=DARK)

    add_footer_bar(slide, "Texas A&M UES · Steam Safety Management Program")


def add_two_column_cards(
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
    top = add_header(slide, title, subtitle)

    for col_x, col_title, items, bg in (
        (0.65, left_title, left, CREAM),
        (6.75, right_title, right, SKY),
    ):
        panel = slide.shapes.add_shape(1, Inches(col_x), Inches(top), Inches(5.95), Inches(5.55))
        panel.fill.solid()
        panel.fill.fore_color.rgb = bg
        panel.line.color.rgb = ACCENT

        label = slide.shapes.add_textbox(Inches(col_x + 0.2), Inches(top + 0.15), Inches(5.5), Inches(0.35))
        style_paragraph(label.text_frame.paragraphs[0], size=15, bold=True, color=MAROON)
        label.text_frame.paragraphs[0].text = col_title

        box = slide.shapes.add_textbox(Inches(col_x + 0.25), Inches(top + 0.55), Inches(5.45), Inches(4.8))
        tf = box.text_frame
        tf.word_wrap = True
        for i, item in enumerate(items):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.text = f"• {item}"
            style_paragraph(p, size=14, color=DARK)
            p.space_after = Pt(8)

    add_footer_bar(slide, "Texas A&M UES · Steam Safety Management Program")


def add_journey_slide(prs: Presentation) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    top = add_header(slide, "Program Development Path", "From field discovery to a sustainable maintenance program")

    phases = [
        ("1", "Field Data\nCollection", "Site walks\nNameplate photos\nValve verification"),
        ("2", "Master Excel\nRegister", "Sort & normalize\nTrack due dates\nInventory IDs"),
        ("3", "Digital\nDashboard", "Fleet KPIs\nDrill-down views\nExcel exports"),
        ("4", "Maintenance\nStrategy", "PM intervals\nSpare pooling\nCode alignment"),
    ]

    start_x = 0.55
    width = 2.95
    gap = 0.35
    for i, (num, phase_title, desc) in enumerate(phases):
        x = start_x + i * (width + gap)
        card = slide.shapes.add_shape(1, Inches(x), Inches(top + 0.15), Inches(width), Inches(4.95))
        card.fill.solid()
        card.fill.fore_color.rgb = CREAM
        card.line.color.rgb = ACCENT

        circle = slide.shapes.add_shape(1, Inches(x + 0.2), Inches(top + 0.35), Inches(0.55), Inches(0.55))
        circle.fill.solid()
        circle.fill.fore_color.rgb = MAROON
        circle.line.fill.background()
        np = circle.text_frame.paragraphs[0]
        np.text = num
        style_paragraph(np, size=20, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

        title_box = slide.shapes.add_textbox(Inches(x + 0.15), Inches(top + 1.05), Inches(width - 0.3), Inches(1.0))
        style_paragraph(title_box.text_frame.paragraphs[0], size=16, bold=True, color=DARK, align=PP_ALIGN.CENTER)
        title_box.text_frame.paragraphs[0].text = phase_title

        desc_box = slide.shapes.add_textbox(Inches(x + 0.15), Inches(top + 2.2), Inches(width - 0.3), Inches(2.5))
        style_paragraph(desc_box.text_frame.paragraphs[0], size=13, color=GRAY, align=PP_ALIGN.CENTER)
        desc_box.text_frame.paragraphs[0].text = desc

        if i < len(phases) - 1:
            arrow = slide.shapes.add_textbox(Inches(x + width + 0.05), Inches(top + 2.35), Inches(0.3), Inches(0.4))
            style_paragraph(arrow.text_frame.paragraphs[0], size=24, color=ACCENT, align=PP_ALIGN.CENTER)
            arrow.text_frame.paragraphs[0].text = "→"

    add_footer_bar(slide, "Texas A&M UES · Steam Safety Management Program")


def add_screenshot_slide(prs: Presentation, title: str, image_name: str, caption: str) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    top = add_header(slide, title)

    image_path = SCREENSHOTS / image_name
    if image_path.exists():
        slide.shapes.add_picture(str(image_path), Inches(0.65), Inches(top), width=Inches(12.0))

    cap = slide.shapes.add_textbox(Inches(0.65), Inches(6.82), Inches(12), Inches(0.35))
    style_paragraph(cap.text_frame.paragraphs[0], size=11, color=GRAY, align=PP_ALIGN.CENTER)
    cap.text_frame.paragraphs[0].text = caption

    add_footer_bar(slide, "Texas A&M UES · Steam Safety Management Program")


def add_tag_diagram_slide(prs: Presentation) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    top = add_header(
        slide,
        "Valve Identification & Labeling",
        "Read the tag left to right — each segment has a fixed meaning",
    )

    diagram = ASSETS / "tag-diagram.png"
    if diagram.exists():
        slide.shapes.add_picture(str(diagram), Inches(0.65), Inches(top), width=Inches(12.0))

    note = slide.shapes.add_shape(1, Inches(0.65), Inches(6.45), Inches(12.0), Inches(0.55))
    note.fill.solid()
    note.fill.fore_color.rgb = AMBER_BG
    note.line.color.rgb = ACCENT
    tf = note.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = "Physical tag is two-sided: Position Tag + Inventory ID + Serial Number + Service + Location"
    style_paragraph(p, size=13, bold=True, color=DARK, align=PP_ALIGN.CENTER)

    add_footer_bar(slide, "Section 8 · Maintenance Strategy")


def build() -> Path:
    tag_script = ROOT / "scripts" / "generate_tag_diagram.py"
    if tag_script.exists():
        import runpy

        runpy.run_path(str(tag_script), run_name="__not_main__")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # --- Opening ---------------------------------------------------------------
    add_title_slide(prs)

    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    add_header(slide, "Executive Summary", "End-to-end program built from the ground up")
    add_stat_cards(
        slide,
        [
            ("4 Phases", "Program path", "Field → Excel → Dashboard → Strategy"),
            ("Fleet-wide", "PSVs tracked", "Boilers, HRSG, hot water"),
            ("3 Years", "Recert cycle", "NBIC / ASME aligned"),
            ("1 Source", "System of record", "Dashboard + master Excel"),
        ],
    )
    box = slide.shapes.add_textbox(Inches(0.85), Inches(3.05), Inches(11.8), Inches(3.55))
    tf = box.text_frame
    tf.word_wrap = True
    for i, point in enumerate([
        "Walked boiler rooms and steam systems — photographed nameplates and verified installed valves",
        "Built a comprehensive Excel master register, then a live compliance dashboard for the full fleet",
        "Authored a formal PSV/SRV Maintenance Strategy aligned to ASME, NBIC, API RP 576, and Texas code",
        "Outcome: visible compliance, proactive due-date management, and a defendable maintenance program",
    ]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = f"✓  {point}"
        style_paragraph(p, size=16, color=DARK)
        p.space_after = Pt(12)
    add_footer_bar(slide, "Texas A&M UES · Steam Safety Management Program")

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
        subtitle="Risk reduction through visibility and a defendable maintenance program",
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

    add_bullet_slide(
        prs,
        "Phase 1 — Field Data Collection",
        [
            "Walked boiler rooms and steam systems to locate every relief valve and protected point",
            "Captured nameplate photos: serial number, set pressure (CDTP), orifice, manufacturer, NB number",
            "Verified what was actually installed vs. what drawings or records showed",
            "Documented spare availability, valve orientation, discharge path, and visible condition",
            "Flagged gaps: missing spares, illegible nameplates, weeping seats, isolation concerns",
        ],
        subtitle="Ground truth before any database or dashboard",
    )

    add_two_column_cards(
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
        "Live production dashboard — site-wide compliance posture and equipment overview",
    )

    add_screenshot_slide(
        prs,
        "KPI Drill-Down",
        "02-kpi-modal.png",
        "Click any KPI to see the exact valves driving that metric",
    )

    add_screenshot_slide(
        prs,
        "Equipment & Location Views",
        "03-equipment.png",
        "Scoped view per boiler with location-level Inventory ID and installed valve due dates",
    )

    add_screenshot_slide(
        prs,
        "Valve Record Detail",
        "05-psv-detail.png",
        "Full datasheet, compliance clock, status history, and repair/overhaul log",
    )

    add_section_slide(prs, "Phase 4 — Maintenance Strategy", "Formal PSV/SRV program document for UES operations")

    add_table_slide(
        prs,
        "PM Intervals & Triggers",
        ["Activity", "Frequency", "Code / reference", "Notes"],
        [
            ["Pop test & overhaul", "Every 3 years", "NBIC Part 2, ASME Sec. I", "Send to Setpoint — complete before due"],
            ["Visual walkdown", "Semi-annual", "API RP 576", "Weeping, corrosion, discharge path"],
            ["Manual lever test", "Annual (optional)", "PG-73.1.3", "Management decision — seat damage risk"],
            ["Condition inspection", "As needed", "API RP 576", "Leakage, chattering, damage"],
        ],
        subtitle="Maximum intervals shown — UES should complete before due date",
        col_widths=[2.5, 1.8, 2.8, 5.0],
    )

    add_table_slide(
        prs,
        "Testing Methods — Send-Out vs. In-Place",
        ["Factor", "Send-out (preferred)", "In-place (no spare)"],
        [
            ["Process", "Remove valve → install spare → bench overhaul", "Setpoint tests on live system"],
            ["Inspection depth", "Full disassembly, lapping, spring check", "Functional lift only"],
            ["Certification", "Complete overhaul + pop test", "Equivalent certification issued"],
            ["Risk", "Lower seat-damage risk", "Higher risk on older valves"],
            ["Goal", "Fleet-wide spare coverage", "Interim until spare acquired"],
        ],
        subtitle="Long-term goal: spare coverage for all valves to enable send-out testing fleet-wide",
        col_widths=[2.2, 4.9, 4.9],
    )

    add_field_checklist_slide(prs)

    add_tag_diagram_slide(prs)

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

    add_table_slide(
        prs,
        "Commercial 125 psi Boiler Strategy",
        ["Approach", "Annual valves", "Cost trend", "Recommendation"],
        [
            ["Replace-and-discard", "~16+ / year", "Recurring purchase every cycle", "Simple but highest lifecycle cost"],
            ["Test-and-reuse + spare pool", "Same fleet, pooled spares", "~40% reduction after pool built*", "Mirror high-pressure program"],
            ["Pilot program", "3–5 valves first", "Validate quotes & turnaround", "Prove before fleet-wide change"],
        ],
        subtitle="Section 7 — *illustrative pending actual vendor quotes",
        col_widths=[2.8, 2.0, 3.5, 3.7],
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

    add_two_column_cards(
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
        font_size=16,
    )

    add_section_slide(prs, "Discussion", "Steam Safety Management Program · Texas A&M UES · Reliability & Compliance")

    prs.save(OUTPUT)
    return OUTPUT


if __name__ == "__main__":
    path = build()
    print(f"Created: {path}")
