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
