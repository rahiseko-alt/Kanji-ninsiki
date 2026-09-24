import type { PracticeRecord, SessionResult } from '../practice/practice.ts'

type Props = { record: PracticeRecord; onReset: () => void }

export function RecordsScreen({ record, onReset }: Props) {
  const sessions = record.sessions
  return (
    <main className="records">
      <h1>Your records</h1>
      <p>
        Kanji you are practicing: <strong>{record.learningCount}</strong>
      </p>
      {sessions.length === 0 ? (
        <p className="empty">No sessions yet. Finish a 10-question session to see your progress.</p>
      ) : (
        <>
          <TrendChart
            title="Average time per question (seconds)"
            sessions={sessions}
            value={(s) => s.averageMs / 1000}
            format={(v) => v.toFixed(1)}
          />
          <TrendChart
            title="Correct answers (%)"
            sessions={sessions}
            value={(s) => (s.correct / s.total) * 100}
            format={(v) => v.toFixed(0)}
            fixedMax={100}
          />
          <table className="session-table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Correct</th>
                <th>Average time</th>
              </tr>
            </thead>
            <tbody>
              {sessions
                .map((s, i) => ({ s, n: i + 1 }))
                .reverse()
                .map(({ s, n }) => (
                  <tr key={n}>
                    <td>{n}</td>
                    <td>
                      {s.correct} / {s.total}
                    </td>
                    <td>{(s.averageMs / 1000).toFixed(1)} s</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}
      <button
        className="danger"
        onClick={() => {
          if (window.confirm('Delete all your records and start over?')) onReset()
        }}
      >
        Delete records
      </button>
    </main>
  )
}

type ChartProps = {
  title: string
  sessions: SessionResult[]
  value: (s: SessionResult) => number
  format: (v: number) => string
  fixedMax?: number
}

const W = 320
const H = 120
const PAD = { top: 12, right: 12, bottom: 20, left: 32 }

/** 練習回ごとの移り変わりを示す1系列の折れ線 */
function TrendChart({ title, sessions, value, format, fixedMax }: ChartProps) {
  const values = sessions.map(value)
  const max = fixedMax ?? Math.max(...values) * 1.1
  const x = (i: number) =>
    PAD.left + (values.length === 1 ? (W - PAD.left - PAD.right) / 2 : (i * (W - PAD.left - PAD.right)) / (values.length - 1))
  const y = (v: number) => PAD.top + (1 - v / max) * (H - PAD.top - PAD.bottom)
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  return (
    <figure className="trend">
      <figcaption>{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        <line className="axis" x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} />
        <text className="tick" x={PAD.left - 6} y={y(max) + 4} textAnchor="end">
          {format(max)}
        </text>
        <text className="tick" x={PAD.left - 6} y={y(0) + 4} textAnchor="end">
          0
        </text>
        {values.length > 1 && <polyline className="line" points={points} />}
        {values.map((v, i) => (
          <g key={i}>
            <circle className="dot" cx={x(i)} cy={y(v)} r={4} />
            <circle className="hit" cx={x(i)} cy={y(v)} r={12}>
              <title>{`Session ${i + 1}: ${format(v)}`}</title>
            </circle>
          </g>
        ))}
      </svg>
    </figure>
  )
}
