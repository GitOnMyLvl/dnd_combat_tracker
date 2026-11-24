import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import ErrorBoundary from './components/shared/ErrorBoundary'
// Self-hosted fonts: no request to Google (GDPR) and available offline.
import '@fontsource/cinzel/500.css'
import '@fontsource/cinzel/600.css'
import '@fontsource/cinzel/700.css'
import '@fontsource-variable/inter/wght.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary fullPage label="Battle Tracker">
      <App />
    </ErrorBoundary>
    <Analytics />
  </React.StrictMode>,
)
