import { useCallback, useState } from 'react'
import { loadRecord, saveRecord } from './storage.ts'
import { loadSettings, saveSettings, type Settings } from './settings.ts'
import { messages, MessagesContext } from './i18n.tsx'
import { PracticeScreen } from './screens/PracticeScreen.tsx'
import { BoardScreen } from './screens/BoardScreen.tsx'
import { OddScreen } from './screens/OddScreen.tsx'
import { StageSwitch } from './screens/StageSwitch.tsx'
import { ResultScreen } from './screens/ResultScreen.tsx'
import { RecordsScreen } from './screens/RecordsScreen.tsx'
import { CreditsScreen } from './screens/CreditsScreen.tsx'
import { initialRecord, type PracticeRecord, type SessionResult, type Stage } from './practice/practice.ts'

type Screen = 'practice' | 'records' | 'credits'

export function App() {
  const [record, setRecord] = useState<PracticeRecord>(loadRecord)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  // 練習回の結果。10問目に答えた時点で受け取り、結果画面を閉じるまで持つ
  const [result, setResult] = useState<SessionResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [screen, setScreen] = useState<Screen>('practice')
  const m = messages[settings.language]

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

  const tabs: [Screen, string][] = [
    ['practice', m.navPractice],
    ['records', m.navRecords],
    ['credits', m.navCredits],
  ]

  return (
    <MessagesContext.Provider value={m}>
      <div lang={settings.language}>
        <nav className="nav">
          {tabs.map(([id, label]) => (
            <button key={id} aria-current={screen === id ? 'page' : undefined} onClick={() => goTo(id)}>
              {label}
            </button>
          ))}
          <button
            className="lang-switch"
            onClick={() => updateSettings({ ...settings, language: settings.language === 'en' ? 'ja' : 'en' })}
          >
            {m.switchLanguage}
          </button>
        </nav>
        {screen === 'records' ? (
          <RecordsScreen
            record={record}
            initialStage={settings.stage}
            onReset={() => {
              updateRecord(initialRecord())
              clearResult()
            }}
          />
        ) : screen === 'credits' ? (
          <CreditsScreen />
        ) : !settings.seenIntro ? (
          <main className="page intro">
            <h1>{m.introTitle}</h1>
            <p>{m.introBody}</p>
            <button className="next" onClick={() => updateSettings({ ...settings, seenIntro: true })} autoFocus>
              {m.introOk}
            </button>
          </main>
        ) : (
          <>
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
      </div>
    </MessagesContext.Provider>
  )
}
