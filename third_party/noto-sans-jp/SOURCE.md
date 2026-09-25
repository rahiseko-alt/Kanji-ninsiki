# Noto Sans JP（常用漢字などに絞った woff2 を同梱）

- 出典: https://github.com/google/fonts/tree/main/ofl/notosansjp （`NotoSansJP[wght].ttf`）
- コミットSHA: `23e54b51ddffbc7713c583748e3bd86f62b1fa4a`
- 取得日: 2026-09-24
- ライセンス: SIL Open Font License 1.1（`OFL.txt` は上流の原本。Reserved Font Name は 'Source'）
- 同梱物: `src/assets/fonts/NotoSansJP-subset.woff2`。`subset.py` で、常用漢字2136字・Lv5 の部品（KanjiVG の部品データで2つに分かれる字の直下の部品のうち、元フォントに字形があるもの）・かな・英数字・画面の文言の文字だけに絞り、太さを 400 に固定したもの（改変版。OFL に従い同じライセンスで配布）
- 何のために: 端末にフォントが無くても、通信なしで同じゴシック体を表示するため（ADR-0003、rahiseko-alt/Kanji-ninsiki#9）
- 収録文字の一覧: `src/assets/fonts/NotoSansJP-subset.chars.txt`（`subset.py` が woff2 と一緒に書き出す。woff2 の cmap にある文字を1行に並べたもの）。`src/assets/fonts/fontCoverage.test.ts` が、常用漢字2136字と `src/i18n.tsx` の日本語の文字がすべてこの一覧に入っているかを確かめる。落ちたら `subset.py` を再実行する
