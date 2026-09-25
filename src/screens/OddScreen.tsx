import { useCallback, useEffect, useRef, useState } from 'react'
import { kanjiData } from '../kanjiData.ts'
import {
  answerOdd,
  nextOddQuestion,
  QUESTIONS_PER_SESSION,
  type AnswerOutcome,
  type PracticeRecord,
  type SessionResult,
} from '../practice/practice.ts'
import type { OddQuestion } from '../practice/question.ts'
import { useMessages } from '../i18n.tsx'

type Props = {
  record: PracticeRecord
  onRecord: (record: PracticeRecord) => void
  /** 練習回の10問目に答えた時点で呼ばれる（結果画面はまだ出さない） */
  onSessionResult: (result: SessionResult) => void
  /** 10問目のあとで次へ進むとき、結果画面へ進む */
  onShowResult: () => void
}

/** 正解のときに次の問題へ移るまでの間 */
const CORRECT_PAUSE_MS = 500

/** Lv4「ちがう じ」: 見本なしで、同じ字の並ぶ盤面から仲間はずれを1つ選ぶ */
export function OddScreen({ record, onRecord, onSessionResult, onShowResult }: Props) {
  const m = useMessages()
  const [question, setQuestion] = useState<OddQuestion>(() => nextOddQuestion(record, kanjiData, Math.random))
  const [picked, setPicked] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<AnswerOutcome | null>(null)
  const shownAt = useRef(performance.now())

  const answered = outcome !== null
  const progress = record.lv4.currentSession.length
  const questionNumber = !answered ? progress + 1 : outcome.sessionResult ? QUESTIONS_PER_SESSION : progress

  const choose = (i: number) => {
    if (answered) return
    const result = answerOdd(record, kanjiData, question, i, Math.round(performance.now() - shownAt.current))
    setPicked(i)
    setOutcome(result)
    onRecord(result.record)
    if (result.sessionResult) onSessionResult(result.sessionResult)
  }

  const goNext = useCallback(() => {
    if (!outcome) return
    if (outcome.sessionResult) {
      onShowResult()
      return
    }
    setQuestion(nextOddQuestion(outcome.record, kanjiData, Math.random))
    setPicked(null)
    setOutcome(null)
    shownAt.current = performance.now()
  }, [outcome, onShowResult])

  // 正解ならすぐ次へ
  useEffect(() => {
    if (!outcome?.correct) return
    const id = setTimeout(goNext, CORRECT_PAUSE_MS)
    return () => clearTimeout(id)
  }, [outcome, goNext])

  // 答えたあとは、ボタンの外で Enter／スペースを押すと次へ
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!answered || (e.key !== 'Enter' && e.key !== ' ')) return
      if (e.target instanceof HTMLButtonElement) return
      e.preventDefault()
      goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answered, goNext])

  const cellClass = (i: number) => {
    if (!answered) return 'cell'
    if (i === question.oddIndex) return 'cell is-found'
    if (i === picked) return 'cell is-wrong'
    return 'cell is-dim'
  }

  return (
    <main className="practice">
      <p className="progress">
        {questionNumber} / {QUESTIONS_PER_SESSION}
      </p>
      <p className="instruction">{m.instructionOdd}</p>
      <div className={`board board-${question.board.length}`}>
        {question.board.map((c, i) => (
          <button key={i} lang="ja" className={cellClass(i)} disabled={answered} onClick={() => choose(i)}>
            {c}
          </button>
        ))}
      </div>
      {answered && !outcome.correct && (
        <div className="feedback">
          <ul className="legend">
            <li>
              <span className="swatch is-found" /> {m.legendOdd}
            </li>
            <li>
              <span className="swatch is-wrong" /> {m.yourChoice}
            </li>
          </ul>
          <button className="next" onClick={goNext} autoFocus>
            {m.next}
          </button>
        </div>
      )}
    </main>
  )
}
