import { useEffect, useState } from 'react'
import { loadBestScore, saveBestScore } from '../lib/bestScore'
import { calcScore, type GameResult } from '../lib/score'

type Props = {
  result: GameResult
  onRetry: () => void
  onBack: () => void
}

export function ResultScreen({ result, onRetry, onBack }: Props) {
  const score = calcScore(result)
  // 保存前のベストスコアと比べたいので、最初の表示時に1回だけ読む
  const [prevBest] = useState(loadBestScore)
  const isNewBest = score.score > prevBest

  useEffect(() => {
    if (isNewBest) saveBestScore(score.score)
  }, [isNewBest, score.score])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        onRetry()
      } else if (e.key === 'Escape') {
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onRetry, onBack])

  return (
    <section className="screen">
      <h2>結果</h2>
      <p className={`rank rank-${score.rank}`}>{score.rank}</p>
      <p className="score">
        スコア {score.score}
        {isNewBest && <span className="new-best">ベスト更新！</span>}
      </p>

      <dl className="stats">
        <div>
          <dt>打鍵数</dt>
          <dd>{result.correctKeys}</dd>
        </div>
        <div>
          <dt>ミス</dt>
          <dd>{result.missCount}</dd>
        </div>
        <div>
          <dt>正確率</dt>
          <dd>{(score.accuracy * 100).toFixed(1)}%</dd>
        </div>
        <div>
          <dt>単語数</dt>
          <dd>{result.wordCount}</dd>
        </div>
      </dl>

      <div className="buttons">
        <button type="button" className="primary-button" onClick={onRetry}>
          もう一度
        </button>
        <button type="button" className="secondary-button" onClick={onBack}>
          タイトルへ
        </button>
      </div>
      <p className="hint">スペースでもう一度 / Esc でタイトルへ</p>
    </section>
  )
}
