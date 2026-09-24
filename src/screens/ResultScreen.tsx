import type { SessionResult } from '../practice/practice.ts'
import { useMessages } from '../i18n.tsx'
import { formatSeconds } from '../format.ts'

type Props = { result: SessionResult; onContinue: () => void }

export function ResultScreen({ result, onContinue }: Props) {
  const m = useMessages()
  return (
    <main className="result">
      <h1>{m.sessionComplete}</h1>
      <p className="session-correct">
        {result.correct} / {result.total}
      </p>
      <p>
        {m.averageTime}: {formatSeconds(result.averageMs)} {m.seconds}
      </p>
      <button className="next" onClick={onContinue} autoFocus>
        {m.continue}
      </button>
    </main>
  )
}
