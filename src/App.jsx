import TopBar from './components/TopBar'
import Canvas from './components/canvas/Canvas'
import PopoutApp from './components/PopoutApp'
import { useStorageSync } from './hooks/useStorageSync'

export default function App() {
  useStorageSync()

  const params = new URLSearchParams(window.location.search)
  const popoutType = params.get('popout')

  if (popoutType) {
    let config = {}
    try { config = JSON.parse(decodeURIComponent(params.get('config') ?? '{}')) } catch (_) {}
    return <PopoutApp type={popoutType} config={config} />
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden' }}>
      <TopBar />
      <div className="flex-1 overflow-auto">
        <Canvas />
      </div>
    </div>
  )
}
