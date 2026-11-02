type Props = {
  onRetry: () => void
}

export function ResultScreen({ onRetry }: Props) {
  return (
    <section>
      <h2>結果</h2>
      <button type="button" onClick={onRetry}>
        もう一度
      </button>
    </section>
  )
}
