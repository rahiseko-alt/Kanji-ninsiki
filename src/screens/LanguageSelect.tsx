import { LANGUAGE_NAMES, useMessages, type Language } from '../i18n.tsx'

type Props = { language: Language; onChange: (language: Language) => void; className?: string }

/** 表示言語の選択。選択肢はそれぞれの言語の名前で出す */
export function LanguageSelect({ language, onChange, className }: Props) {
  const m = useMessages()
  return (
    <select
      className={className}
      aria-label={m.languageLabel}
      value={language}
      onChange={(e) => onChange(e.target.value as Language)}
    >
      {(Object.keys(LANGUAGE_NAMES) as Language[]).map((l) => (
        <option key={l} value={l} lang={l}>
          {LANGUAGE_NAMES[l]}
        </option>
      ))}
    </select>
  )
}
