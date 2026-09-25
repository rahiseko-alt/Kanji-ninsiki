import { APP_NAME } from '../i18n.tsx'
import stones from '../assets/cover/stones.webp'

/** 表紙: 開くたびに最初に出す。題字「認字 NINJI」と START（利用者のデザインどおり、どの言語でも同じ） */
export function CoverScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="cover">
      <img className="cover-stones" src={stones} alt="" width={720} height={422} />
      <h1 className="cover-title" lang="ja">
        {APP_NAME}
      </h1>
      <p className="cover-reading">NINJI</p>
      <button className="cover-start" onClick={onStart}>
        START
      </button>
    </main>
  )
}
