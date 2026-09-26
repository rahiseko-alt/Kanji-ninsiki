// 練習回（仕様 rahiseko-alt/Kanji-ninsiki#36）。記録を持たず、1回の練習の中で完結する（ADR-0005）。
// 画面・保存・時計には触れない。数値の根拠は docs/research/redesign-evidence.md
import type { KanjiData, Parts } from '../data/buildKanjiData.ts'

/** 段階（画面ではモード）。lv1 1つさがす・lv2 ぜんぶさがす・lv3 いっしゅんみる・lv4 ちがうじ・lv5 くみたてる */
export type Stage = 'lv1' | 'lv2' | 'lv3' | 'lv4' | 'lv5'

/** 0以上1未満を返す乱数 */
export type Rng = () => number

function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

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
/** 1回の問題数（約8分: Molloy ら 2012）。盤面の段階は1問に時間がかかるので面の数 */
const QUESTIONS: Record<Stage, number> = { lv1: 60, lv2: 20, lv3: 60, lv4: 20, lv5: 60 }
/** 出題範囲の区切り（レベル1〜3の先頭。よく使う順） */
export const RANGE_STARTS = [0, 500, 1000] as const
/** Lv3 で見本を見せる時間（利用者の指定で固定） */
const FLASH_MS = 1000

/** Lv1・Lv3・Lv5 の難しさの段: 選択肢の数と、紛らわし字をよく似た字から選ぶか（似ている度合いを先に: Duncan & Humphreys 1989） */
const CHOICE_STEPS = [
  { count: 4, similar: false },
  { count: 4, similar: true },
  { count: 6, similar: true },
  { count: 8, similar: true },
]
/** Lv2 の難しさの段: 盤面の字数 */
const BOARD_STEPS = [9, 12, 16]
/** Lv4 の難しさの段: 仲間はずれの似ている度合いと、盤面の字数 */
const ODD_STEPS = [
  { similar: false, size: 9 },
  { similar: false, size: 16 },
  { similar: true, size: 9 },
  { similar: true, size: 16 },
]
/** 紛らわし字候補のうち「よく似た字」とみなす上位の数（残りを「少し似た字」とする） */
const CLOSEST = 3
/** Lv2 の盤面を埋める紛らわし字は、似ている順の上位からこの数の中で選ぶ（重複あり） */
const BOARD_DISTRACTOR_POOL = 6

type Numbered = {
  /** いま何問目か（1から） */
  number: number
  /** 全体の問題数 */
  total: number
}

/** 選択肢から1字を選ぶ問題（Lv1・Lv3・Lv5）。Lv3 は showMs だけ見本を見せる、Lv5 は見本の代わりに部品を見せる */
export type ChoiceQuestion = Numbered & {
  kind: 'choice'
  target: string
  choices: string[]
  showMs?: number
  parts?: Parts
}
/** 盤面から見本と同じ字を全部選ぶ問題（Lv2） */
export type BoardQuestion = Numbered & { kind: 'board'; target: string; board: string[] }
/** 同じ字の並ぶ盤面から仲間はずれを選ぶ問題（Lv4） */
export type OddQuestion = Numbered & { kind: 'odd'; target: string; odd: string; oddIndex: number; board: string[] }
export type SessionQuestion = ChoiceQuestion | BoardQuestion | OddQuestion

/** 答え: 選んだ字（Lv1・3・5）、盤面で選んだ位置（Lv2）、選んだ位置（Lv4） */
export type SessionAnswer = string | { selected: number[] } | { index: number }

type Learning = { char: string; correct: number }
type Review = { char: string; due: number }

export type Session = {
  stage: Stage
  /** 出題範囲のうち、この段階で出せる字 */
  range: string[]
  /** まだ使っていない出題範囲の字（ランダムな並び） */
  unused: string[]
  learning: Learning[]
  /** 取り違え・見落としの出し直し。due 問目以降に出す */
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

/** 練習回を始める。startAt はレベルの先頭（0・500・1000）。Lv5 は部品に分かれる字だけを出す */
export function startSession(data: KanjiData, stage: Stage, startAt: number, rng: Rng): Session {
  const end = RANGE_STARTS.find((s) => s > startAt) ?? data.order.length
  const eligible = (c: string) => stage !== 'lv5' || data.kanji[c].parts !== undefined
  const range = data.order.slice(startAt, Math.min(end, data.order.length)).filter(eligible)
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

/** 出題範囲に出せる字が1字も無いとき（Lv5 で部品に分かれる字が無い範囲）は true */
export function isEmpty(session: Session): boolean {
  return session.range.length === 0
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

/** いまの問題に答える。ms は答えるまでの時間 */
export function answerSession(
  session: Session,
  data: KanjiData,
  answer: SessionAnswer,
  ms: number,
  rng: Rng,
): { session: Session; correct: boolean } {
  const q = session.current
  if (!q) return { session, correct: false }
  const index = session.answered
  const { correct, confused } = judge(q, answer)

  let learning = session.learning
  let unused = session.unused
  let reviews = session.reviews.filter((r) => r.char !== q.target)
  if (correct) {
    learning = learning.map((l) => (l.char === q.target ? { ...l, correct: l.correct + 1 } : l))
    const retired = learning.find((l) => l.char === q.target && l.correct >= CORRECT_TO_RETIRE)
    if (retired) {
      learning = learning.filter((l) => l !== retired)
      // 出題範囲を使い切ったら（出せる字が少ない範囲）、学習中でない字をもう一度使う
      if (unused.length === 0) unused = shuffle(session.range.filter((c) => !learning.some((l) => l.char === c)), rng)
      if (unused.length > 0) {
        learning = [...learning, { char: unused[0], correct: 0 }]
        unused = unused.slice(1)
      }
    }
  } else {
    // 見本と取り違えた字の両方を、間に MIN_GAP 問以上空けて出し直す（取り違えた字は出題範囲の字のときだけ）
    const due = index + MIN_GAP + 1
    const again = [...new Set([q.target, ...confused.filter((c) => session.range.includes(c))])]
    reviews = [...reviews.filter((r) => !again.includes(r.char)), ...again.map((char) => ({ char, due }))]
  }

  const steps = stepsOf(session.stage)
  const streak = correct ? session.streak + 1 : 0
  const raise = correct && streak >= STREAK_TO_RAISE
  const step = correct ? Math.min(session.step + (raise ? 1 : 0), steps - 1) : Math.max(session.step - 1, 0)

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

/** 正しいか、と取り違えた字（出し直す字）。Lv2 は、違う字を選ぶか見本を選び残すと誤り */
function judge(q: SessionQuestion, answer: SessionAnswer): { correct: boolean; confused: string[] } {
  if (q.kind === 'board') {
    const selected = typeof answer === 'object' && 'selected' in answer ? answer.selected : []
    const wrong = selected.filter((i) => q.board[i] !== q.target).map((i) => q.board[i])
    const missed = q.board.some((c, i) => c === q.target && !selected.includes(i))
    return { correct: wrong.length === 0 && !missed, confused: wrong }
  }
  if (q.kind === 'odd') {
    const index = typeof answer === 'object' && 'index' in answer ? answer.index : -1
    return { correct: index === q.oddIndex, confused: [q.odd] }
  }
  const picked = typeof answer === 'string' ? answer : ''
  return { correct: picked === q.target, confused: [picked] }
}

function stepsOf(stage: Stage): number {
  return stage === 'lv2' ? BOARD_STEPS.length : stage === 'lv4' ? ODD_STEPS.length : CHOICE_STEPS.length
}

function nextQuestion(session: Session, data: KanjiData, rng: Rng): SessionQuestion | null {
  const index = session.answered
  const total = QUESTIONS[session.stage]
  if (index >= total || session.range.length === 0) return null
  const target = pickTarget(session, data, index)
  const numbered = { number: index + 1, total }
  const distractors = data.kanji[target].distractors

  if (session.stage === 'lv2') {
    const size = BOARD_STEPS[session.step]
    const copies = 2 + Math.floor(rng() * 3)
    const pool = distractors.slice(0, BOARD_DISTRACTOR_POOL)
    const fillers = Array.from({ length: size - copies }, () => pool[Math.floor(rng() * pool.length)])
    const board = shuffle([...Array<string>(copies).fill(target), ...fillers], rng)
    return { kind: 'board', target, board, ...numbered }
  }
  if (session.stage === 'lv4') {
    const { similar, size } = ODD_STEPS[session.step]
    const pool = similar ? distractors.slice(0, CLOSEST) : distractors.slice(CLOSEST)
    const odd = pool[Math.floor(rng() * pool.length)]
    const oddIndex = Math.floor(rng() * size)
    const board = Array.from({ length: size }, (_, i) => (i === oddIndex ? odd : target))
    return { kind: 'odd', target, odd, oddIndex, board, ...numbered }
  }

  const { count, similar } = CHOICE_STEPS[session.step]
  const others = similar ? distractors.slice(0, count - 1) : dissimilarTo(target, data, count - 1, rng)
  const question: ChoiceQuestion = { kind: 'choice', target, choices: shuffle([target, ...others], rng), ...numbered }
  if (session.stage === 'lv3') question.showMs = FLASH_MS
  if (session.stage === 'lv5') question.parts = data.kanji[target].parts
  return question
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
  const fresh = chars.filter(spaced).sort(byAge)[0]
  if (fresh) return fresh
  // 学習中の字がみな出し直し待ちなら、間を空けられる出し直しの字を時期の早い順に前倒しする
  const byDue = [...session.reviews].sort((a, b) => a.due - b.due).map((r) => r.char)
  const early = byDue.find(spaced)
  if (early) return early
  // 間を空けられる字が無いとき（出せる字が少ないとき）は、いちばん古い字を出す
  return [...chars, ...byDue].sort(byAge)[0]
}

/** 似ていない字: 紛らわし字候補に入っていない常用漢字からランダムに（足りなければ紛らわし字候補で埋める） */
function dissimilarTo(target: string, data: KanjiData, n: number, rng: Rng): string[] {
  const similar = new Set([target, ...data.kanji[target].distractors])
  const picked: string[] = []
  for (let tries = 0; picked.length < n && tries < n * 50; tries++) {
    const c = data.order[Math.floor(rng() * data.order.length)]
    if (!similar.has(c) && !picked.includes(c)) picked.push(c)
  }
  const rest = [...data.order.filter((c) => !similar.has(c) && !picked.includes(c)), ...data.kanji[target].distractors]
  return [...picked, ...rest.slice(0, n - picked.length)]
}
