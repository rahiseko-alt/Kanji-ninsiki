import { useEffect, useState } from 'react'
import { loadRecord, saveRecord } from './storage.ts'
import { loadSettings, saveSettings, type Settings } from './settings.ts'
import { messages, MessagesContext, type Language } from './i18n.tsx'
import { HomeScreen } from './screens/HomeScreen.tsx'
import { SessionScreen } from './screens/SessionScreen.tsx'
import { CoverScreen } from './screens/CoverScreen.tsx'
import { IntroScreen } from './screens/IntroScreen.tsx'
import { ModeScreen } from './screens/ModeScreen.tsx'
import { LanguageSelect } from './screens/LanguageSelect.tsx'
import { kanjiData } from './kanjiData.ts'
import { RecordsScreen } from './screens/RecordsScreen.tsx'
import { CreditsScreen } from './screens/CreditsScreen.tsx'
import { initialRecord, withStart, type PracticeRecord, type Stage } from './practice/practice.ts'

// 表紙 → アプリ説明 → ホーム（始める位置）→ モード選択 → 練習
type Screen = 'cover' | 'intro' | 'home' | 'modes' | 'practice' | 'records' | 'credits'

export function App() {
  const [record, setRecord] = useState<PracticeRecord>(loadRecord)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  // 開いたときは表紙を出す
  const [screen, setScreen] = useState<Screen>('cover')
  const m = messages[settings.language]

  // 読み上げや字形の選び方がそろうよう、ページ全体の言語も合わせる
  useEffect(() => {
    document.documentElement.lang = settings.language
  }, [settings.language])

  const updateRecord = (next: PracticeRecord) => {
    saveRecord(next)
    setRecord(next)
  }
  const updateSettings = (next: Settings) => {
    saveSettings(next)
    setSettings(next)
  }

  const goTo = (next: Screen) => setScreen(next)
  const chooseStage = (stage: Stage) => updateSettings({ ...settings, stage })

  // 始める位置の変更は、練習したことがあれば確認のうえ（記録は残る）
  const changeStart = (startAt: number) => {
    if (startAt === record.startAt) return
    const practiced = Object.keys(record.stats).length > 0
    if (!practiced || window.confirm(m.confirmStart)) updateRecord(withStart(record, kanjiData, startAt))
  }
  const changeLanguage = (language: Language) => updateSettings({ ...settings, language })

  // アプリ説明を最後まで見るか飛ばしたら、次回からは途中で飛ばせる
  const finishIntro = () => {
    if (!settings.seenIntro) updateSettings({ ...settings, seenIntro: true })
    setScreen('home')
  }

  const chooseMode = (stage: Stage) => {
    chooseStage(stage)
    goTo('practice')
  }

  // 下のタブ。「練習」はホーム・モード選択・練習の画面を受け持つ。表紙と説明では出さない
  const tabs: [Screen, string][] = [
    ['home', m.navPractice],
    ['records', m.navRecords],
    ['credits', m.navCredits],
  ]
  const activeTab = screen === 'practice' || screen === 'modes' ? 'home' : screen
  const showTabs = screen !== 'cover' && screen !== 'intro'

  return (
    <MessagesContext.Provider value={m}>
      <div lang={settings.language} className="app">
        <LanguageSelect language={settings.language} onChange={changeLanguage} />
        {screen === 'cover' ? (
          <CoverScreen onStart={() => setScreen('intro')} />
        ) : screen === 'intro' ? (
          <IntroScreen onDone={finishIntro} />
        ) : screen === 'home' ? (
          <HomeScreen startAt={record.startAt} onPractice={() => goTo('modes')} onStart={changeStart} />
        ) : screen === 'modes' ? (
          <ModeScreen stage={settings.stage} onChoose={chooseMode} onBack={() => goTo('home')} />
        ) : screen === 'records' ? (
          <RecordsScreen
            record={record}
            initialStage={settings.stage}
            onStart={changeStart}
            onReset={() => {
              updateRecord(initialRecord())
            }}
          />
        ) : screen === 'credits' ? (
          <CreditsScreen />
        ) : (
          <>
            <div className="practice-top">
              <button className="back" onClick={() => goTo('modes')}>
                ‹ {m.modeTitle}
              </button>
            </div>
            {/* 練習回（記録を持たない。ADR-0005） */}
            <SessionScreen
              key={`${settings.stage}-${record.startAt}`}
              stage={settings.stage}
              startAt={record.startAt}
              onBack={() => goTo('modes')}
            />
          </>
        )}
        {showTabs && (
          <nav className="tabbar">
            {tabs.map(([id, label]) => (
              <button key={id} aria-current={activeTab === id ? 'page' : undefined} onClick={() => goTo(id)}>
                {label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </MessagesContext.Provider>
  )
}
