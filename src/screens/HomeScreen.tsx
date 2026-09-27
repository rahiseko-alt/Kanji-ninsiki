import { APP_NAME, useMessages } from '../i18n.tsx'
import { RANGE_STARTS } from '../practice/session.ts'
import stones from '../assets/cover/stones.webp'

type Props = {
  startAt: number
  /** レベルを選ぶと、そのままモード選択へ進む */
  onChoose: (startAt: number) => void
}

/** ホーム: アプリ名と出題範囲（レベル1〜3）。レベルを選ぶとモード選択へ進む */
export function HomeScreen({ startAt, onChoose }: Props) {
  const m = useMessages()
  const names = [m.startBeginner, m.startSome, m.startWell]
  const options = RANGE_STARTS.map((value, i) => ({ value, name: names[i] }))
  return (
    <main className="home">
      <header className="home-hero">
        <img className="home-stones" src={stones} alt="" width={720} height={422} />
        <h1 lang="ja">{APP_NAME}</h1>
        <p className="home-subtitle">{m.appSubtitle}</p>
      </header>

      <section className="home-start">
        <nav className="start-cards" aria-label={m.startTitle}>
          {options.map((o) => (
            <button
              key={o.value}
              className="start-card"
              aria-current={startAt === o.value ? 'true' : undefined}
              onClick={() => onChoose(o.value)}
            >
              <span className="start-card-text">
                <span className="start-card-name">{o.name}</span>
              </span>
              <span className="chevron" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
        </nav>
      </section>
    </main>
  )
}
