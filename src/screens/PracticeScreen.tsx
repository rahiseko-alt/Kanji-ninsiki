import { useCallback, useEffect, useRef, useState } from 'react'
import { kanjiData } from '../kanjiData.ts'
import {
  answer,
  nextQuestion,
  QUESTIONS_PER_SESSION,
  type PracticeRecord,
  type SessionResult,
} from '../practice/practice.ts'
import type { Question } from '../practice/question.ts'
import { useMessages } from '../i18n.tsx'

type Props = {
  record: PracticeRecord
  onRecord: (record: PracticeRecord) => void
  onSessionEnd: (result: SessionResult) => void
}

/** 正解のときに次の問題へ移るまでの間 */
const CORRECT_PAUSE_MS = 500

export function PracticeScreen({ record, onRecord, onSessionEnd }: Props) {
  const m = useMessages()
  const [question, setQuestion] = useState<Question>(() => nextQuestion(record, kanjiData, Math.random))
  const [picked, setPicked] = useState<string | null>(null)
  const [pendingResult, setPendingResult] = useState<SessionResult | undefined>()
  const [latest, setLatest] = useState(record)
  const shownAt = useRef(performance.now())

    const answered = picked !== null
  const correct = picked === question.target
  const questionNumber =
    picked === null ? record.currentSession.length + 1 : pendingResult ? QUESTIONS_PER_SESSION : record.currentSession.length

  const goNext = useCallback(() => {
    if (pendingResult) {
      onSessionEnd(pendingResult)
      return
    }
    setQuestion(nextQuestion(latest, kanjiData, Math.random))
    setPicked(null)
    shownAt.current = performance.now()
  }, [latest, pendingResult, onSessionEnd])

  const choose = useCallback(
    (c: string) => {
      if (picked !== null) return
      const outcome = answer(record, kanjiData, question, c, Math.round(performance.now() - shownAt.current))
      setPicked(c)
      setLatest(outcome.record)
      setPendingResult(outcome.sessionResult)
      onRecord(outcome.record)
    },
    [picked, record, question, onRecord],
  )

  // 正解ならすぐ次へ
  useEffect(() => {
    if (!answered || !correct) return
    const id = setTimeout(goNext, CORRECT_PAUSE_MS)
    return () => clearTimeout(id)
  }, [answered, correct, goNext])

  // 数字キーで答え、Enter／スペースで次へ
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!answered) {
        const n = Number(e.key)
        if (n >= 1 && n <= question.choices.length) choose(question.choices[n - 1])
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answered, question, choose, goNext])

  return (
    <main className="practice">
      <p className="progress">
        {questionNumber} / {QUESTIONS_PER_SESSION}
      </p>
      <p className="instruction">{m.instruction}</p>
      <div className="target" lang="ja">
        {question.target}
      </div>
      <div className={`choices choices-${question.choices.length}`}>
        {question.choices.map((c, i) => (
          <button
            key={c}
            lang="ja"
            className={
              'choice' +
              (answered && c === question.target ? ' is-correct' : '') +
              (c === picked && !correct ? ' is-wrong' : '')
            }
            disabled={answered}
            onClick={() => choose(c)}
          >
            <span className="key">{i + 1}</span>
            {c}
          </button>
        ))}
      </div>
      {answered && !correct && (
        <div className="feedback">
          <div className="compare">
            <figure>
              <div className="compare-char is-correct" lang="ja">
                {question.target}
              </div>
              <figcaption>{m.correct}</figcaption>
            </figure>
            <figure>
              <div className="compare-char is-wrong" lang="ja">
                {picked}
              </div>
              <figcaption>{m.yourChoice}</figcaption>
            </figure>
          </div>
          <button className="next" onClick={goNext}>
            {m.next}
          </button>
        </div>
      )}
    </main>
  )
}
