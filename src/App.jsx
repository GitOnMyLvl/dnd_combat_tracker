import TopBar from './components/TopBar'
import Canvas from './components/canvas/Canvas'
import PopoutApp from './components/PopoutApp'
import LandingPage from './components/landing/LandingPage'
import QuickGuide from './components/QuickGuide'
import { useStorageSync } from './hooks/useStorageSync'
import { useUIStore } from './store/uiStore'

export default function App() {
  useStorageSync()

  const params = new URLSearchParams(window.location.search)
  const popoutType = params.get('popout')
  const hasEntered = useUIStore(s => s.hasEntered)
  const showGuide = useUIStore(s => s.showGuide)

  if (popoutType) {
    let config = {}
    try { config = JSON.parse(decodeURIComponent(params.get('config') ?? '{}')) } catch { /* malformed config → defaults */ }
    return <PopoutApp type={popoutType} config={config} />
  }

  if (!hasEntered) {
    return <LandingPage />
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden' }}>
      <TopBar />
      {showGuide && <QuickGuide />}
      <div className="flex-1 overflow-auto">
        <Canvas />
      </div>
    </div>
  )
}
