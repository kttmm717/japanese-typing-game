import { useCallback, useState } from 'react'
import { StartScreen } from './components/StartScreen'
import { GameScreen } from './components/GameScreen'
import { ResultScreen } from './components/ResultScreen'
import type { GameResult } from './lib/score'

type Phase = 'start' | 'playing' | 'result'

function App() {
  const [phase, setPhase] = useState<Phase>('start')
  const [result, setResult] = useState<GameResult | null>(null)

  // GameScreen のタイマーが作り直されないよう、関数を固定しておく
  const handleFinish = useCallback((result: GameResult) => {
    setResult(result)
    setPhase('result')
  }, [])
  const handleQuit = useCallback(() => setPhase('start'), [])

  return (
    <main>
      {phase === 'start' && <StartScreen onStart={() => setPhase('playing')} />}
      {phase === 'playing' && <GameScreen onFinish={handleFinish} onQuit={handleQuit} />}
      {phase === 'result' && result && (
        <ResultScreen
          result={result}
          onRetry={() => setPhase('playing')}
          onBack={() => setPhase('start')}
        />
      )}
    </main>
  )
}

export default App
