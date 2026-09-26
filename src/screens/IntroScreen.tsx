import { useMessages } from '../i18n.tsx'
import world from '../assets/intro/world.webp'
import compare from '../assets/intro/compare.webp'
import confident from '../assets/intro/confident.webp'
import confuse from '../assets/intro/confuse.webp'
import overlook from '../assets/intro/overlook.webp'
import puzzled from '../assets/intro/puzzled.webp'
import parts from '../assets/intro/parts.webp'
import goal from '../assets/intro/goal.webp'

/** 慣れない文字の例（デーヴァナーガリー）と、よく似た漢字の組。どの言語でも同じものを見せる */
const DEVANAGARI = ['क ख ग घ च छ']
const SIMILAR_KANJI = ['未 末', '日 目', '土 士']

/** アプリ説明: 文章と挿絵を1枚のページにまとめ、利用者が自分でスクロールして読む（流す演出は利用者の指示でやめた） */
export function IntroScreen({ onDone }: { onDone: () => void }) {
  const m = useMessages()
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

  return (
    <main className="intro">
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
        {/* 読み終えたら進むボタン（ページの最後） */}
        <button className="ink-button intro-next" onClick={onDone}>
          <span>{m.next}</span>
        </button>
      </div>
      {/* 途中で飛ばすボタン。スクロールしても画面の右下に残る */}
      <button className="intro-skip" onClick={onDone}>
        {m.skip}
      </button>
    </main>
  )
}
