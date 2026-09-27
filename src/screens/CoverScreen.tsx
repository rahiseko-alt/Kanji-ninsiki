import { APP_NAME } from '../i18n.tsx'
import stones from '../assets/cover/stones.webp'
import seal from '../assets/cover/seal.webp'

/** 表紙: 開くたびに最初に出す。題字「認字 NINJI」と START（利用者のデザインどおり、どの言語でも同じ） */
export function CoverScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="cover">
      <img className="cover-stones" src={stones} alt="" width={720} height={422} />
      <div className="cover-heading">
        <h1 className="cover-title" lang="ja">
          {APP_NAME}
        </h1>
        {/* 開発元の印（利用者の見本どおり、朱の縦長の二重枠） */}
        <img className="cover-seal" src={seal} alt="開発元 小齊平 恒平" lang="ja" width={200} height={672} />
      </div>
      <p className="cover-reading">NINJI</p>
      <button className="cover-start" onClick={onStart}>
        START
      </button>
    </main>
  )
}
