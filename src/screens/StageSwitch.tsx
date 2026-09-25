import { useMessages } from '../i18n.tsx'
import type { Stage } from '../practice/practice.ts'

/** 段階の切り替え。Lv1「1つ さがす」／Lv2「ぜんぶ さがす」／Lv3「いっしゅん みる」／Lv4「ちがう じを さがす」／Lv5「くみたてる」 */
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
