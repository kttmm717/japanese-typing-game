import { useEffect } from 'react'
import { loadBestScore } from '../lib/bestScore'

type Props = {
  onStart: () => void
}

export function StartScreen({ onStart }: Props) {
  const bestScore = loadBestScore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        onStart()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onStart])

  return (
    <section className="screen">
      <h1 className="title">タイピングゲーム</h1>
      <p className="lead">60秒でどれだけ打てるかな？</p>
      <button type="button" className="primary-button" onClick={onStart}>
        スタート
      </button>
      <p className="hint">スペースキーでもスタートできます</p>
      {bestScore > 0 && <p className="best">ベストスコア: {bestScore}</p>}
    </section>
  )
}
