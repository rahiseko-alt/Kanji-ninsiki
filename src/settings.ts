// 端末内に残すのは、表示言語・選んだ段階・出題範囲・アプリ説明を見たかどうかだけ（ADR-0005）
import { messages, type Language } from './i18n.tsx'
import { RANGE_STARTS, type Stage } from './practice/session.ts'

const SETTINGS_KEY = 'kanji-ninsiki:settings:v1'
/** 以前の版が保存していた練習記録。いまは使わず、起動時に消す */
const OLD_RECORD_KEY = 'kanji-ninsiki:record:v1'

export type Settings = {
  language: Language
  stage: Stage
  /** 出題範囲（レベル）の先頭 */
  startAt: number
  seenIntro: boolean
}

const defaults: Settings = { language: 'en', stage: 'lv1', startAt: 0, seenIntro: false }

const isRangeStart = (v: unknown): v is number => (RANGE_STARTS as readonly unknown[]).includes(v)

export function loadSettings(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null')
    // 以前の版では出題範囲を練習記録の側に持っていたので、そこから引き継ぐ
    const oldStart = JSON.parse(localStorage.getItem(OLD_RECORD_KEY) ?? 'null')?.startAt
    return {
      language: Object.hasOwn(messages, raw?.language) ? raw.language : 'en',
      stage: ['lv2', 'lv3', 'lv4', 'lv5'].includes(raw?.stage) ? raw.stage : 'lv1',
      startAt: isRangeStart(raw?.startAt) ? raw.startAt : isRangeStart(oldStart) ? oldStart : 0,
      seenIntro: raw?.seenIntro === true,
    }
  } catch {
    return defaults
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // 保存できなくても使える
  }
}

/** 以前の版が残した練習記録を消す（出題範囲は loadSettings で引き継いだあとに呼ぶ） */
export function removeOldRecord(): void {
  try {
    localStorage.removeItem(OLD_RECORD_KEY)
  } catch {
    // 消せなくても使える
  }
}
