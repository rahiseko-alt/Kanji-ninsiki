import { useState } from 'react'
import { loadRecord, saveRecord } from './storage.ts'
import { loadSettings, saveSettings, type Settings } from './settings.ts'
import { messages, MessagesContext } from './i18n.tsx'
import { PracticeScreen } from './screens/PracticeScreen.tsx'
import { ResultScreen } from './screens/ResultScreen.tsx'
import { RecordsScreen } from './screens/RecordsScreen.tsx'
import { CreditsScreen } from './screens/CreditsScreen.tsx'
import { initialRecord, type PracticeRecord, type SessionResult } from './practice/practice.ts'

type Screen = 'practice' | 'records' | 'credits'

export function App() {
  const [record, setRecord] = useState<PracticeRecord>(loadRecord)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [result, setResult] = useState<SessionResult | null>(null)
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
            <button key={id} aria-current={screen === id ? 'page' : undefined} onClick={() => setScreen(id)}>
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
        {!settings.seenIntro ? (
          <main className="page intro">
            <h1>{m.introTitle}</h1>
            <p>{m.introBody}</p>
            <button className="next" onClick={() => updateSettings({ ...settings, seenIntro: true })} autoFocus>
              {m.introOk}
            </button>
          </main>
        ) : screen === 'records' ? (
          <RecordsScreen
            record={record}
            onReset={() => {
              updateRecord(initialRecord())
              setResult(null)
            }}
          />
        ) : screen === 'credits' ? (
          <CreditsScreen />
        ) : result ? (
          <ResultScreen result={result} onContinue={() => setResult(null)} />
        ) : (
          <PracticeScreen record={record} onRecord={updateRecord} onSessionEnd={setResult} />
        )}
      </div>
    </MessagesContext.Provider>
  )
}
