from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "public/Assets/images/labs_logo.png"
OUT = ROOT / "public"
BG = (15, 17, 24, 255)

source = Image.open(SOURCE).convert("RGBA")
alpha = source.getchannel("A")
bounds = alpha.getbbox()
mark = source.crop(bounds) if bounds else source

def square(size: int, maskable: bool = False) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), BG)
    padding = 0.24 if maskable else 0.16
    fit = int(size * (1 - padding * 2))
    mark_copy = ImageOps.contain(mark, (fit, fit), Image.Resampling.LANCZOS)
    canvas.alpha_composite(mark_copy, ((size - mark_copy.width) // 2, (size - mark_copy.height) // 2))
    return canvas

for name, size, maskable in (
    ("favicon-16x16.png", 16, False),
    ("favicon-32x32.png", 32, False),
    ("apple-touch-icon.png", 180, False),
    ("android-chrome-192x192.png", 192, False),
    ("android-chrome-512x512.png", 512, False),
    ("android-chrome-192x192-maskable.png", 192, True),
    ("android-chrome-512x512-maskable.png", 512, True),
):
    square(size, maskable).save(OUT / name, optimize=True)

square(48).save(OUT / "favicon-48x48.png", optimize=True)
square(48).save(OUT / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])

og = Image.new("RGBA", (1200, 630), BG)
og_mark = ImageOps.contain(mark, (840, 430), Image.Resampling.LANCZOS)
og.alpha_composite(og_mark, ((1200 - og_mark.width) // 2, (630 - og_mark.height) // 2))
og.convert("RGB").save(OUT / "opengraph-image.png", optimize=True)
