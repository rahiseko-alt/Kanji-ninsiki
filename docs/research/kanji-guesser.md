# Kanji Guesser 調査メモ（設計の把握）

- 対象: https://github.com/tryforceful/kanji-guesser
- 調査時点のコミット: `10d242464fae5c4bbfed104a58c5ca4d7f75ba61`（master の HEAD、2020-02-05）
- 以下のリンクはすべてこのSHAに固定している（行番号つき）。
- 方針: このリポジトリのコードとデータは**一切コピーしていない**。本文は自分の言葉で書いた説明と、自作の疑似コードだけで構成している。

---

## 0. ライセンスの結論（最初に確認）

**明示的なライセンスは見つからなかった。したがってコードもデータもコピー・流用できない。**

確認した内容:

| 確認箇所 | 結果 | 根拠 |
|---|---|---|
| リポジトリ直下の LICENSE / COPYING | 無い（全ファイルを列挙して確認） | ツリー: https://github.com/tryforceful/kanji-guesser/tree/10d242464fae5c4bbfed104a58c5ca4d7f75ba61 |
| package.json の `license` 欄 | 無い。`"private": true` だけがある | [package.json L1-L5](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/package.json#L1-L5) |
| README | ライセンスの記載は無い。Credits 節に「データの一部は @larsyencken の simsearch を元にしている」とだけ書かれている | [readme.md L38-L40](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/readme.md#L38-L40) |
| リポジトリ全体の "license" 文字列検索 | yarn.lock と WaniKani の API ダンプ内を除き、該当なし | — |
| GitHub API のライセンス判定 | 今回の環境では API に接続できず、確認できなかった。【曖昧】ただしファイル実物にライセンスが無いので、結論は変わらない | — |

補足: 公開リポジトリであっても、ライセンスが無ければ著作権者の許諾が無いのと同じ扱いになる（GitHub 利用規約上は閲覧とフォークはできるが、複製・改変・再配布の許諾は無い）。本プロジェクトでは「仕組みを理解して独自に作り直す」ことだけを行う。

---

## 1. 概要

- 目的: 英語話者の日本語学習者向け。**既に知っている単語**の中の漢字1字を空欄にし、似た形の漢字の中から正しい字を選ばせる。読み（かな、またはローマ字）と英語の意味をヒントとして出す。 [readme.md L20-L24](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/readme.md#L20-L24)
- 形態: Ionic 4 + React 16 + Capacitor 1 のアプリ。Netlify で Web 版を公開していた（README のバッジとリンク）。ネイティブアプリのビルド手順は "forthcoming"（未作成）のまま。 [readme.md L28-L36](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/readme.md#L28-L36)
- 規模: コミット22件。最初のコミットは 2020-01-19、**最終コミットは 2020-02-05**。README には「2020年2月時点で開発中」とあるが、その後の更新は無い。事実上止まったプロトタイプ。
- 問題数: **ハードコードされた10問だけ**（信、言、上、独、南、東、果、早、日、本）。 [src/data/QuizData.ts L36-L335](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/data/QuizData.ts#L36-L335)
- `_data/` にある大量のデータ（WaniKani の API ダンプ、KanjiTester の回答ログ）は**アプリからは読み込まれていない**。問題を作るための素材を置いた場所になっている（§3）。

## 2. ディレクトリ構成・依存・ビルド

### 2.1 構成

```
kanji-guesser/
├─ .circleci/config.yml      CI（yarn test → codecov 送信）
├─ _data/                    素材データ（アプリからは使っていない）
│  ├─ kanji0-1000.json など   WaniKani API v2 の漢字データ（3分割）
│  ├─ vocab_levels_10-20.json WaniKani API v2 の語彙データ（Lv10-20）
│  ├─ simplified.json / vocab.csv / kanji_2048.csv   上の2つを加工したもの
│  ├─ kanji_vocab_data_dump_from_wk_tryforceful.txt  作者の WaniKani 学習済み漢字・語彙の一覧
│  ├─ kanjitester_(source)/  KanjiTester の回答ログ（2010年）
│  └─ old_codepen/           前身の CodePen 試作
├─ public/                   index.html, manifest.json, _redirects（Netlify の SPA 設定）, アイコン
├─ src/
│  ├─ App.tsx                ルーティング、サイドメニュー、設定の読み込み
│  ├─ pages/                 KanjiGuesserPage（クイズ本体の親）、Settings、Home/Sample（雛形の残り）
│  ├─ components/            Quizzard（出題ロジック）、QuizQueryCard（問題カード）、KanjiButton、
│  │                         StartScreen、FinishScreen、TextPlaceholder、Menu
│  ├─ data/QuizData.ts       問題データの型定義と10問のデータ（テストあり）
│  ├─ state/SettingsContext.tsx  設定用の Context + useReducer + 端末への保存
│  ├─ theme/                 Ionic のテーマ変数、SCSS
│  └─ serviceWorker.ts       CRA 標準のSW（登録はしていない）
├─ capacitor.config.json / ionic.config.json
└─ TODO.yaml / technologies.yaml   作者のメモ
```

### 2.2 依存パッケージ（主要なもの）

[package.json L24-L60](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/package.json#L24-L60)

- UI: `@ionic/react` ^4.11、`@ionic/react-router`、`ionicons`
- React 16.12、react-router 5、`react-scripts` 3.3.0（Create React App）
- ネイティブ化: `@capacitor/core` 1.4.0（設定の保存に `Storage` プラグインを使う）、dev に `@capacitor/cli`
- 補助: `lodash.shuffle`（選択肢の並べ替え）、`classnames`、`styled-components`（空欄の四角1個にだけ使用）、`node-sass`
- テスト: Jest（CRA 同梱）、`@testing-library/react`、`react-test-renderer`
- TypeScript 3.7.4

### 2.3 ビルド・PWA化

- スクリプトは CRA 標準の `start` / `build` / `test`。 [package.json L6-L10](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/package.json#L6-L10)
  - README には `yarn serve` と書かれているが、package.json にその script は無い（食い違い）。 [readme.md L32-L35](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/readme.md#L32-L35)
- Capacitor の `webDir` は `www`、CRA の出力先は `build/`。【曖昧】通常は Ionic CLI（`ionic build`）が差を吸収するが、リポジトリ内に手順は無い。 [capacitor.config.json](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/capacitor.config.json)
- **PWA としては未完成。**
  - manifest.json は Ionic の雛形のままで、名前が "My Ionic App" になっている。 [public/manifest.json](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/public/manifest.json)
  - Service Worker は `unregister()` が呼ばれており、オフライン動作はしない。 [src/index.tsx L11](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/index.tsx#L11)
  - iOS のホーム画面追加用の meta はある（タイトルは雛形のまま）。 [public/index.html L24-L27](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/public/index.html#L24-L27)
- viewport で `user-scalable=no` と `maximum-scale=1.0` を指定し、拡大を禁止している。 [public/index.html L9-L12](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/public/index.html#L9-L12)（アクセシビリティ上は真似しない方がよい。§7）
- CI: CircleCI で `yarn test` を実行し、codecov に送っている。 [.circleci/config.yml](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/.circleci/config.yml)

## 3. データの出典一覧

| ファイル | 元データセット | 元のライセンス | 状態・根拠 |
|---|---|---|---|
| `_data/kanji0-1000.json`, `kanji1001-2000.json`, `kanji2001+.json` | **WaniKani API v2**（`/v2/subjects?types=kanji`、全2048字、2019-11 取得） | リポジトリ内に記載なし。WaniKani（Tofugu社）の独自コンテンツで、自由なライセンスで公開されたものではないと理解している【曖昧：WaniKani の規約本文は今回確認していない】 | 各ファイル先頭の `url` に API の URL がある。例: [kanji0-1000.json L1](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/_data/kanji0-1000.json#L1) |
| `_data/vocab_levels_10-20.json` | **WaniKani API v2**（語彙、Lv10-20、1333語） | 同上 | [vocab_levels_10-20.json L1-L10](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/_data/vocab_levels_10-20.json#L1-L10) |
| `_data/simplified.json`, `_data/vocab.csv`, `_data/kanji_2048.csv` | 上の WaniKani データを加工したものと推定（字数2048、語彙の並びが一致） | 同上【曖昧：加工スクリプトはリポジトリに無い】 | [kanji_2048.csv](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/_data/kanji_2048.csv), [vocab.csv](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/_data/vocab.csv) |
| `_data/kanji_vocab_data_dump_from_wk_tryforceful.txt` | 作者自身の WaniKani 学習履歴（学習済みの漢字・語彙） | 記載なし | [該当ファイル L1-L3](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/_data/kanji_vocab_data_dump_from_wk_tryforceful.txt#L1-L3) |
| `_data/kanjitester_(source)/*.yaml(.bz2)` | **KanjiTester**（Lars Yencken）の回答ログ（2010-04-22 時点） | KanjiTester のソースコードは setup.py で `license='GPL'`（バージョン指定なし）。**回答ログというデータ自体のライセンスは不明【曖昧】** | 出典表記: [info_about_source.txt L1](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/_data/kanjitester_%28source%29/info_about_source.txt#L1)（→ github.com/larsyencken/kanjitester）。GPL の根拠: https://github.com/larsyencken/kanjitester/blob/8ffde158e8b863d6ee725fb689be163b1365f258/setup.py#L34 |
| `src/data/QuizData.ts` の誤答候補（distractors） | **SimSearch**（Lars Yencken）の類似度（筆順列の編集距離）に由来すると README に書かれている | SimSearch は setup.py で `license='BSD'`（どの BSD 条項かは不明）。SimSearch は漢字情報に KANJIDIC（EDRDG, CC BY-SA）を使うと説明している | README の Credits: [readme.md L40](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/readme.md#L40)。BSD の根拠: https://github.com/larsyencken/simsearch/blob/8c8ed998e8be98962487927195904eeb6c6d0508/setup.py#L24 。【曖昧】実際にどの手順で10問ぶんの候補を出したか（スクリプト・中間データ）はリポジトリに無い |
| `src/data/QuizData.ts` の単語・読み・英訳 | 作者の手入力と推定（WaniKani の語彙と重なる） | 記載なし【曖昧】 | [QuizData.ts L36-L335](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/data/QuizData.ts#L36-L335) |

**本プロジェクトへの示唆:** 類似漢字の元データが必要なら、Kanji Guesser を経由せず、ライセンスが明示された一次資料を直接検討する。候補は SimSearch 系の研究データ（BSD 表記）、KANJIDIC2 / KanjiVG（どちらも CC BY-SA 3.0）など。採用の可否は別途ライセンスを確認して判断する。

## 4. 類似漢字の出題の作り方

### 4.1 問題データのモデル

[QuizData.ts L1-L34](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/data/QuizData.ts#L1-L34)

- 1問は「正解の漢字1字」「単語を区切った配列」「英語の意味」「誤答候補の配列」の4つでできている。
- 単語は**区切り（segment）の配列**で表す。各区切りは表示文字列・ふりがな・ローマ字を持つ。**空欄にする区切りだけ、表示文字列が null** になる。null を目印に型を区別し（TypeScript の判別可能なユニオン）、型ガード関数で判定する。
  - 例（自作の説明）: 「信じる」なら [空欄(しん/shin), 「じる」]、「召し上がる」なら [「召し」, 空欄(あ/a), 「がる」]。空欄は語頭・語中・語尾のどこにでも置ける。
- データに対するテストで、次の不変条件を保証している。 [QuizData.test.ts L3-L73](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/data/QuizData.test.ts#L3-L73)
  - 正解の字は問題間で重複しない。どれも1文字。
  - 誤答候補は重複せず、どれも1文字で、正解の字を含まない。
  - 誤答候補は**11個以上**（最難度の12択を作れる数）。 [L36-L40](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/data/QuizData.test.ts#L36-L40)
  - 1問に空欄はちょうど1つ。 [L64-L72](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/data/QuizData.test.ts#L64-L72)

### 4.2 誤答候補の選び方

- 各問に、**類似度の高い順と思われる順に並んだ誤答候補が約20個**、事前計算した状態で埋め込まれている。 [例: 信 L38-L65](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/data/QuizData.ts#L38-L65)
- 出題時は「難易度＝選択肢の数 N」（4 / 8 / 12）に対して、**候補リストの先頭から N−1 個を取り、正解を加えてシャッフル**する。 [Quizzard.tsx L61-L73](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/Quizzard.tsx#L61-L73), [L147-L159](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/Quizzard.tsx#L147-L159), 難易度の定義 [SettingsContext.tsx L15-L19](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/state/SettingsContext.tsx#L15-L19)
  - つまり**選択肢が増えるほど、似ていない字も混ざる**。難易度は「選択肢の数」だけで決まり、「似ている度合い」では調整していない。
- 候補は実行時に計算していない。類似度計算はオフラインで一度だけ行われた（README の Credits から SimSearch 由来と推定）。【曖昧】
- 観察: 「信」の候補と「言」の候補はほぼ同じ集合で、互いに相手の字が入っている（[L44-L64](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/data/QuizData.ts#L44-L64) と [L73-L93](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/data/QuizData.ts#L73-L93)）。**同じ近傍リストから自分自身を除いて使い回した**ように見える。【曖昧】また「信」の候補は「言」を部品に持つ字（訂・記・討など）が中心で、字全体の形より**共通部品**に引きずられている。「独」の候補は「虫」「風」系が多い。つまり**部品の共有に基づく類似**が中心になっている。
- 常用外の字（訃・訌・訐・珂・蚩・颪・遖・軣 など）も多く含まれる。学習者が一度も見たことのない字が誤答として出る。

自作の疑似コード（仕組みの説明用）:

```
function buildChoices(item, n):
    pool = item.similarKanji            // 類似度の高い順に並べて事前計算したもの
    wrong = pool.take(n - 1)            // 上から n-1 個
    return shuffle(wrong + [item.answer])
```

### 4.3 語中の漢字を空欄にする方式

- 表示: 区切り配列を順に描画し、空欄の区切りには**色付きの半透明の四角**を置く。回答後は四角を正解の字に差し替え、正解なら緑、不正解なら赤の文字色にする。 [QuizQueryCard.tsx L39-L49](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/QuizQueryCard.tsx#L39-L49), 四角 [TextPlaceholder.tsx L8-L18](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/TextPlaceholder.tsx#L8-L18)
- 読みの行: 区切りごとに、設定に応じてローマ字かふりがなを出す（無ければ表示文字列そのもの）。**空欄に当たる読みは強調色で表示**し、どの音の字を選べばよいかが分かるようにしている。 [QuizQueryCard.tsx L51-L66](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/QuizQueryCard.tsx#L51-L66)
- 下段に英語の意味を出す。 [L69-L71](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/QuizQueryCard.tsx#L69-L71)
- 前身の CodePen 試作では、単語の漢字を1字ずつ `_` に置き換える自動分割を考えていた。ただし漢字の判定はダミー実装のままだった。 [codepen.js L89-L111](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/_data/old_codepen/codepen.js#L89-L111)
- **本アプリとの違い:** Kanji Guesser は「読みと意味を手がかりに字を思い出す」問題で、形の識別だけを問うものではない。本アプリは読みも意味も教えない方針なので、**空欄方式そのものは使えない**。参考になるのは「選択肢の生成」「フィードバック」「データ検証テスト」の部分。

## 5. 状態管理・画面遷移・フィードバック

### 5.1 状態管理

- **設定（全体で共有）**: React Context + `useReducer`。アクションは「更新（部分的な上書き）」と「初期化」の2種類。 [SettingsContext.tsx L89-L114](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/state/SettingsContext.tsx#L89-L114)
  - 更新のたびに設定全体を JSON にして Capacitor の `Storage` に保存する。Web ではブラウザ側の保存領域に入る【曖昧：Capacitor 1 の Web 実装は localStorage と理解している】。 [L38-L51](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/state/SettingsContext.tsx#L38-L51)
  - 起動時は、画面を持たないローダー部品が保存済みの設定を読み、「更新」アクションで流し込む。 [App.tsx L52-L65](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/App.tsx#L52-L65)
  - 真似しない点: reducer の中で保存処理と DOM 操作（ダークテーマのクラス切替）という副作用を起こしている。 [L94-L99](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/state/SettingsContext.tsx#L94-L99)
- **クイズの進行**: クラスコンポーネント2段。
  - 親（KanjiGuesserPage）: 段階（未開始 / 進行中 / 中断 / 終了）と、正解数・不正解数を持つ。 [KanjiGuesserPage.tsx L25-L43](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/pages/KanjiGuesserPage.tsx#L25-L43)。「中断」は定義されているが使われていない。
  - 子（Quizzard）: シャッフル済みの出題順、今の問題番号、今の選択肢、利用者の選んだ字を持つ。 [Quizzard.tsx L19-L26](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/Quizzard.tsx#L19-L26)
  - 「回答済みか」は「選んだ字が null でないか」で判定している。 [L133-L135](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/Quizzard.tsx#L133-L135)
  - 残り問題数と進捗率を、データ全体の件数から直接計算している（TODO コメントあり）。出題数を変えると表示が壊れる設計。 [KanjiGuesserPage.tsx L83-L89](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/pages/KanjiGuesserPage.tsx#L83-L89)
  - 進行中に難易度を変えると、選択肢の数だけ更新され、今の問題の選択肢は作り直されない。 [Quizzard.tsx L77-L82](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/Quizzard.tsx#L77-L82)

### 5.2 画面遷移

- ルーティング（react-router + Ionic のルーター出口）: `/kanji-guess`（クイズ）と `/settings`（設定）。`/` はクイズへリダイレクトする。サイドメニュー（広い画面では常時表示の分割ペイン）から移動する。 [App.tsx L29-L50](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/App.tsx#L29-L50), [L70-L86](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/App.tsx#L70-L86)
- クイズの中の遷移は URL を変えず、**親の段階ステートで表示を切り替える**（開始画面 → 出題 → 結果画面 → 開始画面）。 [KanjiGuesserPage.tsx L91-L114](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/pages/KanjiGuesserPage.tsx#L91-L114)
- 進行中はヘッダーに「終了」ボタン、残り数・正解数・不正解数のチップ、進捗バーを出す。 [L117-L147](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/pages/KanjiGuesserPage.tsx#L117-L147)
- クイズ中に設定画面へ移るとクイズが消える（TODO にも書かれている既知の問題）。 [TODO.yaml L4](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/TODO.yaml#L4)

### 5.3 フィードバック

- 回答した瞬間に全ボタンを無効にし、**正解のボタンを緑、それ以外をすべて赤**にする。選んだボタンには「選択済み」のクラスを付ける（不透明度で区別）。 [KanjiButton.tsx L26-L43](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/KanjiButton.tsx#L26-L43)
- 問題カードの空欄に正解の字が入り、正誤に応じて緑か赤で表示される（§4.3）。
- 自動では次へ進まない。右下の浮動ボタン（または Space / Enter / →）で次の問題へ進む。 [Quizzard.tsx L213-L219](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/Quizzard.tsx#L213-L219)
- 結果画面: 正解数、不正解数、正答率。50%を境に励ましの言葉を変える。 [FinishScreen.tsx L11](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/FinishScreen.tsx#L11), [L41-L54](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/FinishScreen.tsx#L41-L54)
- 問題点（作者の TODO にもある）: ダークテーマでは枠線だけのボタンになり、正解と不正解の見分けが色だけに頼るので、色覚の多様性に弱い。 [TODO.yaml L5-L6](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/TODO.yaml#L5-L6)。「選んだ誤答」と「その他の誤答」が同じ赤になるのも分かりにくい。

## 6. スマホとブラウザの両対応

- **Ionic の部品**（カード、ボタン、ツールバー、浮動ボタン、分割ペイン）が、iOS 風と Material 風の見た目を自動で切り替える。
- **判定**: Ionic の端末判定で「モバイルでない」ときだけ、キーボード操作を有効にし、ボタン左上にキー番号を出す。 [Quizzard.tsx L57-L60](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/Quizzard.tsx#L57-L60), [KanjiButton.tsx L30](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/KanjiButton.tsx#L30), [L34](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/KanjiButton.tsx#L34)
  - キー割り当て: 数字列の 1〜0、−、＝ を選択肢の1〜12番目に割り当てる。回答後は Space / Enter / → で次へ。 [Quizzard.tsx L28-L43](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/Quizzard.tsx#L28-L43), [L105-L127](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/Quizzard.tsx#L105-L127)
  - キー番号は、CSS の疑似要素でデータ属性の値を表示している（ボタン内の DOM は増やさない）。 [KanjiGuesserPage.scss L137-L157](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/theme/KanjiGuesserPage.scss#L137-L157)
- **レイアウト**: CSS Grid で選択肢を並べる。狭い画面（幅400px未満）では2列（12択なら3列）、それ以上では4列。1マスの幅は 90〜120px の範囲。**正方形のボタンにするため、上下の余白を幅と同じ割合にする手法**（padding-bottom 100%）を使っている。 [KanjiGuesserPage.scss L101-L135](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/theme/KanjiGuesserPage.scss#L101-L135)
- **小さい画面への配慮**: 問題カードを `position: sticky` で上部に固定し、選択肢をスクロールしても問題が見えるようにしている（iPhone 5 向けとコミットにある）。 [KanjiGuesserPage.scss L22-L26](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/theme/KanjiGuesserPage.scss#L22-L26)
- 漢字の文字サイズは 40px で固定。 [KanjiGuesserPage.scss L39-L47](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/theme/KanjiGuesserPage.scss#L39-L47)

## 7. 評価

### 7.1 取り入れる価値が高い仕組み（自分たちで作り直す前提）

1. **「類似字の近傍リストを事前計算し、選択肢の数で難易度を変える」出題モデル**
   - 実行時は「近傍の上位 N−1 個＋正解をシャッフル」するだけなので軽く、オフラインでも動く。本アプリの Lv1（見本と同じ字を選ぶ）、Lv2（同じ字を全部選ぶ）、Lv4（類似字の区別）に直接使える。
   - 改良: 近傍に「類似度スコア」と「類似の種類（共通部品 / 全体の形 / 鏡像や点の有無）」を持たせる。難易度を**選択肢の数**と**似ている度合い（上位何位から取るか）**の2軸にする。対象は学習範囲内の字（例: 常用漢字や学年別）に絞る。
2. **データの不変条件を単体テストで守る**
   - 正解の字が候補に入っていない、候補に重複が無い、1文字である、最大の択数を作れるだけの候補数がある、などを自動テストで確認する。教員が問題を追加・編集する運用でも壊れにくい。本アプリでは「見本の字が誤答に混ざらない」「字形がほぼ同じ異体字を誤答にしない」といった条件も加えるとよい。
3. **1画面で完結する出題ループと即時フィードバック**
   - 回答したらボタンを固定し、正解を強調し、次へ進むのは利用者の操作で決める。ヘッダーに残り数・正誤数・進捗バーを出す。PC では数字キーで回答し Space/Enter で次へ、というキーボード操作と、キー番号の小さな表示。学校の PC 教室とタブレットの両方で使いやすい。
   - 次点: 区切り配列で単語を表し、その一部を空欄にするデータ構造。本アプリでは「部品の配列から一部を空欄にする」Lv5（部品から組み立て）のデータ表現に応用できる。

### 7.2 真似しない方がよい点

- **ライセンスを書かない**こと自体（本アプリは最初に LICENSE と、データ出典・ライセンスの一覧を置く）。
- **秘密情報をリポジトリに直書きしている**: 前身の試作に WaniKani の API キー（[codepen.js L2](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/_data/old_codepen/codepen.js#L2)）、package.json と CI 設定に codecov のトークン（[package.json L12](https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/package.json#L12)）がある。値はここには転記しない。本アプリでは環境変数や CI のシークレット機能を使う。
- 規約が不明なデータ（有料サービスの API ダンプ、他人の回答ログ）を、未加工のままリポジトリに入れている（合計 約19MB）。
- 選択肢が増えると、似ていない字や常用外の字が混ざる。識別の訓練として「どのくらい似ているか」を制御できない。
- 色だけのフィードバック（赤と緑）。「選んだ誤答」と「他の誤答」が同じ表示になる。本アプリでは形（✓ / ✕ のマーク）や文言でも示す。
- viewport で拡大を禁止している。弱視の学習者などへの配慮に欠ける。
- 進捗の計算がデータ全体の件数に直結していて、出題数を変えられない。クイズの状態がページ部品の中にあり、画面を移ると消える。
- reducer の中で副作用（保存、DOM 操作）を起こしている。
- PWA の雛形（manifest の名前、SW の未登録）が未完成のまま公開されている。
- 読みと英訳が常に出る。本アプリの「形だけを見分ける」方針と正反対。

## 8. Next.js / React で同等のものを作る際のヒント

- **Ionic は不要**。本アプリは学校用の PWA で、ネイティブのストア配布は必須ではない。レスポンシブな CSS Grid とボタンで十分に作れる。Ionic 版で良かった点（正方形のボタン、狭い画面で問題を上部固定、PC だけキー番号を表示）は、素の CSS とメディアクエリ（`(hover: hover) and (pointer: fine)` など、端末の種類ではなく入力手段で判定）で再現できる。
- **出題ロジックを純粋関数に分ける**。「問題セット＋設定＋乱数の種 → 出題列」「出題＋回答 → 判定結果」のように UI から切り離すと、TDD がしやすく、乱数の種を固定したテストも書ける。Kanji Guesser では出題ロジックがクラスコンポーネントの中にあり、単体テストはデータ検証しか無かった。
- **クイズの進行は1つの reducer（状態機械）にまとめる**。例: `未開始 → 出題中(i, 選択肢, 回答) → 回答済み → … → 結果`。レベル（Lv1〜5）ごとに「出題生成」と「判定」だけを差し替える。Lv3（一瞬表示）は「提示 → 隠す → 回答」の段階を1つ追加するだけにできる。

  自作の疑似コード:
  ```
  state: { phase: 'idle' | 'showing' | 'answering' | 'feedback' | 'done', index, items, answers }
  on START    -> phase = level.hasFlash ? 'showing' : 'answering'
  on TIMEOUT  -> phase = 'answering'                     // Lv3 のみ
  on ANSWER   -> answers[index] = level.judge(item, input); phase = 'feedback'
  on NEXT     -> index + 1 < items.length ? 次の問題へ : phase = 'done'
  ```
- **類似字データはビルド時に作る**。ライセンスを確認した一次データから、Node スクリプトで「字 → 近傍（スコア・種類つき）」の JSON を生成する。Next.js の静的出力に含めてオフラインで使う。生成物には出典とライセンスの表記を付ける。
- **設定と学習記録の保存**は、端末内だけで良いなら localStorage / IndexedDB に、学校で共有するならサーバー側に置く。保存処理は reducer の外（effect や専用のモジュール）で行う。
- **PWA 化**: Next.js なら manifest をアプリ名で正しく作り、Service Worker（next-pwa 系のプラグイン、または自作）で静的アセットと類似字 JSON をキャッシュする。Kanji Guesser のように雛形のまま放置しない。
- **漢字の表示**: フォントによって字形が変わる（とめ・はね、教科書体とゴシック体の差）。形の識別を教えるアプリでは、表示フォントを固定する（Web フォントを同梱する）ことが Kanji Guesser 以上に重要になる。【曖昧】Kanji Guesser はフォントを指定していない。

---

### 付録: 参照したファイル（すべて SHA 固定）

- https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/Quizzard.tsx
- https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/QuizQueryCard.tsx
- https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/components/KanjiButton.tsx
- https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/pages/KanjiGuesserPage.tsx
- https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/state/SettingsContext.tsx
- https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/data/QuizData.ts
- https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/data/QuizData.test.ts
- https://github.com/tryforceful/kanji-guesser/blob/10d242464fae5c4bbfed104a58c5ca4d7f75ba61/src/theme/KanjiGuesserPage.scss
- 上流: https://github.com/larsyencken/simsearch/tree/8c8ed998e8be98962487927195904eeb6c6d0508 / https://github.com/larsyencken/kanjitester/tree/8ffde158e8b863d6ee725fb689be163b1365f258
