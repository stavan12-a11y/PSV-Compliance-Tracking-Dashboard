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
OUTPUT = ROOT / "docs" / "presentation" / "UES-Steam-Safety-Program-v3.pptx"

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


def add_screenshot_slide(prs: Presentation, title: str, image_name: str, caption: str, callouts: list[str] | None = None) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    top = add_header(slide, title)

    image_path = SCREENSHOTS / image_name
    img_width = 8.8 if callouts else 12.0
    if image_path.exists():
        slide.shapes.add_picture(str(image_path), Inches(0.65), Inches(top), width=Inches(img_width))

    if callouts:
        panel = slide.shapes.add_shape(1, Inches(9.65), Inches(top), Inches(3.0), Inches(5.55))
        panel.fill.solid()
        panel.fill.fore_color.rgb = CREAM
        panel.line.color.rgb = ACCENT

        label = slide.shapes.add_textbox(Inches(9.85), Inches(top + 0.15), Inches(2.6), Inches(0.35))
        style_paragraph(label.text_frame.paragraphs[0], size=13, bold=True, color=MAROON)
        label.text_frame.paragraphs[0].text = "Key takeaways"

        box = slide.shapes.add_textbox(Inches(9.85), Inches(top + 0.55), Inches(2.65), Inches(4.8))
        tf = box.text_frame
        tf.word_wrap = True
        for i, item in enumerate(callouts):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            p.text = f"▸ {item}"
            style_paragraph(p, size=12, color=DARK)
            p.space_after = Pt(10)

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


def add_image_table_slide(
    prs: Presentation,
    title: str,
    image_name: str,
    headers: list[str],
    rows: list[list[str]],
    subtitle: str = "",
) -> None:
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    top = add_header(slide, title, subtitle)

    image_path = SCREENSHOTS / image_name
    if image_path.exists():
        slide.shapes.add_picture(str(image_path), Inches(0.65), Inches(top), width=Inches(5.6))

    n_rows = len(rows) + 1
    n_cols = len(headers)
    table_shape = slide.shapes.add_table(n_rows, n_cols, Inches(6.55), Inches(top), Inches(6.1), Inches(5.55))
    table = table_shape.table
    for col, header in enumerate(headers):
        style_table_cell(table.cell(0, col), header, header=True, size=11)
    for r, row in enumerate(rows, start=1):
        for c, value in enumerate(row):
            style_table_cell(table.cell(r, c), value, alt=r % 2 == 0, size=10)

    add_footer_bar(slide, "Texas A&M UES · Steam Safety Management Program")


def build() -> Path:
    tag_script = ROOT / "scripts" / "generate_tag_diagram.py"
    if tag_script.exists():
        import runpy

        runpy.run_path(str(tag_script), run_name="__not_main__")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    add_title_slide(prs)

    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_bg(slide, WHITE)
    add_header(slide, "Executive Summary", "End-to-end program built from the ground up")
    add_stat_cards(
        slide,
        [
            ("4 Phases", "Program path", "Field → Excel → Dashboard → Strategy"),
            ("26+ Valves", "Fleet tracked", "Boilers, HRSG, hot water"),
            ("3 Years", "Recert cycle", "NBIC / ASME aligned"),
            ("1 Source", "System of record", "Dashboard + master Excel"),
        ],
    )
    box = slide.shapes.add_textbox(Inches(0.85), Inches(3.05), Inches(11.8), Inches(3.55))
    tf = box.text_frame
    tf.word_wrap = True
    summary_points = [
        "Walked boiler rooms and steam systems — photographed nameplates and verified installed valves",
        "Built a comprehensive Excel master register, then a live compliance dashboard for the full fleet",
        "Authored a formal PSV/SRV Maintenance Strategy aligned to ASME, NBIC, API RP 576, and Texas code",
        "Outcome: visible compliance, proactive due-date management, and a defendable maintenance program",
    ]
    for i, point in enumerate(summary_points):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = f"✓  {point}"
        style_paragraph(p, size=16, color=DARK)
        p.space_after = Pt(12)
    add_footer_bar(slide, "Texas A&M UES · Steam Safety Management Program")

    add_table_slide(
        prs,
        "Why Leadership Should Care",
        ["Risk area", "What was happening", "What the program fixes"],
        [
            ["Regulatory", "Missed 3-year recertification creates TDLR / NBIC exposure", "Visible overdue tracking and PM schedule"],
            ["Operational", "Valve status and spare coverage hard to see across units", "Equipment → Location → PSV hierarchy"],
            ["Financial", "Last-minute testing and unplanned outages drive cost", "Planned Setpoint outages and spare pooling"],
            ["Audit / safety", "Scattered files and memory-based tracking", "Traceable history, exports, and strategy document"],
        ],
        subtitle="Reliability work that protects people, equipment, and compliance standing",
        col_widths=[2.0, 4.8, 5.2],
    )

    add_table_slide(
        prs,
        "Regulatory & Standards Foundation",
        ["Standard / code", "Requirement", "How the program uses it"],
        [
            ["ASME Section I", "Safety valve design, capacity, manual-lift rules", "Datasheet fields + capacity verification"],
            ["NBIC Part 2", "In-service inspection; max 3-year test interval", "Due-date engine + PM schedule"],
            ["API RP 576", "Inspection, testing, repair best practice", "Walkdowns, send-out vs in-place guidance"],
            ["16 TAC Ch. 65 / TX HSC 755", "State boiler program requirements", "Strategy ties PM to Texas expectations"],
        ],
        subtitle="Program decisions are code-informed, not ad hoc",
        col_widths=[2.8, 4.5, 4.7],
    )

    add_section_slide(prs, "Building the Program", "Field data → Master register → Dashboard → Maintenance strategy")
    add_journey_slide(prs)

    add_table_slide(
        prs,
        "Phase 1 — Field Data Collection",
        ["Data element", "How captured", "Why it matters"],
        [
            ["Equipment identity", "Site walk + nameplate photo", "Links valve to boiler / HRSG / unit"],
            ["Protected location", "Physical position on system", "Steam drum, economizer, outlet, etc."],
            ["Serial number & NB #", "Nameplate photo + field notes", "Unique traceability for Setpoint / CMMS"],
            ["Set pressure & capacity", "Nameplate + datasheet review", "Correct valve at correct point"],
            ["Installed vs spare", "Visual verification", "Determines send-out vs in-place testing"],
            ["Condition flags", "Eyes-on inspection", "Weeping, corrosion, isolation concerns"],
        ],
        subtitle="Ground truth before any database or dashboard",
        col_widths=[2.8, 3.8, 5.4],
    )

    add_two_column_cards(
        prs,
        "Field Work in Practice",
        "On-site activities",
        [
            "Walk every boiler room and steam path",
            "Photograph every nameplate",
            "Confirm installed valve vs drawings",
            "Note discharge path and orientation",
            "Flag missing spares immediately",
        ],
        "Deliverables from the field",
        [
            "Photo library per valve",
            "Verified equipment/location list",
            "Gap list (no spare, bad nameplate)",
            "Inputs for Excel master register",
            "Confidence before digitizing",
        ],
    )

    add_table_slide(
        prs,
        "Phase 2 — Master Excel Register",
        ["Register function", "What it tracks", "Leadership value"],
        [
            ["Master inventory", "Every PSV by equipment, location, serial", "Complete fleet picture"],
            ["Due-date logic", "Install date + 3-year recert", "No valve left behind"],
            ["Spare tracking", "Installed / inventory / out for service", "Swap planning for Setpoint"],
            ["Inventory IDs", "Warehouse + CMMS identifiers", "Procurement and tagging alignment"],
            ["Bulk reporting", "5-sheet export structure", "Reviews without opening the app"],
        ],
        subtitle="The bridge between field discovery and digital management",
        col_widths=[2.8, 4.5, 4.7],
    )

    add_section_slide(prs, "Phase 3 — Digital Compliance Dashboard", "Operational visibility for the whole fleet")

    add_table_slide(
        prs,
        "Dashboard Capabilities",
        ["Feature", "What you see", "Who benefits"],
        [
            ["Fleet KPIs", "Total, Installed, Out for Service, Overdue, Compliant %", "Leadership snapshot"],
            ["KPI drill-down", "Click any metric → valve list with Inventory ID", "Planners & reliability"],
            ["Hierarchy views", "Equipment → Location → PSV faceplates", "Operators"],
            ["Compliance clock", "Auto 3-year due date from install / service", "Compliance tracking"],
            ["Dual history", "Status changes separate from repair/overhaul", "Audit trail"],
            ["Excel export", "All PSVs, Installed, OOS, Overdue, Upcoming", "Reporting & meetings"],
        ],
        subtitle="reliability-and-compliance-dashboar.vercel.app",
        col_widths=[2.5, 5.0, 4.5],
    )

    add_screenshot_slide(
        prs,
        "Dashboard — Fleet Compliance at a Glance",
        "01-dashboard.png",
        "Site-wide compliance posture with equipment cards and upcoming due list",
        ["Fleet KPIs at the top — click any card to drill down", "Equipment grid mirrors plant layout", "Urgency panel shows overdue and due-soon valves"],
    )

    add_screenshot_slide(
        prs,
        "KPI Drill-Down — Compliant Valves",
        "02-kpi-modal.png",
        "Every KPI opens a filterable table — serial, Inventory ID, due date, compliance state",
        ["Inventory ID column on every filter", "Due Soon counts toward Compliant %", "Export-ready data for meetings"],
    )

    add_image_table_slide(
        prs,
        "Equipment & Location Views",
        "03-equipment.png",
        ["View level", "Shows", "Example"],
        [
            ["Equipment", "Scoped KPIs + location list", "Boiler #2 → 4 PSVs"],
            ["Location", "Installed valve + due date", "Steam Drum Relief"],
            ["Faceplate", "Status toggle + quick context", "CV-2001 installed"],
        ],
        subtitle="Scoped views per boiler with Inventory ID on every location row",
    )

    add_screenshot_slide(
        prs,
        "Valve Record Detail",
        "05-psv-detail.png",
        "Full datasheet, compliance clock, status history, and repair/overhaul log in one place",
        ["Inventory ID on header and datasheet", "Status History vs Repair split", "One-click Excel export per valve"],
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

    add_table_slide(
        prs,
        "Pre-Test Field Checklist",
        ["Check item", "Pass criteria", "Action if fail"],
        [
            ["Valve body / bonnet", "No active corrosion or mechanical damage", "Defer test — evaluate repair/replace"],
            ["Discharge stack", "Clear, supported, no standing water", "Clear path before testing"],
            ["Nameplate", "Legible — set pressure, serial, orifice", "Re-tag or replace nameplate"],
            ["Seat / lever", "No weeping; lifting lever free", "Repair before test"],
            ["Isolation", "Valve not inadvertently isolated", "Restore to service position"],
        ],
        subtitle="Section 4.1 of Maintenance Strategy — filed in CMMS work order",
        col_widths=[2.5, 4.8, 4.7],
    )

    add_tag_diagram_slide(prs)

    add_table_slide(
        prs,
        "Overhaul vs. Repair vs. Replace",
        ["Decision", "When to use", "Requirements", "Outcome"],
        [
            ["Overhaul", "Scheduled 3-year send-out", "VR-stamp shop + pop test", "Valve returned certified"],
            ["Repair", "Limited defect found", "VR-stamp work + re-test", "Targeted fix, lower cost"],
            ["Replace", "Body damage / obsolete / economics", "New valve + correct capacity", "Long-term reliability"],
            ["Spare re-test", "In storage > 5 years", "API RP 576 guidance", "Verify before installation"],
        ],
        col_widths=[1.8, 3.0, 3.2, 4.0],
    )

    add_table_slide(
        prs,
        "Commercial 125 psi Boiler Strategy",
        ["Approach", "Annual valves", "Unit cost trend", "Recommendation"],
        [
            ["Replace-and-discard", "~16+ / year", "Recurring purchase every cycle", "Simple but highest lifecycle cost"],
            ["Test-and-reuse + spare pool", "Same fleet, pooled spares", "~40% reduction after pool built*", "Mirror high-pressure program"],
            ["Pilot program", "3–5 valves first", "Validate quotes & turnaround", "Prove before fleet-wide change"],
        ],
        subtitle="Section 7 of Maintenance Strategy — *illustrative pending actual vendor quotes",
        col_widths=[2.8, 2.0, 3.5, 3.7],
    )

    add_bullet_slide(
        prs,
        "Highest-Impact Program Improvements",
        [
            "Acquire spares for no-spare locations — unlocks full bench testing",
            "Rank valves by criticality (pressure, capacity, consequence) for capital prioritization",
            "Adopt semi-annual visual walkdowns as standard UES practice",
            "Keep dashboard + Excel register as single source of truth for due dates",
            "Management decision on routine manual lever testing — risk vs. PG-73.1.3",
        ],
        subtitle="Quick wins and decisions that multiply program value",
        icons=["①", "②", "③", "④", "⑤"],
    )

    add_table_slide(
        prs,
        "Program Outcomes & Value Delivered",
        ["Category", "Deliverable", "Impact"],
        [
            ["Operational", "Complete valve inventory across steam systems", "Nothing missed in the field"],
            ["Operational", "Visible compliance by equipment and site", "Leadership-ready status"],
            ["Operational", "Traceable status + repair history", "Audit and incident support"],
            ["Strategic", "Code-aligned maintenance strategy", "Defendable PM program"],
            ["Strategic", "Dashboard + Excel reporting", "Capital requests backed by data"],
            ["Strategic", "Spare-pool foundation", "Lower long-term testing cost"],
        ],
        col_widths=[2.0, 5.0, 5.0],
    )

    add_table_slide(
        prs,
        "Recommended Next Steps",
        ["#", "Action", "Decision owner", "Target"],
        [
            ["1", "Endorse Maintenance Strategy and PM frequencies", "Leadership", "This quarter"],
            ["2", "Decide manual lever testing policy", "Operations / Safety", "Policy memo"],
            ["3", "Approve spare-acquisition priority list", "Leadership / Capital", "FY planning"],
            ["4", "Pilot test-and-reuse on 125 psi valves", "Reliability", "3–5 valve pilot"],
            ["5", "Fleet-wide physical tagging (Position Tag + Inventory ID)", "Operations", "Rolling install"],
        ],
        subtitle="Concrete actions to move from program build to program sustainment",
        col_widths=[0.5, 5.5, 3.0, 3.0],
    )

    add_section_slide(prs, "Discussion", "Steam Safety Management Program · Texas A&M UES · Reliability & Compliance")

    prs.save(OUTPUT)
    return OUTPUT


if __name__ == "__main__":
    path = build()
    print(f"Created: {path}")
