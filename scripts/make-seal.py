# 表紙の印（開発元 小齊平 恒平）の画像を作る。使い方: python3 scripts/make-seal.py <NotoSerifJP[wght].ttf>
# 同梱フォントは使う字だけに絞っていて「齊」が無いため、原本のフォントから画像にして同梱する。
# 形: 利用者の見本の意匠（角の丸い二重枠・上に小さく「開発元」）を、題字の高さにそろえるため正方形にしたもの。
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

F = sys.argv[1]
W = H = 400  # 仕上がりの大きさ（表示はこの1/5ほど）
S = 4  # なめらかに描くための拡大率
RED = (178, 36, 30)


def font(px, weight):
    f = ImageFont.truetype(F, px * S)
    f.set_variation_by_axes([weight])
    return f


mask = Image.new('L', (W * S, H * S), 0)
d = ImageDraw.Draw(mask)
# 外枠（太）と内枠（細）
d.rounded_rectangle([5 * S, 5 * S, (W - 5) * S, (H - 5) * S], radius=26 * S, outline=255, width=16 * S)
d.rounded_rectangle([30 * S, 30 * S, (W - 30) * S, (H - 30) * S], radius=10 * S, outline=255, width=4 * S)


def glyph(c, weight):
    """字の実寸（余白を除いた形）だけを切り出す"""
    f = font(200, weight)
    g = Image.new('L', (280 * S, 280 * S), 0)
    ImageDraw.Draw(g).text((140 * S, 140 * S), c, font=f, fill=255, anchor='mm')
    return g.crop(g.getbbox())


def put(c, x0, y0, w, h, weight=900):
    """字を枠 (x0, y0, w, h) いっぱいに収める（印の字入れと同じく、枠に合わせて縦横を伸ばす）"""
    g = glyph(c, weight).resize((int(w * S), int(h * S)), Image.LANCZOS)
    mask.paste(255, (int(x0 * S), int(y0 * S)), g)


# 印面の割付（章法）: 内枠の中を右から3列に分け、読む順に「開発元」「小齊平」「恒平」。
# ・印面を字で均等に埋め、字の太さをそろえる
# ・名が2字で奇数の釣り合いが崩れるため、「恒平」は縦に伸ばして3字の列と同じ高さにする（はんこの字入れの定石）
# ・「開発元」は見本どおり小さく、右端の細い列に均等に置く
L, T, R, B = 46, 46, W - 46, H - 46
GAP = 10
small_w = 50
col_w = (R - L - small_w - GAP * 2) / 2
# 右端: 開発元（小さく、列の高さに均等に割り付けて右下が空かないようにする）
cell0 = (B - T) / 3
for i, c in enumerate('開発元'):
    size = small_w - 10
    put(c, R - small_w + 5, T + cell0 * i + (cell0 - size) / 2, size, size, 800)
# 中央: 小齊平（3字で縦いっぱい）
x = R - small_w - GAP - col_w
cell = (B - T) / 3
for i, c in enumerate('小齊平'):
    put(c, x + 4, T + cell * i + 4, col_w - 8, cell - 8)
# 左: 恒平（2字を3字分の高さに伸ばす）
x = L
cell2 = (B - T) / 2
for i, c in enumerate('恒平'):
    put(c, x + 4, T + cell2 * i + 6, col_w - 8, cell2 - 12)
mask = mask.resize((W, H), Image.LANCZOS)


# 押印のかすれ: 縁の荒れ・細かな欠け・色むら
def blob(scale, amt):
    return Image.effect_noise((max(2, W // scale), max(2, H // scale)), amt).resize((W, H), Image.BICUBIC)


rough = blob(3, 120).filter(ImageFilter.GaussianBlur(0.8))
edge = ImageChops.subtract(mask.filter(ImageFilter.GaussianBlur(0.7)), rough.point(lambda v: max(0, 95 - v) * 1.4))
edge = edge.point(lambda v: 255 if v > 105 else 0).filter(ImageFilter.GaussianBlur(0.6))
holes = Image.effect_noise((W, H), 120).filter(ImageFilter.GaussianBlur(0.8)).point(lambda v: 0 if v < 36 else 255)
dens = blob(20, 110).point(lambda v: int(200 + 55 * min(1, max(0, (v - 60) / 140))))
alpha = ImageChops.multiply(ImageChops.multiply(edge, holes), dens)
out = Image.new('RGB', (W, H), RED)
out.putalpha(alpha)
out.save('src/assets/cover/seal.webp', 'WEBP', quality=85, method=6)
print(out.size)
