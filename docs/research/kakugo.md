# Kakugo 調査メモ（設計の把握）

- 対象: https://github.com/blastrock/kakugo （アプリID `org.kaqui`）
- 調査時点のコミット: `fb333c0f8f8e5f178a2969b0e247eaf38885969a`（master の HEAD、2026-09-18「Bump version」、versionName 1.46）
- 以下の Kakugo へのリンクはすべてこのSHAに固定している（行番号つき）。リンクの基点は
  `https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/` 。
- 方針: **Kakugo のソースコードは一切コピーしていない**。本文は自分の言葉による説明と、自作の疑似コードだけで書いた。数値の定数（0.34 など）は、仕組みを説明するための事実として記載している。
- データファイル（`app/src/main/res/raw/dict`）の中身は、構造と統計を確かめるために手元で展開して見ただけで、本リポジトリには何も持ち込んでいない。

---

## 0. 結論の要約

| 項目 | 結論 |
|---|---|
| コードのライセンス | **GPL-3.0-or-later**（実物を確認）。コードは流用できない。仕組みを理解して作り直すことだけを行う |
| 同梱データ `dict` | 上流のデータ（EDRDG、KanjiVG など）を作者が加工して1つにまとめた SQLite。**生成スクリプトは公開されていない**。GPL のリポジトリで配られている加工物なので、**そのまま取り込むのは不可**。代わりに上流から直接取得すれば使えるものが多い（§7） |
| 本アプリに役立つ仕組みの上位3つ | ① 誤答候補に似た字を優先して入れる方式と、選んでしまった誤答の字も「弱い」とみなす減点 ② 短期と長期の2つのスコアで重みを付けて抽選する、ペースに合わせる間隔反復 ③ 部品の組み立てテスト（9マスの複数選択。誤答候補は「似た字の部品 → 同じ部品を含む字の部品 → 無関係」の順に層を重ねて選ぶ） |

---

## 1. ライセンスの確認（最初に確認した）

| 確認箇所 | 結果 | 根拠 |
|---|---|---|
| LICENSE | GNU GPL Version 3 の全文（674行、標準の文面と一致） | [LICENSE L1-L2](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/LICENSE#L1-L2) |
| README の License 節 | 「バージョン3、またはそれ以降」と明記しているので **GPL-3.0-or-later** | [README.rst L57-L60](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/README.rst#L57-L60) |
| アプリ内の About 画面 | 「GPLv3 で公開」と表示している | [strings.xml L166](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/res/values/strings.xml#L166) |
| ソースファイル単位のライセンス表記 | 無い（`app/src` を検索しても GPL の見出しは見つからなかった）。リポジトリ全体が GPL の扱いになる | — |
| データの出典（Credits） | kanjidic、JMdict、jpdb、Niai、similar-kanji、Yencken の研究、KanjiVG、Jonathan Waller（JLPT）を挙げている。**各データのライセンスは書いていない** | [README.rst L45-L55](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/README.rst#L45-L55) |

GPL に関する注意: GPL のコードを本アプリに写すと、配布するアプリ全体に GPL の義務（ソースの公開など）が及ぶ。本メモでは、アルゴリズムを自分の言葉と疑似コードで説明するだけにとどめる。アイデアやアルゴリズムそのものは著作権で保護されない、という一般的な理解に基づいている。ただし疑似コードも Kakugo の構造を写しすぎないように、本アプリ向けに組み替えて書いた。

---

## 2. リポジトリ構成・言語・ビルド

### 2.1 概要

- Android アプリ。言語は **Kotlin**、UI は **Jetpack Compose**（設定画面などに旧来の View が一部残っている）。データは端末内の **SQLite**。ネットワークは使わない。[CLAUDE.md（Kakugo 側）](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/CLAUDE.md)
- ビルドは Gradle（Kotlin DSL）。compileSdk 36、minSdk 23、Java 11 が対象。[app/build.gradle.kts L7-L20](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/build.gradle.kts#L7-L20)、AGP 9.0.1、Kotlin 2.3.0、Compose 1.11.3 [gradle/libs.versions.toml L1-L14](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/gradle/libs.versions.toml#L1-L14)
- 歴史: 最初のコミットは 2017-07-14、コミットは830件。作者は「積極的にはメンテしていない」と書いている [CONTRIBUTING.md](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/CONTRIBUTING.md)。ただし 2026 年にも更新がある。
- テストは、DB移行を確かめる実機用のテストが1本あるだけ。

### 2.2 構成（主なもの）

```
app/src/main/
├─ res/raw/dict                 加工済み辞書（gzip 圧縮の SQLite、約12MB、展開すると約25MB）
├─ java/org/kaqui/
│  ├─ TestEngine.kt             出題の中心: 問題の抽選、誤答候補の選択、採点、履歴
│  ├─ SrsCalculator.kt          間隔反復: 出題確率の計算とスコアの更新
│  ├─ model/                    Database（問い合わせ）、DatabaseUpdater（辞書の差し替えと学習記録の引き継ぎ）、
│  │                            LearningDbView（有効な項目の絞り込み）、Model（Kanji/Kana/Word、TestType、KnowledgeType）
│  ├─ testactivities/           TestActivity（テスト画面の外枠）、QuizTest（多肢選択）、CompositionTest（部品）、
│  │                            DrawingTest + DrawView（書字）、TextTest（ローマ字入力）
│  ├─ mainmenu/                 メインメニューと、かな／漢字／語彙それぞれのメニュー
│  ├─ settings/                 出題範囲の選択（JLPT 級、個別チェック、保存、ファイルから取り込み）、設定
│  ├─ stats/                    統計画面
│  └─ itemdetails/              漢字・単語の詳細画面
```

### 2.3 辞書データの読み込み

1. 初回起動と辞書の更新時に、`raw/dict` を一時ファイルへ展開する。[MainActivity.kt L113-L127](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/mainmenu/MainActivity.kt#L113-L127)
2. 既存の DB をバックアップする（直近の2世代を残す）。[DatabaseUpdater.kt L1073-L1091](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/DatabaseUpdater.kt#L1073-L1091)
3. ユーザーの学習記録（スコア、有効にした項目）を取り出して退避する → テーブルを作り直す → 辞書 DB をアタッチしてコピーする → 学習記録を戻す。スキーマの版ごとに、記録を取り出す関数を持っている。[DatabaseUpdater.kt L180-L215](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/DatabaseUpdater.kt#L180-L215)、[L801-L822](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/DatabaseUpdater.kt#L801-L822)、[L940](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/DatabaseUpdater.kt#L940)
4. 初めて入れたときは **JLPT N5 の漢字だけが有効**になる。[DatabaseUpdater.kt L234](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/DatabaseUpdater.kt#L234)

本アプリへの示唆: 「辞書」（配るデータ）と「学習記録」（生徒ごとのデータ）を分けておき、辞書を差し替えても記録を失わない。この考え方は PWA でもそのまま使える（例: 辞書は静的な JSON、記録は IndexedDB かサーバー）。

---

## 3. データモデル

### 3.1 辞書 DB のテーブル（`dict` を展開して確認）

| テーブル | 件数 | 内容 |
|---|---|---|
| kanjis | 4,457 | 漢字（コードポイントがID）、音読み・訓読み、意味（英・仏・西・独）、JLPT 級、RTK の番号、部品数、`radical` フラグ（単独の漢字ではなく部品としてだけ使う字なら 1。195件） |
| kanjis_composition | 11,918 | 漢字 → 部品（1対多） |
| similar_items | 71,414 | 字 → 似た字、類似度スコア（0.03〜0.83） |
| item_strokes | 50,471 | 字ごとの筆画を SVG パス文字列で持ち、順番を付けている（4,380字分。かなを含む） |
| kanas | 142 | かなとローマ字 |
| words | 112,877 | 単語（JMdict）、読み、意味、`similarity_class`（送り仮名のパターンが同じ単語をまとめるID）、頻度 |

データの具体的な性質（手元で集計したもの）:

- **類似関係は対称ではない**。A→B があっても B→A が無い組が 19,812 件ある。
- 漢字1字あたりの似た字の数は平均 16.9、最大 35。似た字が1つも無い漢字は 43 字あり、すべて JLPT の級が付いていない字だった。JLPT の級が付いた漢字で似た字が5つ未満のものは 8 字。
- 部品の分解は深い階層まで下りた平らなリストになっている。例: 「語」→ 言・五・口、「働」→ 亻・丿・十・里・力。中間の部品（「動」「重」など）は含まれないことがある。
- 筆画のパスは 109×109 の座標系で表されている。これは KanjiVG の座標系と同じ。

### 3.2 学習記録（ユーザー側）

- `item_scores`: 字×「知識の種類」ごとに、短期スコア・長期スコア・最後に出題した時刻を持つ。[LearningDbView.kt L123-L131](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/LearningDbView.kt#L123-L131)
- 知識の種類は **読み／意味／筆画（Strokes）** の3つ。同じ字でも種類ごとにスコアが別になる。書字テストと部品テストは、どちらも「筆画」の種類として同じスコアを共有する。[Model.kt L83-L105](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/Model.kt#L83-L105)
- `sessions` / `session_items`: 1問ごとに、テストの種類・問題の字・誤って選んだ字・確信度・時刻を記録する。[LearningDbView.kt L133-L143](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/LearningDbView.kt#L133-L143)
- `stats_snapshots`: セッションを始めるたびに、その日の習熟度の分布を保存する（統計グラフ用）。[Database.kt L422-L471](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/Database.kt#L422-L471)

本アプリへの示唆: 「誤って選んだ字」を1問ごとに残しておくと、「どの字とどの字を取り違えやすいか」という**混同ペアの統計**が後から取れる。教員向けのレポートや、Lv4 の出題の材料になる。

---

## 4. テストの種類

テストの種類は全部で18ある。[TestType.kt L3-L27](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/TestType.kt#L3-L27)
漢字に関係するのは、漢字→読み、読み→漢字、漢字→意味、意味→漢字、書字（KANJI_DRAWING）、部品（KANJI_COMPOSITION）の6つ。

- 選択肢の数は、部品テストだけ **9**、それ以外は **6**。[Model.kt L237-L241](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/Model.kt#L237-L241)
- **どのテストも、問題文に読みか意味を出す**。書字テストと部品テストも、問題文は「読み＋意味」になっている。[Model.kt L135-L156](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/Model.kt#L135-L156)
  → 本アプリ（読み・意味を教えない）には、**形だけで答える問題はそのままの形では存在しない**。一番近いのは「読み→漢字」と「意味→漢字」で、似た字の中から正しい字を選ばせる部分。問題文を「見本の字」に置き換えれば Lv1 になる。
- 複数のテストの種類を選ぶと、1問ごとに種類をランダムに選んで混ぜる。[TestEngine.kt L237](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/TestEngine.kt#L237)、[Utils.kt L256-L291](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/Utils.kt#L256-L291)

---

## 5. 類似漢字を誤答候補に選ぶアルゴリズム

### 5.1 通常の多肢選択（6択）

根拠: [TestEngine.kt L283-L314](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/TestEngine.kt#L283-L314)、似た字の読み込み [Database.kt L158-L163](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/Database.kt#L158-L163)、乱択のしかた [Utils.kt L111-L122](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/Utils.kt#L111-L122)

手順（自分の言葉で）:

1. 問題の字について、`similar_items` から似た字の一覧を取り出す（類似度の高い順）。
2. その中から、**学習者が今「有効」にしている字だけ**を残す。
3. 残った似た字が「選択肢の数 − 1」（=5）以上あれば、**5つを一様にランダムに選ぶ**。5つ未満なら全部使う。
   - 注意: 類似度スコアは読み込むときの並べ替えに使うだけで、**選ぶときの重みには使っていない**。
4. （単語テストのときだけ）送り仮名のパターンが同じ単語で埋める。
5. まだ足りない分は、有効な項目全体から**一様にランダムに**選ぶ（問題の字と、すでに選んだ字は除く）。
6. 正解を加え、全体をシャッフルする。

疑似コード（自作）:

```
function buildChoices(target, pool, n):
    similar = similarOf(target).filter(k => pool.has(k))
    picked  = sampleUniform(similar, min(n - 1, similar.length))
    rest    = pool - {target} - picked
    picked += sampleUniform(rest, n - 1 - picked.length)
    return shuffle(picked + [target])
```

### 5.2 誤答したときの採点（重要な工夫）

- 誤った字を選ぶと、**問題の字だけでなく、選んでしまった字にも「知らない」と同じ減点をする**。[TestEngine.kt L383-L387](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/TestEngine.kt#L383-L387)
- その結果、取り違えた2字が**両方とも近いうちに出題されやすくなる**。混同ペアを自然に復習させる仕組みになっている。

### 5.3 類似データそのものの作られ方

- README によると、Niai、similar-kanji、Yencken の研究の**3つを合わせた**もの。[README.rst L51](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/README.rst#L51)
- **どう合わせたか（重み、しきい値、非対称になる理由）は、コードもスクリプトも公開されていない**。【曖昧】
  - スコアの値の分布を見ると、1/6 や 2/9 のような分数に近い値が多い。Niai 式の「共有する部品の割合」を元にしていると推測できるが、確証は無い。【曖昧】
- 参考として、Niai の計算方法（MIT ライセンスの別リポジトリ、SHA `78632ba7139c152fdacfebfe9f230aaee48c486f`）を確認した。
  - スコア =（2字が共有する部品の数 ÷ 2字のうち部品が多い方の部品数）＋ 0.1 ×（画数の比）。全体を 0〜1 に正規化し、1字につき上位20件を残す。[SimilarScoringService.cs L46-L110](https://github.com/mrahhal/niai/blob/78632ba7139c152fdacfebfe9f230aaee48c486f/backend/src/Aggregator/Services/SimilarScoringService.cs#L46-L110)、[L169-L186](https://github.com/mrahhal/niai/blob/78632ba7139c152fdacfebfe9f230aaee48c486f/backend/src/Aggregator/Services/SimilarScoringService.cs#L169-L186)
  - 部品の情報には KRADFILE（EDRDG）を使っている。[kradintro L1-L10](https://github.com/mrahhal/niai/blob/78632ba7139c152fdacfebfe9f230aaee48c486f/backend/src/Aggregator/data/dictionaries/kradzip/kradintro#L1-L10)
  - 注意: 部品の**位置**を考えていないことはコード内のコメントでも認めている。そのため「部品が同じなら似ている」と判定され、見た目は似ていない組（例: 待↔行、往）も入りやすい。

### 5.4 本アプリへの示唆

- Lv1（見本と同じ字を選ぶ）と Lv4（似た字の区別）には、「似た字を先に入れ、足りない分をランダムで埋める」方式がそのまま使える。
- 改善したい点:
  - 似た字は**有効な字に限らず**、字の全集合から選ぶ。形を見分ける練習なので、誤答の字をまだ習っていなくても問題ない。Kakugo のように有効な字に絞ると、有効な字が少ない初期段階では**誤答がほぼ無関係な字になり、易しすぎる**。
  - 類似度で**重みを付けて**抽選し、難易度（Lv）に合わせて「上位k件から選ぶ」「中位から選ぶ」を切り替える。
  - 学習者自身の混同記録（§3.2）を類似度に加える。

---

## 6. 学習の進み具合の管理（間隔反復）

根拠: [SrsCalculator.kt L11-L192](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/SrsCalculator.kt#L11-L192)、[TestEngine.kt L233-L275](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/TestEngine.kt#L233-L275)

### 6.1 考え方

- **「今日の復習ノルマ」を持たない**。セッションはいつ始めても止めてもよく、1問ごとに「今いちばん出すべき字」を**確率で抽選**する。[README.rst L12](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/README.rst#L12)
- 1字（×知識の種類）ごとに2つのスコアを持つ。
  - **短期スコア** s（0〜1）: 最近の出来。1 になると「当面は覚えている」扱い。
  - **長期スコア** L（0〜1）: 定着の度合い。復習の間隔を決める。
- 復習の間隔は日数で固定しない。**「有効な字の中で最も長く出題されていない字が、何日前に出題されたか」（D）を基準にした相対値**で決める。長期スコア L の字は、およそ L×D 日たつと再び出題の候補になる。[SrsCalculator.kt L49-L65](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/SrsCalculator.kt#L49-L65)、[L174-L178](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/SrsCalculator.kt#L174-L178)
  → たくさん解く人ほど D が短くなり、復習の回転が速くなる。これが README のいう「ペースに合わせる」の正体。

### 6.2 出題確率（2段階）

段階1（字ごと）:
- 短期の重み = 1 − s
- 長期の重み: s が 1 の字だけに付く。「前回の出題からの日数 ≧ 0.99 × D × L」になったら、重み =（0.05 から 1 までを 1−L で補間した値）。それ以外は 0。

段階2（全体の調整）: [SrsCalculator.kt L180-L190](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/SrsCalculator.kt#L180-L190)
- 「まだ覚えていない字」（s<1）が全体に占める割合に応じて、覚えていない字にまとめて割り当てる確率の目標を 20%〜90% の範囲で決める。覚えていない字が多い（25〜33%以上）ほど、また30字に近づくほど、目標を上げる。
- 目標に合うように、短期の重み全体に係数を掛ける。

抽選: **直近6問に出した字を除いて**、重みに比例したルーレット抽選を行う。[TestEngine.kt L254-L275](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/TestEngine.kt#L254-L275)、[L350-L354](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/TestEngine.kt#L350-L354)

### 6.3 スコアの更新

回答の確信度は3段階: **SURE（自信あり）／ MAYBE（たぶん）／ DONTKNOW（わからない・誤答）**。[Certainty.kt](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/Certainty.kt)、[SrsCalculator.kt L87-L143](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/SrsCalculator.kt#L87-L143)

| 回答 | 短期 s | 長期 L |
|---|---|---|
| SURE | +0.34（上限1）。約3回連続で正解すると 1 になる | s が 1 未満の間は変えない（1 に届いた瞬間に最低値 0.01 を与える）。s がすでに 1 なら、予定の間隔にどれだけ達しているかに応じて √L に最大 0.1 を足す（待った期間が長いほど多く上がり、早すぎる復習ではあまり上がらない） |
| MAYBE | +0.17（**上限 0.7**。MAYBE では「覚えた」状態にならない） | 半分にする |
| DONTKNOW／誤答 | 約 −0.34。さらに L 以下に抑える（0 未満にはならない） | L が小さいときは 1/4 に、大きいときは 1/2 に（その間は補間） |

疑似コード（自作。本アプリ向けに整理したもの）:

```
onAnswer(item, result):
    if result == SURE:
        if item.s < 1: item.s = min(1, item.s + STEP); if item.s == 1: item.L = max(item.L, EPS)
        else:          item.L = grow(item.L, elapsed / expectedInterval(item.L))
    if result == MAYBE:   item.s = min(0.7, item.s + STEP/2); item.L /= 2
    if result == WRONG:   item.s = clamp(min(item.L, item.s - STEP), 0, 1); item.L /= lerp(4, 2, item.L)
    item.lastAsked = now
```

### 6.4 正答率・弱点・レベル解放

- **正答率**: 画面上部に「正解数／出題数」と「正解した字の種類数／出題した字の種類数」を出す。[TestActivity.kt L588-L610](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/testactivities/TestActivity.kt#L588-L610)
- **習熟度の3区分**: 短期スコアが 0.3 未満なら「弱い」、1 未満なら「途中」、1 なら「覚えた」。色付きの帯（StatsBar）で分布を見せる。少数の区分も見えるように、帯の幅に最小値を設けている。[Constants.kt L3](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/Constants.kt#L3)、[LearningDbView.kt L198-L238](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/LearningDbView.kt#L198-L238)、[StatsBar.kt L27-L34](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/StatsBar.kt#L27-L34)
- **弱点の再出題**: 専用のキューは無い。弱い字ほど短期の重みが大きいので、抽選で自然に出やすくなる。誤答で選んだ字も減点される（§5.2）。
- **レベル解放**: **無い**。学習者が自分で出題範囲を選ぶ（JLPT 級／RTK の番号の範囲／頻度の範囲でまとめてオン・オフ、1字ずつのチェック、範囲の保存と呼び出し、テキストファイルから字の一覧を取り込み）。[Classifier.kt L8-L106](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/Classifier.kt#L8-L106)、[ClassSelectionActivity.kt L177-L257](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/settings/ClassSelectionActivity.kt#L177-L257)
- 有効な字が **10 未満だとテストを始められない**。[Utils.kt L256-L261](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/Utils.kt#L256-L261)
- 詳細画面から手動でスコアを上げ下げすることもできる。[SrsCalculator.kt L145-L172](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/SrsCalculator.kt#L145-L172)

---

## 7. 部品から組み立てるテスト（KANJI_COMPOSITION）

根拠: [TestEngine.kt L316-L348](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/TestEngine.kt#L316-L348)、[Database.kt L40-L76](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/Database.kt#L40-L76)、[CompositionTest.kt L49-L144](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/testactivities/CompositionTest.kt#L49-L144)

- 問題文: 読みと意味（字の形そのものは見せない）。
- 解答: 3×3 の9マスに部品が並ぶ。**正しい部品を全部選んで**「完了」を押す（部品の順番は問わない）。
- 選択肢の作り方（層を重ねる）:
  1. 正解の部品を全部入れる。
  2. 層A: 問題の字に**似た字（有効な字に限る）の部品**。
  3. 層B: 問題の字と**同じ部品を1つでも含む有効な字の部品**、および**問題の字を部品として含む有効な字**。
  4. 層C: 有効な字全体。
  - 上の層から順に入れ、ある層がまるごと入りきらないときは、その層からランダムに選んで9マスを埋める。
- 採点: すべて正しいときだけ SURE、1つでも間違いか選び漏れがあれば DONTKNOW。MAYBE は無い。
- フィードバック: 各マスを4つの状態で色分けする。「正しく選んだ」「間違えて選んだ」「選び漏れ」「関係ない」。[CompositionTest.kt L49-L54](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/testactivities/CompositionTest.kt#L49-L54)

疑似コード（自作）:

```
function compositionChoices(target, n=9):
    chosen = partsOf(target)
    for layer in [partsOfSimilar(target), partsOfNeighbours(target), allEnabled()]:
        cand = layer - chosen
        if cand.length <= n - chosen.length: chosen += cand
        else: chosen += sampleUniform(cand, n - chosen.length); break
    return shuffle(chosen)
```

本アプリの Lv5 への示唆:
- 問題文は「見本の字」にする（読み・意味は出さない）。あるいは見本を出さずに「部品から字を当てる」逆向きの問題にする。
- 「似た字の部品」を誤答に入れると、**正解とそっくりな部品構成の罠**になって効果が高い。
- Kakugo の部品は平らなリスト（例: 働 → 亻 丿 十 里 力）で、**位置（へん・つくり・かんむり等）の情報が無い**。「組み立て」として見せるなら、KanjiVG の部品の階層や位置の情報を自分で使う必要がある。

---

## 8. 書字テスト（DRAWING）

根拠: [DrawingTest.kt L58-L204](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/testactivities/DrawingTest.kt#L58-L204)、[DrawView.kt L104-L178](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/testactivities/DrawView.kt#L104-L178)、筆画の読み込み [Database.kt L111-L121](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/model/Database.kt#L111-L121)

- 正しい筆順で**1画ずつ**判定する。書いた線が次に書くべき画と合えば、その画を**お手本の線に置き換えて**表示し、次の画に進む。合わなければ線は消え、同じ画を待つ。
- 1画の判定（自分の言葉で）:
  - お手本の画を一定の間隔（字の大きさの1/4ごと）で点に分け、書いた線はそれより細かい間隔で点に分ける。
  - 書いた線の点を始点から順にたどり、「今のお手本の点」からの距離が許容範囲（字の大きさの1/4）を超えたら不合格。次のお手本の点の方が近くなったら、お手本側を1つ進める。
  - 線を書き終えた時点で、お手本の残りの点に届いていなければ（書き足りなければ）不合格。
  - → **向き（始点と終点）と順番**が合っていないと通らない。形が多少ゆがんでいても通る。
- ヒントボタン: 次の画を約1秒かけて薄く表示して消す。ヒントを1回でも使うと、最後まで書けても **DONTKNOW** 扱いになる。
- 「わからない」: 残りの画を別の色で表示する。

本アプリへの示唆: 「形を見分ける」が目的なので、書字は優先度が低い。入れるとしても、画の順番と向きを厳しく判定するのは外国人初学者には厳しすぎる。判定を緩める（向きを問わない、部品単位で判定する）などの検討が必要。

---

## 9. 画面の流れと UI の工夫

### 9.1 画面の流れ

```
メイン（ひらがな／カタカナ／漢字／語彙／統計／設定）
  └ 漢字メニュー: テストの種類ごとのボタン ＋「カスタム（複数の種類を混ぜる）」＋「出題範囲の選択」
       └ テスト画面（終わりは無い。戻るときに確認ダイアログを出す）
```
根拠: [KanjiMenuActivity.kt L80-L128](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/mainmenu/KanjiMenuActivity.kt#L80-L128)、[TestActivity.kt L206-L215](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/testactivities/TestActivity.kt#L206-L215)

テスト画面の構成（上から）: 習熟度の帯 → 正答数 → 問題（文字の大きさは自動で調整）→ 選択肢 → 直前に解いた問題の行 → 履歴を開くボタン。[TestActivity.kt L575-L640](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/testactivities/TestActivity.kt#L575-L640)

### 9.2 フィードバックの出し方

根拠: [QuizTest.kt L120-L136](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/testactivities/QuizTest.kt#L120-L136)、[L355-L370](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/testactivities/QuizTest.kt#L355-L370)

- **正解**: 止まらずに**すぐ次の問題へ進む**（テンポを重視）。
- **誤答**: 正解のボタンを緑、選んだボタンを赤にする。ほかのボタンは押せなくなる。正解のボタンか「次へ」を押すと進む。
- **「わからない」ボタン**: 正解を緑で示す。誤答と同じ扱いで、減点する。
- **直前の問題の行**: 画面の下に、直前の問題の字（誤答なら**選んだ字と正解の字を並べて**）と説明を出す。正解でも一瞬で次へ進むので、ここで振り返れる。タップすると詳細画面へ。[TestActivity.kt L643-L800](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/testactivities/TestActivity.kt#L643-L800)
- **履歴**: 直近の約50件を色分けして一覧にする（下から引き出すシート）。誤答は「正解の字＋選んだ字」の2行で並べる。[TestActivity.kt L339-L361](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/testactivities/TestActivity.kt#L339-L361)
- **押し間違いの取り消し**: 直前の問題の行を**横にスワイプ**すると、回答を「SURE→MAYBE→DONTKNOW→SURE」の順に1段ずらす。スコアは回答前の値から計算し直し、誤答で減点した字も元に戻す。スワイプ中は、離すとどうなるか（色と✓／✗）を背景に表示する。[TestEngine.kt L413-L465](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/TestEngine.kt#L413-L465)、[TestActivity.kt L680-L735](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/testactivities/TestActivity.kt#L680-L735)
- **確信度の入力**: 各選択肢に「自信あり」と「たぶん」の2つのボタンを付ける。1ボタンのモードでは、長押しが「たぶん」になる。[QuizTest.kt L400-L413](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/testactivities/QuizTest.kt#L400-L413)、[L478](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/testactivities/QuizTest.kt#L478)
- **選択肢を隠す**（既定でオン）: 問題だけを先に見せ、「選択肢を表示」を押すまで選択肢を出さない。まず自分で思い出させるための工夫。隠している間も選択肢の領域の大きさは保ち、表示したときに画面がずれないようにしている。[QuizTest.kt L98](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/testactivities/QuizTest.kt#L98)、[L320-L352](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/testactivities/QuizTest.kt#L320-L352)
- **書体の選択**: ゴシック／明朝／任意のフォントファイル。[TypefaceManager.kt L13-L40](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/app/src/main/java/org/kaqui/TypefaceManager.kt#L13-L40)
- 画面を点けたままにする設定。セッションの途中でアプリが終了されても状態を戻す。

本アプリへの示唆:
- 「正解ならすぐ次へ、誤答なら止めて2字を並べる」はそのまま使える。Lv1/Lv4 では、誤答した2字を**大きく並べて違いを見比べさせる**表示にすると、もっと良くなる。
- **一瞬表示（Lv3）に相当する機能は Kakugo には無い**。「選択肢を隠す」はその逆（問題を先に見せる）。Lv3 は「見本を短時間だけ見せて消す → 選択肢を出す」を新しく設計する必要がある。
- 書体の切り替えは、**形を見分ける力を別の書体にも通用させる**ために有効（教科書体・明朝・ゴシック・手書き風）。本アプリでは、Lv が上がるにつれて見本と選択肢の書体を変えるなどの使い方ができる。
- 押し間違いの取り消し（スワイプ）は、タブレットを使う子どもや初学者にも役立つ。ただしスワイプは気づかれにくいので、ボタンにする方が良い。

---

## 10. データの出典とライセンス一覧（取り込み可否の判断材料）

前提: Kakugo の `dict` は、以下の上流データを作者が**非公開の手順で**加工してまとめたもの。生成スクリプトはリポジトリにも履歴にも無い（全830コミットのファイル名を確認した。辞書の更新は、バイナリの差し替えと DatabaseUpdater の修正だけで行われている。例: コミット [8c447d8](https://github.com/blastrock/kakugo/commit/8c447d8)「Update dictionary with more words and better similar items」）。作者の別リポジトリも見つからなかった。【曖昧】（非公開のリポジトリがある可能性はある）

**`dict` そのものの取り込み: 不可**。理由: GPL のリポジトリの一部として配られている加工物で、データ単独のライセンス表記が無い。さらに、CC BY-SA のデータと出典のはっきりしないデータが混ざっている。必要なものは、下の表のとおり**上流から直接取得する**。

| データ | Kakugo 内の場所 | 出典 | 上流のライセンス（確認結果） | 本アプリでの取り込み可否 |
|---|---|---|---|---|
| 漢字の読み・意味（英・仏・西） | kanjis | KANJIDIC2（EDRDG） | **CC BY-SA 4.0**（EDRDG のライセンスページで確認: https://www.edrdg.org/edrdg/licence.html ）。KANJIDIC には追加条件がある | 本アプリは読み・意味を使わないので**不要**。使う場合は EDRDG から直接取得し、表示と継承の条件を守る |
| 漢字の意味（独） | kanjis.meanings_de | 記載なし（KANJIDIC2 には独語が無い） | 不明【曖昧】 | 不要・使わない |
| 部品構成、部品だけの字 | kanjis_composition、kanjis.radical | README では KanjiVG [README.rst L52](https://github.com/blastrock/kakugo/blob/fb333c0f8f8e5f178a2969b0e247eaf38885969a/README.rst#L52)。平らなリストにした手順は非公開【曖昧】 | **CC BY-SA 3.0**（KanjiVG 公式サイト「Copyright © 2009-2026 Ulrich Apel … CC BY-SA 3.0」） | Kakugo の加工物は不可。**KanjiVG から直接**取得し、部品と位置の情報を自分で取り出すのは可（表示と継承が必要） |
| 筆画（SVG パス） | item_strokes | KanjiVG（座標系が 109×109 で一致） | CC BY-SA 3.0 | 同上（KanjiVG から直接取得すれば可） |
| 類似漢字 | similar_items | Niai + similar-kanji + Yencken を独自に合成（手順は非公開【曖昧】） | 下の3行を参照 | Kakugo の合成物は**不可**。上流から直接取得するか、自分で計算する |
| 　↳ Niai | — | https://github.com/mrahhal/niai | リポジトリは **MIT**（LICENSE.txt を確認）。ただし類似度は KRADFILE（EDRDG、**CC BY-SA 4.0**）と KANJIDIC の画数から計算されている。Kakugo が使った版やウェブサイトからの取得方法は不明【曖昧】 | 計算方法は再現できるので、**KRADFILE から自分で計算**すれば可（CC BY-SA の表示と継承は必要） |
| 　↳ similar-kanji | — | https://github.com/siikamiika/similar-kanji （HEAD `0edcfebd5204676dec72b6b12fa26c148489bb1c`） | リポジトリは **MIT**。ただし README によると、元は My JWPce の `kanji.tgz_similars.ut8` で、その元データのライセンスは不明【曖昧】 | 条件付きで可。MIT の表示をしたうえで、JWPce に由来する部分の権利がはっきりしないという危険があることを記録しておく。取り込む前に判断が必要 |
| 　↳ Yencken（博士研究） | — | https://lars.yencken.org/datasets/kanji-confusion （旧URL `/datasets/phd/` は移転済み） | **CC BY 3.0**（ページに「All data sets on this page are released under the Creative Commons Attribution 3.0 Unported license」とある） | **可**（出典の表示が必要）。人が判定した類似度（0〜4）、フラッシュカードの誤答の組、類似字の集合、回答のログなどがあり、**人の知覚に基づく**ので本アプリの趣旨に最も合う |
| JLPT の級 | kanjis.jlpt_level、words.jlpt_level | Jonathan Waller（tanos.co.uk） | **CC BY**（「Use my data」のページで確認）。なお 2010 年以降、公式の JLPT 出題リストは存在しないので、これは非公式の推定 | 可（出典の表示が必要）。ただし学校で使うなら、**日本の学年別漢字配当表**など、目的に合った並び順を別に検討する |
| RTK の番号 | kanjis.rtk_index / rtk6_index | Heisig『Remembering the Kanji』の順番と思われる。出典の記載は無い【曖昧】 | 不明（市販の書籍の順番） | **使わない** |
| 単語 | words | JMdict（EDRDG） | CC BY-SA 4.0 | 本アプリでは不要 |
| 単語の頻度 | words.freq | jpdb.io | ライセンス表記を見つけられなかった【曖昧】 | **使わない** |
| かなの類似関係 | similar_items（かな、63件） | 作者が手で書いたもの（履歴: コミット [856bb1c](https://github.com/blastrock/kakugo/commit/856bb1c) の `data/Kanas.kt`） | Kakugo 本体と同じ **GPL** とみなす | 不可（写さない）。件数が少ないので、必要なら自分で作る |
| アイコン・タイトルのフォント | 画像のみ | Nagayama Kai、Fonters | 未確認【曖昧】 | 無関係 |

CC BY-SA のデータについての注意: 本アプリに KanjiVG や KRADFILE から作ったデータを同梱する場合、**そのデータ（加工したもの）は CC BY-SA で公開する**必要があり、出典の表示も必要。アプリのコードまで CC BY-SA になるわけではない、というのが一般的な理解だが、法的な確認はしていない【曖昧】。対策として、データを別ファイル（別ライセンス）にしてアプリのコードと分けておくと扱いやすい。

---

## 11. 本アプリに取り入れる価値が高い仕組み（ランキング）

| 順位 | 仕組み | 使う Lv | 理由 |
|---|---|---|---|
| 1 | **似た字を優先して誤答に入れ、足りない分をランダムで埋める。誤答で選んだ字も減点する**（§5） | Lv1, Lv2, Lv4 | 形を見分ける訓練の中心。混同した2字を両方とも再出題させられる。改善点（有効な字に限らない、類似度で重み付け）もはっきりしている |
| 2 | **短期と長期の2つのスコアによる重み付き抽選＋直近6問を除外**（§6） | 全体 | 授業のコマ数に関係なく、いつ始めても止めてもよい。「覚えていない字」の割合を一定に保つので、難しすぎず易しすぎない |
| 3 | **部品テスト: 9マスの複数選択、誤答を層を重ねて作る、4状態の色分けによるフィードバック**（§7） | Lv5 | 似た字の部品を罠に使うと効果が高い。「選び漏れ」も見せられる |
| 4 | 正解ならすぐ次へ／誤答なら止めて2字を並べる／直前の問題の行と履歴（§9.2） | 全体 | テンポと振り返りを両立できる |
| 5 | 押し間違いの取り消し | 全体 | 子どもやタブレットでの誤操作から記録を守る |
| 6 | 書体の切り替え | Lv3〜5 | 別の書体にも通用する形の認識を育てる |
| 7 | 字の一覧を取り込む／範囲を保存して呼び出す | 教員の機能 | 教員が「今週の字」を配るのに使える |
| 8 | 1問ごとの記録（誤って選んだ字も残す）と、日ごとの集計の保存 | 教員向けレポート | 混同ペアの分析ができる |
| 9 | 辞書と学習記録を分け、辞書を差し替えるときに記録を引き継ぐ | 基盤 | データを更新しても生徒の進み具合を失わない |

## 12. 真似しない方がよい点

1. **問題が読み・意味に頼っている**。部品テストや書字テストでさえ、問題文は読み＋意味になっている。本アプリでは、問題はすべて「形」（見本の字、または部品）にする。
2. **誤答の候補を「有効な字」に限っている**。初期段階では似た字が選択肢に入らず、無関係な字ばかりになる。形の識別には、字の全集合から選ぶ方が良い。
3. **類似度を抽選に使っていない**（一様にランダム）。難易度を調整できない。
4. **類似データの作り方が非公開で、再現できない**。スコアの意味（どの数値ならどれくらい似ているか）も説明されていない。本アプリでは作り方を文書に残し、スクリプトで再生成できるようにする。
5. **部品の類似度が位置を考えていない**（Niai 式）。「待」と「行」が似ているとされるなど、見た目の類似とずれる。人の判定データ（Yencken）や位置の情報で補正する。
6. **相対的な時間を使う間隔反復は説明しにくい**。「今日やるべき字」が無く、復習の間隔も最も古い字に左右されるので、教員が進み具合を把握しにくい。学校で使うなら、学習者向けにはこの抽選の考え方を借りつつ、教員向けには「習熟度の3区分」のような分かりやすい指標を出す。
7. **レベルの解放が無い**（すべて手動で選ぶ）。本アプリの Lv1〜5 には、解放の条件（例: 対象の字の一定割合が「覚えた」になる）を自分で設計する必要がある。
8. 確信度の「たぶん」を2ボタンで入力させる方式は、初学者や子どもには分かりにくい。入れるなら任意にする。
9. 書字の判定が厳しい（筆順・向きが違うと不合格、ヒントを1回使うと不正解扱い）。
10. 辞書を丸ごと同梱している（展開すると約25MB）。PWA では対象の字だけに絞った小さなデータにする。
11. 誤答でない回答をスワイプで取り消す操作は、気づかれにくい。

---

## 付録: 確認できなかったこと【曖昧】の一覧

- `dict` の生成スクリプトと、3つの類似データを合わせた手順（重み、しきい値、非対称になる理由）。
- 部品の分解を平らなリストにした手順（KanjiVG のどの要素を部品とみなしたか）。
- kanjis.meanings_de の出典。
- RTK の番号の出典と権利。
- jpdb の頻度データのライセンス。
- similar-kanji の元になった My JWPce データのライセンス。
- CC BY-SA のデータを同梱したときに、その条件がアプリ本体にどこまで及ぶか（法的な確認は未実施）。
