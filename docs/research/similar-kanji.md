# 調査書: siikamiika/similar-kanji（似ている漢字のデータ）

- 調査日: 2026-09-24
- 対象: https://github.com/siikamiika/similar-kanji （master `0edcfebd5204676dec72b6b12fa26c148489bb1c`、2018-04-18 が最終コミット。以後は更新されていない）
- 取り込み先: `third_party/similar-kanji/`（中身と sha256 は `third_party/similar-kanji/SOURCE.md`）

## 1. 概要

「ある漢字に形が似ている漢字」を人が判定して作った、機械で読めるリスト。作者 siikamiika が 2017年1月〜2018年4月に、
既存のリスト（My JWPce 同梱ファイル、KanjiDamage の Lookalikes、書籍の表、CJK Decomposition Data）を候補として取り込み、
1ペアずつ「似ている／似ていない」を手で判定して足したり削ったりしたもの（コミット約100件の大半が "more similar kanji"）。

読み・意味は入っていない。形の類似だけを扱うので、このアプリの目的（形を見分ける力だけを鍛える）とは合う。

## 2. ライセンス（結論と根拠）

### 結論

- リポジトリ全体は **MIT License**（Copyright (c) 2017 siikamiika）。これは実物で確かめた。
  - 根拠: `LICENSE` https://github.com/siikamiika/similar-kanji/blob/0edcfebd5204676dec72b6b12fa26c148489bb1c/LICENSE
  - 追加されたのは 2017-02-07 のコミット `dc03b79`（"add MIT License"）。データファイルの多くはそれより前からある。
  - README（https://github.com/siikamiika/similar-kanji/blob/0edcfebd5204676dec72b6b12fa26c148489bb1c/README.md ）にはライセンスも出典の帰属も書かれていない。
- ただし **中心データ `kanji.tgz_similars.ut8` と `book-similars.txt` は、元データのライセンスが不明、または許可されていない** ため、取り込まなかった。
- 取り込んだのは作者が自分で作ったと言えるファイル（`similar_parts.json`、`not_similar`、`not_similar_ignore`）と、
  複数ライセンス（MIT を含む）のデータから作った `cjkdecomp.json`、それに `LICENSE`。

### ファイルごとの由来

| ファイル | 由来 | 判断 |
|---|---|---|
| `kanji.tgz_similars.ut8` | README に「My JWPce 同梱の `kanji.tgz_similars.ut8` を元に作った」とある。My JWPce のページ（https://ppcenter.webou.net/my_jwpce/ ）には「Kanjis with similar looking, grabbed from kanji.free.fr」とある。kanji.free.fr（http://kanji.free.fr/ ）のフッターは「© 2011 kanji.free.fr Tout droits réservés」（無断転載禁止）。My JWPce のページにもデータのライセンスは書かれていない。そこへ KanjiDamage の Lookalikes（`scrape_kanjidamage.py` と初期の `curated_merge.py` で取り込み。https://www.kanjidamage.com/ にもライセンス表記は見つからない）と、下の書籍・cjkdecomp の候補を、手作業の判定を通して足している | **取り込まない**。現行の 5,925 ペアのうち 3,453（約58%）は、最初のコミット `d5a18f8` にあった元ファイルのペアがそのまま残っている |
| `book-similars.txt` | コミット `dafa4c7` で追加。gh-pages ブランチの `ocr/`（`ocr_grid.py`、`crop.txt`、ページ画像4枚ぶんの OCR 結果）から見て、書名の書かれていない書籍の「似ている字」の表を OCR したもの | **取り込まない**（出典・ライセンス不明） |
| `cjkdecomp.json` | コミット `f318591`（"add similar kanji from cjkdecomp"）で追加。生成スクリプトは無い。名前から、CJK Decomposition Data（Gavin Grover 作。https://github.com/amake/cjk-decomp/blob/master/README.md 。Apache-2.0 / LGPL-3.0 / CC BY-SA 3.0 / MIT / ODC-By 1.0 / EPL の6つから1つ選べる）の部品分解を使って似た字をまとめたものと推定 | **取り込んだ**。上流 MIT に加えて元データにも MIT を選べるので問題は小さい。ただし由来は【曖昧】（推定） |
| `similar_parts.json` | 作者の手書き（`find.py` 用の「似ている部品」表） | **取り込んだ**（MIT） |
| `not_similar` | 作者が候補ペアを見て「似ていない」と答えた記録 | **取り込んだ**（MIT） |
| `not_similar_ignore` | `find.py --remove` で削除候補を見たとき「似ている（残す）」と答えた記録 | **取り込んだ**（MIT） |
| `unlisted_parts.json` | ツールの出力（KanjiVG の部品のうち、リストに無いもの 37字） | 用途が無いので取り込まない |
| `*.py`、`file/*.py` | 作者用の対話型編集ツール（Python 3）。実行には kanjidic2.xml・radkfile・KanjiVG の pickle（どれも同梱されていない）が必要 | コードは取り込まない |

参考: JWPce 本体は GPL（https://en.wikipedia.org/wiki/JWPce ）。My JWPce はその派生なので、
同梱データも GPL 扱いになるという見方もありうるが、データファイルにそう書かれたものは見つからなかった【曖昧】。

## 3. ファイル構成（上流）

```
LICENSE                 MIT
README.md               形式の説明だけ
kanji.tgz_similars.ut8  中心データ（61,910 バイト、2,902 行）          ← 取り込まず
book-similars.txt       書籍の表の OCR（JSON、131 グループ）             ← 取り込まず
cjkdecomp.json          似ている字のグループ（JSON、550 グループ）      ← 取り込み
similar_parts.json      似ている部品のペア（JSON、188 ペア）            ← 取り込み
not_similar             似ていないと判定したペア（1,873 行）            ← 取り込み
not_similar_ignore      削除せず残すと判定したペア（579 行）            ← 取り込み
unlisted_parts.json     ツールの出力
add_similar.py / remove_similar.py / validate.py / find.py / merge_list_of_lists.py
find_unlisted_parts.py / scrape_kanjidamage.py / file/*.py   編集ツール
（gh-pages ブランチ: 検索ページ index.html + script.js、書籍 OCR 用の ocr/）
```

## 4. データ形式と実例

文字コードはすべて UTF-8（BOM なし、改行は LF）。中身の漢字はすべて CJK 統合漢字の基本ブロック（U+4E00〜U+9FFF）。
`similar_parts.json` だけは部首用の文字（⺌ ⺍ ⻌ ⻖ など U+2E80 台）と 𠆢・㔾 を含む。

**kanji.tgz_similars.ut8**（取り込まず。形式は参考として記す）: 1行が1つの見出し字。`/` 区切りで、最初が見出し、残りが似ている字。行末にも `/` が付く。
```
丁/庁/打/灯/町/訂/了/才/予/汀/亭/
万/方/乃/力/刀/
```

**cjkdecomp.json**: JSON の「配列の配列」。1つの内側の配列が「互いに似ている字」のグループ（2〜10字）。
```json
[["遣","遺"], ["求","氷","永","水"], ["精","積","績"], ["坐","挫","座"]]
```

**similar_parts.json**: JSON の2字ペアの配列（向きは無い）。
```json
[["人","八"], ["刀","刂"], ["阝","⻏"], ["日","曰"], ["己","已"]]
```

**not_similar / not_similar_ignore**: 1行 `見出し:字,字,...`。末尾の改行は無い。どちらも A→B があれば B→A もある（作者のツールが両向きに書く）。
```
句:号,吊,敬,喝,喚,跨,別,像,免,吻,砲,象,回,抱
```
`not_similar` は「似ていない（使わない）」、`not_similar_ignore` は「削除候補を見たうえで似ている（残す）」の意味。

## 5. 計測結果

常用漢字の判定は KANJIDIC2（EDRDG、database_version 2026-267）の grade 1〜8（2,136字）、教育漢字は grade 1〜6（1,026字）を使った。
計測スクリプトは作業用ディレクトリで実行した使い捨てのもので、リポジトリには入れていない。

### 5.1 kanji.tgz_similars.ut8（取り込まず。比較のための参考値）

| 項目 | 値 |
|---|---|
| 見出し字 | 2,902（重複する見出しは 0） |
| 1字あたりの類似字 | 平均 4.08、中央値 4、最小 1、最大 16（林: 木森麻杜村枚朴淋休株彬校材松枝琳） |
| ペア（向きなし） | 5,925 |
| 非対称（A→B はあるが B→A が無い） | **0**（`validate.py` で直されている） |
| 自分自身を含む行、同じ行内の重複 | 0 |
| 見出しに無い字が類似字側に出てくる | 0 |
| 常用漢字の網羅 | 2,136字中 2,104字（抜けているのは 一 乙 競 極 など 32字） |
| 出てくる字の内訳 | 常用 2,104 / 人名用 641 / その他 157 |
| `not_similar` と矛盾するペア | 68 組（例: 歓↔観、玉↔住、章↔暗） |

中心データは量も質もいちばん良い。取り込まなかったのはライセンスのためだけ（2章）。

### 5.2 cjkdecomp.json（取り込み済み）

| 項目 | 値 |
|---|---|
| グループ数 | 550（大きさ: 2字=344、3字=110、4字=46、5字以上=50、最大 10） |
| 出てくる字 | 1,256 種（235字は複数のグループに出る。中身が同じグループが 2 組ある） |
| ペアに展開（向きなし） | 1,760 |
| 1字あたりの類似字（グラフにしたとき） | 平均 2.8、最大 11（且） |
| 常用漢字 / 教育漢字 / 常用外 | 1,214 / 614 / 42（乃 之 也 云 亘 など） |
| **`not_similar` で作者が「似ていない」とした候補** | **1,760 中 340 ペア**（例: 姻↔恩、忠↔沖、紫↔雌）。このファイルは未選別の候補リストだと分かる |
| `not_similar` を除いた後の常用漢字 | 類似字が 1 つ以上ある字: 1,182 / 2 つ以上: 679 / 3 つ以上: 400 / 5 つ以上: 123 |
| 同（教育漢字の中だけ） | 1 つ以上: 457 / 3 つ以上: 77 |
| 2段先（似ている字に似ている字）まで広げた常用漢字 | 3 つ以上: 658 / 5 つ以上: 368 |

例（`not_similar` を除いた後）: 待 → 侍 寺 持 時 特 等 詩。休 → 体。問・晴 → 残らない。

### 5.3 その他

- `similar_parts.json`: 188 ペア、198 種、重複なし。
- `not_similar`: 見出し 1,873、ペア 4,477（向きなし）、非対称 0。
- `not_similar_ignore`: 見出し 579、ペア 753（向きなし）。

## 6. Lv1〜Lv4 の問題自動生成への使い方（案）

取り込んだデータだけで使えるのは「`cjkdecomp.json` のペア − `not_similar` のペア」。
常用漢字に絞ると、似ている字が 3 つ以上ある字は 400 字、2段先まで広げると 658 字。4択問題を作るには足りるが、
中心データ（5.1）に比べると量はかなり少ない。

読み込みの型の案（TypeScript。アプリ本体の実装ではなく、形の提案）:

```ts
// ビルド時に third_party の生ファイルから作る、正規化済みの形
type Kanji = string;                       // 1文字（コードポイント1つ）
type SimilarGraph = ReadonlyMap<Kanji, ReadonlySet<Kanji>>; // 必ず両向き

interface SimilarSource {
  groups: Kanji[][];                       // cjkdecomp.json
  rejected: Array<[Kanji, Kanji]>;         // not_similar を展開したもの
}

// groups をペアにし、rejected を除き、許可リスト（例: 常用漢字）で絞る
declare function buildGraph(src: SimilarSource, allow: ReadonlySet<Kanji>): SimilarGraph;

interface Question {
  target: Kanji;           // 見本
  choices: Kanji[];        // 正解を含む選択肢（並びはシャッフル済み）
}
declare function pickDistractors(g: SimilarGraph, target: Kanji, n: number, rng: () => number): Kanji[];
```

- **Lv1（見本と同じ字を 1 つ選ぶ）**: `target` の隣の字から `n-1` 個。足りなければ 2段先、それでも足りなければ
  `similar_parts.json` で部品の近い字（別途 KanjiVG などの部品データが要る）か、同じ部首の字で補う。
- **Lv2（同じ字を全部選ぶ）**: マス目に `target` を複数置き、残りを隣の字で埋める。隣が少ない字は出題しないか、2段先で埋める。
- **Lv3（一瞬出して消えた字を選ぶ）**: 選択肢の作り方は Lv1 と同じ。表示時間で難しさを変える。
- **Lv4（似た字の区別）**: ペアをそのまま使う。`not_similar_ignore` のペア（作者が一度削除を検討して残したもの）は、
  「似すぎていて紛らわしい」候補として難しめに回せるかもしれない【曖昧】（そういう意図のファイルではない）。
- **Lv5（部品から組み立て）**: このデータでは作れない。部品分解は KanjiVG か cjk-decomp の本体が要る。
  `similar_parts.json` は「亻と彳」「日と曰」など、ダミー部品を選ぶのには使える。

難しさの目安として、似ている字の数（多い字ほど紛らわしい）や、教育漢字の学年（KANJIDIC2）が使える。

## 7. 注意点・未確認事項

- **中心データを取り込まなかったこと**: `kanji.tgz_similars.ut8` を使えるかどうかは法的な判断になる。「似ている字の組」が
  著作物やデータベースとして保護されるかは【曖昧】（kanji.free.fr はフランスのサイトで、EU にはデータベース製作者の権利がある）。
  使いたい場合は、kanji.free.fr や My JWPce の作者に問い合わせるか、専門家に確認すること。取り直すときは SOURCE.md の SHA と sha256 で照合できる。
- My JWPce の元ファイル（`kanji.tgz` という名前の配布物）そのものは見ていない。「kanji.free.fr から取得」は My JWPce のページの一文だけが根拠【曖昧】。
  kanji.free.fr 側に「似ている字」の機能やデータがあることは確かめられなかった。
- `cjkdecomp.json` が CJK Decomposition Data から作られたというのは、ファイル名とコミットメッセージからの推定【曖昧】。どんな規則でまとめたかも不明。
- CJK Decomposition Data は中国大陸の字形で分解している（cjk-decomp の README）。日本の字形では似て見えない組が混ざるかもしれない【曖昧】。
  これと 340 ペアの却下のため、`not_similar` を必ず差し引くこと。
- 字形は表示フォントで変わる（例: 已/己/巳、⻌の点の数）。Lv4 では、画面のフォントで本当に区別できるかを人の目で確かめたい。
- 異体字・互換漢字は入っていない（すべて基本ブロック）。ただし 𠮟（U+20B9F）のように常用漢字の中に基本ブロック外の字がある点は、
  アプリ側で文字を「1コードポイント」として扱うときに注意（JavaScript の `length` は 2 になる）。
- 上流は 2018 年から更新されていない。今後の修正は期待できない。issue の有無は確認できなかった（GitHub API に届かなかった）。
- 「似ている」は作者一人の主観で、学習者向けの難しさの検証はされていない。
