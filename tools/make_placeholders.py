import sys, os, random
from PIL import Image, ImageDraw, ImageFont
root = sys.argv[1]
def font(sz):
    for p in ["/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/Library/Fonts/Arial Bold.ttf", "/System/Library/Fonts/Helvetica.ttc"]:
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default(sz)
def save(img, rel):
    p = os.path.join(root, rel); os.makedirs(os.path.dirname(p), exist_ok=True); img.save(p)
def canvas(w, h): return Image.new("RGBA", (w, h), (0, 0, 0, 0))
def label(d, w, h, text, sz, fill=(255, 255, 255, 255)):
    f = font(sz); b = d.textbbox((0, 0), text, font=f)
    d.text(((w - (b[2]-b[0]))/2 - b[0], (h - (b[3]-b[1]))/2 - b[1]), text, font=f, fill=fill)
GOLD, DARK = (240, 180, 40, 255), (40, 25, 15, 255)

# claw: drawn pointing DOWN, attachment at top centre
for name, spread in [("claw_open", 26), ("claw_closed", 10)]:
    im = canvas(64, 80); d = ImageDraw.Draw(im)
    d.rectangle([26, 0, 38, 30], fill=(190, 190, 200, 255), outline=DARK, width=2)
    d.line([32, 28, 32 - spread, 76], fill=(220, 120, 30, 255), width=9)
    d.line([32, 28, 32 + spread, 76], fill=(220, 120, 30, 255), width=9)
    d.ellipse([24, 22, 40, 38], fill=(120, 120, 130, 255), outline=DARK, width=2)
    save(im, f"sprites/claw/{name}.png")

def circle_item(name, size, col, text=""):
    im = canvas(size, size); d = ImageDraw.Draw(im)
    d.ellipse([2, 2, size-3, size-3], fill=col, outline=DARK, width=3)
    if text: label(d, size, size, text, max(14, size//3), DARK)
    save(im, f"sprites/items/{name}.png")
circle_item("gold_s", 48, GOLD, "S")
circle_item("gold_l", 110, GOLD, "L")
circle_item("stone_s", 70, (130, 125, 120, 255), "s")
circle_item("stone_l", 140, (110, 105, 100, 255), "S")
circle_item("bag", 64, (150, 80, 190, 255), "?")
im = canvas(130, 100); d = ImageDraw.Draw(im)
d.rounded_rectangle([2, 2, 127, 97], 10, fill=(130, 75, 35, 255), outline=GOLD, width=6); label(d, 130, 100, "$$$", 30, GOLD)
save(im, "sprites/items/chest.png")
im = canvas(44, 44); d = ImageDraw.Draw(im)
d.polygon([(22, 2), (42, 22), (22, 42), (2, 22)], fill=(80, 220, 250, 255), outline=(20, 60, 90, 255), width=3)
save(im, "sprites/items/diamond.png")
im = canvas(160, 160); d = ImageDraw.Draw(im)
d.rectangle([2, 2, 157, 157], fill=(60, 55, 60, 255), outline=(20, 20, 20, 255), width=4); label(d, 160, 160, "ROCK", 32, (160, 160, 160, 255))
save(im, "sprites/items/bedrock.png")
for i, col in enumerate([(200, 70, 60, 255), (220, 90, 70, 255)]):
    im = canvas(80, 50); d = ImageDraw.Draw(im)
    d.ellipse([2, 6, 77, 47], fill=col, outline=DARK, width=3); d.ellipse([56, 14, 66, 24], fill=(255, 255, 255, 255))
    save(im, f"sprites/items/critter_{i+1}.png")

# environment
random.seed(4)
im = Image.new("RGBA", (128, 128), (74, 46, 28, 255)); d = ImageDraw.Draw(im)
for _ in range(90):
    x, y, r = random.randint(0, 127), random.randint(0, 127), random.randint(1, 4)
    c = random.choice([(60, 36, 22, 255), (92, 60, 36, 255), (55, 50, 48, 255)])
    d.ellipse([x-r, y-r, x+r, y+r], fill=c)
save(im, "sprites/env/soil_tile.png")
im = Image.new("RGBA", (720, 260), (0, 0, 0, 255)); d = ImageDraw.Draw(im)
for y in range(260):
    t = y / 259; d.line([0, y, 719, y], fill=(int(250 - 60*t), int(190 - 80*t), int(110 - 60*t), 255))
d.rectangle([0, 244, 719, 259], fill=(110, 80, 40, 255))
save(im, "sprites/env/sky.png")
for name, ang in [("winch_idle", 0), ("winch_reel", 45)]:
    im = canvas(160, 120); d = ImageDraw.Draw(im)
    d.rectangle([10, 60, 150, 118], fill=(90, 90, 100, 255), outline=DARK, width=3)
    d.ellipse([50, 10, 110, 70], fill=(170, 120, 50, 255), outline=DARK, width=3)
    d.line([80, 40, 80 + (25 if ang else 0), 40 - (25 if ang else 25) + (25 if ang else 0)], fill=DARK, width=5)
    save(im, f"sprites/env/{name}.png")

# UI
def button(name, w, h, text, col=(200, 120, 30, 255), sz=44):
    im = canvas(w, h); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 6, w-1, h-1], 24, fill=(90, 50, 15, 255))
    d.rounded_rectangle([0, 0, w-1, h-7], 24, fill=col, outline=(255, 230, 160, 255), width=4)
    label(d, w, h-7, text, sz); save(im, f"ui/{name}.png")
for n, t in [("btn_play", "PLAY"), ("btn_levels", "LEVELS"), ("btn_settings", "SETTINGS"), ("btn_resume", "RESUME"),
             ("btn_restart", "RESTART"), ("btn_next", "NEXT"), ("btn_menu", "MENU")]:
    button(n, 360, 120, t)
button("btn_back", 200, 100, "BACK", sz=36)
button("btn_reset", 360, 110, "RESET PROGRESS", (170, 50, 40, 255), 30)
button("btn_pause", 96, 96, "II", (90, 90, 110, 255), 40)
button("tile_open", 140, 140, "", (200, 120, 30, 255))
button("tile_locked", 140, 140, "X", (80, 70, 65, 255), 50)
for n, t, c in [("toggle_on", "ON", (60, 160, 70, 255)), ("toggle_off", "OFF", (110, 100, 95, 255))]:
    button(n, 160, 90, t, c, 34)
im = canvas(96, 96); d = ImageDraw.Draw(im)
d.rounded_rectangle([0, 0, 95, 95], 28, fill=(45, 30, 20, 240), outline=GOLD, width=6); save(im, "ui/panel.png")
im = canvas(64, 64); d = ImageDraw.Draw(im)
d.rounded_rectangle([0, 0, 63, 63], 16, fill=(30, 20, 12, 220)); save(im, "ui/topbar.png")
save(Image.new("RGBA", (4, 4), (0, 0, 0, 255)), "ui/dim.png")
for n, fill in [("star_empty", (70, 60, 55, 255)), ("star_full", GOLD)]:
    import math
    im = canvas(80, 80); d = ImageDraw.Draw(im)
    pts = [(40 + (36 if i % 2 == 0 else 15) * math.cos(math.radians(-90 + 36*i)), 40 + (36 if i % 2 == 0 else 15) * math.sin(math.radians(-90 + 36*i))) for i in range(10)]
    d.polygon(pts, fill=fill, outline=DARK, width=3); save(im, f"ui/{n}.png")
im = canvas(560, 200); d = ImageDraw.Draw(im)
label(d, 560, 200, "DEEP CLAW", 90, GOLD); save(im, "ui/logo.png")
print("ok")
