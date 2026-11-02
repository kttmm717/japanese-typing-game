import { useEffect, useReducer, useRef, useState } from 'react'
import { WORDS, type Word } from '../data/words'
import {
  createTypingState,
  getRomajiGuide,
  inputKey,
  isFinished,
  type TypingState,
} from '../lib/romaji'
import type { GameResult } from '../lib/score'

const TIME_LIMIT_SECONDS = 60

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
    // 1単語打ち終わったら次の単語へ（最後まで行ったらシャッフルし直す）
    const isLast = state.wordIndex + 1 >= state.words.length
    const words = isLast ? shuffle(WORDS) : state.words
    const wordIndex = isLast ? 0 : state.wordIndex + 1
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
  const guide = getRomajiGuide(game.typing)

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
        <span>残り {timeLeft} 秒</span>
        <span>
          {game.wordCount} 単語 / ミス {game.missCount}
        </span>
      </div>
      <div className="time-bar">
        <div
          className="time-bar-fill"
          style={{ width: `${(timeLeft / TIME_LIMIT_SECONDS) * 100}%` }}
        />
      </div>

      <div className="word" key={game.missFlash} data-miss={game.missFlash > 0}>
        <p className="word-text">{word.text}</p>
        <p className="word-kana">{word.kana}</p>
        <p className="word-romaji">
          <span className="typed">{guide.typed}</span>
          <span className="rest">{guide.rest}</span>
        </p>
      </div>

      <p className="hint">Esc でやめる</p>
    </section>
  )
}
