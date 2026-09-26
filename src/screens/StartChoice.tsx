import { useMessages } from '../i18n.tsx'
import { START_POSITIONS } from '../practice/practice.ts'

type Props = { startAt: number; onChange: (startAt: number) => void }

/** 始める位置の選択（レベル1／レベル2／レベル3） */
export function StartChoice({ startAt, onChange }: Props) {
  const m = useMessages()
  const options: [number, string][] = [
    [START_POSITIONS.beginner, m.startBeginner],
    [START_POSITIONS.some, m.startSome],
    [START_POSITIONS.well, m.startWell],
  ]
  return (
    <section className="start-choice">
      <h2>{m.startTitle}</h2>
      <div className="stage-switch start-options" role="group">
        {options.map(([value, label]) => (
          <button key={value} aria-pressed={startAt === value} onClick={() => onChange(value)}>
            {label}
          </button>
        ))}
      </div>
      <p className="hint">{m.startHint}</p>
    </section>
  )
}
