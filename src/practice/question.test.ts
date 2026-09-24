import { describe, expect, it } from 'vitest'
import { createQuestion } from './question.ts'
import { seededRng, testData } from './testData.ts'

describe('問題を作る', () => {
  it('見本1字と、正解＋紛らわし字候補の上位からなる選択肢を並べる', () => {
    const q = createQuestion(testData, '三', 4, seededRng(1))
    expect(q.target).toBe('三')
    expect(q.choices).toHaveLength(4)
    expect([...q.choices].sort()).toEqual(['一', '三', '二', '四'].sort())
  })

  it('選択肢には正解がちょうど1つあり、同じ字が重複しない', () => {
    for (let seed = 0; seed < 50; seed++) {
      const q = createQuestion(testData, '五', 8, seededRng(seed))
      expect(q.choices.filter((c) => c === '五')).toHaveLength(1)
      expect(new Set(q.choices).size).toBe(8)
    }
  })

  it('選択肢の並びは乱数によって変わる', () => {
    const orders = new Set(
      Array.from({ length: 20 }, (_, s) => createQuestion(testData, '三', 4, seededRng(s)).choices.join('')),
    )
    expect(orders.size).toBeGreaterThan(1)
  })

  it('同じ乱数なら同じ問題になる', () => {
    expect(createQuestion(testData, '三', 6, seededRng(7))).toEqual(
      createQuestion(testData, '三', 6, seededRng(7)),
    )
  })
})
