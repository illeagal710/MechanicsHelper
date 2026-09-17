#!/usr/bin/env python3
"""Build the Play Console feature graphic (1024×500, 24-bit RGB, no alpha)."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
ICON = ROOT / "public/brand/play-icon-512.png"
OUT = REPO / "store/play-screenshots/feature-graphic-1024x500.png"
NAVY = (7, 24, 52)
GOLD = (245, 158, 11)

W, H = 1024, 500
canvas = Image.new("RGB", (W, H), NAVY)
icon = Image.open(ICON).convert("RGBA")
side = 300
icon = icon.resize((side, side), Image.Resampling.LANCZOS)
x = 48
y = (H - side) // 2
canvas.paste(icon, (x, y), icon)

bar = Image.new("RGB", (6, 220), GOLD)
canvas.paste(bar, (x + side + 20, (H - 220) // 2))

from PIL import ImageDraw, ImageFont

draw = ImageDraw.Draw(canvas)
font_paths = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]
font = None
small = None
for path in font_paths:
    if Path(path).exists():
        font = ImageFont.truetype(path, 36)
        small = ImageFont.truetype(path, 20)
        break
if font:
    tx = x + side + 48
    title = "Mechanics Helper"
    bbox = draw.textbbox((0, 0), title, font=font)
    while bbox[2] > W - tx - 40 and font.size > 24:
        font = ImageFont.truetype(font.path, font.size - 2)
        bbox = draw.textbbox((0, 0), title, font=font)
    draw.text((tx, 178), title, fill=GOLD, font=font)
    if small:
        draw.text((tx, 232), "Your shop. Your customers.", fill=(226, 232, 240), font=small)
        draw.text((tx, 264), "Not a marketplace.", fill=(148, 163, 184), font=small)

OUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUT, "PNG")
print(f"wrote {OUT} {canvas.size}")
