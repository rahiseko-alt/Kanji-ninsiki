import { useMessages, type Language } from '../i18n.tsx'
import type { Stage } from '../practice/practice.ts'
import { StartChoice } from './StartChoice.tsx'
import { LanguageSelect } from './LanguageSelect.tsx'

type Props = {
  stage: Stage
  startAt: number
  language: Language
  /** 段階を選んで練習を始める */
  onPractice: (stage: Stage) => void
  onStart: (startAt: number) => void
  onLanguage: (language: Language) => void
}

/** ホーム: アプリの説明、練習を始めるボタン、段階の一覧、始める位置、表示言語 */
export function HomeScreen({ stage, startAt, language, onPractice, onStart, onLanguage }: Props) {
  const m = useMessages()
  const stages: { id: Stage; name: string; desc: string; sample: string }[] = [
    { id: 'lv1', name: m.stageFindOne, desc: m.descLv1, sample: '持' },
    { id: 'lv2', name: m.stageFindAll, desc: m.descLv2, sample: '持持' },
    { id: 'lv3', name: m.stageQuickLook, desc: m.descLv3, sample: '？' },
    { id: 'lv4', name: m.stageOddOneOut, desc: m.descLv4, sample: '持待' },
    { id: 'lv5', name: m.stageBuild, desc: m.descLv5, sample: '扌寺' },
  ]
  return (
    <main className="page home">
      <header className="home-hero">
        <div className="home-mark" lang="ja" aria-hidden="true">
          字
        </div>
        <h1>{m.appTitle}</h1>
        <p className="tagline">{m.appTagline}</p>
        <p className="hint">{m.storageNote}</p>
        <button className="next home-start" onClick={() => onPractice(stage)}>
          {m.startPractice}
        </button>
      </header>

      <section>
        <h2>{m.stagesTitle}</h2>
        <ol className="stage-cards">
          {stages.map((s, i) => (
            <li key={s.id}>
              <button className="stage-card" aria-current={s.id === stage ? 'true' : undefined} onClick={() => onPractice(s.id)}>
                <span className="stage-sample" lang="ja" aria-hidden="true">
                  {s.sample}
                </span>
                <span className="stage-text">
                  <span className="stage-name">
                    {i + 1}. {s.name}
                  </span>
                  <span className="stage-desc">{s.desc}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <StartChoice startAt={startAt} onChange={onStart} />

      <section className="home-language">
        <h2>{m.languageLabel}</h2>
        <LanguageSelect language={language} onChange={onLanguage} />
      </section>
    </main>
  )
}
