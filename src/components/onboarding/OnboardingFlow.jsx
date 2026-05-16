import { useEffect, useRef } from 'react'
import { useUIStore } from '../../store/uiStore'
import Modal from '../shared/Modal'
import SpotlightOverlay from './SpotlightOverlay'
import { STEPS } from './steps'
import { seedDemoEncounter, clearDemoEncounter } from './demoEncounter'

export default function OnboardingFlow() {
  const showOnboarding = useUIStore(s => s.showOnboarding)
  const onboardingStep = useUIStore(s => s.onboardingStep)
  const nextStep = useUIStore(s => s.nextStep)
  const prevStep = useUIStore(s => s.prevStep)
  const skipOnboarding = useUIStore(s => s.skipOnboarding)
  const completeOnboarding = useUIStore(s => s.completeOnboarding)

  // Seed the demo encounter the moment the user moves past the welcome modal.
  // We track which step we last seeded for so a skip-then-restart works cleanly.
  const seededRef = useRef(false)
  useEffect(() => {
    if (!showOnboarding) {
      seededRef.current = false
      return
    }
    if (onboardingStep >= 1 && !seededRef.current) {
      seedDemoEncounter()
      seededRef.current = true
    }
  }, [showOnboarding, onboardingStep])

  if (!showOnboarding) return null
  const step = STEPS[onboardingStep]
  if (!step) return null

  const isFirst = onboardingStep === 0
  const isLast = onboardingStep === STEPS.length - 1

  const stepLabel = (
    <div className="label" style={{ fontSize: '0.7rem', color: 'var(--c-muted)', marginBottom: 'var(--sp-2)' }}>
      Step {onboardingStep + 1} of {STEPS.length}
    </div>
  )

  if (step.kind === 'modal') {
    if (isFirst) {
      return (
        <Modal onClose={skipOnboarding} title={step.title} maxWidth={420}>
          {stepLabel}
          <p style={{ fontSize: '0.88rem', color: 'var(--c-muted)', lineHeight: 1.6, margin: 0, marginBottom: 'var(--sp-4)' }}>
            {step.body}
          </p>
          <div className="flex items-center justify-end" style={{ gap: 8 }}>
            <button
              onClick={skipOnboarding}
              className="btn-ghost"
              style={{ minHeight: 36, minWidth: 'unset', padding: '0 14px', fontSize: '0.82rem' }}
            >Skip</button>
            <button
              onClick={nextStep}
              className="btn-primary"
              style={{ minHeight: 36, minWidth: 'unset', padding: '0 18px', fontSize: '0.82rem' }}
            >Start tour</button>
          </div>
        </Modal>
      )
    }

    if (isLast) {
      return (
        <Modal onClose={completeOnboarding} title={step.title} maxWidth={420}>
          {stepLabel}
          <p style={{ fontSize: '0.88rem', color: 'var(--c-muted)', lineHeight: 1.6, margin: 0, marginBottom: 'var(--sp-4)' }}>
            {step.body}
          </p>
          <div className="flex items-center justify-between" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={prevStep}
              className="btn-ghost"
              style={{ minHeight: 36, minWidth: 'unset', padding: '0 14px', fontSize: '0.82rem' }}
            >Back</button>
            <div className="flex items-center" style={{ gap: 8 }}>
              <button
                onClick={() => { clearDemoEncounter(); completeOnboarding() }}
                className="btn-ghost"
                style={{ minHeight: 36, minWidth: 'unset', padding: '0 14px', fontSize: '0.82rem' }}
              >Clear demo</button>
              <button
                onClick={completeOnboarding}
                className="btn-primary"
                style={{ minHeight: 36, minWidth: 'unset', padding: '0 18px', fontSize: '0.82rem' }}
              >Keep demo</button>
            </div>
          </div>
        </Modal>
      )
    }
  }

  // Spotlight step
  return (
    <SpotlightOverlay
      targetSelector={step.target}
      placement={step.placement ?? 'bottom'}
      step={onboardingStep}
      totalSteps={STEPS.length}
      title={step.title}
      body={step.body}
      onNext={nextStep}
      onPrev={prevStep}
      onSkip={skipOnboarding}
      canPrev={!isFirst}
    />
  )
}
