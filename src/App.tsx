import { useEffect, useState } from 'react'
import { loadSettings, removeOldRecord, saveSettings, type Settings } from './settings.ts'
import { messages, MessagesContext, type Language } from './i18n.tsx'
import { HomeScreen } from './screens/HomeScreen.tsx'
import { SessionScreen } from './screens/SessionScreen.tsx'
import { CoverScreen } from './screens/CoverScreen.tsx'
import { IntroScreen } from './screens/IntroScreen.tsx'
import { ModeScreen } from './screens/ModeScreen.tsx'
import { LanguageSelect } from './screens/LanguageSelect.tsx'
import { CreditsScreen } from './screens/CreditsScreen.tsx'
import type { Stage } from './practice/session.ts'

// 表紙 → アプリ説明 → ホーム（出題範囲）→ モード選択 → 練習
type Screen = 'cover' | 'intro' | 'home' | 'modes' | 'practice' | 'credits'

export function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  // 選んだモードは端末に残さない（ADR-0005）
  const [stage, setStage] = useState<Stage>('lv1')
  // 開いたときは表紙を出す
  const [screen, setScreen] = useState<Screen>('cover')
  const m = messages[settings.language]

  // 読み上げや字形の選び方がそろうよう、ページ全体の言語も合わせる
  useEffect(() => {
    document.documentElement.lang = settings.language
  }, [settings.language])

  // 以前の版の練習記録は持たない（ADR-0005）。出題範囲を設定へ移してから消す
  useEffect(() => {
    saveSettings(settings)
    removeOldRecord()
    // 起動時に一度だけ
  }, [])

  const updateSettings = (next: Settings) => {
    saveSettings(next)
    setSettings(next)
  }

  const goTo = (next: Screen) => setScreen(next)

  // レベル（出題範囲）を選んだら、そのままモード選択へ進む
  const chooseStart = (startAt: number) => {
    updateSettings({ ...settings, startAt })
    goTo('modes')
  }
  const changeLanguage = (language: Language) => updateSettings({ ...settings, language })

  // アプリ説明を最後まで見るか飛ばしたら、次回からは途中で飛ばせる
  const finishIntro = () => {
    if (!settings.seenIntro) updateSettings({ ...settings, seenIntro: true })
    setScreen('home')
  }

  const chooseMode = (next: Stage) => {
    setStage(next)
    goTo('practice')
  }

  // 下のバーはホームにだけ出し、クレジットへの入口だけを置く（利用者の見本）
  const showFooter = screen === 'home'
  // ホームと練習中は白い和紙を敷く
  const onPaper = screen === 'home' || screen === 'practice'

  return (
    <MessagesContext.Provider value={m}>
      <div lang={settings.language} className={'app' + (showFooter ? ' has-tabs' : '') + (onPaper ? ' is-paper' : '')}>
        <LanguageSelect language={settings.language} onChange={changeLanguage} />
        {screen === 'cover' ? (
          <CoverScreen onStart={() => setScreen('intro')} />
        ) : screen === 'intro' ? (
          <IntroScreen onDone={finishIntro} />
        ) : screen === 'home' ? (
          <HomeScreen startAt={settings.startAt} onChoose={chooseStart} />
        ) : screen === 'modes' ? (
          <ModeScreen stage={stage} onChoose={chooseMode} onBack={() => goTo('home')} />
        ) : screen === 'credits' ? (
          <>
            <div className="practice-top">
              <button className="back" onClick={() => goTo('home')}>
                ‹ {m.navHome}
              </button>
            </div>
            <CreditsScreen />
          </>
        ) : (
          <>
            <div className="practice-top">
              <button className="back" onClick={() => goTo('modes')}>
                ‹ {m.modeTitle}
              </button>
            </div>
            {/* 練習回（記録を持たない。ADR-0005） */}
            <SessionScreen
              key={`${stage}-${settings.startAt}`}
              stage={stage}
              startAt={settings.startAt}
              onBack={() => goTo('modes')}
            />
          </>
        )}
        {showFooter && (
          <nav className="tabbar">
            <button onClick={() => goTo('credits')}>{m.navCredits}</button>
          </nav>
        )}
      </div>
    </MessagesContext.Provider>
  )
}
