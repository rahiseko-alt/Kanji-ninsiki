import { useMessages } from '../i18n.tsx'
import logo from '../assets/home/logo.webp'
import landscape from '../assets/home/landscape.webp'

/** 表紙: 開くたびに最初に出す。アプリ名と、アプリ説明へ進むボタン */
export function CoverScreen({ onStart }: { onStart: () => void }) {
  const m = useMessages()
  return (
    <main className="home cover">
      <header className="home-hero">
        <img className="home-logo" src={logo} alt="" width={160} height={150} />
        <h1>{m.appTitle}</h1>
        <p className="home-subtitle">{m.appSubtitle}</p>
      </header>
      <button className="ink-button" onClick={onStart}>
        <span>{m.coverStart}</span>
        <span className="chevron" aria-hidden="true">
          ›
        </span>
      </button>
      <img className="home-landscape" src={landscape} alt="" />
    </main>
  )
}
