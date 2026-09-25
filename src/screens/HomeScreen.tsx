import { LANGUAGE_NAMES, LANGUAGE_SHORT, useMessages, type Language } from '../i18n.tsx'
import { START_POSITIONS } from '../practice/practice.ts'
import logo from '../assets/home/logo.webp'
import landscape from '../assets/home/landscape.webp'

type Props = {
  startAt: number
  language: Language
  onPractice: () => void
  onStart: (startAt: number) => void
  onLanguage: (language: Language) => void
}

/** ホーム: アプリ名、始める位置、練習を始めるボタン、表示言語（右上） */
export function HomeScreen({ startAt, language, onPractice, onStart, onLanguage }: Props) {
  const m = useMessages()
  const options: { value: number; name: string; desc: string }[] = [
    { value: START_POSITIONS.beginner, name: m.startBeginner, desc: m.startDescBeginner },
    { value: START_POSITIONS.some, name: m.startSome, desc: m.startDescSome },
    { value: START_POSITIONS.well, name: m.startWell, desc: m.startDescWell },
  ]
  return (
    <main className="home">
      <label className="home-lang">
        <span aria-hidden="true">{LANGUAGE_SHORT[language]}</span>
        <select aria-label={m.languageLabel} value={language} onChange={(e) => onLanguage(e.target.value as Language)}>
          {(Object.keys(LANGUAGE_NAMES) as Language[]).map((l) => (
            <option key={l} value={l} lang={l}>
              {LANGUAGE_NAMES[l]}
            </option>
          ))}
        </select>
      </label>

      <header className="home-hero">
        <img className="home-logo" src={logo} alt="" width={160} height={150} />
        <h1>{m.appTitle}</h1>
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

      <img className="home-landscape" src={landscape} alt="" />
    </main>
  )
}
