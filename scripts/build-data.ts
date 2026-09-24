// 出題用データを作り、アプリが読むファイルに書き出す
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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

// 出典画面から開く、取り込んだデータの公開条件の全文
const thirdParty = new URL('../third_party/', import.meta.url)
const notices: [string, string][] = [
  ['KanjiVG (https://kanjivg.tagaini.net/) - modified data, CC BY-SA 3.0', 'kanjivg/COPYING'],
  ['kanjidist-visualiser (https://github.com/lennart-finke/kanjidist-visualiser)', 'kanjidist-visualiser/LICENSE'],
  ['topokanji (https://github.com/scriptin/topokanji)', 'topokanji/LICENSE'],
  ['joyo-json (https://github.com/hoffmannjp/joyo-json)', 'joyo-json/LICENSE'],
]
const publicDir = new URL('../public/', import.meta.url)
mkdirSync(publicDir, { recursive: true })
writeFileSync(
  new URL('third-party-notices.txt', publicDir),
  [
    'Third-party notices for Kanji Shape Trainer',
    '',
    'Stroke edit distances (distributed via kanjidist-visualiser): Lars Yencken, "Orthographic support for passing the reading hurdle in Japanese" (PhD thesis, University of Melbourne, 2010), https://lars.yencken.org/datasets/kanji-confusion, CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/).',
    '',
    ...notices.flatMap(([title, path]) => [
      '='.repeat(72),
      title,
      '='.repeat(72),
      readFileSync(new URL(path, thirdParty), 'utf8'),
      '',
    ]),
  ].join('\n'),
)
