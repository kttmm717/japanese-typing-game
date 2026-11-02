const STORAGE_KEY = 'typing-game:best-score'

// localStorage はプライベートブラウズなどで使えないことがあるので、失敗しても動くようにする
export function loadBestScore(): number {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0
  } catch {
    return 0
  }
}

export function saveBestScore(score: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(score))
  } catch {
    // 保存できなくてもゲームは続けられるので何もしない
  }
}
