import { describe, expect, it } from 'vitest'
import {
  answer,
  answerBuild,
  initialRecord,
  nextBuildQuestion,
  nextQuestion,
  restoreRecord,
  START_POSITIONS,
  withStart,
} from './practice.ts'
import type { KanjiData } from '../data/buildKanjiData.ts'
import { seededRng, testData } from './testData.ts'

/** 出題順が40字の、テスト用の大きめの出題用データ。部品に分かれる字だけ parts を持たせる */
function bigData(withParts: (i: number) => boolean): KanjiData {
  const order = Array.from({ length: 40 }, (_, i) => String.fromCodePoint(0x4e00 + i * 3))
  return {
    order,
    kanji: Object.fromEntries(
      order.map((c, i) => [
        c,
        {
          strokes: 1,
          distractors: order.filter((d) => d !== c).slice(0, 10),
          ...(withParts(i) ? { parts: { parts: ['亻', c] as [string, string], layout: 'row' as const } } : {}),
        },
      ]),
    ),
  }
}

describe('始める位置', () => {
  it('3つの位置は 先頭・200字目・600字目', () => {
    expect(START_POSITIONS).toEqual({ beginner: 0, some: 200, well: 600 })
  })

  it('始める位置を変えると、学習中の字はその位置からの8字になる', () => {
    const data = bigData(() => false)
    const r = withStart(initialRecord(), data, 20)
    const targets = new Set<string>()
    const rng = seededRng(1)
    for (let i = 0; i < 100; i++) targets.add(nextQuestion(r, data, rng).target)
    expect([...targets].sort()).toEqual(data.order.slice(20, 28).sort())
  })

  it('始める位置を変えても、字ごとの記録と練習回の記録は残る', () => {
    const q = nextQuestion(initialRecord(), testData, seededRng(1))
    const before = answer(initialRecord(), testData, q, q.target, 900).record
    const after = withStart(before, testData, 2)
    expect(after.stats).toEqual(before.stats)
    expect(after.currentSession).toEqual(before.currentSession)
    expect(after.startAt).toBe(2)
  })

  it('出題順より先の位置は、最後の8字に丸める', () => {
    const r = withStart(initialRecord(), testData, 600)
    expect(r.startAt).toBe(testData.order.length - 8)
  })

  it('始める位置も読み戻せ、以前の記録では先頭から始まる', () => {
    const r = withStart(initialRecord(), testData, 3)
    expect(restoreRecord(JSON.parse(JSON.stringify(r)))).toEqual(r)
    const old = JSON.parse(JSON.stringify(initialRecord()))
    delete old.startAt
    expect(restoreRecord(old).startAt).toBe(0)
  })
})

describe('「くみたてる」の出題範囲', () => {
  it('学習中の字に組み立てられる字が足りなければ、その先20字の中からだけ足す', () => {
    // 分かれる字は 5, 12, 25, 30 番目。学習中は 0〜7、足せる範囲は 8〜27
    const data = bigData((i) => [5, 12, 25, 30].includes(i))
    const rng = seededRng(2)
    const targets = new Set<string>()
    let r = initialRecord()
    for (let i = 0; i < 30; i++) {
      const q = nextBuildQuestion(r, data, rng)!
      targets.add(q.target)
      r = answerBuild(r, data, q, q.target, 900).record
      r = { ...r, learningCount: 8 } // 学習中の字を増やさずに確かめる
    }
    expect([...targets].sort()).toEqual([data.order[5], data.order[12], data.order[25]].sort())
  })

  it('範囲の中に組み立てられる字が1字も無ければ、問題を出さない', () => {
    const data = bigData((i) => i === 35)
    expect(nextBuildQuestion(initialRecord(), data, seededRng(1))).toBeNull()
  })

  it('始める位置を変えると、その位置からの範囲で出す', () => {
    const data = bigData((i) => i === 3 || i === 22)
    const r = withStart(initialRecord(), data, 20)
    expect(nextBuildQuestion(r, data, seededRng(1))!.target).toBe(data.order[22])
  })
})
