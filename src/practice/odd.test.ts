import { describe, expect, it } from 'vitest'
import {
  answerOdd,
  initialRecord,
  nextBoardQuestion,
  nextOddQuestion,
  restoreRecord,
  type PracticeRecord,
} from './practice.ts'
import { seededRng, testData } from './testData.ts'

/** Lv4 を n問、正解するかどうかを決めて進める */
function playOdd(record: PracticeRecord, n: number, isCorrect: (i: number) => boolean, seed = 1) {
  const rng = seededRng(seed)
  const questions = []
  const outcomes = []
  for (let i = 0; i < n; i++) {
    const q = nextOddQuestion(record, testData, rng)
    questions.push(q)
    const pickedIndex = isCorrect(i) ? q.oddIndex : (q.oddIndex + 1) % q.board.length
    const r = answerOdd(record, testData, q, pickedIndex, 900 + i)
    record = r.record
    outcomes.push(r)
  }
  return { record, questions, outcomes }
}

const sizeAfter = (record: PracticeRecord) => nextOddQuestion(record, testData, seededRng(1)).board.length

describe('Lv4 の盤面', () => {
  it('9字から始まり、仲間はずれはちょうど1つで、紛らわし字候補の上位3字のどれか。残りは全部同じ字', () => {
    for (let seed = 0; seed < 40; seed++) {
      const q = nextOddQuestion(initialRecord(), testData, seededRng(seed))
      expect(q.board).toHaveLength(9)
      expect(q.board[q.oddIndex]).toBe(q.odd)
      expect(q.board.filter((c) => c === q.odd)).toHaveLength(1)
      expect(q.board.filter((c) => c === q.target)).toHaveLength(8)
      expect(testData.kanji[q.target].distractors.slice(0, 3)).toContain(q.odd)
    }
  })

  it('並べる字は最初の練習回では出題順の先頭8字から選ぶ', () => {
    const first8 = testData.order.slice(0, 8)
    for (const q of playOdd(initialRecord(), 10, () => true).questions) expect(first8).toContain(q.target)
  })
})

describe('Lv4 の採点と再出題', () => {
  it('仲間はずれの位置を押せば正解、それ以外は取り違え', () => {
    const q = nextOddQuestion(initialRecord(), testData, seededRng(4))
    expect(answerOdd(initialRecord(), testData, q, q.oddIndex, 800).correct).toBe(true)
    const wrong = answerOdd(initialRecord(), testData, q, (q.oddIndex + 1) % 9, 800)
    expect(wrong.correct).toBe(false)
    expect(wrong.record.stats[q.target]).toMatchObject({ seen: 1, correct: 0, mixedUp: 1 })
  })

  it('取り違えたら、並べた字と仲間はずれの両方が3問以内に出る', () => {
    for (let seed = 0; seed < 20; seed++) {
      const { questions } = playOdd(initialRecord(), 4, (i) => i !== 0, seed)
      const next3 = questions.slice(1, 4).map((q) => q.target)
      expect(next3, `seed ${seed}`).toContain(questions[0].target)
      expect(next3, `seed ${seed}`).toContain(questions[0].odd)
    }
  })
})

describe('Lv4 の盤面の字数', () => {
  it('5問続けて正解すると 9→12→16 と増え、16より増えない', () => {
    const sizes = [0, 4, 5, 10, 15].map((n) => sizeAfter(playOdd(initialRecord(), n, () => true).record))
    expect(sizes).toEqual([9, 9, 12, 16, 16])
  })

  it('取り違えで1段減り、9より減らない', () => {
    const at16 = playOdd(initialRecord(), 10, () => true).record
    expect(sizeAfter(playOdd(at16, 1, () => false).record)).toBe(12)
    expect(sizeAfter(playOdd(at16, 3, () => false).record)).toBe(9)
  })

  it('Lv2 の盤面の字数とは別々に変わる', () => {
    const { record } = playOdd(initialRecord(), 10, () => true)
    expect(nextBoardQuestion(record, testData, seededRng(1)).board).toHaveLength(9)
  })
})

describe('Lv4 の練習回と記録', () => {
  it('10問で終わり、Lv4 の練習回として記録される', () => {
    const { record, outcomes } = playOdd(initialRecord(), 10, (i) => i < 8)
    expect(outcomes[9].sessionResult).toMatchObject({ correct: 8, total: 10 })
    expect(record.lv4.sessions).toHaveLength(1)
    expect(record.sessions).toHaveLength(0)
  })

  it('Lv4 で9問以上正解すると学習中の字が2字増える', () => {
    expect(playOdd(initialRecord(), 10, () => true).record.learningCount).toBe(10)
  })

  it('Lv4 の進み具合も読み戻せ、以前の記録では Lv4 が初期状態で始まる', () => {
    const { record } = playOdd(initialRecord(), 13, (i) => i % 3 !== 0)
    expect(restoreRecord(JSON.parse(JSON.stringify(record)))).toEqual(record)
    const old = JSON.parse(JSON.stringify(initialRecord()))
    delete old.lv4
    expect(restoreRecord(old).lv4).toEqual(initialRecord().lv4)
  })
})
