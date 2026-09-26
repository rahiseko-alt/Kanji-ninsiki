import { useCallback, useEffect, useRef, useState } from 'react'
import { kanjiData } from '../kanjiData.ts'
import {
  answerSession,
  currentQuestion,
  isEmpty,
  sessionResult,
  startSession,
  type BoardQuestion,
  type ChoiceQuestion,
  type OddQuestion,
  type Session,
  type SessionAnswer,
  type Stage,
} from '../practice/session.ts'
import { useMessages } from '../i18n.tsx'
import { formatSeconds } from '../format.ts'

type Props = {
  stage: Stage
  /** 出題範囲（レベル）の先頭 */
  startAt: number
  /** 結果画面から「モード選択へ」 */
  onBack: () => void
}

/** 正解のときに次の問題へ移るまでの間（盤面は見比べる字が多いので少し長く） */
const CORRECT_PAUSE_MS = 500
const BOARD_CORRECT_PAUSE_MS = 700

/** 練習回（記録を持たない。ADR-0005）。段階ごとの問題の形に合わせて画面を切り替える */
export function SessionScreen({ stage, startAt, onBack }: Props) {
  const m = useMessages()
  const start = useCallback(() => startSession(kanjiData, stage, startAt, Math.random), [stage, startAt])
  const [session, setSession] = useState<Session>(start)
  const question = currentQuestion(session)
  if (isEmpty(session)) {
    return (
      <main className="practice">
        <p className="empty">{m.buildEmpty}</p>
      </main>
    )
  }
  if (!question) return <SessionResultView session={session} onRetry={() => setSession(start())} onBack={onBack} />
  const round = { key: question.number, session, onAnswered: setSession }
  if (question.kind === 'board') return <BoardRound {...round} question={question} />
  if (question.kind === 'odd') return <OddRound {...round} question={question} />
  return <ChoiceRound {...round} question={question} />
}

type RoundProps<Q> = { session: Session; question: Q; onAnswered: (s: Session) => void }

/** 答えを受け取り、正解なら少し待って次へ、誤りなら「つぎ」を待つ。答えるまでの時間も測る */
function useRound(session: Session, onAnswered: (s: Session) => void, pauseMs: number) {
  const [result, setResult] = useState<{ next: Session; correct: boolean } | null>(null)
  const shownAt = useRef(performance.now())
  const answer = useCallback(
    (a: SessionAnswer) => {
      if (result) return
      const ms = Math.round(performance.now() - shownAt.current)
      const r = answerSession(session, kanjiData, a, ms, Math.random)
      setResult({ next: r.session, correct: r.correct })
    },
    [result, session],
  )
  const goNext = useCallback(() => {
    if (result) onAnswered(result.next)
  }, [result, onAnswered])
  useEffect(() => {
    if (!result?.correct) return
    const id = setTimeout(goNext, pauseMs)
    return () => clearTimeout(id)
  }, [result, goNext, pauseMs])
  return { answered: result !== null, correct: result?.correct ?? false, answer, goNext, shownAt }
}

function Progress({ question }: { question: { number: number; total: number } }) {
  return (
    <p className="progress">
      {question.number} / {question.total}
    </p>
  )
}

/** Lv1「1つ さがす」・Lv3「いっしゅん みる」（見本を showMs だけ見せる）・Lv5「くみたてる」（部品を見せる） */
function ChoiceRound({ session, question, onAnswered }: RoundProps<ChoiceQuestion>) {
  const m = useMessages()
  const { answered, correct, answer, goNext, shownAt } = useRound(session, onAnswered, CORRECT_PAUSE_MS)
  const [picked, setPicked] = useState<string | null>(null)
  const quickLook = question.showMs !== undefined
  // Lv3 で見本を見せている間は true（選択肢を隠す）
  const [showing, setShowing] = useState(quickLook)
  // Lv3: 見本を見せ終えたら「？」にする。見本は取り違えたときの見比べでだけ見せる
  const hidden = quickLook && !showing && !(answered && !correct)

  useEffect(() => {
    if (!showing) return
    const id = setTimeout(() => {
      setShowing(false)
      shownAt.current = performance.now()
    }, question.showMs)
    return () => clearTimeout(id)
  }, [showing, question.showMs, shownAt])

  const choose = useCallback(
    (c: string) => {
      if (answered || showing) return
      setPicked(c)
      answer(c)
    },
    [answered, showing, answer],
  )

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
      <Progress question={question} />
      <p className="instruction">{quickLook ? m.instructionFlash : question.parts ? m.instructionBuild : m.instruction}</p>
      {question.parts ? (
        <div className={`target parts parts-${question.parts.layout}`} lang="ja">
          <span>{question.parts.parts[0]}</span>
          <span className="plus">＋</span>
          <span>{question.parts.parts[1]}</span>
        </div>
      ) : (
        <div className={'target' + (hidden ? ' is-hidden' : '')} lang="ja">
          {hidden ? '？' : question.target}
        </div>
      )}
      <div className={`choices choices-${question.choices.length}` + (showing ? ' is-concealed' : '')} aria-hidden={showing}>
        {question.choices.map((c, i) => (
          <button
            key={c}
            lang="ja"
            className={
              'choice' +
              (answered && c === question.target ? ' is-correct' : '') +
              (c === picked && !correct ? ' is-wrong' : '')
            }
            disabled={answered || showing}
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

/** Lv2「ぜんぶ さがす」: 盤面から見本と同じ字を全部選ぶ */
function BoardRound({ session, question, onAnswered }: RoundProps<BoardQuestion>) {
  const m = useMessages()
  const { answered, correct, answer, goNext } = useRound(session, onAnswered, BOARD_CORRECT_PAUSE_MS)
  const [selected, setSelected] = useState<Set<number>>(new Set())

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
    answer({ selected: [...selected] })
  }, [answered, selected, answer])

  // ボタンの外で Enter／スペースを押したら「できた」、答えたあとは次へ
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
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
      <Progress question={question} />
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
        !correct && (
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

/** Lv4「ちがう じ」: 見本なしで、同じ字の並ぶ盤面から仲間はずれを1つ選ぶ */
function OddRound({ session, question, onAnswered }: RoundProps<OddQuestion>) {
  const m = useMessages()
  const { answered, correct, answer, goNext } = useRound(session, onAnswered, CORRECT_PAUSE_MS)
  const [picked, setPicked] = useState<number | null>(null)

  const choose = (i: number) => {
    if (answered) return
    setPicked(i)
    answer({ index: i })
  }

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
      <Progress question={question} />
      <p className="instruction">{m.instructionOdd}</p>
      <div className={`board board-${question.board.length}`}>
        {question.board.map((c, i) => (
          <button key={i} lang="ja" className={cellClass(i)} disabled={answered} onClick={() => choose(i)}>
            {c}
          </button>
        ))}
      </div>
      {answered && !correct && (
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
