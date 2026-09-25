# Noto Serif JP（画面の文言だけに絞った明朝体の woff2 を同梱）

- 出典: https://github.com/google/fonts/tree/main/ofl/notoserifjp （`NotoSerifJP[wght].ttf`）
- コミットSHA: `23e54b51ddffbc7713c583748e3bd86f62b1fa4a`
- 取得日: 2026-09-25
- ライセンス: SIL Open Font License 1.1（`OFL.txt` は上流の原本）
- 同梱物: `src/assets/fonts/NotoSerifJP-400.woff2`・`NotoSerifJP-700.woff2`。`subset.py` で、画面の文言（`src/i18n.tsx`）の日本語・かな・英数字・記号だけに絞り、太さを 400 と 700 に固定したもの（改変版。OFL に従い同じライセンスで配布）。実際に入っている文字の一覧は `NotoSerifJP-subset.chars.txt`
- 何のために: 利用者が示したデザインどおり、画面の文言を明朝体で表示するため。問題に出す漢字はゴシック体（Noto Sans JP）のまま
