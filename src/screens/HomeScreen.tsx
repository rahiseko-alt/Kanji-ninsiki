import { APP_NAME, useMessages } from '../i18n.tsx'
import { START_POSITIONS } from '../practice/practice.ts'
import stones from '../assets/cover/stones.webp'

type Props = {
  startAt: number
  onPractice: () => void
  onStart: (startAt: number) => void
}

/** ホーム: アプリ名、始める位置、モード選択へ進むボタン */
export function HomeScreen({ startAt, onPractice, onStart }: Props) {
  const m = useMessages()
  const options: { value: number; name: string; desc: string }[] = [
    { value: START_POSITIONS.beginner, name: m.startBeginner, desc: m.startDescBeginner },
    { value: START_POSITIONS.some, name: m.startSome, desc: m.startDescSome },
    { value: START_POSITIONS.well, name: m.startWell, desc: m.startDescWell },
  ]
  return (
    <main className="home">
      <header className="home-hero">
        <img className="home-stones" src={stones} alt="" width={720} height={422} />
        <h1 lang="ja">{APP_NAME}</h1>
        <p className="home-subtitle">{m.appSubtitle}</p>
      </header>

      <section className="home-start">
        <h2>{m.startTitle}</h2>
        <div className="brush-line" aria-hidden="true" />
        <div className="start-cards" role="radiogroup" aria-label={m.startTitle}>
          {options.map((o) => (
            <button
              key={o.value}
              className="start-card"
              role="radio"
              aria-checked={startAt === o.value}
              onClick={() => onStart(o.value)}
            >
              <span className="start-card-text">
                <span className="start-card-name">{o.name}</span>
                <span className="start-card-desc">{o.desc}</span>
              </span>
              <span className="chevron" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
        </div>
      </section>

      <button className="ink-button" onClick={onPractice}>
        <span>{m.startPractice}</span>
        <span className="chevron" aria-hidden="true">
          ›
        </span>
      </button>
      <p className="home-note">{m.readingNote}</p>

    </main>
  )
}
