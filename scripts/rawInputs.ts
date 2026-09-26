// third_party/ に取り込んだ元データを読み、出題用データ作成の入力にそろえる
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { ComponentNode, RawInputs, Distances } from '../src/data/buildKanjiData.ts'

const root = fileURLToPath(new URL('../third_party/', import.meta.url))
const readJson = (path: string): unknown => JSON.parse(readFileSync(root + path, 'utf8'))

export function readRawInputs(): RawInputs {
  const joyoTable = readJson('joyo-json/joyo_kanji.json') as { standardForm: string; altForm: string }[]
  const joyo = joyoTable.map((k) => k.standardForm)
  // 出現数。許容字体（叱・填・剥・頬）で書かれた分も、通用字体（𠮟・塡・剝・頰）に合算する
  const counts = new Map<string, number>()
  for (const line of readFileSync(root + 'kanji-frequency/data/wikipedia_characters.csv', 'utf8').split('\n').slice(2)) {
    const [, , char, count] = line.split(',')
    if (char) counts.set(char, Number(count))
  }
  const frequency = Object.fromEntries(
    joyoTable.map((k) => [k.standardForm, (counts.get(k.standardForm) ?? 0) + (k.altForm ? (counts.get(k.altForm) ?? 0) : 0)]),
  )
  const kanjivg = readJson('kanjivg/kanjivg-joyo-components.json') as {
    kanji: Record<string, { n: number; t: { k?: ComponentNode[] } }>
  }
  const strokes = Object.fromEntries(Object.entries(kanjivg.kanji).map(([c, v]) => [c, v.n]))
  const nearest = (file: string) =>
    (readJson(`kanjidist-visualiser/data/${file}.json`) as { nearest: Distances }).nearest
  return {
    joyo,
    frequency,
    strokes,
    strokeEdit: nearest('dstrokedit'),
    kanjistat: nearest('dkanjistat'),
    components: Object.fromEntries(Object.entries(kanjivg.kanji).map(([c, v]) => [c, v.t.k ?? []])),
    fontChars: [...readFileSync(new URL('../src/assets/fonts/NotoSerifJP-subset.chars.txt', import.meta.url), 'utf8')],
  }
}
