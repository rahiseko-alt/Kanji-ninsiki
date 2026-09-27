import { APP_NAME } from '../i18n.tsx'
import stones from '../assets/cover/stones.webp'
import seal from '../assets/cover/seal.webp'

/** 表紙: 開くたびに最初に出す。題字「認字 NINJI」と START（利用者のデザインどおり、どの言語でも同じ） */
export function CoverScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="cover">
      <img className="cover-stones" src={stones} alt="" width={519} height={363} />
      {/* 題字と開発元の印をひと組にして中央に置く。印は題字の字の高さにそろえた正方形（利用者の見本の意匠） */}
      <div className="cover-heading">
        <div className="cover-name">
          <h1 className="cover-title" lang="ja">
            {APP_NAME}
          </h1>
          <p className="cover-reading">NINJI</p>
        </div>
        <img className="cover-seal" src={seal} alt="開発元 小齊平 恒平" lang="ja" width={400} height={400} />
      </div>
      <button className="cover-start" onClick={onStart}>
        START
      </button>
    </main>
  )
}
