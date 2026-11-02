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
    <section className="screen start">
      <p className="eyebrow">ローマ字タイピング</p>
      <h1 className="title">タイピングゲーム</h1>
      <p className="lead">60秒で、どれだけ打てるか。</p>

      <ul className="rules">
        <li>制限時間 60秒</li>
        <li>shi / si など、いろいろな綴りに対応</li>
        <li>速さと正確さでランクが決まる</li>
      </ul>

      <button type="button" className="primary-button" onClick={onStart}>
        スタート
      </button>
      <p className="hint">
        <kbd>Space</kbd> でもスタートできます
      </p>
      {bestScore > 0 && (
        <p className="best">
          ベストスコア <strong>{bestScore}</strong>
        </p>
      )}
    </section>
  )
}
