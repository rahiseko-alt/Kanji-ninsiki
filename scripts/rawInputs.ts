// third_party/ に取り込んだ元データを読み、出題用データ作成の入力にそろえる
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { ComponentNode, RawInputs, Distances } from '../src/data/buildKanjiData.ts'

const root = fileURLToPath(new URL('../third_party/', import.meta.url))
const readJson = (path: string): unknown => JSON.parse(readFileSync(root + path, 'utf8'))

export function readRawInputs(): RawInputs {
  const joyo = (readJson('joyo-json/joyo_kanji.json') as { standardForm: string }[]).map(
    (k) => k.standardForm,
  )
  const topoOrder = readFileSync(root + 'topokanji/lists/aozora.txt', 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const kanjivg = readJson('kanjivg/kanjivg-joyo-components.json') as {
    kanji: Record<string, { n: number; t: { k?: ComponentNode[] } }>
  }
  const strokes = Object.fromEntries(Object.entries(kanjivg.kanji).map(([c, v]) => [c, v.n]))
  const nearest = (file: string) =>
    (readJson(`kanjidist-visualiser/data/${file}.json`) as { nearest: Distances }).nearest
  return {
    joyo,
    topoOrder,
    strokes,
    strokeEdit: nearest('dstrokedit'),
    kanjistat: nearest('dkanjistat'),
    components: Object.fromEntries(Object.entries(kanjivg.kanji).map(([c, v]) => [c, v.t.k ?? []])),
    fontChars: [...readFileSync(new URL('../src/assets/fonts/NotoSerifJP-subset.chars.txt', import.meta.url), 'utf8')],
  }
}
