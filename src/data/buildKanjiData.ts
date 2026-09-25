// 元データから出題用データを作る（仕様書 rahiseko-alt/Kanji-ninsiki#2 モジュール1、ADR-0001）

/** 字 → (近い字 → 距離)。距離は小さいほど似ている */
export type Distances = Record<string, Record<string, number>>

export type RawInputs = {
  /** 常用漢字2136字 */
  joyo: string[]
  /** 部品の少ない順の並び（常用漢字以外の部品も含む） */
  topoOrder: string[]
  /** 字 → 画数 */
  strokes: Record<string, number>
  /** 画の編集距離（Yencken & Baldwin 2008） */
  strokeEdit: Distances
  /** kanjistat 距離 */
  kanjistat: Distances
  /** 字 → 直下の部品（KanjiVG の部品データ。CC BY-SA 3.0、ADR-0004） */
  components: Record<string, ComponentNode[]>
  /** 同梱フォントが持つ文字 */
  fontChars: string[]
}

export type ComponentNode = { e?: string; p?: string; pt?: string }

/** Lv5 で見せる部品。row は左右（「亻 ＋ 寺」）、column は上下に並べる */
export type Parts = { parts: [string, string]; layout: 'row' | 'column' }

export type KanjiEntry = {
  strokes: number
  /** 紛らわし字候補。似ている順 */
  distractors: string[]
  /** 2つの部品に分かれ、どちらも同梱フォントで表示できる字だけが持つ */
  parts?: Parts
}

export type KanjiData = {
  /** 出題順に並んだ常用漢字 */
  order: string[]
  kanji: Record<string, KanjiEntry>
}

/** 選択肢数の上限8から正解1字を除いた数。これ未満なら画数の近い字で補う */
const MIN_DISTRACTORS = 7
const MAX_DISTRACTORS = 10

export function buildKanjiData(raw: RawInputs): KanjiData {
  const joyo = new Set(raw.joyo)
  const order = buildOrder(raw, joyo)
  const rank = new Map(order.map((c, i) => [c, i]))
  const kanji: Record<string, KanjiEntry> = {}
  const fontChars = new Set(raw.fontChars)
  for (const c of order) {
    const entry: KanjiEntry = { strokes: raw.strokes[c], distractors: distractorsFor(c, raw, joyo, order, rank) }
    const parts = partsOf(c, raw.components[c] ?? [], fontChars)
    if (parts) entry.parts = parts
    kanji[c] = entry
  }
  return { order, kanji }
}

function partsOf(c: string, children: ComponentNode[], fontChars: Set<string>): Parts | undefined {
  if (children.length !== 2 || children.some((k) => k.pt !== undefined)) return undefined
  const [a, b] = children.map((k) => k.e)
  const usable = (e: string | undefined): e is string =>
    e !== undefined && [...e].length === 1 && e !== c && fontChars.has(e)
  if (!usable(a) || !usable(b)) return undefined
  const layout = children[0].p === 'top' && children[1].p === 'bottom' ? 'column' : 'row'
  return { parts: [a, b], layout }
}

function buildOrder(raw: RawInputs, joyo: Set<string>): string[] {
  const seen = new Set<string>()
  const order: string[] = []
  for (const c of raw.topoOrder) {
    if (joyo.has(c) && !seen.has(c)) {
      seen.add(c)
      order.push(c)
    }
  }
  const rest = raw.joyo.filter((c) => !seen.has(c))
  rest.sort((a, b) => raw.strokes[a] - raw.strokes[b])
  return order.concat(rest)
}

function distractorsFor(
  c: string,
  raw: RawInputs,
  joyo: Set<string>,
  order: string[],
  rank: Map<string, number>,
): string[] {
  const stat = raw.kanjistat[c] ?? {}
  const statOf = (d: string) => stat[d] ?? Infinity
  const byStat = (a: string, b: string) => statOf(a) - statOf(b)

  // (1) 画の編集距離が最小のもの（「土・士」のように kanjistat が取りこぼす組）を kanjistat 順に
  const edit = raw.strokeEdit[c] ?? {}
  const minEdit = Math.min(...Object.values(edit))
  const closest = Object.keys(edit).filter((d) => edit[d] === minEdit).sort(byStat)
  // (2) 続けて kanjistat の近い順
  const rest = Object.keys(stat).sort(byStat)

  const picked: string[] = []
  for (const d of [...closest, ...rest]) {
    if (d !== c && joyo.has(d) && !picked.includes(d)) picked.push(d)
    if (picked.length === MAX_DISTRACTORS) return picked
  }
  // (3) 足りなければ画数の近い常用漢字で補う（同じ近さなら出題順の早いもの）
  if (picked.length < MIN_DISTRACTORS) {
    const s = raw.strokes[c]
    const fillers = order
      .filter((d) => d !== c && !picked.includes(d))
      .sort(
        (a, b) =>
          Math.abs(raw.strokes[a] - s) - Math.abs(raw.strokes[b] - s) ||
          rank.get(a)! - rank.get(b)!,
      )
    picked.push(...fillers.slice(0, MIN_DISTRACTORS - picked.length))
  }
  return picked
}
