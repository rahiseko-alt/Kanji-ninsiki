# Noto Sans JP（常用漢字などに絞った woff2 を同梱）

- 出典: https://github.com/google/fonts/tree/main/ofl/notosansjp （`NotoSansJP[wght].ttf`）
- コミットSHA: `23e54b51ddffbc7713c583748e3bd86f62b1fa4a`
- 取得日: 2026-09-24
- ライセンス: SIL Open Font License 1.1（`OFL.txt` は上流の原本。Reserved Font Name は 'Source'）
- 同梱物: `src/assets/fonts/NotoSansJP-subset.woff2`。`subset.py` で、常用漢字2136字・かな・英数字・画面の文言の文字だけに絞り、太さを 400 に固定したもの（改変版。OFL に従い同じライセンスで配布）
- 何のために: 端末にフォントが無くても、通信なしで同じゴシック体を表示するため（ADR-0003、rahiseko-alt/Kanji-ninsiki#9）
