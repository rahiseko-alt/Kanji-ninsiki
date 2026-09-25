import { useEffect, useRef, useState } from 'react'
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
const ROLL_SPEED = 50

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
  const viewRef = useRef<HTMLDivElement>(null)
  // 動きを減らす設定の端末では流さず、最初から全文を見せる
  const [reduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const [ended, setEnded] = useState(reduced)

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

  // 文章と挿絵を1枚のページとしてまとめ、そのページを下から上へ送る（画面の送りなので、途中で消えない）。
  // 利用者が指で動かしたら、その位置から続ける。言語を変えたら最初から流し直す
  useEffect(() => {
    const view = viewRef.current
    if (!view || reduced) return
    view.scrollTop = 0
    setEnded(false)
    let pos = 0
    let last = performance.now()
    let raf = 0
    const tick = (now: number) => {
      if (Math.abs(view.scrollTop - pos) > 4) pos = view.scrollTop
      pos += ((now - last) / 1000) * ROLL_SPEED
      last = now
      if (pos >= view.scrollHeight - view.clientHeight) {
        setEnded(true)
        return
      }
      view.scrollTop = pos
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [m, reduced])

  return (
    <main className={`intro ${reduced ? 'is-static' : ''}`}>
      <div className="intro-viewport" ref={viewRef}>
        <div className="intro-roll">
          {blocks
            .filter((b) => b.text)
            .map((b) => (
              <section key={b.text} className={`intro-block ${b.bullet ? 'is-bullet' : ''}`}>
                {b.img && <img src={b.img} alt="" />}
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
