# 表紙の印（開発元 小齊平 恒平）の画像を作る。使い方: python3 scripts/make-seal.py <NotoSerifJP[wght].ttf>
# 同梱フォントは使う字だけに絞っていて「齊」が無いため、原本のフォントから画像にして同梱する。
# 形は利用者の見本どおり: 角の丸い縦長の二重枠、上に小さく「開発元」、その下に縦一列で「小齊平 恒平」
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

F = sys.argv[1]
W, H = 200, 672  # 仕上がりの大きさ（表示はこの1/4ほど）
S = 4  # なめらかに描くための拡大率
RED = (178, 36, 30)


def font(px, weight):
    f = ImageFont.truetype(F, px * S)
    f.set_variation_by_axes([weight])
    return f


mask = Image.new('L', (W * S, H * S), 0)
d = ImageDraw.Draw(mask)
# 外枠（太）と内枠（細）
d.rounded_rectangle([4 * S, 4 * S, (W - 4) * S, (H - 4) * S], radius=18 * S, outline=255, width=11 * S)
d.rounded_rectangle([20 * S, 20 * S, (W - 20) * S, (H - 20) * S], radius=8 * S, outline=255, width=3 * S)
cx = W * S // 2
# 上の小さな「開発元」（横書き）
d.text((cx, 62 * S), '開発元', font=font(30, 800), fill=255, anchor='mm')
# 縦一列の名前。姓と名のあいだを少し空ける
big = font(70, 900)
y = 134
for c in '小齊平':
    d.text((cx, y * S), c, font=big, fill=255, anchor='mm')
    y += 96
y += 30
for c in '恒平':
    d.text((cx, y * S), c, font=big, fill=255, anchor='mm')
    y += 96
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
