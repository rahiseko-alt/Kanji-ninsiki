# kanji-frequency（漢字の出現頻度）

- 出典: https://github.com/scriptin/kanji-frequency （説明: https://scriptin.github.io/kanji-frequency/）
- コミットSHA: `62df93626e51a61c3dec58b51bfa20bef79491d7`（2026-03-21）
- 取得日: 2026-09-26
- ライセンス: CC BY 4.0（同梱の `LICENSE.txt` は上流の原本。package.json も `CC-BY-4.0`）。© Dmitry Shpika
- 取り込んだファイル: `data/wikipedia_characters.csv`（無加工の原本）。日本語版ウィキペディアの無作為なページから数えた、字ごとの出現数（列: rank, code_point_hex, char, char_count。rank 0 の行は全体の合計）
- 何のために取ったか: 出題順を「文章でよく使われる順」にするため（仕様 rahiseko-alt/Kanji-ninsiki#36、根拠は docs/research/redesign-evidence.md §6）。現代の説明文に近いウィキペディアを選び、古い文学作品の青空文庫や、量の少ないニュースは使わない
- 確認（2026-09-26）: 常用漢字2136字がすべて含まれる。𠮟・塡・剝・頰 は許容字体（叱・填・剥・頬）で書かれることが多いため、両方の数を合わせて数える
