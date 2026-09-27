# 表紙の印（開発元 小齊平 恒平）の画像を作る。使い方: python3 scripts/make-seal.py <NotoSerifJP[wght].ttf>
# 同梱フォントは使う字だけに絞っていて「齊」が無いため、原本のフォントから画像にして同梱する。
# 形: 利用者の見本の意匠（角の丸い二重枠・上に小さく「開発元」）を、題字の高さにそろえるため正方形にしたもの。
# 名前は右の列から縦書きで「小齊平」「恒平」
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
# 上の小さな「開発元」（横書き）
d.text((W // 2 * S, 84 * S), '開発元', font=font(42, 800), fill=255, anchor='mm')
# 名前（縦書き2列、右から）
big = font(72, 900)
STEP = 80
for x, chars, top in ((262, '小齊平', 158), (138, '恒平', 158 + STEP // 2)):
    # 2字の列は3字の列の中ほどにそろえる
    y = top
    for c in chars:
        d.text((x * S, y * S), c, font=big, fill=255, anchor='mm')
        y += STEP
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
