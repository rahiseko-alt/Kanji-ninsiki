import { useState } from 'react'
import { loadRecord, saveRecord } from './storage.ts'
import { PracticeScreen } from './screens/PracticeScreen.tsx'
import { ResultScreen } from './screens/ResultScreen.tsx'
import type { PracticeRecord, SessionResult } from './practice/practice.ts'

export function App() {
  const [record, setRecord] = useState<PracticeRecord>(loadRecord)
  const [result, setResult] = useState<SessionResult | null>(null)

  const updateRecord = (next: PracticeRecord) => {
    saveRecord(next)
    setRecord(next)
  }

  return result ? (
    <ResultScreen result={result} onContinue={() => setResult(null)} />
  ) : (
    <PracticeScreen record={record} onRecord={updateRecord} onSessionEnd={setResult} />
  )
}
