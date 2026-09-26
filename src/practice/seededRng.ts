// テスト用の決まった乱数

/** 決まった並びを返す乱数（同じ種なら同じ結果） */
export function seededRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}
