import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadSettings, removeOldRecord, saveSettings } from './settings.ts'

const SETTINGS_KEY = 'kanji-ninsiki:settings:v1'
const OLD_RECORD_KEY = 'kanji-ninsiki:record:v1'

function memoryStorage() {
  const items = new Map<string, string>()
  return {
    getItem: (k: string) => items.get(k) ?? null,
    setItem: (k: string, v: string) => void items.set(k, v),
    removeItem: (k: string) => void items.delete(k),
    keys: () => [...items.keys()],
  }
}

let storage: ReturnType<typeof memoryStorage>
beforeEach(() => {
  storage = memoryStorage()
  vi.stubGlobal('localStorage', storage)
})

describe('端末に残す設定（ADR-0005）', () => {
  it('はじめては英語・Lv1・レベル1（先頭から）', () => {
    expect(loadSettings()).toEqual({ language: 'en', stage: 'lv1', startAt: 0, seenIntro: false })
  })

  it('出題範囲は保存して次に開いたときも同じ', () => {
    saveSettings({ language: 'ja', stage: 'lv3', startAt: 500, seenIntro: true })
    expect(loadSettings()).toEqual({ language: 'ja', stage: 'lv3', startAt: 500, seenIntro: true })
  })

  it('出題範囲はレベル1〜3の先頭（0・500・1000）以外を受けつけない', () => {
    storage.setItem(SETTINGS_KEY, JSON.stringify({ startAt: 123 }))
    expect(loadSettings().startAt).toBe(0)
  })

  it('以前の版が記録の側に持っていた出題範囲を引き継ぐ', () => {
    storage.setItem(SETTINGS_KEY, JSON.stringify({ language: 'ja', stage: 'lv2', seenIntro: true }))
    storage.setItem(OLD_RECORD_KEY, JSON.stringify({ startAt: 1000, stats: { 一: {} } }))
    expect(loadSettings().startAt).toBe(1000)
  })

  it('以前の版の練習記録は消え、残るのは設定だけ', () => {
    storage.setItem(OLD_RECORD_KEY, JSON.stringify({ startAt: 500, stats: {} }))
    saveSettings(loadSettings())
    removeOldRecord()
    expect(storage.keys()).toEqual([SETTINGS_KEY])
    expect(loadSettings().startAt).toBe(500)
  })
})
