import TopBar from './components/TopBar'
import Canvas from './components/canvas/Canvas'

export default function App() {
  return (
    <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden' }}>
      <TopBar />
      <div className="flex-1 overflow-auto">
        <Canvas />
      </div>
    </div>
  )
}
