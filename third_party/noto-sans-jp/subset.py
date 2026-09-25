#!/usr/bin/env python3
"""Noto Sans JP を、常用漢字・Lv5 の部品・かな・英数字・画面の文字だけに絞った woff2 にする。

使い方（fonttools と brotli が必要）:
    pip install fonttools brotli
    python3 third_party/noto-sans-jp/subset.py <NotoSansJP[wght].ttf のパス>

出力:
    src/assets/fonts/NotoSansJP-subset.woff2（太さ 400 に固定）
    src/assets/fonts/NotoSansJP-subset.chars.txt（woff2 が実際に持つ文字の一覧。
        UTF-8・1行・コードポイント順・区切りなし。woff2 の cmap から書き出す）
画面の文言（src/i18n.tsx）を変えて新しい文字が増えたら、再実行する。
src/assets/fonts/fontCoverage.test.ts が、常用漢字と i18n.tsx の日本語の文字が
すべて chars.txt に入っているかを確かめ、足りなければ失敗する。
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
chars_out = out.with_name("NotoSansJP-subset.chars.txt")

joyo = [k["standardForm"] for k in json.loads((root / "third_party/joyo-json/joyo_kanji.json").read_text("utf-8"))]
ui_text = (root / "src" / "i18n.tsx").read_text("utf-8")
kana = [chr(c) for c in range(0x3040, 0x3100)]  # ひらがな・カタカナ
ascii_ = [chr(c) for c in range(0x20, 0x7F)]
punct = list("、。・「」『』（）！？：ー〜％　…＋")


def component_parts():
    """Lv5 で表示しうる部品（KanjiVG の部品データで、2つに分かれる字の直下の部品）"""
    kanji = json.loads((root / "third_party/kanjivg/kanjivg-joyo-components.json").read_text("utf-8"))["kanji"]
    parts = set()
    for entry in kanji.values():
        children = entry["t"].get("k") or []
        if len(children) == 2:
            parts.update(c["e"] for c in children if c.get("e") and len(c["e"]) == 1)
    return parts


font = TTFont(source)
# 部品のうち、元のフォントに字形があるものだけを入れる（無いものは Lv5 で出さない）
available = set(chr(c) for c in font.getBestCmap())
chars = sorted(set(joyo) | set(ui_text) | set(kana) | set(ascii_) | set(punct) | (component_parts() & available))

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
kept = "".join(sorted(chr(c) for c in TTFont(out).getBestCmap()))
chars_out.write_text(kept, "utf-8")
print(f"{out.relative_to(root)}: {len(kept)} chars, {out.stat().st_size} bytes")
print(f"{chars_out.relative_to(root)}: written")
