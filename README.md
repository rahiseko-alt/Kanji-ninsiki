# 漢字認識トレーナー（Kanji Shape Trainer）

漢字を使わない国から来た留学生が、読みや意味ではなく「漢字の形を見分ける力」だけを鍛える練習アプリです。
見本の漢字と同じ字を、形の似た字の中から選びます（最初の版は Lv1 のみ）。
ブラウザで開くだけで使え、ログインは不要です。記録はその端末の中だけに残り、一度開けば電波がなくても動きます。

- 仕様: rahiseko-alt/Kanji-ninsiki#2 ／ 用語集: [CONTEXT.md](./CONTEXT.md) ／ 決定の記録: [docs/adr/](./docs/adr/)
- 使っているデータと公開条件: `third_party/*/SOURCE.md`（アプリ内の「Credits」画面にも表示）

## 開発

```bash
npm ci
npm run dev        # 手元で起動
npm test           # 自動テスト
npm run typecheck  # 型の確認
npm run build      # 公開用に組み立て（dist/）
```

main に取り込むと、GitHub Actions が GitHub Pages へ自動で公開します
（事前に Settings → Pages → Source を「GitHub Actions」にしておく必要があります）。

---

このリポジトリは、Claude Code で開発を進めるための進め方の仕組み（テンプレート「Matt2」）の上に作られています。
進め方の説明は以下のとおりです。

## 覚えるのはこの3つだけ

| 打つもの | 何が起きるか |
| --- | --- |
| `s` | 前回の続き・いまの状態・最初の一手を報告します（開始時は自動でも出ます） |
| `f` | 環境を破棄しても大丈夫な状態まで片づけ、終了して良いかを報告します |
| `/next-step` | いまどこにいて、次に何を打てばいいかを1つだけ提示します |

コマンドを覚える必要はありません。「〇〇を作りたい」と伝えるだけでも、実装前に自動で案内が入ります。

## 入っているもの

- `.claude/skills/` に [mattpocock/skills](https://github.com/mattpocock/skills) を 12 個インストール
  （`npx skills add mattpocock/skills`、`skills-lock.json` でバージョン固定）
  - ユーザー起動（このうち案内で使うもの）: `grill-with-docs` / `to-spec` / `to-tickets` / `implement` / `improve-codebase-architecture` / `setup-matt-pocock-skills`
  - モデル起動: `grilling` / `domain-modeling` / `codebase-design` / `tdd` / `code-review`
- `.claude/skills/s/`, `.claude/skills/f/`, `.claude/skills/next-step/`: この置き場所独自の案内役と儀式
- `.claude/settings.json`: 会話開始時に `docs/agents/flow-map.md` を読み込む仕組み
- `docs/agents/flow-map.md`: 進め方と、説明の書き方のルール
- `docs/agents/handover.md`: 会話をまたぐ引き継ぎメモ。区切りごとに自動で追記されます
- `AGENTS.md`: 開発フローの全体像
- `docs/agents/issue-tracker.md`: 作業指示書の置き場所は GitHub Issues
- `docs/agents/domain.md`: 用語集は `CONTEXT.md`、判断の記録は `docs/adr/`

## フロー全体

- 新規開発・機能追加: `/grill-with-docs` → 必要に応じて `/to-spec` → `/to-tickets` → `/implement`
- 設計改善: `/improve-codebase-architecture` → 候補を選択 → `/grill-with-docs` または `/codebase-design` → 以下同じ

`/implement` は `/tdd` で RED → GREEN を繰り返し、最後に `/code-review` を実行します。
詳細は [AGENTS.md](./AGENTS.md) の「Development flow」を参照してください。

## スキルの更新

```bash
npx skills update
```

スキル本体は本家のまま使う方針のため、ローカルで書き換えないでください。
