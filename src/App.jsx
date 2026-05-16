import { lazy, Suspense } from 'react'
import LandingPage from './components/landing/LandingPage'
import { useStorageSync } from './hooks/useStorageSync'
import { useUIStore } from './store/uiStore'

const TopBar = lazy(() => import('./components/TopBar'))
const Canvas = lazy(() => import('./components/canvas/Canvas'))
const PopoutApp = lazy(() => import('./components/PopoutApp'))

export default function App() {
  useStorageSync()

  const params = new URLSearchParams(window.location.search)
  const popoutType = params.get('popout')
  const hasEntered = useUIStore(s => s.hasEntered)

  if (popoutType) {
    let config = {}
    try { config = JSON.parse(decodeURIComponent(params.get('config') ?? '{}')) } catch (_) {}
    return (
      <Suspense fallback={null}>
        <PopoutApp type={popoutType} config={config} />
      </Suspense>
    )
  }

  if (!hasEntered) {
    return <LandingPage />
  }

  return (
    <Suspense fallback={null}>
      <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden' }}>
        <TopBar />
        <div className="flex-1 overflow-auto">
          <Canvas />
        </div>
      </div>
    </Suspense>
  )
}
