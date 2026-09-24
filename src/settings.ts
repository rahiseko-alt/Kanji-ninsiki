// 表示言語・選んだ段階・初回のお知らせを見たかどうかを端末内に保存する
import type { Language } from './i18n.tsx'
import type { Stage } from './practice/practice.ts'

const SETTINGS_KEY = 'kanji-ninsiki:settings:v1'

export type Settings = { language: Language; stage: Stage; seenIntro: boolean }

const defaults: Settings = { language: 'en', stage: 'lv1', seenIntro: false }

export function loadSettings(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null')
    return {
      language: raw?.language === 'ja' ? 'ja' : 'en',
      stage: raw?.stage === 'lv2' ? 'lv2' : 'lv1',
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
