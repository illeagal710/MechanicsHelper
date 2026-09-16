#!/usr/bin/env python3
"""Build Mechanics Helper brand rasters from the ORIGINAL no-tires wordmark.

Leon-approved source is the gold front-facing car + vertical wrench lockup
plus “Mechanics Helper” on navy. This script only crops / resamples that PNG.
It does not redraw the mark, add tires, or invent variants.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
BRAND = PUBLIC / "brand"
ANDROID = BRAND / "android"
IMG = PUBLIC / "img"

NAVY = (7, 24, 52)  # sampled from original wordmark corners
NAVY_HEX = "#071834"

SOURCE_CANDIDATES = [
    ROOT / "public/brand/logo-wordmark-source.png",
    Path("/workspace/mechanicshelper-logo-wordmark.png"),
    Path("/workspace/mechanicshelper-assets/logo-wordmark.png"),
    Path("/home/ubuntu/.cursor/projects/workspace/uploads/mechanicshelper-logo-wordmark_433e.png"),
    Path("/home/ubuntu/.cursor/projects/workspace/uploads/logo-wordmark_91c2.png"),
]


def find_source() -> Path:
    for path in SOURCE_CANDIDATES:
        if path.is_file():
            return path
    raise SystemExit("Original no-tires wordmark PNG not found")


def is_gold(pixel: tuple[int, ...]) -> bool:
    r, g, b = pixel[:3]
    return r > 140 and g > 100 and b < 130 and r > b + 40


def gold_rows(im: Image.Image) -> list[int]:
    counts = []
    pix = im.load()
    w, h = im.size
    for y in range(h):
        n = 0
        for x in range(w):
            if is_gold(pix[x, y]):
                n += 1
        counts.append(n)
    return counts


def gold_bbox(im: Image.Image, y0: int, y1: int) -> tuple[int, int, int, int]:
    pix = im.load()
    w, h = im.size
    xs: list[int] = []
    ys: list[int] = []
    for y in range(max(0, y0), min(h, y1 + 1)):
        for x in range(w):
            if is_gold(pix[x, y]):
                xs.append(x)
                ys.append(y)
    if not xs:
        raise SystemExit("No gold pixels in crop window")
    return min(xs), min(ys), max(xs), max(ys)


def split_mark_and_text(im: Image.Image) -> tuple[tuple[int, int, int, int], tuple[int, int, int, int]]:
    """Mark is the upper gold band; wordmark text is the lower gold band."""
    counts = gold_rows(im)
    active = [i for i, c in enumerate(counts) if c > 8]
    if not active:
        raise SystemExit("No gold bands in source")
    # Find the longest near-zero gap inside the gold range — that's mark vs text.
    lo, hi = active[0], active[-1]
    gap_start = gap_end = None
    best = 0
    run_s = None
    for y in range(lo, hi + 1):
        if counts[y] <= 2:
            if run_s is None:
                run_s = y
        elif run_s is not None:
            length = y - run_s
            if length > best:
                best = length
                gap_start, gap_end = run_s, y - 1
            run_s = None
    if gap_start is None:
        raise SystemExit("Could not isolate mark from wordmark text")
    mark = gold_bbox(im, lo, gap_start - 1)
    text = gold_bbox(im, gap_end + 1, hi)
    return mark, text


def crop(im: Image.Image, box: tuple[int, int, int, int], pad: int = 0) -> Image.Image:
    l, t, r, b = box
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(im.width - 1, r + pad)
    b = min(im.height - 1, b + pad)
    return im.crop((l, t, r + 1, b + 1))


def navy_canvas(size: int, mode: str = "RGB") -> Image.Image:
    if mode == "RGBA":
        return Image.new("RGBA", (size, size), (*NAVY, 255))
    return Image.new("RGB", (size, size), NAVY)


def paste_centered(dst: Image.Image, src: Image.Image) -> Image.Image:
    x = (dst.width - src.width) // 2
    y = (dst.height - src.height) // 2
    if src.mode == "RGBA":
        dst.paste(src, (x, y), src)
    else:
        dst.paste(src, (x, y))
    return dst


def fit_inside(im: Image.Image, box: int, resample=Image.Resampling.LANCZOS) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    scale = min(box / w, box / h)
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    return im.resize((nw, nh), resample)


def knock_out_navy(im: Image.Image, thresh: int = 36) -> Image.Image:
    """Turn near-navy pixels transparent for adaptive-icon foreground."""
    im = im.convert("RGBA")
    pix = im.load()
    nr, ng, nb = NAVY
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = pix[x, y]
            if abs(r - nr) + abs(g - ng) + abs(b - nb) < thresh:
                pix[x, y] = (r, g, b, 0)
    return im


def save_png(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG", optimize=True)


def icon_full_bleed(mark: Image.Image, size: int, fill: float) -> Image.Image:
    """Square RGB icon, navy to the edges, mark sized to `fill` of the canvas."""
    canvas = navy_canvas(size, "RGB")
    fitted = fit_inside(mark, round(size * fill))
    return paste_centered(canvas.convert("RGBA"), fitted).convert("RGB")


def write_favicon_svg(mark_png: Path, dest: Path) -> None:
    import base64

    data = base64.b64encode(mark_png.read_bytes()).decode("ascii")
    dest.write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">\n'
        f'  <rect width="32" height="32" fill="{NAVY_HEX}"/>\n'
        f'  <image href="data:image/png;base64,{data}" x="0" y="0" width="32" height="32"/>\n'
        "</svg>\n",
        encoding="utf-8",
    )


def write_adaptive_xml(dest: Path) -> None:
    dest.write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@mipmap/ic_launcher_background"/>\n'
        '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
        "</adaptive-icon>\n",
        encoding="utf-8",
    )


def main() -> None:
    src_path = find_source()
    BRAND.mkdir(parents=True, exist_ok=True)
    ANDROID.mkdir(parents=True, exist_ok=True)
    IMG.mkdir(parents=True, exist_ok=True)

    canonical = BRAND / "logo-wordmark-source.png"
    if src_path.resolve() != canonical.resolve():
        shutil.copy2(src_path, canonical)
    source = Image.open(canonical).convert("RGB")

    mark_box, text_box = split_mark_and_text(source)
    # Tight original lockup: mark + wordmark text, modest padding, no extra art.
    lockup_box = (
        min(mark_box[0], text_box[0]),
        min(mark_box[1], text_box[1]),
        max(mark_box[2], text_box[2]),
        max(mark_box[3], text_box[3]),
    )
    wordmark = crop(source, lockup_box, pad=28)
    mark = crop(source, mark_box, pad=8)

    save_png(wordmark, IMG / "logo-wordmark.png")

    master = icon_full_bleed(mark, 1024, 0.78)
    save_png(master, BRAND / "mark-master.png")

    # Apple App Store: 1024, no alpha, full-bleed navy.
    apple = icon_full_bleed(mark, 1024, 0.72)
    save_png(apple, BRAND / "apple-icon-1024.png")

    # Play Store 512, no alpha.
    play = icon_full_bleed(mark, 512, 0.74)
    save_png(play, BRAND / "play-icon-512.png")

    # Android adaptive layers (1080 = 108dp @ 10x). Safe zone is the inner 66%.
    bg = navy_canvas(1080, "RGB")
    save_png(bg, ANDROID / "ic_launcher_background.png")
    fg = Image.new("RGBA", (1080, 1080), (0, 0, 0, 0))
    fg_mark = knock_out_navy(fit_inside(mark, round(1080 * 0.62)))
    paste_centered(fg, fg_mark)
    save_png(fg, ANDROID / "ic_launcher_foreground.png")
    write_adaptive_xml(ANDROID / "adaptive-icon.xml")

    # Web / PWA
    touch = icon_full_bleed(mark, 180, 0.74)
    save_png(touch, PUBLIC / "apple-touch-icon.png")
    save_png(touch, PUBLIC / "__grok" / "icon-180.png")

    icon192 = icon_full_bleed(mark, 192, 0.74)
    save_png(icon192, PUBLIC / "icon-192.png")
    icon512 = icon_full_bleed(mark, 512, 0.74)
    save_png(icon512, PUBLIC / "icon-512.png")

    maskable = icon_full_bleed(mark, 512, 0.58)  # inner ~80% safe zone
    save_png(maskable, PUBLIC / "icon-512-maskable.png")

    fav32 = icon_full_bleed(mark, 32, 0.82)
    save_png(fav32, PUBLIC / "favicon.png")
    write_favicon_svg(PUBLIC / "favicon.png", PUBLIC / "favicon.svg")

    # Square chrome fallback (replaces the generic side-profile car+wrench jpg).
    square = icon_full_bleed(mark, 512, 0.78).convert("RGB")
    square.save(IMG / "logo.jpg", "JPEG", quality=92, optimize=True)

    # Share card: original wordmark contained on 1200x630 navy (no new illustration).
    fitted = source.convert("RGB")
    scale = min(1200 / fitted.width, 630 / fitted.height)
    nw, nh = round(fitted.width * scale), round(fitted.height * scale)
    fitted = fitted.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (1200, 630), NAVY)
    canvas.paste(fitted, ((1200 - nw) // 2, (630 - nh) // 2))
    canvas.save(PUBLIC / "og.jpg", "JPEG", quality=90, optimize=True)

    print("source", src_path)
    print("mark bbox", mark_box)
    print("text bbox", text_box)
    print("navy", NAVY_HEX)
    print("wrote brand icons under", PUBLIC)


if __name__ == "__main__":
    main()
