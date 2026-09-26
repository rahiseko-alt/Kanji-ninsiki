import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import './style.css'
import { registerSW } from 'virtual:pwa-register'

// 新しい版を公開したら、開いている画面もすぐ新しい版に切り替える（端末に保存した古い版が残り続けないように）
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    // アプリに戻ってきたときにも、新しい版が出ていないか確かめる
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update()
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
