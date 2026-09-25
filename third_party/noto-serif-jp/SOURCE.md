# Noto Serif JP（使う字だけに絞った明朝体の woff2 を同梱）

- 出典: https://github.com/google/fonts/tree/main/ofl/notoserifjp （`NotoSerifJP[wght].ttf`）
- コミットSHA: `23e54b51ddffbc7713c583748e3bd86f62b1fa4a`
- 取得日: 2026-09-25
- ライセンス: SIL Open Font License 1.1（`OFL.txt` は上流の原本）
- 同梱物: `src/assets/fonts/NotoSerifJP-400.woff2`・`NotoSerifJP-700.woff2`。`subset.py` で絞り、太さを固定したもの。400 は常用漢字・Lv5 の部品・画面の文言（`src/i18n.tsx`）の日本語・かな・英数字・記号、700 は画面の文言の文字だけ（改変版。OFL に従い同じライセンスで配布）。400 に実際に入っている文字の一覧は `NotoSerifJP-subset.chars.txt`
- 何のために: 利用者が示したデザインどおり、画面の文言と問題に出す漢字を明朝体で表示するため（以前使っていた Noto Sans JP は廃止）
