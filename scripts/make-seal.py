# 表紙の落款（小齊平恒平 作）の画像を作る。使い方: python3 scripts/make-seal.py <NotoSerifJP[wght].ttf>
# 同梱フォントは使う字だけに絞っていて「齊」が無いため、原本のフォントから画像にして同梱する
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
random.seed(7)
W,H=360,504
S=4  # supersample
import sys
F=sys.argv[1]  # 原本の NotoSerifJP[wght].ttf
def font(px):
    f=ImageFont.truetype(F,px*S); f.set_variation_by_axes([900]); return f
mask=Image.new('L',(W*S,H*S),0)
d=ImageDraw.Draw(mask)
m=10*S; bw=18*S
d.rectangle([m,m,W*S-m,H*S-m],outline=255,width=bw)
inner_l, inner_r = m+bw+6*S, W*S-m-bw-6*S
inner_t, inner_b = m+bw+6*S, H*S-m-bw-6*S
# 右の列から: 小齊平／恒平作
cols=[list('小齊平'),list('恒平作')]
cw=(inner_r-inner_l)/len(cols)
for ci,chars in enumerate(cols):
    x0=inner_r-cw*(ci+1)
    n=len(chars); ch=(inner_b-inner_t)/n
    for ri,c in enumerate(chars):
        # render glyph big then scale into cell (stretch vertically for 2-char column)
        f=font(200)
        g=Image.new('L',(260*S,260*S),0); gd=ImageDraw.Draw(g)
        gd.text((130*S,130*S),c,font=f,fill=255,anchor='mm')
        g=g.crop(g.getbbox())
        gw,gh=g.size; tw=int(cw*0.96); th=int(min(ch*0.96, gh*tw/gw*(2.2 if n==2 else 1.45))); g=g.resize((tw,th),Image.LANCZOS)
        mask.paste(255,(int(x0+(cw-tw)/2),int(inner_t+ch*ri+(ch-th)/2)),g)
mask=mask.resize((W,H),Image.LANCZOS)
# stamp texture
def blob(scale, amt):
    small=Image.effect_noise((max(2,W//scale),max(2,H//scale)),amt)
    return small.resize((W,H),Image.BICUBIC)
density=blob(18,110)            # uneven ink density (large patches)
speck=Image.effect_noise((W,H),120).filter(ImageFilter.GaussianBlur(0.8))
rough=blob(3,120).filter(ImageFilter.GaussianBlur(0.8))
base=mask.filter(ImageFilter.GaussianBlur(0.8))
# rough edge: threshold blurred mask shifted by noise
edge=ImageChops.add(base.point(lambda v:v), rough.point(lambda v:0), 1, -60)
edge=ImageChops.subtract(base, rough.point(lambda v: max(0,100-v)*1.5))
edge=edge.point(lambda v:255 if v>110 else 0).filter(ImageFilter.GaussianBlur(0.7))
holes=speck.point(lambda v: 0 if v<38 else 255)
a=ImageChops.multiply(edge, holes)
dens=density.point(lambda v: int(185+70*min(1,max(0,(v-60)/140))))
alpha=ImageChops.multiply(a, dens)
red=Image.new('RGB',(W,H),(186,38,34))
out=red.copy(); out.putalpha(alpha)
pad=Image.new('RGBA',(W+24,H+24),(0,0,0,0)); pad.paste(out,(12,12)); out=pad
out=out.rotate(-1.5,resample=Image.BICUBIC,expand=True)
out.save('src/assets/cover/seal.webp','WEBP',quality=85,method=6)
print(out.size)
