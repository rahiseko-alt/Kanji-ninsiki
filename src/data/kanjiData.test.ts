import { describe, expect, it } from 'vitest'
import { buildKanjiData } from './buildKanjiData.ts'
import { readRawInputs } from '../../scripts/rawInputs.ts'

const raw = readRawInputs()
const data = buildKanjiData(raw)
const joyo = new Set(raw.joyo)

describe('出題用データ', () => {
  it('常用漢字2136字を出題順に重複・欠けなく持つ', () => {
    expect(data.order).toHaveLength(2136)
    expect(new Set(data.order).size).toBe(2136)
    for (const c of data.order) expect(joyo.has(c)).toBe(true)
  })

  it('出題順は部品の少ない字から始まる', () => {
    expect(data.order.slice(0, 3)).toEqual(['人', '一', '口'])
  })

  it('すべての字に7字以上の紛らわし字候補がある', () => {
    for (const c of data.order) {
      expect(data.kanji[c].distractors.length, c).toBeGreaterThanOrEqual(7)
    }
  })

  it('紛らわし字候補は常用漢字だけで、見本自身と重複を含まない', () => {
    for (const c of data.order) {
      const ds = data.kanji[c].distractors
      expect(ds, c).not.toContain(c)
      expect(new Set(ds).size, c).toBe(ds.length)
      for (const d of ds) expect(joyo.has(d), `${c}→${d}`).toBe(true)
    }
  })

  it('形のほぼ同じ字を最優先の候補にする', () => {
    // 画の編集距離が最小の字（土→士・工、人→入）が先頭に来る
    expect(data.kanji['土'].distractors.slice(0, 2)).toContain('士')
    expect(data.kanji['人'].distractors[0]).toBe('入')
  })

  it('字ごとに画数を持つ', () => {
    expect(data.kanji['一'].strokes).toBe(1)
    expect(data.kanji['大'].strokes).toBe(3)
  })
})
