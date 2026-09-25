#!/usr/bin/env python3
"""Noto Serif JP（明朝体）を、常用漢字・Lv5 の部品・かな・英数字・画面の文字だけに絞った woff2 にする。

使い方（fonttools と brotli が必要）:
    pip install fonttools brotli
    python3 third_party/noto-serif-jp/subset.py <NotoSerifJP[wght].ttf のパス>

出力:
    src/assets/fonts/NotoSerifJP-400.woff2（問題の漢字と画面の文字。太さ 400 に固定）
    src/assets/fonts/NotoSerifJP-700.woff2（太字の見出し用。画面の文字だけ。太さ 700 に固定）
    src/assets/fonts/NotoSerifJP-subset.chars.txt（400 の woff2 が実際に持つ文字の一覧。
        UTF-8・1行・コードポイント順・区切りなし。Lv5 で出せる部品の判定にも使う）
画面の文言（src/i18n.tsx）を変えて新しい文字が増えたら、再実行する。
src/assets/fonts/fontCoverage.test.ts が、常用漢字と i18n.tsx の日本語の文字が
すべて入っているかを確かめ、足りなければ失敗する。
"""
import json
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

root = Path(__file__).resolve().parents[2]
source = Path(sys.argv[1])
out_dir = root / "src" / "assets" / "fonts"

joyo = {k["standardForm"] for k in json.loads((root / "third_party/joyo-json/joyo_kanji.json").read_text("utf-8"))}
ui_text = (root / "src" / "i18n.tsx").read_text("utf-8")
japanese = {c for c in ui_text if ord(c) >= 0x3000}
kana = {chr(c) for c in range(0x3040, 0x3100)}
latin = {chr(c) for c in range(0x20, 0x7F)} | {chr(c) for c in range(0xA0, 0x100)}
punct = set("、。・「」『』（）！？：ー〜％　…＋›‹")
ui_chars = japanese | kana | latin | punct


def component_parts():
    """Lv5 で表示しうる部品（KanjiVG の部品データで、2つに分かれる字の直下の部品）"""
    kanji = json.loads((root / "third_party/kanjivg/kanjivg-joyo-components.json").read_text("utf-8"))["kanji"]
    parts = set()
    for entry in kanji.values():
        children = entry["t"].get("k") or []
        if len(children) == 2:
            parts.update(c["e"] for c in children if c.get("e") and len(c["e"]) == 1)
    return parts


# 部品のうち、元のフォントに字形があるものだけを入れる（無いものは Lv5 で出さない）
available = {chr(c) for c in TTFont(source).getBestCmap()}
texts = {
    400: "".join(sorted(ui_chars | joyo | (component_parts() & available))),
    700: "".join(sorted(ui_chars)),
}

kept = None
for weight in (700, 400):
    text = texts[weight]
    font = instancer.instantiateVariableFont(TTFont(source), {"wght": weight})
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
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
