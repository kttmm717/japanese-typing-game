import { useState } from 'react'
import { StartScreen } from './components/StartScreen'
import { GameScreen } from './components/GameScreen'
import { ResultScreen } from './components/ResultScreen'

type Phase = 'start' | 'playing' | 'result'

function App() {
  const [phase, setPhase] = useState<Phase>('start')

  return (
    <main>
      {phase === 'start' && <StartScreen onStart={() => setPhase('playing')} />}
      {phase === 'playing' && <GameScreen onFinish={() => setPhase('result')} />}
      {phase === 'result' && <ResultScreen onRetry={() => setPhase('start')} />}
    </main>
  )
}

export default App
