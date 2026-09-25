import { useCallback, useEffect, useState } from 'react'
import { loadRecord, saveRecord } from './storage.ts'
import { loadSettings, saveSettings, type Settings } from './settings.ts'
import { messages, MessagesContext, type Language } from './i18n.tsx'
import { HomeScreen } from './screens/HomeScreen.tsx'
import { PracticeScreen } from './screens/PracticeScreen.tsx'
import { BoardScreen } from './screens/BoardScreen.tsx'
import { OddScreen } from './screens/OddScreen.tsx'
import { StageSwitch } from './screens/StageSwitch.tsx'
import { kanjiData } from './kanjiData.ts'
import { ResultScreen } from './screens/ResultScreen.tsx'
import { RecordsScreen } from './screens/RecordsScreen.tsx'
import { CreditsScreen } from './screens/CreditsScreen.tsx'
import { initialRecord, withStart, type PracticeRecord, type SessionResult, type Stage } from './practice/practice.ts'

type Screen = 'home' | 'practice' | 'records' | 'credits'

export function App() {
  const [record, setRecord] = useState<PracticeRecord>(loadRecord)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  // 練習回の結果。10問目に答えた時点で受け取り、結果画面を閉じるまで持つ
  const [result, setResult] = useState<SessionResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  // 開いたときはホームを出す
  const [screen, setScreen] = useState<Screen>('home')
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

  const openResult = useCallback(() => setShowResult(true), [])
  const clearResult = () => {
    setResult(null)
    setShowResult(false)
  }
  // 10問目のあとで別の画面へ移っても、戻ってきたときに結果画面を出す
  const goTo = (next: Screen) => {
    if (next !== screen && result) setShowResult(true)
    setScreen(next)
  }

  // 10問目のあとで段階を切り替えても、その練習回の結果画面を出す
  const chooseStage = (stage: Stage) => {
    if (result) setShowResult(true)
    updateSettings({ ...settings, stage })
  }

  // 始める位置の変更は、練習したことがあれば確認のうえ（記録は残る）
  const changeStart = (startAt: number) => {
    if (startAt === record.startAt) return
    const practiced = Object.keys(record.stats).length > 0
    if (!practiced || window.confirm(m.confirmStart)) updateRecord(withStart(record, kanjiData, startAt))
  }
  const changeLanguage = (language: Language) => updateSettings({ ...settings, language })

  // 下のタブ。「練習」はホームと練習の画面の両方を受け持つ
  const tabs: [Screen, string][] = [
    ['home', m.navPractice],
    ['records', m.navRecords],
    ['credits', m.navCredits],
  ]
  const activeTab = screen === 'practice' ? 'home' : screen

  return (
    <MessagesContext.Provider value={m}>
      <div lang={settings.language} className="app">
        {screen === 'home' ? (
          <HomeScreen
            startAt={record.startAt}
            language={settings.language}
            onPractice={() => goTo('practice')}
            onStart={changeStart}
            onLanguage={changeLanguage}
          />
        ) : screen === 'records' ? (
          <RecordsScreen
            record={record}
            initialStage={settings.stage}
            onStart={changeStart}
            onReset={() => {
              updateRecord(initialRecord())
              clearResult()
            }}
          />
        ) : screen === 'credits' ? (
          <CreditsScreen />
        ) : (
          <>
            <div className="practice-top">
              <button className="back" onClick={() => goTo('home')}>
                ‹ {m.navHome}
              </button>
            </div>
            <StageSwitch stage={settings.stage} onChange={chooseStage} />
            {result && showResult ? (
              <ResultScreen result={result} onContinue={clearResult} />
            ) : (
              settings.stage === 'lv4' ? (
                <OddScreen
                  key={settings.stage}
                  record={record}
                  onRecord={updateRecord}
                  onSessionResult={setResult}
                  onShowResult={openResult}
                />
              ) : settings.stage === 'lv2' ? (
                <BoardScreen
                  key={settings.stage}
                  record={record}
                  onRecord={updateRecord}
                  onSessionResult={setResult}
                  onShowResult={openResult}
                />
              ) : (
                <PracticeScreen
                  key={settings.stage}
                  stage={settings.stage}
                  record={record}
                  onRecord={updateRecord}
                  onSessionResult={setResult}
                  onShowResult={openResult}
                />
              )
            )}
          </>
        )}
        <nav className="tabbar">
          {tabs.map(([id, label]) => (
            <button key={id} aria-current={activeTab === id ? 'page' : undefined} onClick={() => goTo(id)}>
              {label}
            </button>
          ))}
        </nav>
      </div>
    </MessagesContext.Provider>
  )
}
