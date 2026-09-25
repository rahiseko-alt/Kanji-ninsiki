import { useLayoutEffect, useRef, useState } from 'react'
import { useMessages } from '../i18n.tsx'
import world from '../assets/intro/world.webp'
import compare from '../assets/intro/compare.webp'
import confident from '../assets/intro/confident.webp'
import confuse from '../assets/intro/confuse.webp'
import overlook from '../assets/intro/overlook.webp'
import puzzled from '../assets/intro/puzzled.webp'
import parts from '../assets/intro/parts.webp'
import goal from '../assets/intro/goal.webp'

/** 文章が下から上へ流れる速さ（1秒あたりの px） */
const ROLL_SPEED = 44

/** 慣れない文字の例（デーヴァナーガリー）と、よく似た漢字の組。どの言語でも同じものを見せる */
const DEVANAGARI = ['क ख ग घ च छ']
const SIMILAR_KANJI = ['未 末', '日 目', '土 士']

type Props = {
  /** 一度でも最後まで見ていれば、途中で「とばす」を出す */
  canSkip: boolean
  onDone: () => void
}

/** アプリ説明: 文章が下から上へ流れ、段落ごとに挿絵を添える */
export function IntroScreen({ canSkip, onDone }: Props) {
  const m = useMessages()
  const rollRef = useRef<HTMLDivElement>(null)
  const [duration, setDuration] = useState<number | null>(null)
  // 動きを減らす設定の端末では流さず、最初から全文を見せる
  const [ended, setEnded] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

  const blocks: { text: string; img?: string; glyphs?: string[]; bullet?: boolean }[] = [
    { text: m.introLead },
    { text: m.introUsed },
    { text: m.introExample, glyphs: DEVANAGARI },
    { text: m.introSame, glyphs: SIMILAR_KANJI },
    { text: m.introWorld, img: world },
    { text: m.introResearch, img: compare },
    { text: m.introEven, img: confident },
    { text: m.introB1, img: confuse, bullet: true },
    { text: m.introB2, img: overlook, bullet: true },
    { text: m.introB3, img: puzzled, bullet: true },
    { text: m.introB4, bullet: true },
    { text: m.introAfter },
    { text: m.introApp, img: parts },
    { text: m.introGoal, img: goal },
  ]

  // 文章の長さは言語で変わるので、高さから流す時間を決める（言語を変えたら最初から流し直す）
  useLayoutEffect(() => {
    const roll = rollRef.current
    if (!roll) return
    setDuration((roll.offsetHeight + window.innerHeight) / ROLL_SPEED)
  }, [m])

  return (
    <main className={`intro ${ended ? 'is-static' : ''}`}>
      <div className="intro-viewport">
        <div
          key={m.introLead}
          ref={rollRef}
          className="intro-roll"
          style={duration ? { animationDuration: `${duration}s` } : { visibility: 'hidden' }}
          onAnimationEnd={() => setEnded(true)}
        >
          {blocks
            .filter((b) => b.text)
            .map((b) => (
              <section key={b.text} className={`intro-block ${b.bullet ? 'is-bullet' : ''}`}>
                {b.img && <img src={b.img} alt="" loading="lazy" />}
                <p>{b.text}</p>
                {b.glyphs && (
                  <div className="intro-glyphs" aria-hidden="true">
                    {b.glyphs.map((g) => (
                      <span key={g}>{g}</span>
                    ))}
                  </div>
                )}
              </section>
            ))}
        </div>
      </div>
      {(ended || canSkip) && (
        <button className={ended ? 'ink-button intro-next' : 'intro-skip'} onClick={onDone}>
          <span>{ended ? m.next : m.skip}</span>
          {ended && (
            <span className="chevron" aria-hidden="true">
              ›
            </span>
          )}
        </button>
      )}
    </main>
  )
}
