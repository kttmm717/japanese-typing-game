import { describe, expect, it } from 'vitest'
import { createTypingState, getRomajiGuide, inputKey, isFinished } from './romaji'

// 文字列をすべて入力して、最後まで打ち切れたかを返す
function typeAll(kana: string, keys: string): boolean {
  let state = createTypingState(kana)
  for (const key of keys) {
    const result = inputKey(state, key)
    if (!result.ok) return false
    state = result.state
  }
  return isFinished(state)
}

describe('ローマ字入力の判定', () => {
  it('基本的な入力', () => {
    expect(typeAll('すし', 'sushi')).toBe(true)
    expect(typeAll('すし', 'susi')).toBe(true)
    expect(typeAll('すし', 'sasi')).toBe(false)
  })

  it('拗音（しゃ・ちょう など）', () => {
    expect(typeAll('じてんしゃ', 'jitensha')).toBe(true)
    expect(typeAll('じてんしゃ', 'zitensya')).toBe(true)
    expect(typeAll('じてんしゃ', 'jitenshixya')).toBe(true)
    expect(typeAll('いっせきにちょう', 'issekinichou')).toBe(true)
    expect(typeAll('いっせきにちょう', 'issekinityou')).toBe(true)
  })

  it('促音「っ」', () => {
    expect(typeAll('いっせきにちょう', 'ixtusekinichou')).toBe(true)
    expect(typeAll('まっちゃ', 'maccha')).toBe(true)
    expect(typeAll('まっちゃ', 'matcha')).toBe(true)
    expect(typeAll('まっちゃ', 'mattya')).toBe(true)
  })

  it('撥音「ん」', () => {
    expect(typeAll('しんかんせん', 'shinkansenn')).toBe(true)
    expect(typeAll('しんかんせん', 'shinnkannsenn')).toBe(true)
    // 最後の「ん」は n 1回では確定しない
    expect(typeAll('しんかんせん', 'shinkansen')).toBe(false)
    // 「ん」の次が な行・や行 なら nn が必要（"kanya" は「かにゃ」になってしまう）
    expect(typeAll('こんにちは', 'konnnichiha')).toBe(true)
    expect(typeAll('こんにちは', 'konichiha')).toBe(false)
  })

  it('長音「ー」', () => {
    expect(typeAll('とうきょうたわー', 'toukyoutawa-')).toBe(true)
  })

  it('お手本の表示', () => {
    let state = createTypingState('しんかんせん')
    expect(getRomajiGuide(state)).toEqual({ typed: '', rest: 'shinkansenn' })
    for (const key of 'si') state = inputKey(state, key).state
    expect(getRomajiGuide(state)).toEqual({ typed: 'si', rest: 'nkansenn' })
  })
})
