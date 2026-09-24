# topokanji（データのみ取り込み）

- 出典: https://github.com/scriptin/topokanji
- コミットSHA: `cd04afc2c4335336c9243b8aef01c0d2a69c3009`（2026-08-22）
- 取得日: 2026-09-24
- ライセンス: 上流に LICENSE ファイルは無い。README の License 節と package.json で Apache-2.0+ / CC-BY-4.0+ / EPL-1.0+ / LGPL-3.0+ / MIT の選択式と宣言されている。本プロジェクトは MIT を選ぶ（同梱の `LICENSE` 参照）。
- 取り込んだファイル（無加工の原本。パスは上流と同じ）:
  - `lists/aozora.json`, `lists/aozora.txt`: 2310字。字の部品が先に来るようにトポロジカル順に並べ、同じ順位の中では青空文庫での出現頻度が高い順にしたもの。部首・部品（丨 丶 など）も含む
  - `dependencies/1-to-N.json`: 字 → 直接の構成部品の一覧（形の分解グラフ）
  - `data/kanji.json`: `[字, 画数, 常用的か(bool)]` の表
- 何のために取ったか: 出題順（「部品を先に見せてから、それを含む字を出す」）の土台、Lv5「部品から組み立て」用の部品グラフ、画数での難易度付け。
- 注意【曖昧】: 部品分解は CJK Decompositions Data（cjkdecomp.codeplex.com、現在はリンク切れ）を上流で修正したもの。その元データのライセンスは今回、実物のファイルで確かめられていない。常用漢字のうち 36 字（𠮟 塡 剝 頰 など）がリストに無い。
