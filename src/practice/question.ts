import type { KanjiData } from '../data/buildKanjiData.ts'

/** 0以上1未満を返す乱数 */
export type Rng = () => number

export type Question = {
  /** 見本 */
  target: string
  /** 選択肢（正解1字＋紛らわし字）。並びはランダム */
  choices: string[]
}

export function createQuestion(data: KanjiData, target: string, choiceCount: number, rng: Rng): Question {
  const distractors = data.kanji[target].distractors.slice(0, choiceCount - 1)
  return { target, choices: shuffle([target, ...distractors], rng) }
}

export function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Lv2 の問題。盤面に見本と同じ字が2〜4個あり、残りは紛らわし字 */
export type BoardQuestion = {
  target: string
  board: string[]
}

/** 盤面を埋める紛らわし字は、似ている順の上位からこの数の中で選ぶ（重複あり） */
const BOARD_DISTRACTOR_POOL = 6

export function createBoard(data: KanjiData, target: string, size: number, rng: Rng): BoardQuestion {
  const copies = 2 + Math.floor(rng() * 3)
  const pool = data.kanji[target].distractors.slice(0, BOARD_DISTRACTOR_POOL)
  const fillers = Array.from({ length: size - copies }, () => pool[Math.floor(rng() * pool.length)])
  return { target, board: shuffle([...Array<string>(copies).fill(target), ...fillers], rng) }
}
