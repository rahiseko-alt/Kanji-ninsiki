// 練習の進め方（仕様書 rahiseko-alt/Kanji-ninsiki#2 モジュール2、Lv2 は #11、Lv3 は #15、Lv4 は #19、Lv5 は #22）。画面・保存・時計には触れない
import type { KanjiData, Parts } from '../data/buildKanjiData.ts'
import {
  createBoard,
  createOddBoard,
  createQuestion,
  type BoardQuestion,
  type OddQuestion,
  type Question,
  type Rng,
} from './question.ts'

export const QUESTIONS_PER_SESSION = 10
const FIRST_LEARNING_COUNT = 8
const RECENT_EXCLUDED = 2
const CHOICE_COUNTS = [4, 6, 8]
/** Lv2 の盤面の字数 */
const BOARD_SIZES = [9, 12, 16]
/** Lv3 の表示時間（ms）。正解が続くと右へ（短く）進む */
const SHOW_TIMES = [1500, 1000, 700, 500]
/** Lv3 の選択肢数（変えない） */
const FLASH_CHOICE_COUNT = 4
/** 選択肢数を1段上げるのに要る連続正解数 */
const STREAK_TO_RAISE = 5
/** 練習回でこの数以上正解すると学習中の字が増える（10問中9問 = 8割超） */
const CORRECT_TO_GROW = 9
const GROW_BY = 2
/** 始める位置（出題順の何字目から学習中の字を始めるか） */
export const START_POSITIONS = { beginner: 0, some: 200, well: 600 } as const
/** 「組み立てる」で、学習中の字に出せる字が足りないときに足してよい、学習中の字の先の字数 */
const LOOKAHEAD = 20

export type KanjiStats = {
  seen: number
  correct: number
  /** 直近の回答時間（ms）。以前の記録には無い */
  lastMs?: number
  /** 見落とした回数（Lv2）。以前の記録には無い */
  missed?: number
  /** 取り違えた回数。以前の記録には無い */
  mixedUp?: number
}

export type SessionResult = { correct: number; total: number; averageMs: number }

/** 段階ごとの進み具合 */
export type StageProgress = {
  /** 段の値。Lv1 は選択肢数、Lv2・Lv4 は盤面の字数、Lv3 は表示時間（ms） */
  choiceCount: number
  /** 字数を上げるための連続正解数 */
  streak: number
  /** 進行中の練習回の回答 */
  currentSession: { correct: boolean; ms: number }[]
  /** 終わった練習回 */
  sessions: SessionResult[]
}

/** Lv1 の進み具合は以前の記録と同じ形で直下に持ち、Lv2〜Lv4 は lv2〜lv4 に持つ */
export type PracticeRecord = StageProgress & {
  /** 学習中の字は出題順の startAt 字目から learningCount 字目の手前まで（段階で共通） */
  startAt: number
  learningCount: number
  lv2: StageProgress
  lv3: StageProgress
  lv4: StageProgress
  lv5: StageProgress
  stats: Record<string, KanjiStats>
  /** 直近の見本（新しい順） */
  recentTargets: string[]
  /** 取り違えて、近いうちに見本として出す字（先頭ほど先に出す） */
  pendingReview: string[]
}

export function initialRecord(): PracticeRecord {
  return {
    startAt: 0,
    learningCount: FIRST_LEARNING_COUNT,
    choiceCount: CHOICE_COUNTS[0],
    streak: 0,
    stats: {},
    recentTargets: [],
    pendingReview: [],
    currentSession: [],
    sessions: [],
    lv2: initialStage(BOARD_SIZES[0]),
    lv3: initialStage(SHOW_TIMES[0]),
    lv4: initialStage(BOARD_SIZES[0]),
    lv5: initialStage(CHOICE_COUNTS[0]),
  }
}

function initialStage(choiceCount: number): StageProgress {
  return { choiceCount, streak: 0, currentSession: [], sessions: [] }
}

/**
 * 段階。Lv1「1つ探す」、Lv2「全部探す」、Lv3「一瞬見る」、
 * Lv4「違う字を探す」、Lv5「組み立てる」
 */
export type Stage = 'lv1' | 'lv2' | 'lv3' | 'lv4' | 'lv5'
const COUNTS_OF: Record<Stage, number[]> = {
  lv1: CHOICE_COUNTS,
  lv2: BOARD_SIZES,
  lv3: SHOW_TIMES,
  lv4: BOARD_SIZES,
  lv5: CHOICE_COUNTS,
}

export function progressOf(record: PracticeRecord, stage: Stage): StageProgress {
  if (stage !== 'lv1') return record[stage]
  const { choiceCount, streak, currentSession, sessions } = record
  return { choiceCount, streak, currentSession, sessions }
}

function withProgress(record: PracticeRecord, stage: Stage, progress: StageProgress): PracticeRecord {
  return stage === 'lv1' ? { ...record, ...progress } : { ...record, [stage]: progress }
}

export function nextQuestion(record: PracticeRecord, data: KanjiData, rng: Rng): Question {
  return createQuestion(data, pickAny(record, data, rng), record.choiceCount, rng)
}

export function nextBoardQuestion(record: PracticeRecord, data: KanjiData, rng: Rng): BoardQuestion {
  return createBoard(data, pickAny(record, data, rng), record.lv2.choiceCount, rng)
}

/** どの字でも出せる段階（Lv1〜Lv4）の見本。学習中の字は必ずあるので null にならない */
function pickAny(record: PracticeRecord, data: KanjiData, rng: Rng): string {
  return pickTarget(record, data, rng) ?? data.order[record.startAt]
}

/** Lv3 の問題。見本を showMs だけ見せてから選択肢を出す */
export type FlashQuestion = Question & { showMs: number }

export function nextFlashQuestion(record: PracticeRecord, data: KanjiData, rng: Rng): FlashQuestion {
  const question = createQuestion(data, pickAny(record, data, rng), FLASH_CHOICE_COUNT, rng)
  return { ...question, showMs: showMsOf(record) }
}

/** Lv3 の表示時間（ms）。以前の記録と形をそろえるため、段の値の欄に持っている */
export function showMsOf(record: PracticeRecord): number {
  return record.lv3.choiceCount
}

export function nextOddQuestion(record: PracticeRecord, data: KanjiData, rng: Rng): OddQuestion {
  return createOddBoard(data, pickAny(record, data, rng), record.lv4.choiceCount, rng)
}

/** Lv5 の問題。部品2つ（parts）から組み立てた字を選択肢から選ぶ */
export type BuildQuestion = Question & { parts: Parts }

/** 学習中の字とその先20字に組み立てられる字が1つも無いときは null（画面で案内を出す） */
export function nextBuildQuestion(record: PracticeRecord, data: KanjiData, rng: Rng): BuildQuestion | null {
  const hasParts = (c: string) => data.kanji[c]?.parts !== undefined
  const target = pickTarget(record, data, rng, hasParts)
  if (target === null) return null
  const question = createQuestion(data, target, record.lv5.choiceCount, rng)
  return { ...question, parts: data.kanji[target].parts! }
}

/**
 * 再出題待ちを優先し、無ければ出題する字の集まりから正答率の低い字ほど選ばれやすく選ぶ。
 * 集まりはふつう学習中の字。eligible で出せる字を絞る段階（Lv5 は部品に分かれる字だけ）では、
 * 学習中の字のうち出せる字が8字に満たなければ、学習中の字の先20字の中から出せる字を足して8字まで
 * そろえる（同じ字ばかり出ないように、かつ練習中の字から離れすぎないように）。
 * 出せる字が1つも無ければ null
 */
function pickTarget(
  record: PracticeRecord,
  data: KanjiData,
  rng: Rng,
  eligible: (c: string) => boolean = () => true,
): string | null {
  const recent = record.recentTargets.slice(0, RECENT_EXCLUDED)
  const review = record.pendingReview.find((c) => !recent.includes(c) && c in data.kanji && eligible(c))
  if (review) return review

  const pool = poolOf(record, data, eligible)
  if (pool.length === 0) return null
  // 直前の字を避けきれないとき（出せる字が少ないとき）は、同じ字をもう一度出す
  const fresh = pool.filter((c) => !recent.includes(c))
  const candidates = fresh.length > 0 ? fresh : pool
  return weightedPick(candidates, (c) => weightOf(record.stats[c]), rng)
}

/** 学習中の字（出題順の startAt 字目から learningCount 字目の手前まで） */
function learningOf(record: PracticeRecord, data: KanjiData): string[] {
  return data.order.slice(record.startAt, record.learningCount)
}

function poolOf(record: PracticeRecord, data: KanjiData, eligible: (c: string) => boolean): string[] {
  const learning = learningOf(record, data).filter(eligible)
  if (learning.length >= FIRST_LEARNING_COUNT) return learning
  const ahead = data.order.slice(record.learningCount, record.learningCount + LOOKAHEAD).filter(eligible)
  return [...learning, ...ahead].slice(0, FIRST_LEARNING_COUNT)
}

/** 始める位置を変える。学習中の字だけを新しい位置の8字から始め直し、記録は残す */
export function withStart(record: PracticeRecord, data: KanjiData, startAt: number): PracticeRecord {
  const clamped = Math.max(0, Math.min(startAt, data.order.length - FIRST_LEARNING_COUNT))
  return { ...record, startAt: clamped, learningCount: clamped + FIRST_LEARNING_COUNT }
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
  data: KanjiData,
  question: Question,
  picked: string,
  ms: number,
): AnswerOutcome {
  const correct = picked === question.target
  return applyAnswer(record, data, 'lv1', question.target, { correct, missed: false, picked: correct ? undefined : picked }, ms)
}

/** Lv3 の答え。採点と再出題は Lv1 と同じ */
export function answerFlash(
  record: PracticeRecord,
  data: KanjiData,
  question: Question,
  picked: string,
  ms: number,
): AnswerOutcome {
  const correct = picked === question.target
  return applyAnswer(record, data, 'lv3', question.target, { correct, missed: false, picked: correct ? undefined : picked }, ms)
}

/** Lv4 の答え。仲間はずれの位置を押せば正解。外したら並べた字と仲間はずれの両方を再出題する */
export function answerOdd(
  record: PracticeRecord,
  data: KanjiData,
  question: OddQuestion,
  pickedIndex: number,
  ms: number,
): AnswerOutcome {
  const correct = pickedIndex === question.oddIndex
  return applyAnswer(
    record,
    data,
    'lv4',
    question.target,
    { correct, missed: false, picked: correct ? undefined : question.odd },
    ms,
  )
}

/** Lv5 の答え。採点と再出題は Lv1 と同じ */
export function answerBuild(
  record: PracticeRecord,
  data: KanjiData,
  question: Question,
  picked: string,
  ms: number,
): AnswerOutcome {
  const correct = picked === question.target
  // 部品に分かれない字は Lv5 で出せないので、取り違えても再出題待ちには入れない（見本だけを入れる）
  const reviewable = !correct && data.kanji[picked]?.parts !== undefined
  return applyAnswer(
    record,
    data,
    'lv5',
    question.target,
    { correct, missed: false, picked: correct ? undefined : picked, reviewPicked: reviewable },
    ms,
  )
}

export type BoardOutcome = AnswerOutcome & {
  /** 選ばなかった、見本と同じ字の位置 */
  missed: number[]
  /** 間違えて選んだ字（盤面の並び順、重複なし） */
  wrongPicks: string[]
}

/** Lv2 の答え。選んだ位置が見本の位置と完全に一致したときだけ正解 */
export function answerBoard(
  record: PracticeRecord,
  data: KanjiData,
  question: BoardQuestion,
  selected: number[],
  ms: number,
): BoardOutcome {
  const chosen = new Set(selected)
  const missed = question.board.flatMap((c, i) => (c === question.target && !chosen.has(i) ? [i] : []))
  const wrongPicks = [
    ...new Set(question.board.filter((c, i) => c !== question.target && chosen.has(i))),
  ]
  const correct = missed.length === 0 && wrongPicks.length === 0
  const outcome = applyAnswer(
    record,
    data,
    'lv2',
    question.target,
    { correct, missed: missed.length > 0, picked: wrongPicks[0] },
    ms,
  )
  return { ...outcome, missed, wrongPicks }
}

/**
 * 1問の答えの中身。picked は取り違えて選んだ字（無ければ undefined）。
 * reviewPicked が false なら、選んだ字は再出題待ちに入れない（既定は入れる）
 */
type Judgement = { correct: boolean; missed: boolean; picked: string | undefined; reviewPicked?: boolean }

function applyAnswer(
  record: PracticeRecord,
  data: KanjiData,
  stage: Stage,
  target: string,
  { correct, missed, picked, reviewPicked = true }: Judgement,
  ms: number,
): AnswerOutcome {
  const prev = record.stats[target] ?? { seen: 0, correct: 0 }
  const progress = progressOf(record, stage)
  let nextProgress: StageProgress = {
    ...progress,
    currentSession: [...progress.currentSession, { correct, ms }],
    ...nextChoiceCount(progress, COUNTS_OF[stage], correct),
  }
  let next: PracticeRecord = {
    ...record,
    stats: {
      ...record.stats,
      [target]: {
        seen: prev.seen + 1,
        correct: prev.correct + (correct ? 1 : 0),
        lastMs: ms,
        missed: (prev.missed ?? 0) + (missed ? 1 : 0),
        mixedUp: (prev.mixedUp ?? 0) + (picked !== undefined ? 1 : 0),
      },
    },
    recentTargets: [target, ...record.recentTargets].slice(0, RECENT_EXCLUDED),
    pendingReview: nextPendingReview(record.pendingReview, target, reviewPicked ? picked : undefined, correct),
  }
  if (nextProgress.currentSession.length < QUESTIONS_PER_SESSION) {
    return { record: withProgress(next, stage, nextProgress), correct }
  }

  const answers = nextProgress.currentSession
  const sessionResult: SessionResult = {
    correct: answers.filter((a) => a.correct).length,
    total: answers.length,
    averageMs: answers.reduce((sum, a) => sum + a.ms, 0) / answers.length,
  }
  nextProgress = { ...nextProgress, currentSession: [], sessions: [...nextProgress.sessions, sessionResult] }
  const learningCount =
    sessionResult.correct >= CORRECT_TO_GROW
      ? Math.min(next.learningCount + GROW_BY, data.order.length)
      : next.learningCount
  next = { ...next, learningCount }
  return { record: withProgress(next, stage, nextProgress), correct, sessionResult }
}

/** 連続正解で1段上げ、取り違え・見落としで1段下げる。段が変わったら数え直す */
function nextChoiceCount(
  progress: StageProgress,
  counts: number[],
  correct: boolean,
): Pick<StageProgress, 'choiceCount' | 'streak'> {
  const choiceStep = counts.indexOf(progress.choiceCount)
  if (!correct) return { choiceCount: counts[Math.max(choiceStep - 1, 0)], streak: 0 }
  const streak = progress.streak + 1
  if (streak < STREAK_TO_RAISE) return { choiceCount: progress.choiceCount, streak }
  return { choiceCount: counts[Math.min(choiceStep + 1, counts.length - 1)], streak: 0 }
}

/**
 * 見本として出した字は待ちから外す。取り違えたら、選んだ字・見本の順で待ちの先頭に置き、
 * それより前の待ちはその後ろに回す。最新の取り違えを優先するので、続けて取り違えても
 * 選んだ字 → 別の字 → 見本 の順で3問以内に収まる（見本は直前2問に出せないため）
 */
function nextPendingReview(
  pending: string[],
  target: string,
  picked: string | undefined,
  correct: boolean,
): string[] {
  const rest = pending.filter((c) => c !== target)
  if (correct) return rest
  // Lv2 の見落としだけのときは、見本だけを先頭に置く
  if (picked === undefined) return [target, ...rest]
  return [picked, target, ...rest.filter((c) => c !== picked)]
}

/** 保存しておいた記録を読み戻す。形が崩れていれば初期状態を返す */
export function restoreRecord(saved: unknown): PracticeRecord {
  if (!isRecord(saved)) return initialRecord()
  const r = saved as PracticeRecord
  return {
    // 始める位置を持たない以前の記録は先頭から
    startAt: r.startAt ?? 0,
    learningCount: r.learningCount,
    choiceCount: r.choiceCount,
    streak: r.streak,
    stats: r.stats,
    recentTargets: r.recentTargets,
    pendingReview: r.pendingReview,
    currentSession: r.currentSession,
    sessions: r.sessions,
    // Lv2 を持たない以前の記録は、Lv2 を初期状態で始める
    lv2: r.lv2 === undefined ? initialStage(BOARD_SIZES[0]) : restoreStage(r.lv2),
    // Lv3 を持たない以前の記録は、Lv3 を初期状態で始める
    lv3: r.lv3 === undefined ? initialStage(SHOW_TIMES[0]) : restoreStage(r.lv3),
    lv4: r.lv4 === undefined ? initialStage(BOARD_SIZES[0]) : restoreStage(r.lv4),
    lv5: r.lv5 === undefined ? initialStage(CHOICE_COUNTS[0]) : restoreStage(r.lv5),
  }
}

function restoreStage(p: StageProgress): StageProgress {
  return { choiceCount: p.choiceCount, streak: p.streak, currentSession: p.currentSession, sessions: p.sessions }
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0
const isArrayOf = (v: unknown, item: (x: unknown) => boolean) => Array.isArray(v) && v.every(item)

function isStage(v: unknown, counts: number[]): boolean {
  if (!isObject(v)) return false
  return (
    counts.includes(v.choiceCount as number) &&
    isCount(v.streak) &&
    isArrayOf(v.currentSession, (x) => isObject(x) && typeof x.correct === 'boolean' && typeof x.ms === 'number') &&
    isArrayOf(
      v.sessions,
      (x) =>
        isObject(x) &&
        isCount(x.correct) &&
        isCount(x.total) &&
        (x.total as number) >= 1 &&
        (x.correct as number) <= (x.total as number) &&
        typeof x.averageMs === 'number',
    )
  )
}

function isRecord(v: unknown): boolean {
  if (!isObject(v)) return false
  return (
    isCount(v.learningCount) &&
    (v.learningCount as number) >= FIRST_LEARNING_COUNT &&
    (v.startAt === undefined ||
      (isCount(v.startAt) && (v.learningCount as number) >= (v.startAt as number) + FIRST_LEARNING_COUNT)) &&
    isStage(v, CHOICE_COUNTS) &&
    (v.lv2 === undefined || isStage(v.lv2, BOARD_SIZES)) &&
    (v.lv3 === undefined || isStage(v.lv3, SHOW_TIMES)) &&
    (v.lv4 === undefined || isStage(v.lv4, BOARD_SIZES)) &&
    (v.lv5 === undefined || isStage(v.lv5, CHOICE_COUNTS)) &&
    isObject(v.stats) &&
    Object.values(v.stats).every(
      (s) =>
        isObject(s) &&
        isCount(s.seen) &&
        isCount(s.correct) &&
        (s.lastMs === undefined || typeof s.lastMs === 'number') &&
        (s.missed === undefined || isCount(s.missed)) &&
        (s.mixedUp === undefined || isCount(s.mixedUp)),
    ) &&
    isArrayOf(v.recentTargets, (x) => typeof x === 'string') &&
    isArrayOf(v.pendingReview, (x) => typeof x === 'string')
  )
}
