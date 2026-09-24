# similar-kanji（取り込み元の記録）

- 上流URL: https://github.com/siikamiika/similar-kanji
- 取り込んだコミット: `0edcfebd5204676dec72b6b12fa26c148489bb1c`（master、2018-04-18 "more similar kanji"。上流の最終コミット）
- 取得日: 2026-09-24
- ライセンス: MIT License（Copyright (c) 2017 siikamiika）。同梱の `LICENSE` は上流の原本そのまま。
- 詳しい調査: `docs/research/similar-kanji.md`

## 同梱したファイル（すべて上流の原本を無加工でコピー）

| ファイル | sha256 | 中身 |
|---|---|---|
| `LICENSE` | `06c3b7d4828de91d21c16b577d7bfad3601a15249fa5577f38b48858dfa1754f` | 上流の MIT License 原文 |
| `cjkdecomp.json` | `7b0fb1018a977e879d00f9bd0c6cbd9dbc4ec11e3092e1a436be1111f180b222` | 似ている字のグループ 550 組（JSON の配列の配列） |
| `similar_parts.json` | `29e4d50fb388081a0a1cf9a2d29ac117b38510d894ac9a133cf4a4dec88f93b9` | 似ている部品のペア 188 組 |
| `not_similar` | `2e87702134d6ce5055c4810e115f886dac2716b01c43308c2290c4762e0271d9` | 作者が「似ていない」と判定したペア（`字:字,字,...`） |
| `not_similar_ignore` | `70d4ec125afc7807d034c00474c6110bf87f77338696d8ede1b08923ab407e03` | 削除候補を検討した結果「似ている」と残したペア（`字:字,字,...`） |

## 帰属表示

- similar-kanji — Copyright (c) 2017 siikamiika — MIT License（`LICENSE`）
- `cjkdecomp.json` は、ファイル名とコミットメッセージ（"add similar kanji from cjkdecomp"）から、
  Gavin Grover 作の CJK Decomposition Data（https://github.com/amake/cjk-decomp 、
  Apache-2.0 / LGPL-3.0 / CC BY-SA 3.0 / MIT / ODC-By 1.0 / EPL から1つ選べる）から作ったものと推定される。
  生成スクリプトは上流に無く、確証は無い。念のため帰属を記す:
  "CJK Decomposition Data, originally compiled by Gavin Grover"。

## 意図的に同梱しなかったファイル

| ファイル | sha256 | 理由 |
|---|---|---|
| `kanji.tgz_similars.ut8` | `2f80888f8c0afbf8793327cdf7dad0778f028467594183e53811b2ed461ef026` | 上流の中心データだが、元は My JWPce 同梱ファイル。My JWPce はそのデータを「kanji.free.fr から取得した」と書いており、kanji.free.fr は「© 2011 kanji.free.fr Tout droits réservés」（無断転載禁止）。現行ペアの約58%が元ファイル由来。由来側のライセンスが不明または許可されていないため |
| `book-similars.txt` | `35bfcc504a4561b4c362c9c04b5bb7f5b564cc2c5b4bd18fcf3e9e7e81765ba0` | 書名の書かれていない書籍の表を OCR したもの（gh-pages ブランチ `ocr/`）。出典とライセンスが不明なため |
| `unlisted_parts.json` | — | ツールの出力（37字）で、アプリには使わないため |
| `*.py`、`file/` | — | 作者用の編集ツール。コードは取り込まない方針のため |

上の2つが必要になったら、上記のコミット SHA から取り直せば同一のファイルが得られる（sha256 で照合できる）。
