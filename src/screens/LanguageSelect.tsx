import { LANGUAGE_NAMES, LANGUAGE_SHORT, useMessages, type Language } from '../i18n.tsx'

/** 表示言語の切り替え。どの画面でも右上に出す */
export function LanguageSelect({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  const m = useMessages()
  return (
    <label className="lang-switch">
      <span aria-hidden="true">{LANGUAGE_SHORT[language]}</span>
      <select aria-label={m.languageLabel} value={language} onChange={(e) => onChange(e.target.value as Language)}>
        {(Object.keys(LANGUAGE_NAMES) as Language[]).map((l) => (
          <option key={l} value={l} lang={l}>
            {LANGUAGE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  )
}
