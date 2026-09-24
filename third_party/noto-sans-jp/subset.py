#!/usr/bin/env python3
"""Noto Sans JP を、常用漢字・かな・英数字・画面の文字だけに絞った woff2 にする。

使い方（fonttools と brotli が必要）:
    pip install fonttools brotli
    python3 third_party/noto-sans-jp/subset.py <NotoSansJP[wght].ttf のパス>

出力: src/assets/fonts/NotoSansJP-subset.woff2（太さ 400 に固定）
画面の文言（src/i18n.tsx）を変えて新しい文字が増えたら、再実行する。
"""
import json
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

root = Path(__file__).resolve().parents[2]
source = Path(sys.argv[1])
out = root / "src" / "assets" / "fonts" / "NotoSansJP-subset.woff2"

joyo = [k["standardForm"] for k in json.loads((root / "third_party/joyo-json/joyo_kanji.json").read_text("utf-8"))]
ui_text = (root / "src" / "i18n.tsx").read_text("utf-8")
kana = [chr(c) for c in range(0x3040, 0x3100)]  # ひらがな・カタカナ
ascii_ = [chr(c) for c in range(0x20, 0x7F)]
punct = list("、。・「」『』（）！？：ー〜％　…")
chars = sorted(set(joyo) | set(ui_text) | set(kana) | set(ascii_) | set(punct))

font = TTFont(source)
font = instancer.instantiateVariableFont(font, {"wght": 400})
options = subset.Options()
options.flavor = "woff2"
options.layout_features = ["*"]
options.name_IDs = ["*"]
subsetter = subset.Subsetter(options)
subsetter.populate(text="".join(chars))
subsetter.subset(font)
out.parent.mkdir(parents=True, exist_ok=True)
font.flavor = "woff2"
font.save(out)
print(f"{out.relative_to(root)}: {len(chars)} chars, {out.stat().st_size} bytes")
