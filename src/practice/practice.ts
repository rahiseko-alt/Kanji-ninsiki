// 練習の進め方（仕様書 rahiseko-alt/Kanji-ninsiki#2 モジュール2）。画面・保存・時計には触れない
import type { KanjiData } from '../data/buildKanjiData.ts'
import { createQuestion, type Question, type Rng } from './question.ts'

export const QUESTIONS_PER_SESSION = 10
const FIRST_LEARNING_COUNT = 8
const RECENT_EXCLUDED = 2

export type KanjiStats = { seen: number; correct: number }

export type SessionResult = { correct: number; total: number; averageMs: number }

export type PracticeRecord = {
  /** 学習中の字は出題順の先頭からこの数 */
  learningCount: number
  choiceCount: number
  stats: Record<string, KanjiStats>
  /** 直近の見本（新しい順） */
  recentTargets: string[]
  /** 取り違えて、近いうちに見本として出す字（先頭ほど先に出す） */
  pendingReview: string[]
  /** 進行中の練習回の回答 */
  currentSession: { correct: boolean; ms: number }[]
  /** 終わった練習回 */
  sessions: SessionResult[]
}

export function initialRecord(): PracticeRecord {
  return {
    learningCount: FIRST_LEARNING_COUNT,
    choiceCount: 4,
    stats: {},
    recentTargets: [],
    pendingReview: [],
    currentSession: [],
    sessions: [],
  }
}

export function nextQuestion(record: PracticeRecord, data: KanjiData, rng: Rng): Question {
  const recent = record.recentTargets.slice(0, RECENT_EXCLUDED)
  const review = record.pendingReview.find((c) => !recent.includes(c) && c in data.kanji)
  if (review) return createQuestion(data, review, record.choiceCount, rng)

  const learning = data.order.slice(0, record.learningCount)
  const candidates = learning.filter((c) => !recent.includes(c))
  const target = weightedPick(candidates, (c) => weightOf(record.stats[c]), rng)
  return createQuestion(data, target, record.choiceCount, rng)
}

/** 正答率が低いほど重い。まだ出ていない字は最も重い */
function weightOf(s: KanjiStats | undefined): number {
  const accuracy = s && s.seen > 0 ? s.correct / s.seen : 0
  return 1 + 4 * (1 - accuracy)
}

function weightedPick<T>(items: T[], weight: (item: T) => number, rng: Rng): T {
  const weights = items.map(weight)
  let r = rng() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r < 0) return items[i]
  }
  return items[items.length - 1]
}

export type AnswerOutcome = {
  record: PracticeRecord
  correct: boolean
  /** 練習回の最後の問題に答えたときだけ入る */
  sessionResult?: SessionResult
}

export function answer(
  record: PracticeRecord,
  _data: KanjiData,
  question: Question,
  picked: string,
  ms: number,
): AnswerOutcome {
  const correct = picked === question.target
  const prev = record.stats[question.target] ?? { seen: 0, correct: 0 }
  let next: PracticeRecord = {
    ...record,
    stats: {
      ...record.stats,
      [question.target]: { seen: prev.seen + 1, correct: prev.correct + (correct ? 1 : 0) },
    },
    recentTargets: [question.target, ...record.recentTargets].slice(0, RECENT_EXCLUDED),
    pendingReview: nextPendingReview(record.pendingReview, question.target, picked, correct),
    currentSession: [...record.currentSession, { correct, ms }],
  }
  if (next.currentSession.length < QUESTIONS_PER_SESSION) return { record: next, correct }

  const answers = next.currentSession
  const sessionResult: SessionResult = {
    correct: answers.filter((a) => a.correct).length,
    total: answers.length,
    averageMs: answers.reduce((sum, a) => sum + a.ms, 0) / answers.length,
  }
  next = { ...next, currentSession: [], sessions: [...next.sessions, sessionResult] }
  return { record: next, correct, sessionResult }
}

/**
 * 見本として出した字は待ちから外す。取り違えたら、選んだ字を先に、見本を後に加える
 * （見本は直前2問に出せないので、選んだ字 → 別の字 → 見本 の順で3問以内に収まる）
 */
function nextPendingReview(pending: string[], target: string, picked: string, correct: boolean): string[] {
  const rest = pending.filter((c) => c !== target)
  if (correct) return rest
  return [...rest.filter((c) => c !== picked), picked, target]
}

/** 保存しておいた記録を読み戻す。形が崩れていれば初期状態を返す */
export function restoreRecord(saved: unknown): PracticeRecord {
  if (!isRecord(saved)) return initialRecord()
  const r = saved as PracticeRecord
  return {
    learningCount: r.learningCount,
    choiceCount: r.choiceCount,
    stats: r.stats,
    recentTargets: r.recentTargets,
    pendingReview: r.pendingReview,
    currentSession: r.currentSession,
    sessions: r.sessions,
  }
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0
const isArrayOf = (v: unknown, item: (x: unknown) => boolean) => Array.isArray(v) && v.every(item)

function isRecord(v: unknown): boolean {
  if (!isObject(v)) return false
  return (
    isCount(v.learningCount) &&
    (v.learningCount as number) >= FIRST_LEARNING_COUNT &&
    [4, 6, 8].includes(v.choiceCount as number) &&
    isObject(v.stats) &&
    Object.values(v.stats).every((s) => isObject(s) && isCount(s.seen) && isCount(s.correct)) &&
    isArrayOf(v.recentTargets, (x) => typeof x === 'string') &&
    isArrayOf(v.pendingReview, (x) => typeof x === 'string') &&
    isArrayOf(v.currentSession, (x) => isObject(x) && typeof x.correct === 'boolean' && typeof x.ms === 'number') &&
    isArrayOf(
      v.sessions,
      (x) => isObject(x) && isCount(x.correct) && isCount(x.total) && typeof x.averageMs === 'number',
    )
  )
}
