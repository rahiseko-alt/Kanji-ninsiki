// 練習回（仕様 rahiseko-alt/Kanji-ninsiki#36）。記録を持たず、1回の練習の中で完結する（ADR-0005）。
// 画面・保存・時計には触れない。数値の根拠は docs/research/redesign-evidence.md
import type { KanjiData } from '../data/buildKanjiData.ts'
import { shuffle, type Question, type Rng } from './question.ts'
import type { Stage } from './practice.ts'

/** 同時に練習する字の数（短期記憶の容量 約4: Cowan 2001、習得量 2〜4: Burns & Dean 2005） */
const LEARNING_SIZE = 4
/** この回数正解した字は学習中の字から外す（Rawson & Dunlosky 2011） */
const CORRECT_TO_RETIRE = 3
/** 同じ字のあいだに最低はさむ問題数（Mettler & Kellman 2014 など） */
const MIN_GAP = 2
/** この数だけ続けて正解すると1段難しくする（4問連続→正答率 約84%: Levitt 1971） */
const STREAK_TO_RAISE = 4
/** 開始の段（下から2段目。やや易しく始める: Wisniewski ら 2019） */
const START_STEP = 1
/** 1回の問題数（約8分: Molloy ら 2012） */
const QUESTIONS = 60
/** 出題範囲の区切り（レベル1〜3の先頭。よく使う順） */
const RANGE_STARTS = [0, 500, 1000]

/** Lv1 の難しさの段: 選択肢の数と、紛らわし字をよく似た字から選ぶか */
const CHOICE_STEPS = [
  { count: 4, similar: false },
  { count: 4, similar: true },
  { count: 6, similar: true },
  { count: 8, similar: true },
]

export type SessionQuestion = Question & {
  /** いま何問目か（1から） */
  number: number
  /** 全体の問題数 */
  total: number
}

type Learning = { char: string; correct: number }
type Review = { char: string; due: number }

export type Session = {
  stage: Stage
  /** 出題範囲の字 */
  range: string[]
  /** まだ使っていない出題範囲の字（ランダムな並び） */
  unused: string[]
  learning: Learning[]
  /** 取り違えた字の出し直し。due 問目以降に出す */
  reviews: Review[]
  /** 字 → 最後に見本に出した問題の番号（0から） */
  lastShown: Record<string, number>
  step: number
  streak: number
  answered: number
  correct: number
  totalMs: number
  current: SessionQuestion | null
}

export type SessionResult = { correct: number; total: number; averageMs: number }

/** 練習回を始める。startAt はレベルの先頭（0・500・1000） */
export function startSession(data: KanjiData, stage: Stage, startAt: number, rng: Rng): Session {
  const end = RANGE_STARTS.find((s) => s > startAt) ?? data.order.length
  const range = data.order.slice(startAt, Math.min(end, data.order.length))
  const unused = shuffle(range, rng)
  const learning = unused.splice(0, LEARNING_SIZE).map((char) => ({ char, correct: 0 }))
  const session: Session = {
    stage,
    range,
    unused,
    learning,
    reviews: [],
    lastShown: {},
    step: START_STEP,
    streak: 0,
    answered: 0,
    correct: 0,
    totalMs: 0,
    current: null,
  }
  return { ...session, current: nextQuestion(session, data, rng) }
}

export function currentQuestion(session: Session): SessionQuestion | null {
  return session.current
}

export function isFinished(session: Session): boolean {
  return session.current === null
}

export function sessionResult(session: Session): SessionResult {
  return {
    correct: session.correct,
    total: session.answered,
    averageMs: session.answered > 0 ? session.totalMs / session.answered : 0,
  }
}

/** いまの問題に答える。picked は選んだ字、ms は答えるまでの時間 */
export function answerSession(
  session: Session,
  data: KanjiData,
  picked: string,
  ms: number,
  rng: Rng,
): { session: Session; correct: boolean } {
  const q = session.current
  if (!q) return { session, correct: false }
  const index = session.answered
  const correct = picked === q.target

  let learning = session.learning
  let unused = session.unused
  let reviews = session.reviews.filter((r) => r.char !== q.target)
  if (correct) {
    learning = learning.map((l) => (l.char === q.target ? { ...l, correct: l.correct + 1 } : l))
    const retired = learning.find((l) => l.char === q.target && l.correct >= CORRECT_TO_RETIRE)
    if (retired) {
      learning = learning.filter((l) => l !== retired)
      if (unused.length > 0) {
        learning = [...learning, { char: unused[0], correct: 0 }]
        unused = unused.slice(1)
      }
    }
  } else {
    // 見本と選んだ字の両方を、間に MIN_GAP 問以上空けて出し直す（選んだ字は出題範囲の字のときだけ）
    const due = index + MIN_GAP + 1
    reviews = [...reviews.filter((r) => r.char !== picked), { char: q.target, due }]
    if (picked !== q.target && session.range.includes(picked)) reviews.push({ char: picked, due })
  }

  const streak = correct ? session.streak + 1 : 0
  const raise = correct && streak >= STREAK_TO_RAISE
  const step = correct
    ? Math.min(session.step + (raise ? 1 : 0), CHOICE_STEPS.length - 1)
    : Math.max(session.step - 1, 0)

  const next: Session = {
    ...session,
    learning,
    unused,
    reviews,
    lastShown: { ...session.lastShown, [q.target]: index },
    step,
    streak: raise ? 0 : streak,
    answered: index + 1,
    correct: session.correct + (correct ? 1 : 0),
    totalMs: session.totalMs + ms,
  }
  return { session: { ...next, current: nextQuestion(next, data, rng) }, correct }
}

function nextQuestion(session: Session, data: KanjiData, rng: Rng): SessionQuestion | null {
  const index = session.answered
  if (index >= QUESTIONS) return null
  const target = pickTarget(session, data, index)
  const { count, similar } = CHOICE_STEPS[session.step]
  const distractors = similar
    ? data.kanji[target].distractors.slice(0, count - 1)
    : dissimilarTo(target, data, count - 1, rng)
  return { target, choices: shuffle([target, ...distractors], rng), number: index + 1, total: QUESTIONS }
}

/** 出し直しの時期が来た字を先に。無ければ学習中の字のうち、いちばん長く出ていない字（同じなら画数の少ない字） */
function pickTarget(session: Session, data: KanjiData, index: number): string {
  const spaced = (c: string) => (session.lastShown[c] ?? -Infinity) < index - MIN_GAP
  const review = session.reviews.find((r) => r.due <= index && spaced(r.char))
  if (review) return review.char
  const byAge = (a: string, b: string) =>
    (session.lastShown[a] ?? -Infinity) - (session.lastShown[b] ?? -Infinity) ||
    data.kanji[a].strokes - data.kanji[b].strokes
  // 出し直し待ちの字は、その時期が来るまで出さない
  const waiting = new Set(session.reviews.map((r) => r.char))
  const chars = session.learning.map((l) => l.char).filter((c) => !waiting.has(c))
  if (chars.length === 0) return [...session.reviews].sort((a, b) => a.due - b.due)[0].char
  // 間を空けられる字が無いとき（出せる字が少ないとき）は、いちばん古い字を出す
  return (chars.filter(spaced).sort(byAge)[0] ?? [...chars].sort(byAge)[0])!
}

/** 似ていない字: 紛らわし字候補に入っていない常用漢字からランダムに */
function dissimilarTo(target: string, data: KanjiData, n: number, rng: Rng): string[] {
  const similar = new Set([target, ...data.kanji[target].distractors])
  const picked: string[] = []
  while (picked.length < n) {
    const c = data.order[Math.floor(rng() * data.order.length)]
    if (!similar.has(c) && !picked.includes(c)) picked.push(c)
  }
  return picked
}
