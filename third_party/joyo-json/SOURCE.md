# joyo-json（常用漢字 2136 字の機械可読リスト）

- 出典: https://github.com/hoffmannjp/joyo-json
- コミットSHA: `6b76bf6e9b286265a597e370cd01d38d856ce606`（2021-08-10）
- 取得日: 2026-09-24
- ライセンス: MIT（同梱の `LICENSE` は上流の原本。Copyright (c) 2021 Benjamin Hoffmann）。元になった常用漢字表（平成22年内閣告示第2号）は告示なので、著作権法13条により著作権の対象にならない。
- 取り込んだファイル: `joyo_kanji.json`（無加工の原本）。配列 2136 件。各要素は `standardForm`（通用字体）、`oldForm`（旧字体、392件にあり）、`altForm`（許容字体。𠮟→叱、塡→填、剝→剥、頰→頬 の4件）、`readingsOn`、`readingsKun` を持つ。並びは常用漢字表と同じ音訓順。
- 検証（2026-09-24）: 件数 2136、重複なし、全要素が1文字。別の出典である kanjidist-visualiser の `dkanjistat.json` のキー集合（2136字）と完全に一致した。𠮟・塡・剝・頰 は表の通りの字体で入っている。
- 何のために取ったか: 出題対象になる字の母集団（字種リスト）。本アプリは読みを教えないので、`readings*` は使わない。
