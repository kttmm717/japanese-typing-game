import { useEffect, useReducer } from 'react'
import { WORDS, type Word } from '../data/words'
import {
  createTypingState,
  getRomajiGuide,
  inputKey,
  isFinished,
  type TypingState,
} from '../lib/romaji'

type Props = {
  onFinish: () => void
}

type GameState = {
  words: Word[]
  wordIndex: number
  typing: TypingState
  missCount: number
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
  return { words, wordIndex: 0, typing: createTypingState(words[0].kana), missCount: 0 }
}

function reducer(state: GameState, key: string): GameState {
  const { state: typing, ok } = inputKey(state.typing, key)
  if (!ok) return { ...state, missCount: state.missCount + 1 }

  if (isFinished(typing)) {
    // 1単語打ち終わったら次の単語へ（最後まで行ったら最初に戻る）
    const wordIndex = (state.wordIndex + 1) % state.words.length
    return { ...state, wordIndex, typing: createTypingState(state.words[wordIndex].kana) }
  }
  return { ...state, typing }
}

// TODO: タイマー、スコア
export function GameScreen({ onFinish }: Props) {
  const [game, dispatch] = useReducer(reducer, undefined, initGame)
  const word = game.words[game.wordIndex]
  const guide = getRomajiGuide(game.typing)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1文字のキー（英字・記号）だけを入力として扱う
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
      dispatch(e.key.toLowerCase())
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <section className="game">
      <p className="word-text">{word.text}</p>
      <p className="word-kana">{word.kana}</p>
      <p className="word-romaji">
        <span className="typed">{guide.typed}</span>
        <span className="rest">{guide.rest}</span>
      </p>
      <p>ミス: {game.missCount}</p>
      <button type="button" onClick={onFinish}>
        終了（仮）
      </button>
    </section>
  )
}
