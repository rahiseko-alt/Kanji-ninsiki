import { describe, expect, it } from 'vitest'
import { answer, initialRecord, nextQuestion, restoreRecord, type PracticeRecord } from './practice.ts'
import { seededRng, testData } from './testData.ts'

/** n問を、正解するかどうかを決めて解き進める */
function play(record: PracticeRecord, n: number, isCorrect: (i: number) => boolean, seed = 1) {
  const rng = seededRng(seed)
  const targets: string[] = []
  const results = []
  for (let i = 0; i < n; i++) {
    const q = nextQuestion(record, testData, rng)
    targets.push(q.target)
    const picked = isCorrect(i) ? q.target : q.choices.find((c) => c !== q.target)!
    const r = answer(record, testData, q, picked, 1000 + i)
    record = r.record
    results.push(r)
  }
  return { record, targets, results }
}

describe('練習回', () => {
  it('最初の練習回の見本は出題順の先頭8字だけから出る', () => {
    const { targets } = play(initialRecord(), 10, () => true)
    const first8 = testData.order.slice(0, 8)
    for (const t of targets) expect(first8).toContain(t)
  })

  it('直前2問と同じ見本は出ない', () => {
    const { targets } = play(initialRecord(), 200, () => true, 3)
    for (let i = 2; i < targets.length; i++) {
      expect(targets[i]).not.toBe(targets[i - 1])
      expect(targets[i]).not.toBe(targets[i - 2])
    }
  })

  it('10問で終わり、正解数と平均時間がわかる', () => {
    const { results, record } = play(initialRecord(), 10, (i) => i < 7)
    expect(results.slice(0, 9).every((r) => r.sessionResult === undefined)).toBe(true)
    expect(results[9].sessionResult).toEqual({ correct: 7, total: 10, averageMs: 1004.5 })
    expect(record.sessions).toHaveLength(1)
  })

  it('正誤を返す', () => {
    const { results } = play(initialRecord(), 2, (i) => i === 0)
    expect(results.map((r) => r.correct)).toEqual([true, false])
  })

  it('正答率の低い字ほど見本に選ばれやすい', () => {
    const record = initialRecord()
    for (const c of testData.order.slice(0, 8)) record.stats[c] = { seen: 10, correct: 10 }
    record.stats['三'] = { seen: 10, correct: 0 }
    const rng = seededRng(5)
    const counts: Record<string, number> = {}
    for (let i = 0; i < 2000; i++) {
      const t = nextQuestion(record, testData, rng).target
      counts[t] = (counts[t] ?? 0) + 1
    }
    const others = testData.order.slice(0, 8).filter((c) => c !== '三')
    for (const c of others) expect(counts['三']).toBeGreaterThan(counts[c] * 2)
  })
})

describe('練習記録の読み戻し', () => {
  it('保存した記録を読み戻すと同じ記録になる', () => {
    const { record } = play(initialRecord(), 13, (i) => i % 3 !== 0)
    expect(restoreRecord(JSON.parse(JSON.stringify(record)))).toEqual(record)
  })

  it('読めない・壊れた記録は初期状態として扱う', () => {
    for (const broken of [null, undefined, 'x', 42, [], { learningCount: 'many' }, { stats: 3 }]) {
      expect(restoreRecord(broken)).toEqual(initialRecord())
    }
  })
})
