import { useEffect, useReducer, useRef, useState } from 'react'
import { WORDS, type Word } from '../data/words'
import {
  createTypingState,
  getKanaProgress,
  getRomajiGuide,
  inputKey,
  isFinished,
  type TypingState,
} from '../lib/romaji'
import type { GameResult } from '../lib/score'

const TIME_LIMIT_SECONDS = 60
// 残り時間がこの秒数以下になったら、タイマーを目立たせる
const WARNING_SECONDS = 10

type Props = {
  onFinish: (result: GameResult) => void
  onQuit: () => void
}

type GameState = {
  words: Word[]
  wordIndex: number
  typing: TypingState
  correctKeys: number
  missCount: number
  wordCount: number
  // ミスした直後に表示を揺らすためのカウンター（値が変わるたびにアニメーションを再生する）
  missFlash: number
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function initGame(): GameState {
  const words = shuffle(WORDS)
  return {
    words,
    wordIndex: 0,
    typing: createTypingState(words[0].kana),
    correctKeys: 0,
    missCount: 0,
    wordCount: 0,
    missFlash: 0,
  }
}

function reducer(state: GameState, key: string): GameState {
  const { state: typing, ok } = inputKey(state.typing, key)
  if (!ok) {
    return { ...state, missCount: state.missCount + 1, missFlash: state.missFlash + 1 }
  }

  const correctKeys = state.correctKeys + 1
  if (isFinished(typing)) {
    // 1単語打ち終わったら次の単語へ。
    // 「次のお題」を常に表示できるよう、残りが少なくなったらシャッフルした単語を後ろに足す
    const wordIndex = state.wordIndex + 1
    const words =
      wordIndex + 1 >= state.words.length ? [...state.words, ...shuffle(WORDS)] : state.words
    return {
      ...state,
      words,
      wordIndex,
      typing: createTypingState(words[wordIndex].kana),
      correctKeys,
      wordCount: state.wordCount + 1,
    }
  }
  return { ...state, typing, correctKeys }
}

export function GameScreen({ onFinish, onQuit }: Props) {
  const [game, dispatch] = useReducer(reducer, undefined, initGame)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS)
  const word = game.words[game.wordIndex]
  const nextWord = game.words[game.wordIndex + 1]
  const romaji = getRomajiGuide(game.typing)
  const kana = getKanaProgress(game.typing)

  // タイマー終了時に最新のスコアを渡せるよう、ref にも持っておく
  const gameRef = useRef(game)
  useEffect(() => {
    gameRef.current = game
  }, [game])

  // キー入力
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onQuit()
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const key = e.key.toLowerCase()
      // ローマ字入力に使うキー（英字とハイフン）だけを扱う
      if (!/^[a-z-]$/.test(key)) return
      e.preventDefault()
      dispatch(key)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onQuit])

  // タイマー。setInterval の回数で数えるとずれるので、終了時刻との差で残り時間を出す
  useEffect(() => {
    const endAt = Date.now() + TIME_LIMIT_SECONDS * 1000
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setTimeLeft(left)
      if (left === 0) {
        clearInterval(id)
        const { correctKeys, missCount, wordCount } = gameRef.current
        onFinish({ correctKeys, missCount, wordCount, seconds: TIME_LIMIT_SECONDS })
      }
    }, 100)
    return () => clearInterval(id)
  }, [onFinish])

  return (
    <section className="game">
      <div className="game-header">
        <div className={`timer${timeLeft <= WARNING_SECONDS ? ' is-warning' : ''}`}>
          <span className="timer-value">{timeLeft}</span>
          <span className="timer-unit">秒</span>
        </div>
        <dl className="game-stats">
          <div>
            <dt>単語</dt>
            <dd>{game.wordCount}</dd>
          </div>
          <div>
            <dt>打鍵</dt>
            <dd>{game.correctKeys}</dd>
          </div>
          <div>
            <dt>ミス</dt>
            <dd>{game.missCount}</dd>
          </div>
        </dl>
      </div>
      <div className={`time-bar${timeLeft <= WARNING_SECONDS ? ' is-warning' : ''}`}>
        <div
          className="time-bar-fill"
          style={{ width: `${(timeLeft / TIME_LIMIT_SECONDS) * 100}%` }}
        />
      </div>

      <div className="word" key={game.missFlash} data-miss={game.missFlash > 0}>
        <p className="word-text">{word.text}</p>
        <p className="word-kana">
          <span className="typed">{kana.typed}</span>
          {kana.rest}
        </p>
        <p className="word-romaji">
          <span className="typed">{romaji.typed}</span>
          <span className="cursor">{romaji.rest.slice(0, 1)}</span>
          <span className="rest">{romaji.rest.slice(1)}</span>
        </p>
      </div>

      <p className="next-word">
        <span className="next-label">次</span>
        {nextWord.text}
      </p>

      <p className="hint">
        <kbd>Esc</kbd> でやめる
      </p>
    </section>
  )
}
