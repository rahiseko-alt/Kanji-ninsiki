import { useMessages } from '../i18n.tsx'
import type { Stage } from '../practice/practice.ts'

type Props = {
  stage: Stage
  onChoose: (stage: Stage) => void
  onBack: () => void
}

/** モード選択: 段階（Lv1〜Lv5）を選んで練習を始める */
export function ModeScreen({ stage, onChoose, onBack }: Props) {
  const m = useMessages()
  const options: [Stage, string, string][] = [
    ['lv1', m.stageFindOne, m.stageDescFindOne],
    ['lv2', m.stageFindAll, m.stageDescFindAll],
    ['lv3', m.stageQuickLook, m.stageDescQuickLook],
    ['lv4', m.stageOddOneOut, m.stageDescOddOneOut],
    ['lv5', m.stageBuild, m.stageDescBuild],
  ]
  return (
    <main className="home modes">
      <div className="practice-top">
        <button className="back" onClick={onBack}>
          ‹ {m.navHome}
        </button>
      </div>
      <section className="home-start">
        <h2>{m.modeTitle}</h2>
        <div className="brush-line" aria-hidden="true" />
        <div className="start-cards">
          {options.map(([id, name, desc]) => (
            <button key={id} className="start-card" aria-current={stage === id ? 'true' : undefined} onClick={() => onChoose(id)}>
              <span className="start-card-text">
                <span className="start-card-name">{name}</span>
                <span className="start-card-desc">{desc}</span>
              </span>
              <span className="chevron" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
