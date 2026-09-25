import { useCallback, useEffect, useState } from 'react'
import { loadRecord, saveRecord } from './storage.ts'
import { loadSettings, saveSettings, type Settings } from './settings.ts'
import { messages, MessagesContext } from './i18n.tsx'
import { HomeScreen } from './screens/HomeScreen.tsx'
import { LanguageSelect } from './screens/LanguageSelect.tsx'
import { PracticeScreen } from './screens/PracticeScreen.tsx'
import { BoardScreen } from './screens/BoardScreen.tsx'
import { OddScreen } from './screens/OddScreen.tsx'
import { StageSwitch } from './screens/StageSwitch.tsx'
import { StartChoice } from './screens/StartChoice.tsx'
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

  const tabs: [Screen, string][] = [
    ['home', m.navHome],
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
          <LanguageSelect
            className="lang-switch"
            language={settings.language}
            onChange={(language) => updateSettings({ ...settings, language })}
          />
        </nav>
        {screen === 'home' ? (
          <HomeScreen
            stage={settings.stage}
            startAt={record.startAt}
            language={settings.language}
            onPractice={(stage) => {
              chooseStage(stage)
              goTo('practice')
            }}
            onStart={(startAt) => {
              if (startAt !== record.startAt && window.confirm(m.confirmStart)) {
                updateRecord(withStart(record, kanjiData, startAt))
              }
            }}
            onLanguage={(language) => updateSettings({ ...settings, language })}
          />
        ) : screen === 'records' ? (
          <RecordsScreen
            record={record}
            initialStage={settings.stage}
            onStart={(startAt) => {
              if (startAt !== record.startAt && window.confirm(m.confirmStart)) {
                updateRecord(withStart(record, kanjiData, startAt))
              }
            }}
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
            <StartChoice startAt={record.startAt} onChange={(startAt) => updateRecord(withStart(record, kanjiData, startAt))} />
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
