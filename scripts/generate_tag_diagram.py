#!/usr/bin/env python3
"""Generate tag labeling diagram image for the presentation."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "presentation" / "assets" / "tag-diagram.png"

MAROON = (80, 0, 0)
ACCENT = (184, 58, 58)
DARK = (30, 41, 59)
GRAY = (100, 116, 139)
WHITE = (255, 255, 255)
SEGMENT_COLORS = [
    (254, 242, 242),
    (255, 247, 237),
    (240, 249, 255),
    (236, 253, 245),
    (245, 243, 255),
]
SEGMENT_BORDERS = [
    (220, 100, 100),
    (234, 140, 70),
    (96, 165, 250),
    (52, 211, 153),
    (167, 139, 250),
]


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def build() -> Path:
    OUT.parent.mkdir(parents=True, exist_ok=True)

    width, height = 1600, 620
    img = Image.new("RGB", (width, height), WHITE)
    draw = ImageDraw.Draw(img)

    title_font = load_font(28, bold=True)
    tag_font = load_font(54, bold=True)
    label_font = load_font(22, bold=True)
    desc_font = load_font(18)

    draw.text((width // 2, 36), "Position Tag — How to Read It", fill=MAROON, font=title_font, anchor="mt")

    segments = [
        ("B012", "Equipment", "Boiler unit"),
        ("SD", "Location", "Steam Drum"),
        ("STM", "Service", "Steam medium"),
        ("SV", "Valve Type", "Safety Valve"),
        ("001B", "Sequence", "Point B"),
    ]

    seg_w = 220
    seg_h = 88
    gap = 18
    total_w = len(segments) * seg_w + (len(segments) - 1) * gap
    start_x = (width - total_w) // 2
    y_tag = 110

    centers = []
    for i, (text, label, desc) in enumerate(segments):
        x = start_x + i * (seg_w + gap)
        draw.rounded_rectangle(
            (x, y_tag, x + seg_w, y_tag + seg_h),
            radius=14,
            fill=SEGMENT_COLORS[i],
            outline=SEGMENT_BORDERS[i],
            width=3,
        )
        draw.text((x + seg_w // 2, y_tag + seg_h // 2), text, fill=DARK, font=tag_font, anchor="mm")
        centers.append(x + seg_w // 2)

        if i < len(segments) - 1:
            dash_x = x + seg_w + gap // 2
            draw.text((dash_x, y_tag + seg_h // 2), "—", fill=GRAY, font=load_font(36, bold=True), anchor="mm")

    bracket_y = y_tag + seg_h + 28
    label_y = bracket_y + 58
    desc_y = label_y + 34

    for i, (text, label, desc) in enumerate(segments):
        cx = centers[i]
        draw.line((cx, y_tag + seg_h + 4, cx, bracket_y + 18), fill=SEGMENT_BORDERS[i], width=3)
        draw.polygon(
            [(cx - 8, bracket_y + 18), (cx + 8, bracket_y + 18), (cx, bracket_y + 30)],
            fill=SEGMENT_BORDERS[i],
        )
        draw.text((cx, label_y), label, fill=MAROON, font=label_font, anchor="mt")
        draw.text((cx, desc_y), desc, fill=GRAY, font=desc_font, anchor="mt")

    draw.rounded_rectangle((90, 470, width - 90, 585), radius=16, fill=(253, 248, 248), outline=ACCENT, width=2)
    inv_font = load_font(24, bold=True)
    draw.text((width // 2, 500), "Inventory ID example:  BLR-002-PSV-A", fill=DARK, font=inv_font, anchor="mt")
    draw.text(
        (width // 2, 540),
        "Printed on the physical two-sided valve tag together with serial number, service, and location",
        fill=GRAY,
        font=desc_font,
        anchor="mt",
    )

    img.save(OUT)
    return OUT


if __name__ == "__main__":
    print(f"Created: {build()}")
