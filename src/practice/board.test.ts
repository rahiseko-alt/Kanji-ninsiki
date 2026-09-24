import { describe, expect, it } from 'vitest'
import {
  answer,
  answerBoard,
  initialRecord,
  nextBoardQuestion,
  nextQuestion,
  restoreRecord,
  type PracticeRecord,
} from './practice.ts'
import type { BoardQuestion } from './question.ts'
import { seededRng, testData } from './testData.ts'

const positionsOf = (q: BoardQuestion) => q.board.flatMap((c, i) => (c === q.target ? [i] : []))

type Play = 'correct' | 'missed' | 'wrong'

/** Lv2 を n問、指定どおりに答えて進める */
function playBoard(record: PracticeRecord, n: number, how: (i: number) => Play, seed = 1) {
  const rng = seededRng(seed)
  const targets: string[] = []
  const outcomes = []
  for (let i = 0; i < n; i++) {
    const q = nextBoardQuestion(record, testData, rng)
    targets.push(q.target)
    const right = positionsOf(q)
    const wrongIndex = q.board.findIndex((c) => c !== q.target)
    const selected =
      how(i) === 'correct' ? right : how(i) === 'missed' ? right.slice(1) : [...right, wrongIndex]
    const r = answerBoard(record, testData, q, selected, 2000 + i)
    record = r.record
    outcomes.push({ q, ...r })
  }
  return { record, targets, outcomes }
}

describe('Lv2 の盤面', () => {
  it('最初は9字で、見本と同じ字が2〜4個、残りは紛らわし字', () => {
    for (let seed = 0; seed < 40; seed++) {
      const q = nextBoardQuestion(initialRecord(), testData, seededRng(seed))
      expect(q.board).toHaveLength(9)
      const n = positionsOf(q).length
      expect(n).toBeGreaterThanOrEqual(2)
      expect(n).toBeLessThanOrEqual(4)
      const distractors = testData.kanji[q.target].distractors.slice(0, 6)
      for (const c of q.board) if (c !== q.target) expect(distractors).toContain(c)
    }
  })

  it('同じ乱数なら同じ盤面になる', () => {
    expect(nextBoardQuestion(initialRecord(), testData, seededRng(3))).toEqual(
      nextBoardQuestion(initialRecord(), testData, seededRng(3)),
    )
  })
})

describe('Lv2 の採点', () => {
  const q: BoardQuestion = { target: '三', board: ['三', '二', '一', '三', '四', '二', '五', '一', '三'] }

  it('同じ字を全部選び、違う字を選んでいなければ正解', () => {
    const r = answerBoard(initialRecord(), testData, q, [8, 0, 3], 1500)
    expect(r.correct).toBe(true)
    expect(r.missed).toEqual([])
    expect(r.wrongPicks).toEqual([])
  })

  it('選ばなかった同じ字は見落としとして返す', () => {
    const r = answerBoard(initialRecord(), testData, q, [0, 3], 1500)
    expect(r.correct).toBe(false)
    expect(r.missed).toEqual([8])
    expect(r.wrongPicks).toEqual([])
  })

  it('違う字を選んだら取り違えとして、その字を返す', () => {
    const r = answerBoard(initialRecord(), testData, q, [0, 3, 8, 1, 5, 6], 1500)
    expect(r.correct).toBe(false)
    expect(r.wrongPicks).toEqual(['二', '五'])
  })

  it('字ごとの記録に残る', () => {
    const r = answerBoard(initialRecord(), testData, q, [0, 3], 1500)
    expect(r.record.stats['三']).toEqual({ seen: 1, correct: 0, lastMs: 1500 })
  })
})

describe('Lv2 の再出題', () => {
  it('見落としだけなら、見本が3問以内にまた出る', () => {
    for (let seed = 0; seed < 20; seed++) {
      const { targets } = playBoard(initialRecord(), 4, (i) => (i === 0 ? 'missed' : 'correct'), seed)
      expect(targets.slice(1, 4), `seed ${seed}`).toContain(targets[0])
    }
  })

  it('取り違えたら、選んだ字と見本の両方が3問以内に出る', () => {
    for (let seed = 0; seed < 20; seed++) {
      const { targets, outcomes } = playBoard(initialRecord(), 4, (i) => (i === 0 ? 'wrong' : 'correct'), seed)
      const next3 = targets.slice(1, 4)
      expect(next3, `seed ${seed}`).toContain(targets[0])
      expect(next3, `seed ${seed}`).toContain(outcomes[0].wrongPicks[0])
    }
  })
})

describe('Lv2 の盤面の字数', () => {
  it('5問続けて正解すると 9→12→16 と増え、16より増えない', () => {
    const sizes = [0, 4, 5, 10, 15].map((n) => {
      const { record } = playBoard(initialRecord(), n, () => 'correct')
      return nextBoardQuestion(record, testData, seededRng(1)).board.length
    })
    expect(sizes).toEqual([9, 9, 12, 16, 16])
  })

  it('取り違え・見落としで1段減り、9より減らない', () => {
    const at16 = playBoard(initialRecord(), 10, () => 'correct').record
    const size = (r: PracticeRecord) => nextBoardQuestion(r, testData, seededRng(1)).board.length
    expect(size(playBoard(at16, 1, () => 'missed').record)).toBe(12)
    expect(size(playBoard(at16, 1, () => 'wrong').record)).toBe(12)
    expect(size(playBoard(at16, 3, () => 'missed').record)).toBe(9)
  })

  it('Lv1 の選択肢数とは別々に増減する', () => {
    const { record } = playBoard(initialRecord(), 10, () => 'correct')
    expect(nextQuestion(record, testData, seededRng(1)).choices).toHaveLength(4)
  })
})

describe('段階ごとの練習回', () => {
  it('Lv2 も10問で終わり、Lv2 の練習回として記録される', () => {
    const { record, outcomes } = playBoard(initialRecord(), 10, (i) => (i < 6 ? 'correct' : 'missed'))
    expect(outcomes[9].sessionResult).toMatchObject({ correct: 6, total: 10 })
    expect(record.lv2.sessions).toHaveLength(1)
    expect(record.sessions).toHaveLength(0)
  })

  it('Lv2 の途中で Lv1 を解いても、それぞれの練習回は混ざらない', () => {
    let { record } = playBoard(initialRecord(), 3, () => 'correct')
    const q = nextQuestion(record, testData, seededRng(2))
    record = answer(record, testData, q, q.target, 800).record
    expect(record.currentSession).toHaveLength(1)
    expect(record.lv2.currentSession).toHaveLength(3)
  })

  it('Lv2 で9問以上正解しても学習中の字が2字増える', () => {
    expect(playBoard(initialRecord(), 10, () => 'correct').record.learningCount).toBe(10)
  })
})

describe('記録の読み戻し（Lv2 追加後）', () => {
  it('Lv2 の進み具合も読み戻せる', () => {
    const { record } = playBoard(initialRecord(), 13, (i) => (i % 4 ? 'correct' : 'wrong'))
    expect(restoreRecord(JSON.parse(JSON.stringify(record)))).toEqual(record)
  })

  it('Lv2 を持たない以前の記録は、Lv1 の進み具合をそのまま引き継ぐ', () => {
    const old = {
      learningCount: 10,
      choiceCount: 6,
      streak: 2,
      stats: { 一: { seen: 3, correct: 2 } },
      recentTargets: ['一'],
      pendingReview: [],
      currentSession: [{ correct: true, ms: 900 }],
      sessions: [{ correct: 9, total: 10, averageMs: 1200 }],
    }
    const r = restoreRecord(old)
    expect(r.learningCount).toBe(10)
    expect(r.choiceCount).toBe(6)
    expect(r.sessions).toHaveLength(1)
    expect(r.lv2).toEqual(initialRecord().lv2)
  })
})
