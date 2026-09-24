# 周辺OSSの評価（形を見分ける練習アプリ向け）

調査日: 2026-09-24。対象は、ChatGPTの調査で検索結果に出てきた周辺リポジトリ8件と、常用漢字リストを探す途中で見つけた1件（joyo-json）。
中心になる土台（similar-kanji、KanjiVG、Kakugo、Kanji Guesser）は別の担当が調べているので、ここでは扱わない。
各リポジトリは `git clone --depth 1` で取得し、README・LICENSE・データ・主要なコードを実際に読んだ。確証の無い点には【曖昧】と付けた。

## 結論

- **常用漢字 2136 字のリスト**: [hoffmannjp/joyo-json](https://github.com/hoffmannjp/joyo-json)（MIT）を取り込んだ。2136件で重複は無い。kanjidist-visualiser が持つ常用漢字の集合と完全に一致し、𠮟・塡・剝・頰 は表の通りの字体で入っている。
- **似ている字の距離**: [kanjidist-visualiser](https://github.com/lennart-finke/kanjidist-visualiser)（MIT）の JSON を3種類取り込んだ。この調査で一番の収穫。選択肢に混ぜる紛らわしい字を選ぶのにそのまま使える。
- **出題順と部品グラフ**: [topokanji](https://github.com/scriptin/topokanji)（MIT を含む選択式のライセンス）のリストと部品グラフを取り込んだ。
- **コピーしないもの**: kanjistat と radically は GPL。niteru と kanji-data はリポジトリ自体は許諾的だが、中のデータが KANJIDIC（CC BY-SA）など別ライセンスのものを含む。kanji-drill にはライセンスが無い。japanese-codepoints には常用漢字のリストが無い。

## 比較表

| リポジトリ | 何か | ライセンス（実物で確認） | 本アプリでの使い道 | 推奨 | 取り込み |
|---|---|---|---|---|---|
| [scriptin/topokanji](https://github.com/scriptin/topokanji) | 部品が先に来るように並べた漢字リスト（2310字）と、字→部品のグラフ | LICENSE ファイルは無い。[README の License 節](https://github.com/scriptin/topokanji/blob/cd04afc2c4335336c9243b8aef01c0d2a69c3009/README.md#license)と package.json で Apache-2.0+ / CC-BY-4.0+ / EPL / LGPL / MIT から選べると宣言 | 出題順、Lv5 の部品、画数による難易度 | 採用（出題順の参考として） | `third_party/topokanji/` |
| [dschuhmacher/kanjistat](https://github.com/dschuhmacher/kanjistat) | 形の距離を計算する R パッケージ（Optimal Transport、stroke edit、bag-of-radicals） | GPL-3 以降（[LICENSE.md](https://github.com/dschuhmacher/kanjistat/blob/main/LICENSE.md)、[DESCRIPTION](https://github.com/dschuhmacher/kanjistat/blob/main/DESCRIPTION)） | 距離の考え方と出典の手がかり。計算済みの値は下の visualiser から取れる | 参照のみ | しない（GPL） |
| [ktfleming/niteru](https://github.com/ktfleming/niteru) | 似た字の検索（Scala と React）。画の編集距離 | Apache-2.0（[LICENSE](https://github.com/ktfleming/niteru/blob/master/LICENSE)）。ただし中のデータは KANJIDIC（CC BY-SA）と出典不明の `stroke_ulrich` | 画の編集距離の算法を参考にする | 参照のみ | しない（データのライセンスが混ざっている） |
| [lennart-finke/kanjidist-visualiser](https://github.com/lennart-finke/kanjidist-visualiser) | kanjidist.org の中身。3種類の距離で常用漢字ごとに近い字を並べた JSON | MIT（[LICENSE](https://github.com/lennart-finke/kanjidist-visualiser/blob/master/LICENSE)） | 選択肢に混ぜる紛らわしい字の選択、類似度、難易度 | **採用（最優先）** | `third_party/kanjidist-visualiser/` |
| [bagustris/kanji-drill](https://github.com/bagustris/kanji-drill) | 読みを問う PWA の漢字ドリル（素の JS、Service Worker） | **ライセンスファイルが無い**。データは CC BY-SA と CC BY（[CREDITS.md](https://github.com/bagustris/kanji-drill/blob/main/CREDITS.md)） | PWA の構成と、学習者ごとの混同記録の設計を参考にする | 設計の参考のみ | しない（ライセンス無し） |
| [davidluzgouveia/kanji-data](https://github.com/davidluzgouveia/kanji-data) | KANJIDIC・JLPT・WaniKani をまとめた JSON | MIT（[LICENSE](https://github.com/davidluzgouveia/kanji-data/blob/master/LICENSE)）。ただし中身の大半は KANJIDIC（CC BY-SA 4.0）と WaniKani 由来 | 学年と画数のメタデータ | 不採用（データの権利が MIT で済まない） | しない |
| [Radically/radically](https://github.com/Radically/radically) | IDS を使った部品検索の PWA（React） | 生成データとアプリは GPL-2.0 以降（[README の Licenses 節](https://github.com/Radically/radically#licenses)）。LICENSE.MIT もあるが「将来 MIT にしたい」段階 | 部品を展開する算法、PWA のキャッシュ容量の教訓 | 参照のみ | しない（GPL） |
| [yoshisuproject/japanese-codepoints](https://github.com/yoshisuproject/japanese-codepoints) | JIS X 0201/0208/0213 の文字集合を持つ Rust の入力検証ライブラリ | MIT または Apache-2.0（[LICENSE-MIT](https://github.com/yoshisuproject/japanese-codepoints/blob/master/LICENSE-MIT)） | **常用漢字のリストは無い**。JIS の範囲検証にしか使えない | 不採用 | しない |
| （追加）[hoffmannjp/joyo-json](https://github.com/hoffmannjp/joyo-json) | 常用漢字表 2136 字の JSON（通用字体・旧字体・許容字体・音訓） | MIT（[LICENSE](https://github.com/hoffmannjp/joyo-json/blob/main/LICENSE)） | 出題対象の字種リスト | **採用** | `third_party/joyo-json/` |

## 各リポジトリ

### scriptin/topokanji

- **何か**: 「どの字も、その部品より後に出てくる」ように並べた漢字リスト。部品で有向非巡回グラフを作り、Kahn 法でトポロジカル順に並べる。同じ順位の字の間では、出現頻度が高い字を先にする（[README の Algorithm 節](https://github.com/scriptin/topokanji#algorithm)）。
  - 依頼には「部品の少ない順」とあったが、実際は**部品が先に来る順＋頻度の高い順**であり、部品の数で並べたものではない。
- **データ**:
  - `lists/{aozora,news,twitter,wikipedia,all}.{txt,json}`: 2310字で、並び順だけが違う。
  - `dependencies/1-to-N.json`: `{字: [部品...]}`。
  - `data/kanji.json`: `[字, 画数, 常用的か]`。
  - 丨・丶・亻 のような部品も独立した項目として入っている。
- **ライセンス**: LICENSE ファイルは無い。README と `package.json` で `(Apache-2.0+ OR CC-BY-4.0+ OR EPL-1.0+ OR LGPL-3.0+ OR MIT)` と宣言している。取り込みでは MIT を選び、README の該当箇所をそのまま写した `LICENSE` を同梱した。
- **使い道**:
  - 出題順の骨組みにする。例えば、口と木を見分けられるようになってから 呆・杏 を出す。
  - Lv5「部品から組み立て」の正解となる部品集合に使う。
  - 画数を難易度の特徴量の一つにする。
- **注意**:
  - 常用漢字のうち 36 字がリストに無い（𠮟 塡 剝 頰 倹 劾 塑 墾 弔 恣 憬 摯 朕 楷 款 氾 沃 璽 畝 痘 緻 繭 舷 蚕 衷 訃 詔 諮 謁 謄 迭 遵 酪 錮 陪 頒）。本アプリで使うときは、この 36 字を補う必要がある。
  - 部品の分解は CJK Decompositions Data（`data/cjk-decomp-0.4.0.txt`）を上流で修正したもの。その元データのライセンスを実物のファイルで確かめられなかった【曖昧】。元のサイト cjkdecomp.codeplex.com は閉鎖されている。
  - 頻度で並べているので、「形が単純な順」とは一致しない。形の練習の順番に使うなら、画数や部品数で並べ直す必要がある【曖昧：教育的にどちらが良いかは未検証】。
- **推奨**: 採用。出題順と部品グラフの**初期値**として使い、学校のカリキュラムに合わせて上書きできるようにする。

### dschuhmacher/kanjistat

- **何か**: 漢字の統計解析をする R パッケージ。KanjiVG の筆画から `kanjivec` を作り、Optimal Transport で部品を対応させた距離 `kanjidist()` を計算する（[README](https://github.com/dschuhmacher/kanjistat#readme)、論文 [arXiv:2304.02493](https://arxiv.org/abs/2304.02493)）。stroke edit 距離と bag-of-radicals 距離の計算済み行列も持っている。
- **ライセンス**: GPL-3 以降。同梱データの権利は次の通りで、多くが継承条件付き（[README の Attribution 節](https://github.com/dschuhmacher/kanjistat#attribution-of-prior-work)）。
  - `kbase`・`kmorph`・`kreadmean`: KANJIDIC2・RADKFILE・Kanjium 由来で、CC BY-SA 4.0。
  - `fivebetas`: KanjiVG 由来で、CC BY-SA 3.0。
  - `dstrokedit`・`dyehli`: Lars Yencken の [kanji-confusion データセット](https://lars.yencken.org/datasets/kanji-confusion)由来で、**CC BY 3.0**。
- **重要な発見**:
  - `data-raw/kanjiexp_judgements.yaml.gz` と `poolexp_judgements.yaml.gz` は、**人が「この2字は紛らわしいか」を判定したデータ**。Yencken の実験によるもので、上流は CC BY 3.0。
  - 選択肢に混ぜる字の選び方が妥当かを確かめる基準として非常に有用。ただし GPL のリポジトリの中にあるファイルなので、ここからはコピーしない。**上流の lars.yencken.org から直接取るべき**。取れるかどうかは未確認【曖昧】。
- **使い道**: 距離の設計の根拠にする。本アプリは JS/TS なので、R のコードは使わない。計算済みの値は kanjidist-visualiser の MIT の JSON から取れる。
- **推奨**: 参照のみ。コピーしない。

### ktfleming/niteru

- **何か**:
  - 字を入力すると形の似た字を返す Web アプリ。バックエンドは Scala/Play、フロントエンドは React/Redux。
  - 最終コミットは 2017 年。
  - 画の種類の並び（`data/stroke_ulrich`、例 `中,3,11b,2b,3`）の Levenshtein 距離を、元の字の画数で割って類似度にしている（[app/kanji/Kanji.scala](https://github.com/ktfleming/niteru/blob/master/app/kanji/Kanji.scala)）。
  - Yencken の [SimSearch](https://github.com/larsyencken/simsearch) と同じ方法。
- **ライセンス**: Apache-2.0。ただし次のデータは Apache の範囲外になる可能性がある。
  - `data/kanjidic_comb_utf8_fixed` は KANJIDIC で、CC BY-SA。
  - `data/stroke_ulrich` は出典が書かれていない。名前から Ulrich Apel（KanjiVG の作者）のデータと推測されるが、未確認【曖昧】。
- **使い道**: 画の編集距離という考え方の確認にとどめる。同じ距離の計算済みの値は kanjidist-visualiser の `dstrokedit.json` にある。
- **推奨**: 参照のみ。コピーしない。

### lennart-finke/kanjidist-visualiser

- **何か**: [kanjidist.org](https://www.kanjidist.org/) の静的サイト（d3.js）。中心の字の周りに近い字を並べて表示する。
- **データ**（`data/*.json`、形式は `{"nearest": {字: {近い字: 距離}}, title, description, scaleBy, inverted}`）:
  - `dkanjistat.json`: 常用漢字 2136 字それぞれに近い字が 2〜58 個。Optimal Transport による距離で、値の範囲は 0.0095〜0.2493。
  - `dstrokedit.json`: 1940 字（2010年改定前の常用漢字が元）。Yencken & Baldwin の画の編集距離。
  - `dbagofradicals.json`: 1940 字。Yeh & Li の共有部品の割合。
  - `dembeddings.json`: **意味の近さ**なので本アプリでは使わない（読みや意味は教えない方針のため）。
- **ライセンス**: MIT（Copyright 2024 Lennart Finke & Dominic Schuhmacher）。
- **サンプルの確認**: 距離によって得意な組が違う。1つだけに頼らず、組み合わせるべき。

  | 字 | kanjistat 距離（OT） | stroke edit 距離 |
  |---|---|---|
  | 未 | 本 .017、末 .027、朱、来、木 | 末 .001、朱 .168 |
  | 土 | 主、吐、圧、去 …… **士が入っていない** | 士 .001、工 .001 |
  | 人 | 今、介、以 …… **入が入っていない** | 入 .001、八 .001 |
  | 日 | 白 .054、旧、旦、由 | 目 .201、田 .201 |

  - OT による kanjistat 距離は、部品の位置が似ているかをよく捉える。一方、土/士 や 人/入 のように**画数の少ない、紛らわしい組を取りこぼす**ことがある。
  - stroke edit 距離はそうした組を拾えるが、値が 0.001・0.201 のように数段階にしか分かれず、順位を付けにくい。
- **使い道**:
  - Lv1/Lv2 で、選択肢に混ぜる字の候補を出す。
  - Lv4 で、似ている字の組を作る。
  - 距離の値で難易度を調整する。
- **注意**:
  - dstrokedit と dbagofradicals の元データは Yencken のもの（CC BY 3.0）。**帰属表示が必要**。
  - dkanjistat は KanjiVG（CC BY-SA 3.0）の筆画から計算した数値。数値だけでも継承条件が及ぶかどうかには確証が無い【曖昧】。公開する前に判断する。
- **推奨**: **採用（最優先）**。3つのファイルを取り込んだ。

### bagustris/kanji-drill

- **何か**:
  - 日本の小学校の方式にならって、読みと語を練習する PWA。素の JS で作られている。
  - 最終コミットは 2026-09-22 で、開発が続いている。
  - Service Worker（`sw.js`）は、指定したファイルを事前にキャッシュし、stale-while-revalidate で配信する。`manifest.json` は SVG アイコン1つだけの最小構成。
- **ライセンス**:
  - リポジトリに **LICENSE ファイルが無い**ので、コードは著作権者の許可なく使えない。
  - データは CREDITS.md によれば JMdict/KANJIDIC（CC BY-SA 4.0）と Kanji alive（CC BY 4.0）。
- **参考になる設計**（[README の Adaptive Distractor Generation 節](https://github.com/bagustris/kanji-drill#adaptive-distractor-generation)）:
  - 学習者が実際に間違えて選んだ選択肢を問題ごとに `confusions` として記録し、次に出す紛らわしい選択肢の重みに加える。
  - 同じ点数の候補が多いときは、問題と字の組から決まる決定的な方法で順位を付ける。そうしないと毎回同じ字が選択肢に出て、消去法で正解が分かってしまう。README はこの不具合を修正した経緯を記録している。
  - ただし選択肢の特徴量は**読みと意味**が中心で、形は使っていない。本アプリでは、特徴量を上の形の距離に置き換えれば同じ設計の枠組みが使える。
- **推奨**: 設計の考え方だけを参考にする。コードもデータもコピーしない。

### davidluzgouveia/kanji-data

- **何か**: KANJIDIC の画数・学年・頻度・意味・読み、JLPT の級（旧・新）、WaniKani の情報を1つにまとめた JSON。
  - `kanji.json`（5.5MB）、`kanji-jouyou.json`（2136字）、`kanji-kyouiku.json`（1006字）がある。
- **ライセンス**: MIT。しかし次の理由で、MIT だけでは済まない。
  - 中身の大半は KANJIDIC（CC BY-SA 4.0）の変換。
  - WaniKani の情報は WaniKani API から取ったもので、利用規約の制約がある【曖昧】。
  - JLPT の級は tanos.co.uk の非公式データ。
- **重要な発見**:
  - 常用漢字の字体が KANJIDIC に合わせてあり、**叱・剥 は常用漢字表の字体（𠮟・剝）ではない**。一方で 塡・頰 は表の字体になっていて、揃っていない。
  - 教育漢字は 1006 字で、**2020年の学年別漢字配当表（1026字）より前の版**になっている。
  - 学年のデータとしてそのまま使うのは不適切。
- **推奨**: 不採用。学年のデータが必要になったら、文部科学省の配当表から自分で作る方が権利関係もすっきりする【曖昧：配当表は告示の一部なので著作権は無いと考えられる】。

### Radically/radically

- **何か**: CHISE の IDS（漢字の構成を表す記述列）を使った部品検索の PWA（React、Web Worker）。README では、部品を再帰的に展開して「人を3つ以上含む字」のような検索を実現する算法を説明している。
- **ライセンス**: README に `SPDX-License-Identifier: GPL-2.0-or-later` とある。生成した JSON は CHISE と Kanji Database Project（GPLv2）に由来する。`LICENSE.MIT` もあるが、README には「将来 MIT でも出したい」とあるだけで、今は GPL と読むべき。
- **参考になる点**:
  - PWA のキャッシュが大きくなり過ぎる問題。「Apple の Service Worker のキャッシュは 50MB まで」なので、データを分割・圧縮したと README に書かれている。上限の数字は未確認【曖昧】。KanjiVG の SVG を全部オフラインで持つと同じ問題に当たるので、設計の段階で考えておく。
  - IDS を使えば、Lv5 の部品を KanjiVG 以外からも取れる。ただし CHISE は GPL。部品のデータは、別担当が調べる KanjiVG の分解か、上の topokanji で揃える方が良い。
- **推奨**: 参照のみ。コピーしない。

### yoshisuproject/japanese-codepoints

- **何か**: TERASOLUNA の codepoints を Rust に移植したもの。JIS X 0201、0208（非漢字、第1・第2水準漢字 6355字）、0213（第1〜第4水準 10050字）のコードポイントを Rust のソースに直接書き込んで持っている。
- **ライセンス**: MIT または Apache-2.0（LICENSE-MIT と LICENSE-Apache がある）。
- **重要な発見**: **常用漢字や教育漢字のリストは入っていない**（リポジトリ全体を jouyou・joyo・常用 で検索しても見つからなかった）。依頼にあった「常用漢字等の字種リスト」という説明は誤り。データは Rust のコードとして書かれていて、データファイルでもない。
- **推奨**: 不採用。

### （追加）hoffmannjp/joyo-json

- **何か**: 常用漢字表（平成22年内閣告示第2号）を JSON にしたもの。上の8件に常用漢字のリストが無かったので、GitHub で検索して見つけた。
  - `joyo_kanji.json` は2136件の配列。各要素は `standardForm`・`oldForm`・`altForm`・`readingsOn`・`readingsKun` を持つ。
  - 付表（`joyo_additional_table.json`）もある。
- **ライセンス**: MIT（Copyright 2021 Benjamin Hoffmann）。元の常用漢字表は告示なので、著作権法13条により著作権の対象にならない。
- **検証**:
  - 2136件、重複なし、すべて1文字。
  - `altForm` は 𠮟→叱、塡→填、剝→剥、頰→頬 の4件で、表の許容字体と一致する。
  - 旧字体は392件に入っている。
  - 独立した出典である kanjidist-visualiser の常用漢字の集合と完全に一致した。
- **使い道**: 出題対象の字種の正本にする。本アプリは読みを出さないので、`readings*` は使わない。
- **推奨**: **採用**。
- **その他の候補**: 同じ検索で [Tsukinatsune/Daily-use-Japanese-letter](https://github.com/Tsukinatsune/Daily-use-Japanese-letter)（CC0）も見つけた。しかし1ファイルが数MBあり、KanjiVG 由来と思われる筆順のデータ（`Kvg-order/`）も含む。CC0 と表示しながら、元データの継承条件が守られていない可能性がある【曖昧】ので、見送った。

## 取り込んだもの（`third_party/`）

| ディレクトリ | ファイル | サイズ | 上流のコミット |
|---|---|---|---|
| `third_party/joyo-json/` | `joyo_kanji.json`, `LICENSE`, `SOURCE.md` | 約0.8MB | `6b76bf6e9b286265a597e370cd01d38d856ce606` |
| `third_party/kanjidist-visualiser/` | `data/dkanjistat.json`, `data/dstrokedit.json`, `data/dbagofradicals.json`, `LICENSE`, `SOURCE.md` | 約1.4MB | `3819425ea35926c2ed1979b85a71269ef14ccb63` |
| `third_party/topokanji/` | `lists/aozora.{json,txt}`, `dependencies/1-to-N.json`, `data/kanji.json`, `LICENSE`（README から写したもの）, `SOURCE.md` | 約0.14MB | `cd04afc2c4335336c9243b8aef01c0d2a69c3009` |

データファイルはすべて上流の原本と同じであることを `cmp` で確かめた。取得日は 2026-09-24。

## 次に判断が要ること

1. **dkanjistat.json を公開してよいか**。KanjiVG から計算した距離の数値に、CC BY-SA の継承条件が及ぶかどうかを判断する。
2. **Yencken の人手判定データ（CC BY 3.0）を上流から取るか**。選択肢に混ぜる字の品質を確かめる基準として使える。
3. **出題順の方針**。topokanji の「部品が先で、頻度の高い順」をそのまま使うか、画数や部品数で並べ直すか。学校のカリキュラム（学年別漢字配当表）とどう合わせるかも決める。
