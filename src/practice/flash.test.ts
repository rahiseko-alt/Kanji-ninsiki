import { describe, expect, it } from 'vitest'
import {
  answerFlash,
  initialRecord,
  nextFlashQuestion,
  nextQuestion,
  restoreRecord,
  type PracticeRecord,
} from './practice.ts'
import { seededRng, testData } from './testData.ts'

/** Lv3 を n問、正解するかどうかを決めて進める */
function playFlash(record: PracticeRecord, n: number, isCorrect: (i: number) => boolean, seed = 1) {
  const rng = seededRng(seed)
  const targets: string[] = []
  const picks: string[] = []
  const outcomes = []
  for (let i = 0; i < n; i++) {
    const q = nextFlashQuestion(record, testData, rng)
    targets.push(q.target)
    const picked = isCorrect(i) ? q.target : q.choices.find((c) => c !== q.target)!
    picks.push(picked)
    const r = answerFlash(record, testData, q, picked, 700 + i)
    record = r.record
    outcomes.push(r)
  }
  return { record, targets, picks, outcomes }
}

const showMsAfter = (record: PracticeRecord) => nextFlashQuestion(record, testData, seededRng(1)).showMs

describe('Lv3 の問題', () => {
  it('選択肢はいつも4字で、表示時間は1500msから始まる', () => {
    const q = nextFlashQuestion(initialRecord(), testData, seededRng(2))
    expect(q.choices).toHaveLength(4)
    expect(q.choices.filter((c) => c === q.target)).toHaveLength(1)
    expect(q.showMs).toBe(1500)
  })

  it('表示時間が短くなっても選択肢は4字のまま', () => {
    const { record } = playFlash(initialRecord(), 15, () => true)
    expect(nextFlashQuestion(record, testData, seededRng(3)).choices).toHaveLength(4)
  })
})

describe('Lv3 の表示時間', () => {
  it('5問続けて正解すると 1500→1000→700→500 と短くなり、500より短くならない', () => {
    const times = [0, 4, 5, 10, 15, 25].map((n) => showMsAfter(playFlash(initialRecord(), n, () => true).record))
    expect(times).toEqual([1500, 1500, 1000, 700, 500, 500])
  })

  it('取り違えで1段長くなり、1500より長くならない', () => {
    const at500 = playFlash(initialRecord(), 15, () => true).record
    expect(showMsAfter(playFlash(at500, 1, () => false).record)).toBe(700)
    expect(showMsAfter(playFlash(at500, 5, () => false).record)).toBe(1500)
  })

  it('Lv1 の選択肢数とは別々に変わる', () => {
    const { record } = playFlash(initialRecord(), 10, () => true)
    expect(nextQuestion(record, testData, seededRng(1)).choices).toHaveLength(4)
    expect(record.choiceCount).toBe(4)
  })
})

describe('Lv3 の練習回と再出題', () => {
  it('10問で終わり、Lv3 の練習回として記録される', () => {
    const { record, outcomes } = playFlash(initialRecord(), 10, (i) => i < 7)
    expect(outcomes[9].sessionResult).toMatchObject({ correct: 7, total: 10 })
    expect(record.lv3.sessions).toHaveLength(1)
    expect(record.sessions).toHaveLength(0)
    expect(record.lv2.sessions).toHaveLength(0)
  })

  it('Lv3 で9問以上正解すると学習中の字が2字増える', () => {
    expect(playFlash(initialRecord(), 10, () => true).record.learningCount).toBe(10)
  })

  it('取り違えた2字が3問以内に見本として出る', () => {
    for (let seed = 0; seed < 20; seed++) {
      const { targets, picks } = playFlash(initialRecord(), 4, (i) => i !== 0, seed)
      expect(targets.slice(1, 4), `seed ${seed}`).toContain(targets[0])
      expect(targets.slice(1, 4), `seed ${seed}`).toContain(picks[0])
    }
  })
})

describe('記録の読み戻し（Lv3 追加後）', () => {
  it('Lv3 の進み具合も読み戻せる', () => {
    const { record } = playFlash(initialRecord(), 13, (i) => i % 4 !== 0)
    expect(restoreRecord(JSON.parse(JSON.stringify(record)))).toEqual(record)
  })

  it('Lv3 を持たない以前の記録は、Lv3 を初期状態で始める', () => {
    const old = JSON.parse(JSON.stringify(initialRecord()))
    delete old.lv3
    old.learningCount = 12
    const r = restoreRecord(old)
    expect(r.learningCount).toBe(12)
    expect(r.lv3).toEqual(initialRecord().lv3)
  })
})
