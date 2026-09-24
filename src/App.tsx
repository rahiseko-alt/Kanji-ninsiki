import { useState } from 'react'
import { loadRecord, saveRecord } from './storage.ts'
import { PracticeScreen } from './screens/PracticeScreen.tsx'
import { ResultScreen } from './screens/ResultScreen.tsx'
import { RecordsScreen } from './screens/RecordsScreen.tsx'
import { initialRecord, type PracticeRecord, type SessionResult } from './practice/practice.ts'

type Screen = 'practice' | 'records'

export function App() {
  const [record, setRecord] = useState<PracticeRecord>(loadRecord)
  const [result, setResult] = useState<SessionResult | null>(null)
  const [screen, setScreen] = useState<Screen>('practice')

  const updateRecord = (next: PracticeRecord) => {
    saveRecord(next)
    setRecord(next)
  }

  const tabs: [Screen, string][] = [
    ['practice', 'Practice'],
    ['records', 'Records'],
  ]

  return (
    <>
      <nav className="nav">
        {tabs.map(([id, label]) => (
          <button key={id} aria-current={screen === id ? 'page' : undefined} onClick={() => setScreen(id)}>
            {label}
          </button>
        ))}
      </nav>
      {screen === 'records' ? (
        <RecordsScreen
          record={record}
          onReset={() => {
            updateRecord(initialRecord())
            setResult(null)
          }}
        />
      ) : result ? (
        <ResultScreen result={result} onContinue={() => setResult(null)} />
      ) : (
        <PracticeScreen record={record} onRecord={updateRecord} onSessionEnd={setResult} />
      )}
    </>
  )
}
