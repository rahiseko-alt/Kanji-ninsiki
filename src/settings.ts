// 表示言語と初回のお知らせを見たかどうかを端末内に保存する
import type { Language } from './i18n.tsx'

const SETTINGS_KEY = 'kanji-ninsiki:settings:v1'

export type Settings = { language: Language; seenIntro: boolean }

const defaults: Settings = { language: 'en', seenIntro: false }

export function loadSettings(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null')
    return {
      language: raw?.language === 'ja' ? 'ja' : 'en',
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
