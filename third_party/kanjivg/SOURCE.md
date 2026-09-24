# KanjiVG（取り込み元の記録）

| 項目 | 値 |
|---|---|
| プロジェクト | KanjiVG (Kanji Vector Graphics) |
| 公式サイト | https://kanjivg.tagaini.net/ |
| リポジトリ | https://github.com/KanjiVG/kanjivg |
| 固定したリリース | タグ `r20260714`（コミット `d95a97627fd9fe5b2c8d06ca81e38149609c0c1e`） |
| 使用ファイル | `kanjivg-20260714-main.zip`（異体字ファイルを除く SVG 6703 件） |
| ダウンロード URL | https://github.com/KanjiVG/kanjivg/releases/download/r20260714/kanjivg-20260714-main.zip |
| SHA-256 | `b5df6cd2bc249dd49b8041eb99e38ba9f8dc6b9ea57962a80084b4a315d1a7fc` |
| 取得日 | 2026-09-24 |
| 著作権者 | Ulrich Apel（README.md と各 SVG のヘッダーに記載） |
| ライセンス | Creative Commons Attribution-ShareAlike 3.0（本文は `COPYING`。https://creativecommons.org/licenses/by-sa/3.0/ ） |

調査の時点で、リポジトリの `master` HEAD は `422b5538595676da918c288a4230cb5e22a1ee7e`（2026-09-09）でした。これはタグより新しいコミットで、54 ファイルが変わっています。再現性を優先して、リリースタグの zip に固定しました。

## 常用漢字リストの出典

- Unicode Unihan データベース 18.0.0 の `Unihan_OtherMappings.txt` にある `kJoyoKanji` フィールドを使いました。値が `2010` の行（2010年告示の常用漢字表）がちょうど 2136 字です。
  - URL: https://www.unicode.org/Public/18.0.0/ucd/Unihan.zip
  - SHA-256: `4c93ea9c1f636451729a840978f1667a53886af37ba854fdcce109721c63d43e`
  - 値がコードポイントになっている 4 行は、通用字体から表内字体への対応を示すもので、常用漢字の数には含めていません（剥→剝、叱→𠮟、填→塡、頬→頰）。
- 照合として、KANJIDIC2（http://www.edrdg.org/kanjidic/kanjidic2.xml.gz 、database_version 2026-267）の `grade` 1〜8 とも比べました。2136 字が完全に一致しました。

## このディレクトリの中身

| ファイル | 内容 | コミット対象 |
|---|---|---|
| `COPYING` | KanjiVG のライセンス本文（原本のまま。タグ r20260714 の版と同一） | はい |
| `README.upstream.md` | KanjiVG の README.md（原本のまま。ライセンスの記載を含む） | はい |
| `SOURCE.md` | このファイル | はい |
| `fetch.py` | 固定版を取得・検証し、常用漢字分だけを取り出すスクリプト（Python 3 の標準ライブラリのみ） | はい |
| `kanjivg-joyo-components.json` | 常用 2136 字の部品構成ツリー（約 554 KB、gzip で約 80 KB） | はい |
| `svg/` | 常用 2136 字の SVG（原本のまま。約 8.7 MB） | いいえ（`.gitignore`） |
| `cache/` | ダウンロードした zip | いいえ（`.gitignore`） |

再生成の手順は次のとおりです。

    python3 third_party/kanjivg/fetch.py            # svg/ と JSON を作る
    python3 third_party/kanjivg/fetch.py --no-svg   # JSON だけ作る

同じ入力からは同じ出力になります。JSON の SHA-256 は `f0c01aad63beece621c9db75c4d1624b0fa98df7a2809391dee1a48941c60db5` です。

## 帰属表示の文言（アプリの「クレジット／ライセンス」画面などに載せる）

原本の SVG をそのまま使う場合の文言です。

> 漢字の字形データ: KanjiVG (https://kanjivg.tagaini.net/) © Ulrich Apel.
> Creative Commons 表示-継承 3.0 (CC BY-SA 3.0) https://creativecommons.org/licenses/by-sa/3.0/

加工したデータ（`kanjivg-joyo-components.json`、色分けや軽量化をした SVG など）を配布する場合は、次のように改変したことも明記します。

> This app uses data derived from KanjiVG (https://kanjivg.tagaini.net/), copyright Ulrich Apel,
> licensed under CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/).
> The original data has been modified (stroke paths removed / component structure re-encoded as JSON).
> The modified data is distributed under the same license.

各 SVG のヘッダーコメントには次の依頼も書かれています。

> "Attribution. You must attribute the work by stating your use of KanjiVG in your own copyright header and linking to KanjiVG's website (http://kanjivg.tagaini.net)"

## `kanjivg-joyo-components.json` について

このファイルは KanjiVG を翻案したもの（Adaptation）で、**CC BY-SA 3.0** で提供します。原本からの改変点は次のとおりです。

- 筆画のパスデータ（`d` 属性）と筆順番号の座標を削除しました。
- `<g>` 要素の入れ子と `kvg:*` 属性を、短いキー名の JSON に置き換えました。
- 各グループに、そのグループに含まれる筆画の番号範囲（`s`、1 始まりで両端を含む）を付けました。
