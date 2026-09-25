import { useCallback, useEffect, useRef, useState } from 'react'
import { kanjiData } from '../kanjiData.ts'
import {
  answer,
  answerBuild,
  answerFlash,
  nextBuildQuestion,
  nextFlashQuestion,
  nextQuestion,
  progressOf,
  QUESTIONS_PER_SESSION,
  type BuildQuestion,
  type FlashQuestion,
  type PracticeRecord,
  type SessionResult,
} from '../practice/practice.ts'
import type { Question, Rng } from '../practice/question.ts'
import type { KanjiData } from '../data/buildKanjiData.ts'
import { useMessages } from '../i18n.tsx'

type Props = {
  /**
   * lv1「1つ探す」、lv3「一瞬見る」（見本を表示時間だけ見せてから選択肢を出す）、
   * lv5「組み立てる」（見本のかわりに部品2つを見せる）
   */
  stage: 'lv1' | 'lv3' | 'lv5'
  record: PracticeRecord
  onRecord: (record: PracticeRecord) => void
  /** 練習回の10問目に答えた時点で呼ばれる（結果画面はまだ出さない） */
  onSessionResult: (result: SessionResult) => void
  /** 10問目のあとで「つぎへ」が押されたとき、結果画面へ進む */
  onShowResult: () => void
}

/** 正解のときに次の問題へ移るまでの間 */
const CORRECT_PAUSE_MS = 500

type AnyQuestion = Question | FlashQuestion | BuildQuestion

/** Lv1・Lv3・Lv5 で、問題の作り方と答え方だけを切り替える */
const modes = {
  lv1: {
    next: (r: PracticeRecord, d: KanjiData, rng: Rng): AnyQuestion => nextQuestion(r, d, rng),
    answer: (r: PracticeRecord, d: KanjiData, q: AnyQuestion, c: string, ms: number) => answer(r, d, q, c, ms),
  },
  lv3: {
    next: (r: PracticeRecord, d: KanjiData, rng: Rng): AnyQuestion => nextFlashQuestion(r, d, rng),
    answer: (r: PracticeRecord, d: KanjiData, q: AnyQuestion, c: string, ms: number) =>
      answerFlash(r, d, q, c, ms),
  },
  lv5: {
    next: (r: PracticeRecord, d: KanjiData, rng: Rng): AnyQuestion | null => nextBuildQuestion(r, d, rng),
    answer: (r: PracticeRecord, d: KanjiData, q: AnyQuestion, c: string, ms: number) =>
      answerBuild(r, d, q, c, ms),
  },
}

export function PracticeScreen(props: Props) {
  const m = useMessages()
  // 「組み立てる」では、学習中の字の近くに組み立てられる字が無いと問題を出せない
  const [first] = useState(() => modes[props.stage].next(props.record, kanjiData, Math.random))
  if (first === null) {
    return (
      <main className="practice">
        <p className="empty">{m.buildEmpty}</p>
      </main>
    )
  }
  return <PracticeRound {...props} first={first} />
}

function PracticeRound({ stage, record, onRecord, onSessionResult, onShowResult, first }: Props & { first: AnyQuestion }) {
  const m = useMessages()
  const quickLook = stage === 'lv3'
  const mode = modes[stage]
  const [question, setQuestion] = useState<AnyQuestion>(first)
  // Lv3 で見本を見せている間は true（選択肢を隠す）
  const [showing, setShowing] = useState(quickLook)
  const [picked, setPicked] = useState<string | null>(null)
  const [pendingResult, setPendingResult] = useState<SessionResult | undefined>()
  const [latest, setLatest] = useState(record)
  const shownAt = useRef(performance.now())

  const answered = picked !== null
  const correct = picked === question.target
  const done = progressOf(record, stage).currentSession.length
  const questionNumber = picked === null ? done + 1 : pendingResult ? QUESTIONS_PER_SESSION : done
  const showMs = 'showMs' in question ? question.showMs : 0
  // Lv3: 見本を見せ終えたら「？」にする。見本は取り違えたときの見比べでだけ見せる
  const hidden = quickLook && !showing && !(answered && !correct)

  const goNext = useCallback(() => {
    if (pendingResult) {
      onShowResult()
      return
    }
    setQuestion((prev) => mode.next(latest, kanjiData, Math.random) ?? prev)
    setPicked(null)
    setShowing(quickLook)
    shownAt.current = performance.now()
  }, [latest, pendingResult, onShowResult, mode, quickLook])

  // Lv3: 表示時間が過ぎたら見本を隠して選択肢を出し、そこから答えるまでの時間を測る
  useEffect(() => {
    if (!showing) return
    const id = setTimeout(() => {
      setShowing(false)
      shownAt.current = performance.now()
    }, showMs)
    return () => clearTimeout(id)
  }, [showing, showMs, question])

  const choose = useCallback(
    (c: string) => {
      if (picked !== null || showing) return
      const outcome = mode.answer(record, kanjiData, question, c, Math.round(performance.now() - shownAt.current))
      setPicked(c)
      setLatest(outcome.record)
      setPendingResult(outcome.sessionResult)
      onRecord(outcome.record)
      if (outcome.sessionResult) onSessionResult(outcome.sessionResult)
    },
    [picked, showing, record, question, onRecord, onSessionResult, mode],
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
      <p className="instruction">
        {quickLook ? m.instructionFlash : stage === 'lv5' ? m.instructionBuild : m.instruction}
      </p>
      {quickLook && (
        <p className="show-time">
          {m.showTime}: {(showMs / 1000).toFixed(1)} {m.seconds}
        </p>
      )}
      {'parts' in question ? (
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
