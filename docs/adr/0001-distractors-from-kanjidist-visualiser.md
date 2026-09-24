# 紛らわし字は kanjidist-visualiser の類似度データから選ぶ

紛らわし字の元データとして、内容が最も良い similar-kanji の中心データ（`kanji.tgz_similars.ut8`）は使わず、kanjidist-visualiser（MIT）の類似度データを使う。similar-kanji 自体は MIT だが、中心データは kanji.free.fr（無断転載禁止）由来の My JWPce のファイルを元にしており、再配布の許諾が確認できないため。kanjidist-visualiser の測り方は1つでは「土・士」「人・入」を取りこぼすので、kanjistat 距離と画の編集距離の2つを組み合わせる。

## Considered Options

- similar-kanji 中心データ: 常用漢字の網羅率が最も高いが、許諾が無い。作者への問い合わせで許可が取れれば再検討する
- Lars Yencken の人手評価データ（CC BY 3.0）: 目的に最も合うが未取得。後から精度向上の材料として追加する候補
- Kakugo 同梱データ: GPL のリポジトリ内にあり、元データの許諾も混在しているため不採用

## Consequences

- kanjidist-visualiser の `dkanjistat.json` は KanjiVG（CC BY-SA 3.0）から計算された数値で、継承条件が及ぶかは未確定。詳細は `docs/research/peripheral-oss.md`
