import { describe, expect, it } from 'vitest'
import { calcScore } from './score'

describe('スコア計算', () => {
  it('打鍵数と正確率からスコアを出す', () => {
    const score = calcScore({ correctKeys: 300, missCount: 0, wordCount: 30, seconds: 60 })
    expect(score).toEqual({ kpm: 300, accuracy: 1, score: 300, rank: 'A' })
  })

  it('ミスが多いとスコアが下がる', () => {
    const score = calcScore({ correctKeys: 300, missCount: 100, wordCount: 30, seconds: 60 })
    expect(score.accuracy).toBe(0.75)
    expect(score.score).toBe(225)
    expect(score.rank).toBe('B')
  })

  it('1文字も打たなかった場合', () => {
    const score = calcScore({ correctKeys: 0, missCount: 0, wordCount: 0, seconds: 60 })
    expect(score).toEqual({ kpm: 0, accuracy: 0, score: 0, rank: 'D' })
  })
})
