export type GameResult = {
  // 正しく打ったキーの数
  correctKeys: number
  missCount: number
  // 打ち終わった単語の数
  wordCount: number
  // プレイ時間（秒）
  seconds: number
}

export type Rank = 'S' | 'A' | 'B' | 'C' | 'D'

export type Score = {
  // 1分あたりの正しい打鍵数
  kpm: number
  // 正確率（0〜1）
  accuracy: number
  score: number
  rank: Rank
}

const RANKS: { rank: Rank; min: number }[] = [
  { rank: 'S', min: 350 },
  { rank: 'A', min: 250 },
  { rank: 'B', min: 160 },
  { rank: 'C', min: 80 },
  { rank: 'D', min: 0 },
]

export function calcScore(result: GameResult): Score {
  const totalKeys = result.correctKeys + result.missCount
  const kpm = result.seconds > 0 ? (result.correctKeys / result.seconds) * 60 : 0
  const accuracy = totalKeys > 0 ? result.correctKeys / totalKeys : 0
  // 速さだけでなく正確さも評価するため、正確率を掛ける
  const score = Math.round(kpm * accuracy)
  const rank = RANKS.find((r) => score >= r.min)?.rank ?? 'D'
  return { kpm: Math.round(kpm), accuracy, score, rank }
}
