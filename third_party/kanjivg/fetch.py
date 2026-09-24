#!/usr/bin/env python3
"""Fetch a pinned KanjiVG release and extract the Joyo kanji subset.

Python 3 standard library only. Run from anywhere:

    python3 third_party/kanjivg/fetch.py            # SVGs + components JSON
    python3 third_party/kanjivg/fetch.py --no-svg   # components JSON only

What it does
  1. Downloads (and caches in ./cache/) the pinned KanjiVG release
     "kanjivg-20260714-main.zip" (tag r20260714) and the pinned Unicode
     Unihan database (Unicode 18.0.0), verifying SHA-256 for both.
  2. Builds the Joyo kanji list (2136 chars) from Unihan's kJoyoKanji field
     (entries whose value is "2010"; entries whose value is a code point are
     the popular variant forms, e.g. U+5265 -> U+525D, and are skipped).
  3. Copies the 2136 Joyo SVGs, unmodified, to ./svg/ (git-ignored).
  4. Writes ./kanjivg-joyo-components.json: character -> component tree.

Output JSON (an Adaptation of KanjiVG, CC BY-SA 3.0; see SOURCE.md):
  {"meta": {...}, "kanji": {"侍": {"n": 8, "t": NODE}, ...}}
  NODE = {"e": element, "s": [firstStroke, lastStroke],   (1-based, inclusive)
          "p": position, "r": radical, "v": 1 (variant), "o": original,
          "pt": part, "pa": 1 (partial), "ph": phon, "nb": number,
          "tf": tradForm, "rf": radicalForm, "k": [child NODE, ...]}
  Keys other than "s" are present only when the source SVG has them.
  Groups without kvg:element are kept (no "e") so stroke ranges stay exact.
"""
import argparse
import hashlib
import io
import json
import os
import shutil
import sys
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))

KANJIVG_TAG = "r20260714"
KANJIVG_COMMIT = "d95a97627fd9fe5b2c8d06ca81e38149609c0c1e"
KANJIVG_URL = ("https://github.com/KanjiVG/kanjivg/releases/download/"
               "r20260714/kanjivg-20260714-main.zip")
KANJIVG_SHA256 = "b5df6cd2bc249dd49b8041eb99e38ba9f8dc6b9ea57962a80084b4a315d1a7fc"

UNIHAN_URL = "https://www.unicode.org/Public/18.0.0/ucd/Unihan.zip"
UNIHAN_SHA256 = "4c93ea9c1f636451729a840978f1667a53886af37ba854fdcce109721c63d43e"

JOYO_COUNT = 2136

ATTR_KEYS = [  # KanjiVG attribute -> short JSON key
    ("element", "e"), ("position", "p"), ("radical", "r"), ("variant", "v"),
    ("original", "o"), ("part", "pt"), ("partial", "pa"), ("phon", "ph"),
    ("number", "nb"), ("tradForm", "tf"), ("radicalForm", "rf"),
]
BOOL_KEYS = {"variant", "partial"}


def fetch(url, sha256, cache_dir):
    os.makedirs(cache_dir, exist_ok=True)
    path = os.path.join(cache_dir, url.rsplit("/", 1)[1])
    if not os.path.exists(path):
        print("downloading", url, file=sys.stderr)
        with urllib.request.urlopen(url) as r, open(path + ".part", "wb") as f:
            shutil.copyfileobj(r, f)
        os.replace(path + ".part", path)
    with open(path, "rb") as f:
        digest = hashlib.sha256(f.read()).hexdigest()
    if digest != sha256:
        sys.exit("SHA-256 mismatch for %s: got %s" % (path, digest))
    return path


def joyo_codepoints(unihan_zip):
    cps = []
    with zipfile.ZipFile(unihan_zip) as z:
        with z.open("Unihan_OtherMappings.txt") as f:
            for line in io.TextIOWrapper(f, encoding="utf-8"):
                parts = line.rstrip("\n").split("\t")
                if len(parts) == 3 and parts[1] == "kJoyoKanji" and parts[2] == "2010":
                    cps.append(int(parts[0][2:], 16))
    if len(cps) != JOYO_COUNT:
        sys.exit("expected %d Joyo kanji, got %d" % (JOYO_COUNT, len(cps)))
    return sorted(cps)


def local(tag):
    """Strip any XML namespace ('{uri}name' -> 'name')."""
    return tag.rsplit("}", 1)[-1]


def build_node(g, counter):
    node = {}
    attrs = {local(k): v for k, v in g.attrib.items()}
    for src, key in ATTR_KEYS:
        if src in attrs:
            node[key] = 1 if src in BOOL_KEYS and attrs[src] == "true" else attrs[src]
    first = counter[0] + 1
    kids = []
    for child in g:
        name = local(child.tag)
        if name == "path":
            counter[0] += 1
        elif name == "g":
            kids.append(build_node(child, counter))
    node["s"] = [first, counter[0]]
    if kids:
        node["k"] = kids
    return node


def parse_svg(data, cp):
    root = ET.fromstring(data)
    want = "kvg:%05x" % cp
    for g in root.iter():
        if local(g.tag) == "g" and g.get("id") == want:
            counter = [0]
            tree = build_node(g, counter)
            return {"n": counter[0], "t": tree}
    raise ValueError("no top group %s" % want)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--cache", default=os.path.join(HERE, "cache"))
    ap.add_argument("--svg-out", default=os.path.join(HERE, "svg"))
    ap.add_argument("--json-out", default=os.path.join(HERE, "kanjivg-joyo-components.json"))
    ap.add_argument("--no-svg", action="store_true", help="skip copying SVG files")
    args = ap.parse_args()

    kvg_zip = fetch(KANJIVG_URL, KANJIVG_SHA256, args.cache)
    unihan_zip = fetch(UNIHAN_URL, UNIHAN_SHA256, args.cache)
    cps = joyo_codepoints(unihan_zip)

    if not args.no_svg:
        os.makedirs(args.svg_out, exist_ok=True)
    out = {}
    with zipfile.ZipFile(kvg_zip) as z:
        for cp in cps:
            name = "kanji/%05x.svg" % cp
            data = z.read(name)  # KeyError here means the release lacks a Joyo kanji
            if not args.no_svg:
                with open(os.path.join(args.svg_out, "%05x.svg" % cp), "wb") as f:
                    f.write(data)
            out[chr(cp)] = parse_svg(data, cp)

    doc = {
        "meta": {
            "source": "KanjiVG %s (commit %s), kanjivg-20260714-main.zip" % (KANJIVG_TAG, KANJIVG_COMMIT),
            "sourceUrl": "https://kanjivg.tagaini.net/",
            "copyright": "KanjiVG, copyright Ulrich Apel (as stated in upstream README.md and SVG headers)",
            "license": "CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/)",
            "modified": "Derived: stroke paths removed; group hierarchy and kvg:* attributes "
                        "re-encoded as JSON with 1-based stroke ranges. See third_party/kanjivg/SOURCE.md.",
            "joyoList": "Unicode Unihan 18.0.0 kJoyoKanji (value 2010)",
            "keys": dict({k: s for s, k in ATTR_KEYS}, s="strokeRange", k="children",
                         n="strokeCount", t="tree"),
            "count": len(out),
        },
        "kanji": out,
    }
    with open(args.json_out, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    print("wrote %d kanji to %s" % (len(out), args.json_out), file=sys.stderr)


if __name__ == "__main__":
    main()
