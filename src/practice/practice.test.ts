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
    const good = JSON.parse(JSON.stringify(play(initialRecord(), 10, () => true).record))
    for (const session of [
      { correct: 0, total: 0, averageMs: 0 },
      { correct: 5, total: 3, averageMs: 1000 },
    ]) {
      const broken = { ...good, sessions: [session] }
      expect(restoreRecord(broken)).toEqual(initialRecord())
    }
    const badStats = { ...good, stats: { 一: { seen: 1, correct: 1, lastMs: 'fast' } } }
    expect(restoreRecord(badStats)).toEqual(initialRecord())
  })

  it('直近の回答時間を持たない以前の記録も読み戻せる', () => {
    const old = { ...initialRecord(), stats: { 一: { seen: 2, correct: 1 } } }
    expect(restoreRecord(old)).toEqual(old)
  })
})

describe('字ごとの記録', () => {
  it('見本ごとに出た回数・正解数・直近の回答時間が残る', () => {
    let record = initialRecord()
    const q = nextQuestion(record, testData, seededRng(7))
    record = answer(record, testData, q, q.target, 1500).record
    expect(record.stats[q.target]).toEqual({ seen: 1, correct: 1, lastMs: 1500 })
    record = answer(record, testData, q, q.choices.find((c) => c !== q.target)!, 2500).record
    expect(record.stats[q.target]).toEqual({ seen: 2, correct: 1, lastMs: 2500 })
  })
})

describe('取り違え', () => {
  /** 最初の問題だけ、指定した字を選んで取り違える */
  function mixUpThenCorrect(seed: number, pickedOf: (q: { target: string; choices: string[] }) => string) {
    const rng = seededRng(seed)
    let record = initialRecord()
    const q = nextQuestion(record, testData, rng)
    const picked = pickedOf(q)
    record = answer(record, testData, q, picked, 1000).record
    const targets: string[] = []
    for (let i = 0; i < 3; i++) {
      const next = nextQuestion(record, testData, rng)
      targets.push(next.target)
      record = answer(record, testData, next, next.target, 1000).record
    }
    return { target: q.target, picked, targets, record }
  }

  it('取り違えた2字が、次の3問以内にどちらも見本として出る', () => {
    for (let seed = 0; seed < 30; seed++) {
      const r = mixUpThenCorrect(seed, (q) => q.choices.find((c) => c !== q.target)!)
      expect(r.targets, `seed ${seed}`).toContain(r.target)
      expect(r.targets, `seed ${seed}`).toContain(r.picked)
    }
  })

  it('選んだ字が学習中の字でなくても再出題するが、学習中の字には加えない', () => {
    const outside = testData.order[10] // 学習中の8字の外
    const r = mixUpThenCorrect(2, () => outside)
    expect(r.targets).toContain(outside)
    expect(r.record.learningCount).toBe(8)
  })

  it('続けて取り違えても、最後の取り違えの2字が次の3問以内に出て、待ちの字はすべていずれ出る', () => {
    for (let seed = 0; seed < 30; seed++) {
      const rng = seededRng(seed)
      let record = initialRecord()
      const everPending = new Set<string>()
      let last = { target: '', picked: '' }
      for (let i = 0; i < 4; i++) {
        const q = nextQuestion(record, testData, rng)
        const picked = q.choices.find((c) => c !== q.target)!
        record = answer(record, testData, q, picked, 1000).record
        everPending.add(q.target).add(picked)
        last = { target: q.target, picked }
      }
      const targets: string[] = []
      for (let i = 0; i < 12; i++) {
        const q = nextQuestion(record, testData, rng)
        targets.push(q.target)
        record = answer(record, testData, q, q.target, 1000).record
      }
      expect(targets.slice(0, 3), `seed ${seed}`).toContain(last.target)
      expect(targets.slice(0, 3), `seed ${seed}`).toContain(last.picked)
      for (const c of everPending) expect(targets, `seed ${seed} ${c}`).toContain(c)
      expect(record.pendingReview, `seed ${seed}`).toEqual([])
    }
  })

  it('再出題待ちは練習記録に残り、読み戻しても保たれる', () => {
    const rng = seededRng(4)
    const q = nextQuestion(initialRecord(), testData, rng)
    const { record } = answer(initialRecord(), testData, q, q.choices.find((c) => c !== q.target)!, 900)
    expect(restoreRecord(JSON.parse(JSON.stringify(record)))).toEqual(record)
    const again = nextQuestion(restoreRecord(JSON.parse(JSON.stringify(record))), testData, seededRng(9))
    expect(again.target).not.toBe(q.target) // 直前の見本は続けて出さない
  })
})

describe('選択肢数', () => {
  it('5問続けて正解すると 4→6→8 と上がり、8より上がらない', () => {
    const counts = [0, 4, 5, 9, 10, 14, 15, 30].map((n) => play(initialRecord(), n, () => true).record.choiceCount)
    expect(counts).toEqual([4, 4, 6, 6, 8, 8, 8, 8])
  })

  it('取り違えると1段下がり、4より下がらない', () => {
    const at8 = play(initialRecord(), 10, () => true).record
    expect(play(at8, 1, () => false).record.choiceCount).toBe(6)
    expect(play(at8, 2, () => false).record.choiceCount).toBe(4)
    expect(play(at8, 3, () => false).record.choiceCount).toBe(4)
  })

  it('取り違えると連続正解数は数え直しになる', () => {
    // 4問正解 → 取り違え → 4問正解 では上がらない
    expect(play(initialRecord(), 9, (i) => i !== 4).record.choiceCount).toBe(4)
  })

  it('選んだ選択肢数どおりの字が並ぶ', () => {
    const at6 = play(initialRecord(), 5, () => true).record
    expect(nextQuestion(at6, testData, seededRng(1)).choices).toHaveLength(6)
  })
})

describe('学習中の字', () => {
  it('練習回で9問以上正解すると出題順の次の2字が加わる', () => {
    expect(play(initialRecord(), 10, (i) => i !== 0).record.learningCount).toBe(10)
    expect(play(initialRecord(), 10, () => true).record.learningCount).toBe(10)
  })

  it('8問以下の正解では加わらない', () => {
    expect(play(initialRecord(), 10, (i) => i > 1).record.learningCount).toBe(8)
  })

  it('練習回の途中では加わらない', () => {
    expect(play(initialRecord(), 9, () => true).record.learningCount).toBe(8)
  })

  it('出題順の最後に達しても止まらず、それ以上は増えない', () => {
    const { record } = play(initialRecord(), 100, () => true)
    expect(record.learningCount).toBe(testData.order.length)
    expect(record.sessions).toHaveLength(10)
  })
})
