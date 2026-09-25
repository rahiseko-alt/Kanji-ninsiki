#!/usr/bin/env python3
"""Noto Serif JP（明朝体）を、画面の文言に使う文字だけに絞った woff2 にする。

使い方（fonttools と brotli が必要）:
    pip install fonttools brotli
    python3 third_party/noto-serif-jp/subset.py <NotoSerifJP[wght].ttf のパス>

出力:
    src/assets/fonts/NotoSerifJP-400.woff2 と NotoSerifJP-700.woff2（太さを固定）
    src/assets/fonts/NotoSerifJP-subset.chars.txt（woff2 が実際に持つ文字の一覧）
画面の文言（src/i18n.tsx）の日本語を変えて新しい文字が増えたら、再実行する。
src/assets/fonts/fontCoverage.test.ts が、i18n.tsx の日本語の文字がすべて入っているかを確かめる。
問題に出す漢字（見本・選択肢）はゴシック体（Noto Sans JP）のままで、この明朝体には含めない。
"""
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

root = Path(__file__).resolve().parents[2]
source = Path(sys.argv[1])
out_dir = root / "src" / "assets" / "fonts"

ui_text = (root / "src" / "i18n.tsx").read_text("utf-8")
japanese = {c for c in ui_text if ord(c) >= 0x3000}
kana = {chr(c) for c in range(0x3040, 0x3100)}
latin = {chr(c) for c in range(0x20, 0x7F)} | {chr(c) for c in range(0xA0, 0x100)}
punct = set("、。・「」『』（）！？：ー〜％　…＋›‹")
text = "".join(sorted(japanese | kana | latin | punct))

kept = None
for weight in (400, 700):
    font = instancer.instantiateVariableFont(TTFont(source), {"wght": weight})
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    font.flavor = "woff2"
    out = out_dir / f"NotoSerifJP-{weight}.woff2"
    font.save(out)
    kept = TTFont(out).getBestCmap()
    print(f"{out.relative_to(root)}: {out.stat().st_size} bytes")

chars_out = out_dir / "NotoSerifJP-subset.chars.txt"
chars_out.write_text("".join(sorted(chr(c) for c in kept)), "utf-8")
print(f"{chars_out.relative_to(root)}: {len(kept)} chars")
