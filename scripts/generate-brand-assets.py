#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from typing import Iterable, Tuple

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
EXPORT_DIR = ROOT / "public" / "brand" / "export"
EXTENSION_ICON_DIR = ROOT / "public" / "extension" / "icons"

COLORS = {
    "bg": (9, 9, 11, 255),
    "panel": (17, 24, 39, 255),
    "cyan": (103, 232, 249, 255),
    "green": (52, 211, 153, 255),
    "red": (244, 63, 94, 255),
    "white": (250, 250, 250, 255),
    "muted": (161, 161, 170, 255),
    "line": (39, 39, 42, 255),
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue

    return ImageFont.load_default()


def rounded_rect(draw: ImageDraw.ImageDraw, box: Tuple[int, int, int, int], radius: int, fill, outline=None, width: int = 1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def shield_points(cx: float, top: float, size: float) -> list[tuple[float, float]]:
    return [
        (cx, top),
        (cx + size * 0.34, top + size * 0.13),
        (cx + size * 0.34, top + size * 0.42),
        (cx + size * 0.27, top + size * 0.67),
        (cx + size * 0.12, top + size * 0.86),
        (cx, top + size),
        (cx - size * 0.12, top + size * 0.86),
        (cx - size * 0.27, top + size * 0.67),
        (cx - size * 0.34, top + size * 0.42),
        (cx - size * 0.34, top + size * 0.13),
    ]


def draw_mark(draw: ImageDraw.ImageDraw, box: Tuple[int, int, int, int], background: bool = True):
    x1, y1, x2, y2 = box
    w = x2 - x1
    h = y2 - y1
    base = min(w, h)
    pad = base * 0.08

    if background:
        rounded_rect(draw, (int(x1), int(y1), int(x2), int(y2)), int(base * 0.23), COLORS["bg"])

    cx = x1 + w / 2
    top = y1 + pad * 1.1
    size = base - pad * 2.2
    shield = shield_points(cx, top, size)
    draw.polygon(shield, fill=COLORS["panel"])
    draw.line(shield + [shield[0]], fill=COLORS["cyan"], width=max(2, int(base * 0.047)), joint="curve")

    draw.line(
        [(x1 + base * 0.31, y1 + base * 0.48), (x1 + base * 0.45, y1 + base * 0.59), (x1 + base * 0.68, y1 + base * 0.34)],
        fill=COLORS["green"],
        width=max(3, int(base * 0.073)),
        joint="curve",
    )
    draw.line(
        [(x1 + base * 0.31, y1 + base * 0.27), (x1 + base * 0.69, y1 + base * 0.27)],
        fill=COLORS["red"],
        width=max(2, int(base * 0.047)),
    )
    draw.line(
        [(cx, y1 + base * 0.12), (cx, y1 + base * 0.88)],
        fill=(103, 232, 249, 40),
        width=max(1, int(base * 0.02)),
    )


def save_png(image: Image.Image, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)


def icon(size: int, transparent: bool = False) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0) if transparent else COLORS["bg"])
    draw = ImageDraw.Draw(image)
    draw_mark(draw, (0, 0, size, size), background=not transparent)
    return image


def centered_text(draw: ImageDraw.ImageDraw, text: str, y: int, width: int, fnt, fill):
    bbox = draw.textbbox((0, 0), text, font=fnt)
    draw.text(((width - (bbox[2] - bbox[0])) / 2, y), text, font=fnt, fill=fill)


def fit_font(text: str, max_width: int, start_size: int, bold: bool = True, min_size: int = 14):
    size = start_size
    while size > min_size:
        fnt = font(size, bold)
        if ImageDraw.Draw(Image.new("RGBA", (1, 1))).textbbox((0, 0), text, font=fnt)[2] <= max_width:
            return fnt
        size -= 2

    return font(min_size, bold)


def draw_wrapped(draw: ImageDraw.ImageDraw, text: str, xy: Tuple[int, int], max_width: int, fnt, fill, line_gap: int = 6):
    words = text.split(" ")
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=fnt)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)

    x, y = xy
    for line in lines:
        draw.text((x, y), line, font=fnt, fill=fill)
        y += fnt.size + line_gap


def wordmark(width: int, height: int, transparent: bool = False) -> Image.Image:
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0) if transparent else COLORS["bg"])
    draw = ImageDraw.Draw(image)
    if not transparent:
        for y in range(height):
            tint = int(24 * (y / max(1, height - 1)))
            draw.line([(0, y), (width, y)], fill=(9, 9 + tint // 3, 11 + tint, 255))

    mark_size = int(height * 0.72)
    mark_x = int(width * 0.08)
    mark_y = (height - mark_size) // 2
    draw_mark(draw, (mark_x, mark_y, mark_x + mark_size, mark_y + mark_size), background=True)
    draw.text((mark_x + mark_size + int(height * 0.18), int(height * 0.21)), "TruthShield", font=font(int(height * 0.19), True), fill=COLORS["white"])
    draw.text((mark_x + mark_size + int(height * 0.18), int(height * 0.55)), "真相護盾", font=font(int(height * 0.11), True), fill=COLORS["muted"])

    return image


def promo(width: int, height: int, title: str, subtitle: str, output: Path):
    image = Image.new("RGBA", (width, height), COLORS["bg"])
    draw = ImageDraw.Draw(image)
    for y in range(height):
        draw.line([(0, y), (width, y)], fill=(9, min(32, 9 + y // 18), min(42, 11 + y // 12), 255))

    grid = max(32, width // 28)
    for x in range(0, width, grid):
        draw.line([(x, 0), (x, height)], fill=(19, 38, 46, 255))
    for y in range(0, height, grid):
        draw.line([(0, y), (width, y)], fill=(19, 38, 46, 255))

    mark_size = int(min(width, height) * 0.42)
    mark_x = int(width * 0.07)
    mark_y = int(height * 0.18)
    draw_mark(draw, (mark_x, mark_y, mark_x + mark_size, mark_y + mark_size), background=True)

    text_x = mark_x + mark_size + int(width * 0.06)
    text_width = width - text_x - int(width * 0.07)
    title_font = fit_font(title, text_width, max(26, int(height * 0.11)), True)
    subtitle_font = fit_font(subtitle, text_width, max(14, int(height * 0.046)), False, 12)
    draw.text((text_x, int(height * 0.26)), title, font=title_font, fill=COLORS["white"])
    draw_wrapped(draw, subtitle, (text_x, int(height * 0.48)), text_width, subtitle_font, COLORS["muted"], line_gap=5)
    draw.line([(text_x, int(height * 0.72)), (int(width * 0.92), int(height * 0.72))], fill=COLORS["cyan"], width=max(2, height // 120))
    draw.text((text_x, int(height * 0.76)), "Crowd-powered news credibility", font=fit_font("Crowd-powered news credibility", text_width, max(12, int(height * 0.036)), True, 10), fill=COLORS["cyan"])

    save_png(image, output)


def social_preview():
    width, height = 1200, 630
    image = Image.new("RGBA", (width, height), COLORS["bg"])
    draw = ImageDraw.Draw(image)
    for y in range(height):
        draw.line([(0, y), (width, y)], fill=(9, min(36, 9 + y // 18), min(50, 11 + y // 10), 255))

    draw.polygon([(760, 0), (1200, 0), (1200, 170), (940, 230)], fill=(8, 145, 178, 72))
    draw.polygon([(0, 430), (390, 630), (0, 630)], fill=(244, 63, 94, 62))
    draw_mark(draw, (86, 96, 286, 296), background=True)
    draw.text((330, 116), "TruthShield", font=font(82, True), fill=COLORS["white"])
    draw.text((336, 210), "真相護盾", font=font(40, True), fill=COLORS["muted"])
    draw.text((94, 370), "把每一次閱讀，變成保護公共討論的力量", font=font(44, True), fill=COLORS["white"])
    draw.text((98, 446), "加權投票、公開證據、透明治理", font=font(30, False), fill=COLORS["cyan"])
    save_png(image, EXPORT_DIR / "social-preview-1200x630.png")


def write_readme(paths: Iterable[Path]):
    lines = [
        "# TruthShield Brand Export",
        "",
        "Generated assets for Chrome Web Store, social cards, and public upload forms.",
        "",
        "| File | Use |",
        "| --- | --- |",
    ]
    uses = {
        "logo-mark-128.png": "Chrome extension icon / small upload forms",
        "logo-mark-512.png": "Large square app icon",
        "logo-mark-transparent-512.png": "Transparent-background mark",
        "wordmark-dark-1200x360.png": "Wide logo / brand header",
        "chrome-store-small-promo-440x280.png": "Chrome Web Store small promotional tile",
        "chrome-store-marquee-1400x560.png": "Chrome Web Store marquee promotional tile",
        "social-preview-1200x630.png": "Open Graph / social preview",
    }
    for path in paths:
        lines.append(f"| `{path.name}` | {uses.get(path.name, 'Brand asset')} |")

    (EXPORT_DIR / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    EXTENSION_ICON_DIR.mkdir(parents=True, exist_ok=True)

    outputs: list[Path] = []
    for size in (16, 32, 48, 128):
        path = EXTENSION_ICON_DIR / f"icon-{size}.png"
        save_png(icon(size), path)

    for size in (128, 512):
        path = EXPORT_DIR / f"logo-mark-{size}.png"
        save_png(icon(size), path)
        outputs.append(path)

    transparent_path = EXPORT_DIR / "logo-mark-transparent-512.png"
    save_png(icon(512, transparent=True), transparent_path)
    outputs.append(transparent_path)

    wordmark_path = EXPORT_DIR / "wordmark-dark-1200x360.png"
    save_png(wordmark(1200, 360), wordmark_path)
    outputs.append(wordmark_path)

    small_promo = EXPORT_DIR / "chrome-store-small-promo-440x280.png"
    promo(440, 280, "TruthShield", "新聞信譽提示與社群證據", small_promo)
    outputs.append(small_promo)

    marquee = EXPORT_DIR / "chrome-store-marquee-1400x560.png"
    promo(1400, 560, "TruthShield 真相護盾", "讓新聞旁邊出現加權共識與公開證據", marquee)
    outputs.append(marquee)

    social_preview()
    outputs.append(EXPORT_DIR / "social-preview-1200x630.png")

    write_readme(outputs)
    print("\n".join(str(path.relative_to(ROOT)) for path in outputs))


if __name__ == "__main__":
    main()
