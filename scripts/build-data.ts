// 出題用データを作り、アプリが読むファイルに書き出す
import { mkdirSync, writeFileSync } from 'node:fs'
import { buildKanjiData } from '../src/data/buildKanjiData.ts'
import { readRawInputs } from './rawInputs.ts'

const data = buildKanjiData(readRawInputs())
const out = new URL('../src/generated/', import.meta.url)
mkdirSync(out, { recursive: true })
writeFileSync(
  new URL('kanji-data.json', out),
  JSON.stringify({
    _credits:
      'Generated from joyo-json (MIT), topokanji (MIT), kanjidist-visualiser (MIT; dkanjistat derived from KanjiVG; dstrokedit from Lars Yencken, CC BY 3.0) and KanjiVG (c) Ulrich Apel, CC BY-SA 3.0 (stroke counts). See the Credits screen.',
    ...data,
  }),
)
const padded = data.order.filter((c) => data.kanji[c].distractors.length === 7).length
console.log(`kanji-data.json: ${data.order.length} kanji (${padded} with exactly 7 distractors)`)
