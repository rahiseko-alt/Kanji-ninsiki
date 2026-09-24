import type { SessionResult } from '../practice/practice.ts'
import { useMessages } from '../i18n.tsx'

type Props = { result: SessionResult; onContinue: () => void }

export function ResultScreen({ result, onContinue }: Props) {
  const m = useMessages()
  return (
    <main className="result">
      <h1>{m.sessionComplete}</h1>
      <p className="score">
        {result.correct} / {result.total}
      </p>
      <p>
        {m.averageTime}: {(result.averageMs / 1000).toFixed(1)} {m.seconds}
      </p>
      <button className="next" onClick={onContinue} autoFocus>
        {m.continue}
      </button>
    </main>
  )
}
