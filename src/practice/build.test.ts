import { describe, expect, it } from 'vitest'
import {
  answerBuild,
  initialRecord,
  nextBuildQuestion,
  nextQuestion,
  restoreRecord,
  type PracticeRecord,
} from './practice.ts'
import type { KanjiData } from '../data/buildKanjiData.ts'
import { seededRng, testData } from './testData.ts'

function playBuild(record: PracticeRecord, n: number, isCorrect: (i: number) => boolean, seed = 1, data = testData) {
  const rng = seededRng(seed)
  const questions = []
  const outcomes = []
  for (let i = 0; i < n; i++) {
    const q = nextBuildQuestion(record, data, rng)
    questions.push(q)
    const picked = isCorrect(i) ? q.target : q.choices.find((c) => c !== q.target)!
    const r = answerBuild(record, data, q, picked, 1200 + i)
    record = r.record
    outcomes.push(r)
  }
  return { record, questions, outcomes }
}

const countAfter = (r: PracticeRecord) => nextBuildQuestion(r, testData, seededRng(1)).choices.length

describe('Lv5 の問題', () => {
  it('部品2つと並べ方、正解1つを含む4字の選択肢を出す', () => {
    const q = nextBuildQuestion(initialRecord(), testData, seededRng(3))
    expect(q.parts).toEqual(testData.kanji[q.target].parts)
    expect(q.choices).toHaveLength(4)
    expect(q.choices.filter((c) => c === q.target)).toHaveLength(1)
  })

  it('部品に分かれない字は出さず、学習中の字から出す', () => {
    const { questions } = playBuild(initialRecord(), 30, () => true, 2)
    const learning = new Set(testData.order.slice(0, 8))
    for (const q of questions.slice(0, 10)) {
      expect(['一', '二']).not.toContain(q.target)
      expect(learning.has(q.target)).toBe(true)
    }
  })

  it('学習中の字に部品に分かれる字が無ければ、出題順で次の分かれる字を出す', () => {
    const noParts: KanjiData = {
      order: testData.order,
      kanji: Object.fromEntries(
        testData.order.map((c, i) => [c, i < 9 ? { ...testData.kanji[c], parts: undefined } : testData.kanji[c]]),
      ),
    }
    const { questions } = playBuild(initialRecord(), 3, () => true, 1, noParts)
    expect(questions[0].target).toBe(testData.order[9])
  })
})

describe('Lv5 の選択肢数と記録', () => {
  it('5問続けて正解すると 4→6→8 と増え、取り違えで減る。Lv1 とは別々', () => {
    expect([0, 5, 10].map((n) => countAfter(playBuild(initialRecord(), n, () => true).record))).toEqual([4, 6, 8])
    const at8 = playBuild(initialRecord(), 10, () => true).record
    expect(countAfter(playBuild(at8, 1, () => false).record)).toBe(6)
    expect(nextQuestion(at8, testData, seededRng(1)).choices).toHaveLength(4)
  })

  it('10問で終わり、Lv5 の練習回として記録され、9問以上正解で学習中の字が増える', () => {
    const { record, outcomes } = playBuild(initialRecord(), 10, () => true)
    expect(outcomes[9].sessionResult).toMatchObject({ correct: 10, total: 10 })
    expect(record.lv5.sessions).toHaveLength(1)
    expect(record.sessions).toHaveLength(0)
    expect(record.learningCount).toBe(10)
  })

  it('取り違えた字が部品に分かれる字なら、3問以内に出る', () => {
    for (let seed = 0; seed < 20; seed++) {
      const { questions } = playBuild(initialRecord(), 4, (i) => i !== 0, seed)
      const picked = questions[0].choices.find((c) => c !== questions[0].target)!
      const next3 = questions.slice(1, 4).map((q) => q.target)
      expect(next3, `seed ${seed}`).toContain(questions[0].target)
      if (testData.kanji[picked].parts) expect(next3, `seed ${seed}`).toContain(picked)
    }
  })

  it('Lv5 の進み具合も読み戻せ、以前の記録では Lv5 が初期状態で始まる', () => {
    const { record } = playBuild(initialRecord(), 13, (i) => i % 3 !== 0)
    expect(restoreRecord(JSON.parse(JSON.stringify(record)))).toEqual(record)
    const old = JSON.parse(JSON.stringify(initialRecord()))
    delete old.lv5
    expect(restoreRecord(old).lv5).toEqual(initialRecord().lv5)
  })
})
