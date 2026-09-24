import type { SessionResult } from '../practice/practice.ts'

type Props = { result: SessionResult; onContinue: () => void }

export function ResultScreen({ result, onContinue }: Props) {
  return (
    <main className="result">
      <h1>Session complete</h1>
      <p className="score">
        {result.correct} / {result.total}
      </p>
      <p>Average time: {(result.averageMs / 1000).toFixed(1)} s</p>
      <button className="next" onClick={onContinue} autoFocus>
        Continue
      </button>
    </main>
  )
}
