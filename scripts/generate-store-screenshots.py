#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from textwrap import wrap
from typing import Iterable, Tuple

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "brand" / "export" / "chrome-store-screenshots"
SIZE = (1280, 800)

COLORS = {
    "bg": (9, 9, 11, 255),
    "panel": (16, 24, 39, 255),
    "panel2": (24, 24, 27, 255),
    "cyan": (103, 232, 249, 255),
    "teal": (45, 212, 191, 255),
    "red": (248, 113, 113, 255),
    "orange": (251, 146, 60, 255),
    "green": (134, 239, 172, 255),
    "white": (250, 250, 250, 255),
    "muted": (161, 161, 170, 255),
    "line": (63, 63, 70, 255),
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/STHeiti Medium.ttc" if bold else "/System/Library/Fonts/STHeiti Light.ttc",
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


def rounded(draw: ImageDraw.ImageDraw, box: Tuple[int, int, int, int], radius: int, fill, outline=None, width: int = 1):
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


def mark(draw: ImageDraw.ImageDraw, x: int, y: int, size: int):
    rounded(draw, (x, y, x + size, y + size), int(size * 0.22), COLORS["bg"])
    cx = x + size / 2
    outer = shield_points(cx, y + size * 0.12, size * 0.76)
    draw.polygon(outer, fill=COLORS["cyan"])
    inner = shield_points(cx, y + size * 0.18, size * 0.64)
    draw.polygon(inner, fill=COLORS["panel"])
    nodes = [
        (x + size * 0.35, y + size * 0.40),
        (x + size * 0.50, y + size * 0.50),
        (x + size * 0.66, y + size * 0.37),
        (x + size * 0.32, y + size * 0.62),
        (x + size * 0.68, y + size * 0.63),
    ]
    draw.line([nodes[0], nodes[1], nodes[2]], fill=(103, 232, 249, 190), width=max(2, size // 26))
    draw.line([nodes[3], nodes[1], nodes[4]], fill=COLORS["teal"], width=max(2, size // 26))
    for index, (nx, ny) in enumerate(nodes):
        r = size * (0.062 if index != 1 else 0.083)
        draw.ellipse((nx - r, ny - r, nx + r, ny + r), fill=COLORS["white"] if index == 1 else COLORS["cyan"])


def canvas(title: str, subtitle: str) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGBA", SIZE, COLORS["bg"])
    draw = ImageDraw.Draw(image)
    for y in range(SIZE[1]):
        tint = min(36, y // 16)
        draw.line([(0, y), (SIZE[0], y)], fill=(9, 11 + tint // 2, 16 + tint, 255))
    for x in range(0, SIZE[0], 64):
        draw.line([(x, 0), (x, SIZE[1])], fill=(18, 36, 46, 110), width=1)
    for y in range(0, SIZE[1], 64):
        draw.line([(0, y), (SIZE[0], y)], fill=(18, 36, 46, 110), width=1)

    mark(draw, 54, 42, 64)
    draw.text((132, 48), "TruthShield", font=font(34, True), fill=COLORS["white"])
    draw.text((134, 88), "真相護盾", font=font(18, True), fill=COLORS["muted"])
    draw.text((54, 148), title, font=font(42, True), fill=COLORS["white"])
    draw_wrapped(draw, subtitle, (56, 204), 500, font(22), COLORS["muted"], 8)
    return image, draw


def draw_wrapped(draw: ImageDraw.ImageDraw, text: str, xy: tuple[int, int], max_width: int, fnt, fill, line_gap: int = 6):
    lines: list[str] = []
    current = ""
    for char in text:
        candidate = current + char
        if draw.textbbox((0, 0), candidate, font=fnt)[2] <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = char
    if current:
        lines.append(current)
    x, y = xy
    for line in lines:
        draw.text((x, y), line, font=fnt, fill=fill)
        y += fnt.size + line_gap


def browser_shell(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], url: str):
    rounded(draw, box, 18, (244, 244, 245, 255), outline=(220, 220, 225, 255), width=2)
    x1, y1, x2, _ = box
    draw.rectangle((x1, y1 + 58, x2, y1 + 60), fill=(220, 220, 225, 255))
    for i, color in enumerate([(248, 113, 113, 255), (251, 191, 36, 255), (74, 222, 128, 255)]):
        draw.ellipse((x1 + 22 + i * 22, y1 + 20, x1 + 34 + i * 22, y1 + 32), fill=color)
    rounded(draw, (x1 + 112, y1 + 14, x2 - 22, y1 + 42), 14, (255, 255, 255, 255), outline=(212, 212, 216, 255))
    draw.text((x1 + 128, y1 + 19), url, font=font(14), fill=(82, 82, 91, 255))


def text_lines(draw: ImageDraw.ImageDraw, x: int, y: int, widths: Iterable[int], color=(63, 63, 70, 255), gap: int = 20):
    for width in widths:
        rounded(draw, (x, y, x + width, y + 10), 5, color)
        y += gap


def screenshot_banner():
    image, draw = canvas(
        "新聞頁即時標記",
        "進入新聞頁時，TruthShield 只用上方橫幅提示社群共識，不遮擋閱讀內容。",
    )
    browser_shell(draw, (535, 72, 1218, 710), "news.example.tw/article/2026")
    draw.rectangle((537, 132, 1216, 166), fill=COLORS["bg"])
    mark(draw, 552, 137, 22)
    draw.text((582, 138), "TruthShield", font=font(15, True), fill=COLORS["cyan"])
    draw.text((758, 138), "85% 使用者標註：標題殺人", font=font(16, True), fill=COLORS["white"])
    draw.text((1090, 138), "投票已開放", font=font(14), fill=COLORS["muted"])
    draw.rectangle((537, 166, 1216, 710), fill=(250, 250, 250, 255))
    draw.text((584, 220), "重大政策爭議引發討論，朝野要求完整說明", font=font(28, True), fill=(24, 24, 27, 255))
    text_lines(draw, 584, 284, [520, 560, 490, 540, 420], color=(82, 82, 91, 255), gap=34)
    rounded(draw, (920, 520, 1160, 580), 30, COLORS["panel"], outline=COLORS["cyan"])
    draw.text((952, 538), "點擊橫幅查看證據", font=font(18, True), fill=COLORS["cyan"])
    save(image, "store-screenshot-01-news-banner-1280x800.png")


def screenshot_vote_panel():
    image, draw = canvas(
        "閱讀後再投票",
        "投票面板預設靠右、可拖曳、可收合；結果由投票 × 信用權重計算。",
    )
    browser_shell(draw, (508, 68, 1218, 714), "news.example.tw/article/2026")
    draw.rectangle((510, 130, 1216, 714), fill=(250, 250, 250, 255))
    text_lines(draw, 548, 190, [440, 520, 500, 470, 540, 420], color=(82, 82, 91, 255), gap=34)
    rounded(draw, (818, 104, 1192, 686), 14, COLORS["bg"], outline=(255, 255, 255, 36), width=2)
    rounded(draw, (984, 114, 1026, 130), 8, (255, 255, 255, 22))
    mark(draw, 842, 132, 30)
    draw.text((882, 135), "TruthShield", font=font(18, True), fill=COLORS["white"])
    rounded(draw, (1040, 132, 1136, 158), 6, (39, 39, 42, 255))
    draw.text((1054, 137), "可投票", font=font(14), fill=COLORS["green"])
    draw.text((842, 188), "目前加權結果", font=font(20, True), fill=COLORS["white"])
    rounded(draw, (842, 226, 1168, 286), 10, (127, 29, 29, 190), outline=(248, 113, 113, 155))
    draw.text((864, 244), "85% 使用者標註：標題殺人", font=font(20, True), fill=(254, 226, 226, 255))
    draw.text((842, 326), "閱讀門檻  42 / 30 秒", font=font(16), fill=COLORS["muted"])
    rounded(draw, (842, 358, 1168, 368), 5, (63, 63, 70, 255))
    rounded(draw, (842, 358, 1168, 368), 5, COLORS["cyan"])
    draw.text((842, 410), "選擇你的標籤", font=font(18, True), fill=COLORS["white"])
    for idx, label in enumerate(["標題殺人", "隱瞞事實", "斷章取義", "事實準確"]):
        y = 448 + idx * 42
        rounded(draw, (842, y, 1168, y + 30), 7, COLORS["panel2"], outline=(63, 63, 70, 255))
        draw.text((858, y + 6), label, font=font(15, True), fill=COLORS["cyan"] if idx == 0 else COLORS["muted"])
    rounded(draw, (842, 626, 1168, 662), 8, COLORS["cyan"])
    draw.text((936, 633), "提交或更新評分", font=font(16, True), fill=(9, 9, 11, 255))
    save(image, "store-screenshot-02-vote-panel-1280x800.png")


def screenshot_youtube():
    image, draw = canvas(
        "YouTube 新聞也能標記",
        "影音報導只顯示不干擾播放的小標，投票與證據仍在官網面板完成。",
    )
    browser_shell(draw, (510, 78, 1218, 706), "youtube.com/watch?v=news")
    draw.rectangle((512, 138, 1216, 706), fill=(15, 15, 15, 255))
    rounded(draw, (548, 176, 1028, 446), 12, (24, 24, 27, 255))
    draw.polygon([(728, 260), (728, 362), (828, 312)], fill=COLORS["red"])
    rounded(draw, (548, 472, 1018, 492), 10, (63, 63, 70, 255))
    rounded(draw, (548, 472, 810, 492), 10, COLORS["red"])
    draw.text((548, 524), "官方新聞頻道影片標題", font=font(24, True), fill=COLORS["white"])
    rounded(draw, (868, 516, 1168, 564), 24, COLORS["bg"], outline=(248, 113, 113, 155))
    mark(draw, 884, 526, 28)
    draw.text((920, 530), "85% 標註：標題殺人", font=font(17, True), fill=(254, 202, 202, 255))
    draw.text((548, 574), "TruthShield 會預收官方新聞頻道，也保留社群回報與審核。", font=font(17), fill=COLORS["muted"])
    save(image, "store-screenshot-03-youtube-badge-1280x800.png")


def screenshot_evidence():
    image, draw = canvas(
        "證據比情緒更重要",
        "使用者可附外部圖床、雲端 Drive、新聞連結或 YouTube 影片，其他人可評為有用或沒幫助。",
    )
    rounded(draw, (540, 80, 1210, 710), 20, COLORS["panel"], outline=(255, 255, 255, 28), width=2)
    draw.text((584, 126), "社群證據庫", font=font(32, True), fill=COLORS["white"])
    draw.text((584, 170), "Evidence Library", font=font(18), fill=COLORS["muted"])
    cards = [
        ("圖片截圖", "drive.google.com / 有用 24.8", COLORS["cyan"]),
        ("相關新聞連結", "cna.com.tw / 有用 18.2", COLORS["green"]),
        ("YouTube 影片", "youtube.com / 有用 12.5", COLORS["red"]),
    ]
    for i, (title, meta, color) in enumerate(cards):
        y = 230 + i * 136
        rounded(draw, (584, y, 1166, y + 104), 12, COLORS["bg"], outline=(63, 63, 70, 255))
        rounded(draw, (606, y + 22, 654, y + 70), 10, (*color[:3], 42), outline=color)
        draw.text((676, y + 24), title, font=font(22, True), fill=COLORS["white"])
        draw.text((676, y + 58), meta, font=font(16), fill=COLORS["muted"])
        rounded(draw, (1002, y + 32, 1142, y + 68), 18, (20, 83, 45, 255), outline=COLORS["green"])
        draw.text((1032, y + 40), "有用", font=font(15, True), fill=COLORS["green"])
    save(image, "store-screenshot-04-evidence-library-1280x800.png")


def screenshot_anti_abuse():
    image, draw = canvas(
        "公開的反網軍規則",
        "低閱讀秒數、短時間同向投票、重複證據與高風險帳號會被降權，規則與治理紀錄公開。",
    )
    rounded(draw, (540, 84, 1210, 708), 20, COLORS["panel"], outline=(255, 255, 255, 28), width=2)
    draw.text((584, 128), "透明治理儀表板", font=font(32, True), fill=COLORS["white"])
    metrics = [
        ("正常權重", "92%", COLORS["green"]),
        ("觀察中", "6%", COLORS["orange"]),
        ("暫停權重", "2%", COLORS["red"]),
    ]
    for i, (label, value, color) in enumerate(metrics):
        x = 584 + i * 190
        rounded(draw, (x, 200, x + 160, 294), 12, COLORS["bg"], outline=(63, 63, 70, 255))
        draw.text((x + 22, 218), value, font=font(30, True), fill=color)
        draw.text((x + 22, 258), label, font=font(15), fill=COLORS["muted"])
    rules = [
        ("閱讀門檻", "未達閱讀秒數不得產生完整權重"),
        ("協同行為偵測", "短時間大量同向投票進入審核"),
        ("證據品質", "高信用使用者可標示有用或沒幫助"),
        ("72 小時定案", "截止後凍結結果，降低長期重算成本"),
    ]
    for i, (title, desc) in enumerate(rules):
        y = 348 + i * 74
        rounded(draw, (584, y, 1166, y + 54), 10, COLORS["bg"], outline=(63, 63, 70, 255))
        draw.text((606, y + 12), title, font=font(18, True), fill=COLORS["cyan"])
        draw.text((760, y + 14), desc, font=font(16), fill=COLORS["muted"])
    save(image, "store-screenshot-05-anti-abuse-1280x800.png")


def save(image: Image.Image, filename: str):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / filename
    image.convert("RGB").save(path, optimize=True, quality=94)
    print(path.relative_to(ROOT))


def main():
    screenshot_banner()
    screenshot_vote_panel()
    screenshot_youtube()
    screenshot_evidence()
    screenshot_anti_abuse()


if __name__ == "__main__":
    main()
