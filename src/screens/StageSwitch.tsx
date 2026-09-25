import { useMessages } from '../i18n.tsx'
import type { Stage } from '../practice/practice.ts'

/** 段階の切り替え。Lv1「1つ探す」／Lv2「全部探す」／Lv3「一瞬見る」／Lv4「違う字を探す」／Lv5「組み立てる」 */
export function StageSwitch({ stage, onChange }: { stage: Stage; onChange: (stage: Stage) => void }) {
  const m = useMessages()
  const options: [Stage, string][] = [
    ['lv1', m.stageFindOne],
    ['lv2', m.stageFindAll],
    ['lv3', m.stageQuickLook],
    ['lv4', m.stageOddOneOut],
    ['lv5', m.stageBuild],
  ]
  return (
    <div className="stage-switch" role="group">
      {options.map(([id, label]) => (
        <button key={id} aria-pressed={stage === id} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  )
}
