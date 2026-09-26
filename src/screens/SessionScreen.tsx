import { useCallback, useEffect, useRef, useState } from 'react'
import { kanjiData } from '../kanjiData.ts'
import { answerSession, currentQuestion, sessionResult, startSession, type Session } from '../practice/session.ts'
import { useMessages } from '../i18n.tsx'
import { formatSeconds } from '../format.ts'

type Props = {
  /** 出題範囲（レベル）の先頭 */
  startAt: number
  /** 結果画面から「モード選択へ」 */
  onBack: () => void
}

/** 正解のときに次の問題へ移るまでの間 */
const CORRECT_PAUSE_MS = 500

/** 新しい練習回（記録を持たない。ADR-0005）の Lv1「1つ さがす」 */
export function SessionScreen({ startAt, onBack }: Props) {
  const [session, setSession] = useState<Session>(() => startSession(kanjiData, 'lv1', startAt, Math.random))
  const restart = () => setSession(startSession(kanjiData, 'lv1', startAt, Math.random))
  const question = currentQuestion(session)
  if (!question) return <SessionResultView session={session} onRetry={restart} onBack={onBack} />
  return <ChoiceRound key={question.number} session={session} onAnswered={setSession} />
}

function ChoiceRound({ session, onAnswered }: { session: Session; onAnswered: (s: Session) => void }) {
  const m = useMessages()
  const question = currentQuestion(session)!
  const [picked, setPicked] = useState<string | null>(null)
  const [next, setNext] = useState<Session | null>(null)
  const shownAt = useRef(performance.now())
  const answered = picked !== null
  const correct = picked === question.target

  const goNext = useCallback(() => {
    if (next) onAnswered(next)
  }, [next, onAnswered])

  const choose = useCallback(
    (c: string) => {
      if (answered) return
      const ms = Math.round(performance.now() - shownAt.current)
      setPicked(c)
      setNext(answerSession(session, kanjiData, c, ms, Math.random).session)
    },
    [answered, session],
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
        {question.number} / {question.total}
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
              <figcaption>{m.sampleCorrect}</figcaption>
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

function SessionResultView({ session, onRetry, onBack }: { session: Session; onRetry: () => void; onBack: () => void }) {
  const m = useMessages()
  const result = sessionResult(session)
  return (
    <main className="result">
      <h1>{m.sessionComplete}</h1>
      <p className="session-correct">
        {result.correct} / {result.total}
      </p>
      <p>
        {m.averageTime}: {formatSeconds(result.averageMs)} {m.seconds}
      </p>
      <div className="result-actions">
        <button className="next" onClick={onRetry} autoFocus>
          {m.retry}
        </button>
        <button className="result-back" onClick={onBack}>
          {m.modeTitle}
        </button>
      </div>
    </main>
  )
}
