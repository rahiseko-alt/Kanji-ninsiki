import { useState } from 'react'
import { kanjiData } from './kanjiData.ts'
import { createQuestion, type Question } from './practice/question.ts'

const FIRST_LEARNING = 8

function newQuestion(): Question {
  const pool = kanjiData.order.slice(0, FIRST_LEARNING)
  const target = pool[Math.floor(Math.random() * pool.length)]
  return createQuestion(kanjiData, target, 4, Math.random)
}

export function App() {
  const [question, setQuestion] = useState(newQuestion)
  const [picked, setPicked] = useState<string | null>(null)
  const answered = picked !== null
  const correct = picked === question.target

  return (
    <main className="practice">
      <div className="target" lang="ja">{question.target}</div>
      <div className="choices">
        {question.choices.map((c) => (
          <button
            key={c}
            lang="ja"
            className={
              'choice' + (answered && c === question.target ? ' is-correct' : '') + (c === picked && !correct ? ' is-wrong' : '')
            }
            disabled={answered}
            onClick={() => setPicked(c)}
          >
            {c}
          </button>
        ))}
      </div>
      {answered && (
        <div className="feedback">
          <p>{correct ? 'Correct!' : 'Not quite.'}</p>
          <button
            className="next"
            onClick={() => {
              setQuestion(newQuestion())
              setPicked(null)
            }}
          >
            Next
          </button>
        </div>
      )}
    </main>
  )
}
