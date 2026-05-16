import { useEffect, useState } from 'react'

const PADDING = 8
const CALLOUT_W = 320
const CALLOUT_H = 240 // approximate; used only for viewport clamping
const CALLOUT_GAP = 14

function getCalloutPosition(rect, placement) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  let top, left

  if (placement === 'right' && rect.right + CALLOUT_W + CALLOUT_GAP < vw) {
    left = rect.right + CALLOUT_GAP
    top = rect.top
  } else if (placement === 'left' && rect.left - CALLOUT_W - CALLOUT_GAP > 0) {
    left = rect.left - CALLOUT_W - CALLOUT_GAP
    top = rect.top
  } else if (placement === 'top' && rect.top > CALLOUT_H) {
    left = Math.max(12, rect.left)
    top = rect.top - CALLOUT_H + 20
  } else {
    // Default: below the target, but flip above if there isn't room.
    left = Math.max(12, Math.min(rect.left, vw - CALLOUT_W - 12))
    top = rect.bottom + CALLOUT_GAP + CALLOUT_H > vh
      ? rect.top - CALLOUT_H - CALLOUT_GAP
      : rect.bottom + CALLOUT_GAP
  }

  // Clamp into viewport so the callout (and its buttons) is always reachable.
  left = Math.max(12, Math.min(left, vw - CALLOUT_W - 12))
  top = Math.max(12, Math.min(top, vh - CALLOUT_H - 12))
  return { top, left }
}

export default function SpotlightOverlay({
  targetSelector,
  placement = 'bottom',
  step,
  totalSteps,
  title,
  body,
  onNext,
  onPrev,
  onSkip,
  nextLabel = 'Next',
  prevLabel = 'Back',
  canPrev = true,
  canNext = true,
}) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    let raf = 0
    const update = () => {
      const el = document.querySelector(targetSelector)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect({
          top: r.top - PADDING,
          left: r.left - PADDING,
          width: r.width + PADDING * 2,
          height: r.height + PADDING * 2,
          right: r.right + PADDING,
          bottom: r.bottom + PADDING,
        })
      } else {
        setRect(null)
      }
    }
    update()
    const onResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update) }
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    // Re-poll a few times in case the DOM is still settling (grid layout, etc.)
    const intervals = [50, 150, 350, 700].map(t => setTimeout(update, t))
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
      cancelAnimationFrame(raf)
      intervals.forEach(clearTimeout)
    }
  }, [targetSelector])

  // Fallback when target can't be found: show callout centered.
  const calloutPos = rect
    ? getCalloutPosition(rect, placement)
    : { top: window.innerHeight / 2 - 110, left: window.innerWidth / 2 - CALLOUT_W / 2 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none' }}>
      {/* Dim layer with a hole punched around the target */}
      {rect ? (
        <div
          style={{
            position: 'fixed',
            top: rect.top, left: rect.left,
            width: rect.width, height: rect.height,
            borderRadius: 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
            border: '2px solid var(--c-accent)',
            pointerEvents: 'none',
            transition: 'all 0.25s ease',
          }}
        />
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', pointerEvents: 'auto' }} onClick={onSkip} />
      )}

      {/* Callout */}
      <div
        className="card"
        style={{
          position: 'fixed',
          top: calloutPos.top,
          left: calloutPos.left,
          width: CALLOUT_W,
          padding: 'var(--sp-4)',
          boxShadow: 'var(--shadow-pop)',
          pointerEvents: 'auto',
          background: 'var(--c-surface)',
        }}
      >
        <div className="accent-stripe" />
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--sp-2)' }}>
          <span className="label" style={{ fontSize: '0.7rem', color: 'var(--c-muted)' }}>
            Step {step + 1} of {totalSteps}
          </span>
          <button
            onClick={onSkip}
            style={{
              background: 'none', border: 'none', color: 'var(--c-muted)',
              fontSize: '0.75rem', minHeight: 24, minWidth: 'unset', padding: '0 6px',
              borderRadius: 4, letterSpacing: '0.04em',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-text)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)' }}
          >Skip tour</button>
        </div>

        <div
          className="display"
          style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--c-text)', marginBottom: 'var(--sp-2)' }}
        >{title}</div>

        <p style={{ fontSize: '0.84rem', color: 'var(--c-muted)', lineHeight: 1.55, margin: 0, marginBottom: 'var(--sp-3)' }}>
          {body}
        </p>

        <div className="flex items-center justify-between" style={{ gap: 8 }}>
          <button
            onClick={onPrev}
            disabled={!canPrev}
            className="btn-ghost"
            style={{
              minHeight: 34, minWidth: 'unset', padding: '0 12px', fontSize: '0.78rem',
              opacity: canPrev ? 1 : 0.35, cursor: canPrev ? 'pointer' : 'default',
            }}
          >{prevLabel}</button>
          <button
            onClick={onNext}
            disabled={!canNext}
            className="btn-primary"
            style={{ minHeight: 34, minWidth: 'unset', padding: '0 16px', fontSize: '0.8rem' }}
          >{nextLabel}</button>
        </div>
      </div>
    </div>
  )
}
