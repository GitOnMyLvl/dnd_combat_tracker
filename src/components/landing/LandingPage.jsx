import { useState } from 'react'
import { useUIStore } from '../../store/uiStore'
import { usePwaInstall } from '../../hooks/usePwaInstall'

function D20Hero({ size = 150 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <polygon points="256,97.3 421.8,217.2 256,280.7" fill="currentColor" fillOpacity="0.95" />
      <polygon points="256,97.3 256,280.7 90.2,217.2" fill="currentColor" fillOpacity="0.75" />
      <polygon points="421.8,217.2 358.3,432.3 256,280.7" fill="currentColor" fillOpacity="0.55" />
      <polygon points="90.2,217.2 256,280.7 153.7,432.3" fill="currentColor" fillOpacity="0.45" />
      <polygon points="256,280.7 358.3,432.3 153.7,432.3" fill="currentColor" fillOpacity="0.3" />
      <polygon points="256,97.3 421.8,217.2 358.3,432.3 153.7,432.3 90.2,217.2" fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" />
    </svg>
  )
}

function DownloadIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  )
}

export default function LandingPage() {
  const enterApp = useUIStore(s => s.enterApp)
  const { canInstall, isInstalled, isIos, promptInstall } = usePwaInstall()
  const [showIosHint, setShowIosHint] = useState(false)

  const showInstallButton = !isInstalled && (canInstall || isIos)

  return (
    <div
      style={{
        height: '100dvh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--c-bg)',
        backgroundImage: 'var(--c-bg-pattern)',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22,
          textAlign: 'center',
          maxWidth: 520,
        }}
      >
        <span style={{ color: 'var(--c-accent)', display: 'flex' }}>
          <D20Hero size={150} />
        </span>

        <h1
          className="display"
          style={{
            margin: 0,
            fontSize: 'clamp(1.8rem, 5vw, 2.6rem)',
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: 'var(--c-text)',
            lineHeight: 1,
          }}
        >
          BATTLE TRACKER
        </h1>

        <div className="ornament">A D&amp;D 5e companion</div>

        <p
          style={{
            color: 'var(--c-muted)',
            fontSize: '0.95rem',
            margin: 0,
            lineHeight: 1.6,
            maxWidth: 380,
          }}
        >
          One quiet canvas for every encounter. Initiative, hit points, conditions, and dice — shaped to your table, ready when the fight begins.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
          <button
            onClick={enterApp}
            className="btn-primary"
            style={{
              minHeight: 48,
              minWidth: 220,
              fontSize: '0.95rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              padding: '0 24px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <span style={{ paddingLeft: '0.16em' }}>Roll for Initiative</span>
          </button>

          {showInstallButton && (
            <button
              onClick={() => {
                if (canInstall) promptInstall()
                else if (isIos) setShowIosHint(v => !v)
              }}
              className="btn-ghost"
              style={{
                minHeight: 48,
                minWidth: 160,
                fontSize: '0.85rem',
                padding: '0 20px',
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <DownloadIcon /> Install app
            </button>
          )}
        </div>

        {showIosHint && (
          <div
            className="card"
            style={{
              padding: '14px 18px',
              marginTop: 4,
              maxWidth: 380,
              fontSize: '0.82rem',
              color: 'var(--c-muted2)',
              lineHeight: 1.55,
              textAlign: 'left',
            }}
          >
            <div className="label" style={{ marginBottom: 6 }}>Install on iOS</div>
            Tap the <strong style={{ color: 'var(--c-text)' }}>Share</strong> icon in Safari,
            then choose <strong style={{ color: 'var(--c-text)' }}>Add to Home Screen</strong>.
          </div>
        )}
      </div>
    </div>
  )
}
