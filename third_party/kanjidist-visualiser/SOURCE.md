# kanjidist-visualiser（データのみ取り込み）

- 出典: https://github.com/lennart-finke/kanjidist-visualiser
- コミットSHA: `3819425ea35926c2ed1979b85a71269ef14ccb63`（2024-05-27）
- 取得日: 2026-09-24
- ライセンス: MIT（同梱の `LICENSE` は上流の原本。Copyright (c) 2024 Lennart Finke & Dominic Schuhmacher）
- 取り込んだファイル（無加工の原本）:
  - `data/dkanjistat.json`: 常用漢字 2136 字それぞれの近い字（2〜58個）と距離。Optimal Transport を使った kanjistat 距離（Schuhmacher et al., https://arxiv.org/abs/2304.02493）
  - `data/dstrokedit.json`: 1940字。画の種類の並びの編集距離（Yencken & Baldwin 2008）
  - `data/dbagofradicals.json`: 1940字。共有する部品の割合による距離（Yeh & Li 2002）
  - 形式: `{"nearest": {字: {近い字: 距離, ...}}, "title", "description", "scaleBy", "inverted"}`。値が小さいほど似ている
- 何のために取ったか: Lv1/Lv2/Lv4 で紛らわしい選択肢を選ぶため、また問題の難しさを決めるため（「似ている字」の候補と、その似ている度合い）。
- 帰属表示（必須）: dstrokedit と dbagofradicals の元データは Lars Yencken, *Orthographic support for passing the reading hurdle in Japanese* (PhD thesis, Univ. of Melbourne, 2010), https://lars.yencken.org/datasets/kanji-confusion 、CC BY 3.0 Unported。
- 注意【曖昧】: dkanjistat は KanjiVG（CC BY-SA 3.0）の筆画の座標から計算した距離の値である。数値だけを取り出したものが KanjiVG の二次的著作物に当たる（継承条件が及ぶ）かどうかは確証が無い。使う前に判断すること。字形そのもの（KanjiVG の SVG）は含まれていない。
