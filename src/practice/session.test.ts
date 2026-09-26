import { describe, expect, it } from 'vitest'
import type { KanjiData } from '../data/buildKanjiData.ts'
import {
  answerSession,
  currentQuestion,
  isEmpty,
  isFinished,
  sessionResult,
  startSession,
  type BoardQuestion,
  type ChoiceQuestion,
  type OddQuestion,
  type Session,
} from './session.ts'
import { seededRng } from './seededRng.ts'

/** 出題順が length 字の、テスト用の出題用データ。紛らわし字は出題順で近い10字、画数は出題順と逆（後ろほど単純） */
function makeData(length: number): KanjiData {
  const order = Array.from({ length }, (_, i) => String.fromCodePoint(0x4e00 + i * 3))
  const near = (i: number) =>
    [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8, 9, -9, 10, -10]
      .map((d) => i + d)
      .filter((j) => j >= 0 && j < length)
      .slice(0, 10)
      .map((j) => order[j])
  return {
    order,
    kanji: Object.fromEntries(order.map((c, i) => [c, { strokes: length - i, distractors: near(i) }])),
  }
}

type Play = { targets: string[]; choices: string[][]; session: Session }

/** Lv1 の練習回を、正解するかどうかを決めて最後まで（または n 問）解き進める */
function play(
  data: KanjiData,
  isCorrect: (i: number) => boolean,
  opts: { startAt?: number; seed?: number; n?: number; stage?: 'lv1' | 'lv3' | 'lv5' } = {},
): Play {
  const rng = seededRng(opts.seed ?? 1)
  let session = startSession(data, opts.stage ?? 'lv1', opts.startAt ?? 0, rng)
  const targets: string[] = []
  const choices: string[][] = []
  for (let i = 0; i < (opts.n ?? Infinity) && !isFinished(session); i++) {
    const q = currentQuestion(session) as ChoiceQuestion
    targets.push(q.target)
    choices.push(q.choices)
    const picked = isCorrect(i) ? q.target : q.choices.find((c) => c !== q.target)!
    session = answerSession(session, data, picked, 1000 + i, rng).session
  }
  return { targets, choices, session }
}

const data = makeData(40)

describe('練習回（Lv1）', () => {
  it('選んだ出題範囲の字だけが見本に出る', () => {
    const big = makeData(1200)
    const { targets } = play(big, (i) => i % 3 !== 0, { startAt: 500 })
    for (const t of targets) {
      const i = big.order.indexOf(t)
      expect(i).toBeGreaterThanOrEqual(500)
      expect(i).toBeLessThan(1000)
    }
  })

  it('同時に練習するのは4字（最初の8問に出るのはちょうど4字）', () => {
    const { targets } = play(data, () => true, { n: 8 })
    expect(new Set(targets).size).toBe(4)
  })

  it('学習中の字は単純な形（画数の少ない字）から出す', () => {
    for (const seed of [1, 2, 3]) {
      const { targets } = play(data, () => true, { n: 4, seed })
      const strokes = targets.map((t) => data.kanji[t].strokes)
      expect(strokes).toEqual([...strokes].sort((a, b) => a - b))
    }
  })

  it('練習回ごとに違う字を選ぶ（範囲からランダム）', () => {
    const a = play(data, () => true, { n: 4, seed: 1 }).targets
    const b = play(data, () => true, { n: 4, seed: 7 }).targets
    expect(new Set(a)).not.toEqual(new Set(b))
  })

  it('同じ字は、間に2問以上はさまずに出ない', () => {
    for (const correct of [() => true, (i: number) => i % 4 !== 1, (i: number) => i % 2 === 0]) {
      const { targets } = play(data, correct, { seed: 5 })
      for (let i = 1; i < targets.length; i++) {
        expect(targets[i], `${i}`).not.toBe(targets[i - 1])
        if (i >= 2) expect(targets[i], `${i}`).not.toBe(targets[i - 2])
      }
    }
  })

  it('学習中の字どうしを取り違え続けても、同じ字は間に2問以上はさむ', () => {
    // 5字だけの範囲: 学習中の4字が、互いの紛らわし字になる
    const small = makeData(5)
    const rng = seededRng(7)
    let session = startSession(small, 'lv1', 0, rng)
    const targets: string[] = []
    for (let i = 0; i < 20; i++) {
      const q = currentQuestion(session) as ChoiceQuestion
      targets.push(q.target)
      const learning = session.learning.map((l) => l.char)
      const picked =
        q.choices.find((c) => c !== q.target && learning.includes(c)) ?? q.choices.find((c) => c !== q.target)!
      session = answerSession(session, small, picked, 900, rng).session
    }
    for (let i = 1; i < targets.length; i++) {
      expect(targets[i], `${i}`).not.toBe(targets[i - 1])
      if (i >= 2) expect(targets[i], `${i}`).not.toBe(targets[i - 2])
    }
  })

  it('3回正解した字は外れて、新しい字が入る', () => {
    const { targets } = play(data, () => true)
    const counts = new Map<string, number>()
    for (const t of targets) counts.set(t, (counts.get(t) ?? 0) + 1)
    for (const [t, n] of counts) expect(n, t).toBeLessThanOrEqual(3)
    // 最初の4字は3回ずつ出て外れる
    for (const t of targets.slice(0, 4)) expect(counts.get(t), t).toBe(3)
    expect(counts.size).toBeGreaterThanOrEqual(18)
  })

  it('取り違えたら、見本と選んだ字の両方を、間に2問以上空けて近いうちに出し直す', () => {
    const rng = seededRng(3)
    let session = startSession(data, 'lv1', 0, rng)
    const q = currentQuestion(session) as ChoiceQuestion
    const picked = q.choices.find((c) => c !== q.target)!
    session = answerSession(session, data, picked, 900, rng).session
    const after: string[] = []
    for (let i = 0; i < 8; i++) {
      const next = currentQuestion(session)!
      after.push(next.target)
      session = answerSession(session, data, next.target, 900, rng).session
    }
    for (const c of [q.target, picked]) {
      const at = after.indexOf(c)
      expect(at, c).toBeGreaterThanOrEqual(2)
      expect(at, c).toBeLessThan(6)
    }
  })

  it('やや易しい段（よく似た字の4択）から始まる', () => {
    const q = currentQuestion(startSession(data, 'lv1', 0, seededRng(1))) as ChoiceQuestion
    expect(q.choices).toHaveLength(4)
    for (const c of q.choices) if (c !== q.target) expect(data.kanji[q.target].distractors).toContain(c)
  })

  it('4問続けて正解すると1段上がる（6択 → 8択）', () => {
    const { choices } = play(data, () => true, { n: 9 })
    expect(choices.map((c) => c.length)).toEqual([4, 4, 4, 4, 6, 6, 6, 6, 8])
  })

  it('取り違えると1段下がり、いちばん易しい段では似ていない字の4択になる', () => {
    // 1問目で取り違え → 2問目は下の段
    const { targets, choices } = play(data, (i) => i !== 0, { n: 2 })
    expect(choices[1]).toHaveLength(4)
    const distractors = data.kanji[targets[1]].distractors
    for (const c of choices[1]) if (c !== targets[1]) expect(distractors).not.toContain(c)
  })

  it('いちばん上の段（8択）より上がらず、いちばん下の段より下がらない', () => {
    const up = play(data, () => true).choices.map((c) => c.length)
    expect(Math.max(...up)).toBe(8)
    const down = play(data, () => false, { n: 10 }).choices.map((c) => c.length)
    expect(Math.min(...down)).toBe(4)
  })

  it('60問で終わり、正解数と平均時間を返す', () => {
    const { targets, session } = play(data, (i) => i % 5 !== 0)
    expect(targets).toHaveLength(60)
    expect(isFinished(session)).toBe(true)
    expect(currentQuestion(session)).toBeNull()
    // 答えた時間は 1000, 1001, …, 1059 ms
    expect(sessionResult(session)).toEqual({ correct: 48, total: 60, averageMs: 1029.5 })
  })

  it('問題には、いま何問目か（1から）と全体の問題数がつく', () => {
    const rng = seededRng(1)
    let session = startSession(data, 'lv1', 0, rng)
    expect(currentQuestion(session)).toMatchObject({ number: 1, total: 60 })
    const q = currentQuestion(session)!
    session = answerSession(session, data, q.target, 900, rng).session
    expect(currentQuestion(session)).toMatchObject({ number: 2, total: 60 })
  })
})

describe('練習回（Lv3）', () => {
  it('見本は1秒見せる', () => {
    const q = currentQuestion(startSession(data, 'lv3', 0, seededRng(1))) as ChoiceQuestion
    expect(q.showMs).toBe(1000)
  })

  it('難しさの段は Lv1 と同じく選択肢で上げ下げし、60問で終わる', () => {
    const { choices } = play(data, () => true, { stage: 'lv3' })
    expect(choices).toHaveLength(60)
    expect(choices.slice(0, 9).map((c) => c.length)).toEqual([4, 4, 4, 4, 6, 6, 6, 6, 8])
  })
})

describe('練習回（Lv5）', () => {
  /** 部品に分かれる字だけ parts を持たせる */
  function withParts(base: KanjiData, has: (i: number) => boolean): KanjiData {
    return {
      order: base.order,
      kanji: Object.fromEntries(
        base.order.map((c, i) => [
          c,
          has(i) ? { ...base.kanji[c], parts: { parts: ['亻', c] as [string, string], layout: 'row' as const } } : base.kanji[c],
        ]),
      ),
    }
  }

  it('部品に分かれない字は見本に出さず、見本には部品をつける', () => {
    const d = withParts(data, (i) => i % 2 === 0)
    const rng = seededRng(4)
    let s = startSession(d, 'lv5', 0, rng)
    for (let i = 0; i < 60; i++) {
      const q = currentQuestion(s) as ChoiceQuestion
      expect(d.kanji[q.target].parts, q.target).toBeDefined()
      expect(q.parts).toEqual(d.kanji[q.target].parts)
      s = answerSession(s, d, i % 3 ? q.target : q.choices.find((c) => c !== q.target)!, 900, rng).session
    }
    expect(isFinished(s)).toBe(true)
  })

  it('出せる字が4字に満たない範囲でも、60問を出し切る', () => {
    const d = withParts(data, (i) => i === 3 || i === 10)
    const { targets } = play(d, (i) => i % 4 !== 0, { stage: 'lv5' })
    expect(targets).toHaveLength(60)
    expect(new Set(targets)).toEqual(new Set([d.order[3], d.order[10]]))
  })

  it('範囲に出せる字が1字も無ければ、問題を出さない', () => {
    const s = startSession(withParts(data, () => false), 'lv5', 0, seededRng(1))
    expect(isEmpty(s)).toBe(true)
    expect(currentQuestion(s)).toBeNull()
  })

  it('取り違えで選んだ字が部品に分かれない字なら、見本だけを出し直す', () => {
    const d = withParts(data, (i) => i % 2 === 0)
    const rng = seededRng(2)
    let s = startSession(d, 'lv5', 0, rng)
    const q = currentQuestion(s) as ChoiceQuestion
    const picked = q.choices.find((c) => c !== q.target && d.kanji[c].parts === undefined)
    if (!picked) return
    s = answerSession(s, d, picked, 900, rng).session
    const after: string[] = []
    for (let i = 0; i < 10; i++) {
      const next = currentQuestion(s) as ChoiceQuestion
      after.push(next.target)
      s = answerSession(s, d, next.target, 900, rng).session
    }
    expect(after).not.toContain(picked)
    expect(after).toContain(q.target)
  })
})

describe('練習回（Lv2）', () => {
  /** 盤面の見本の位置を全部選ぶ（correct=false のときは1つ選び残す） */
  const answerBoard = (q: BoardQuestion, correct: boolean) => {
    const all = q.board.flatMap((c, i) => (c === q.target ? [i] : []))
    return { selected: correct ? all : all.slice(1) }
  }

  it('盤面は下から2段目の12字から始まり、4面続けて正解すると16字、見落としで下がる', () => {
    const rng = seededRng(1)
    let s = startSession(data, 'lv2', 0, rng)
    const sizes: number[] = []
    const plan = [true, true, true, true, false, true]
    for (const ok of plan) {
      const q = currentQuestion(s) as BoardQuestion
      sizes.push(q.board.length)
      s = answerSession(s, data, answerBoard(q, ok), 900, rng).session
    }
    sizes.push((currentQuestion(s) as BoardQuestion).board.length)
    expect(sizes).toEqual([12, 12, 12, 12, 16, 12, 12])
  })

  it('いちばん易しい段は9字', () => {
    const rng = seededRng(1)
    let s = startSession(data, 'lv2', 0, rng)
    for (let i = 0; i < 2; i++) s = answerSession(s, data, answerBoard(currentQuestion(s) as BoardQuestion, false), 900, rng).session
    expect((currentQuestion(s) as BoardQuestion).board).toHaveLength(9)
  })

  it('見落とした見本は、間に2問以上空けて出し直す', () => {
    const rng = seededRng(6)
    let s = startSession(data, 'lv2', 0, rng)
    const q = currentQuestion(s) as BoardQuestion
    s = answerSession(s, data, answerBoard(q, false), 900, rng).session
    const after: string[] = []
    for (let i = 0; i < 6; i++) {
      const next = currentQuestion(s) as BoardQuestion
      after.push(next.target)
      s = answerSession(s, data, answerBoard(next, true), 900, rng).session
    }
    expect(after.indexOf(q.target)).toBeGreaterThanOrEqual(2)
  })

  it('見本でない字を選ぶと誤り', () => {
    const rng = seededRng(1)
    const s = startSession(data, 'lv2', 0, rng)
    const q = currentQuestion(s) as BoardQuestion
    const all = q.board.flatMap((c, i) => (c === q.target ? [i] : []))
    const other = q.board.findIndex((c) => c !== q.target)
    expect(answerSession(s, data, { selected: [...all, other] }, 900, rng).correct).toBe(false)
  })

  it('20面で終わる', () => {
    const rng = seededRng(1)
    let s = startSession(data, 'lv2', 0, rng)
    let n = 0
    while (!isFinished(s)) {
      s = answerSession(s, data, answerBoard(currentQuestion(s) as BoardQuestion, true), 900, rng).session
      n++
    }
    expect(n).toBe(20)
    expect(sessionResult(s)).toEqual({ correct: 20, total: 20, averageMs: 900 })
  })
})

describe('練習回（Lv4）', () => {
  it('段に従って、仲間はずれの似ている度合いと盤面の字数が変わる', () => {
    const rng = seededRng(2)
    let s = startSession(data, 'lv4', 0, rng)
    const seen: { size: number; close: boolean }[] = []
    for (let i = 0; i < 13; i++) {
      const q = currentQuestion(s) as OddQuestion
      const close = data.kanji[q.target].distractors.slice(0, 3).includes(q.odd)
      seen.push({ size: q.board.length, close })
      expect(q.board.filter((c) => c === q.odd)).toHaveLength(1)
      expect(q.board[q.oddIndex]).toBe(q.odd)
      s = answerSession(s, data, { index: q.oddIndex }, 900, rng).session
    }
    // 下から2段目（少し似た・16）→ よく似た・9 → よく似た・16
    expect(seen[0]).toEqual({ size: 16, close: false })
    expect(seen[4]).toEqual({ size: 9, close: true })
    expect(seen[8]).toEqual({ size: 16, close: true })
  })

  it('いちばん易しい段は、少し似た仲間はずれの9字', () => {
    const rng = seededRng(2)
    let s = startSession(data, 'lv4', 0, rng)
    const q = currentQuestion(s) as OddQuestion
    s = answerSession(s, data, { index: (q.oddIndex + 1) % q.board.length }, 900, rng).session
    const next = currentQuestion(s) as OddQuestion
    expect(next.board).toHaveLength(9)
    expect(data.kanji[next.target].distractors.slice(0, 3)).not.toContain(next.odd)
  })

  it('取り違えたら、並んでいた字と仲間はずれの両方を、間に2問以上空けて出し直す', () => {
    const rng = seededRng(3)
    let s = startSession(data, 'lv4', 0, rng)
    const q = currentQuestion(s) as OddQuestion
    s = answerSession(s, data, { index: (q.oddIndex + 1) % q.board.length }, 900, rng).session
    const after: string[] = []
    for (let i = 0; i < 8; i++) {
      const next = currentQuestion(s) as OddQuestion
      after.push(next.target)
      s = answerSession(s, data, { index: next.oddIndex }, 900, rng).session
    }
    for (const c of [q.target, q.odd]) {
      const at = after.indexOf(c)
      expect(at, c).toBeGreaterThanOrEqual(2)
      expect(at, c).toBeLessThan(6)
    }
  })

  it('20面で終わる', () => {
    const rng = seededRng(1)
    let s = startSession(data, 'lv4', 0, rng)
    let n = 0
    while (!isFinished(s)) {
      s = answerSession(s, data, { index: (currentQuestion(s) as OddQuestion).oddIndex }, 900, rng).session
      n++
    }
    expect(n).toBe(20)
  })
})
