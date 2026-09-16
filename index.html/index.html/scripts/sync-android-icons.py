#!/usr/bin/env python3
"""Copy Mechanics Helper brand rasters into the Capacitor Android res slots.

Sources (icon-only car+wrench, no wordmark text):
  public/brand/play-icon-512.png
  public/brand/android/ic_launcher_foreground.png
  public/brand/android/ic_launcher_background.png
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public" / "brand"
ANDROID_BRAND = BRAND / "android"
RES = ROOT / "android" / "app" / "src" / "main" / "res"

NAVY = (7, 24, 52)

# Legacy launcher (48dp) and adaptive foreground (108dp) per density.
LAUNCHER = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
FOREGROUND = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}
SPLASH = {
    "drawable": (480, 800),
    "drawable-port-mdpi": (320, 480),
    "drawable-port-hdpi": (480, 800),
    "drawable-port-xhdpi": (720, 1280),
    "drawable-port-xxhdpi": (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
    "drawable-land-mdpi": (480, 320),
    "drawable-land-hdpi": (800, 480),
    "drawable-land-xhdpi": (1280, 720),
    "drawable-land-xxhdpi": (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
}


def resize(im: Image.Image, size: int) -> Image.Image:
    return im.resize((size, size), Image.Resampling.LANCZOS)


def splash(mark: Image.Image, width: int, height: int) -> Image.Image:
    canvas = Image.new("RGB", (width, height), NAVY)
    box = round(min(width, height) * 0.42)
    fitted = mark.convert("RGBA").resize((box, box), Image.Resampling.LANCZOS)
    x = (width - box) // 2
    y = (height - box) // 2
    canvas.paste(fitted, (x, y), fitted)
    return canvas


def save_png(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG", optimize=True)


def main() -> None:
    play = Image.open(BRAND / "play-icon-512.png").convert("RGBA")
    fg = Image.open(ANDROID_BRAND / "ic_launcher_foreground.png").convert("RGBA")
    mark = Image.open(BRAND / "mark-master.png").convert("RGBA")

    for folder, size in LAUNCHER.items():
        icon = resize(play, size).convert("RGB")
        save_png(icon, RES / folder / "ic_launcher.png")
        save_png(icon, RES / folder / "ic_launcher_round.png")

    for folder, size in FOREGROUND.items():
        save_png(resize(fg, size), RES / folder / "ic_launcher_foreground.png")

    for folder, (w, h) in SPLASH.items():
        save_png(splash(mark, w, h), RES / folder / "splash.png")

    print("wired Android icons from", BRAND)


if __name__ == "__main__":
    main()
