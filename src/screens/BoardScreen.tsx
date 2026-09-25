import { useCallback, useEffect, useRef, useState } from 'react'
import { kanjiData } from '../kanjiData.ts'
import {
  answerBoard,
  nextBoardQuestion,
  QUESTIONS_PER_SESSION,
  type BoardOutcome,
  type PracticeRecord,
  type SessionResult,
} from '../practice/practice.ts'
import type { BoardQuestion } from '../practice/question.ts'
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
const CORRECT_PAUSE_MS = 700

/** Lv2「全部探す」: 盤面から見本と同じ字を全部選ぶ */
export function BoardScreen({ record, onRecord, onSessionResult, onShowResult }: Props) {
  const m = useMessages()
  const [question, setQuestion] = useState<BoardQuestion>(() => nextBoardQuestion(record, kanjiData, Math.random))
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [outcome, setOutcome] = useState<BoardOutcome | null>(null)
  const shownAt = useRef(performance.now())

  const answered = outcome !== null
  const progress = record.lv2.currentSession.length
  const questionNumber = !answered ? progress + 1 : outcome.sessionResult ? QUESTIONS_PER_SESSION : progress

  const toggle = (i: number) => {
    if (answered) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const submit = useCallback(() => {
    if (answered || selected.size === 0) return
    const result = answerBoard(record, kanjiData, question, [...selected], Math.round(performance.now() - shownAt.current))
    setOutcome(result)
    onRecord(result.record)
    if (result.sessionResult) onSessionResult(result.sessionResult)
  }, [answered, selected, record, question, onRecord, onSessionResult])

  const goNext = useCallback(() => {
    if (!outcome) return
    if (outcome.sessionResult) {
      onShowResult()
      return
    }
    setQuestion(nextBoardQuestion(outcome.record, kanjiData, Math.random))
    setSelected(new Set())
    setOutcome(null)
    shownAt.current = performance.now()
  }, [outcome, onShowResult])

  // 正解ならすぐ次へ
  useEffect(() => {
    if (!outcome?.correct) return
    const id = setTimeout(goNext, CORRECT_PAUSE_MS)
    return () => clearTimeout(id)
  }, [outcome, goNext])

  // ボタンの外で Enter／スペースを押したら「できた」、答えたあとは次へ
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      // ボタン（盤面の字・段階の切り替え）にいるときは、そのボタンを押す動きに任せる
      if (e.target instanceof HTMLButtonElement) return
      e.preventDefault()
      if (answered) goNext()
      else submit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answered, submit, goNext])

  const cellClass = (c: string, i: number) => {
    const isTarget = c === question.target
    const isSelected = selected.has(i)
    if (!answered) return 'cell' + (isSelected ? ' is-selected' : '')
    if (isTarget && isSelected) return 'cell is-found'
    if (isTarget) return 'cell is-missed'
    if (isSelected) return 'cell is-wrong'
    return 'cell is-dim'
  }

  return (
    <main className="practice">
      <p className="progress">
        {questionNumber} / {QUESTIONS_PER_SESSION}
      </p>
      <p className="instruction">{m.instructionAll}</p>
      <div className="target target-small" lang="ja">
        {question.target}
      </div>
      <div className={`board board-${question.board.length}`}>
        {question.board.map((c, i) => (
          <button
            key={i}
            lang="ja"
            className={cellClass(c, i)}
            aria-pressed={selected.has(i)}
            disabled={answered}
            onClick={() => toggle(i)}
          >
            {c}
          </button>
        ))}
      </div>
      {!answered ? (
        <button className="next" onClick={submit} disabled={selected.size === 0}>
          {m.done}
        </button>
      ) : (
        !outcome.correct && (
          <div className="feedback">
            <ul className="legend">
              <li>
                <span className="swatch is-found" /> {m.legendFound}
              </li>
              <li>
                <span className="swatch is-missed" /> {m.legendMissed}
              </li>
              <li>
                <span className="swatch is-wrong" /> {m.legendWrong}
              </li>
            </ul>
            <button className="next" onClick={goNext}>
              {m.next}
            </button>
          </div>
        )
      )}
    </main>
  )
}
