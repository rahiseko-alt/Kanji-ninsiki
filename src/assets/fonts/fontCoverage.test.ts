import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const fromRoot = (p: string) => fileURLToPath(new URL(`../../../${p}`, import.meta.url))
const read = (p: string) => readFileSync(fromRoot(p), 'utf-8')

const covered = new Set(Array.from(read('src/assets/fonts/NotoSansJP-subset.chars.txt')))

const missingFrom = (chars: Iterable<string>) =>
  [...new Set(chars)].filter((c) => !covered.has(c)).sort()

const hint = (missing: string[]) =>
  `同梱フォントに無い文字: ${missing.join('')}\n` +
  'python3 third_party/noto-sans-jp/subset.py <NotoSansJP[wght].ttf> を再実行して woff2 と chars.txt を作り直してください'

describe('同梱フォント NotoSansJP-subset.woff2 の収録文字', () => {
  it('常用漢字2136字をすべて含む', () => {
    const joyo = (JSON.parse(read('third_party/joyo-json/joyo_kanji.json')) as { standardForm: string }[]).map(
      (k) => k.standardForm,
    )
    expect(joyo).toHaveLength(2136)
    const missing = missingFrom(joyo)
    expect(missing, hint(missing)).toEqual([])
  })

  it('画面の文言（src/i18n.tsx）の日本語の文字をすべて含む', () => {
    const japanese = Array.from(read('src/i18n.tsx')).filter((c) => c.codePointAt(0)! >= 0x3000)
    expect(japanese.length).toBeGreaterThan(0)
    const missing = missingFrom(japanese)
    expect(missing, hint(missing)).toEqual([])
  })
})

describe('同梱フォント NotoSerifJP（明朝体）の収録文字', () => {
  const serif = new Set(Array.from(read('src/assets/fonts/NotoSerifJP-subset.chars.txt')))

  it('画面の文言（src/i18n.tsx）の日本語の文字をすべて含む', () => {
    const japanese = Array.from(read('src/i18n.tsx')).filter((c) => c.codePointAt(0)! >= 0x3000)
    const missing = [...new Set(japanese)].filter((c) => !serif.has(c)).sort()
    expect(
      missing,
      `明朝体に無い文字: ${missing.join('')}\npython3 third_party/noto-serif-jp/subset.py <NotoSerifJP[wght].ttf> を再実行してください`,
    ).toEqual([])
  })
})
