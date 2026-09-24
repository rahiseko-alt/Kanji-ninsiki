// テスト用の小さな出題用データ。紛らわし字候補は「出題順で自分以外の先頭から」
import type { KanjiData } from '../data/buildKanjiData.ts'

const order = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百', '千']
const distractorsOf = (c: string) => order.filter((d) => d !== c).slice(0, 10)

export const testData: KanjiData = {
  order,
  kanji: Object.fromEntries(order.map((c, i) => [c, { strokes: i + 1, distractors: distractorsOf(c) }])),
}

/** 決まった並びを返す乱数（同じ種なら同じ結果） */
export function seededRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}
