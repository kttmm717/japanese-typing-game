type Props = {
  onStart: () => void
}

export function StartScreen({ onStart }: Props) {
  return (
    <section>
      <h1>タイピングゲーム</h1>
      <button type="button" onClick={onStart}>
        スタート
      </button>
    </section>
  )
}
