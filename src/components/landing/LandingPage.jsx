import { useState } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useLayoutStore } from '../../store/layoutStore'
import { useEncounterStore } from '../../store/encounterStore'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { FAQ } from './faq'

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

const STEPS = [
  { title: 'Add heroes & monsters', text: 'Type them in, pick a saved party, or search 300+ SRD monsters with stats filled in.' },
  { title: 'Enter initiative', text: 'Type each roll, hit Sort. Ties are broken by Dexterity automatically.' },
  { title: 'Run the fight', text: 'Press Next to step through turns. Apply damage, healing and conditions with a tap.' },
]

const FEATURES = [
  { title: 'Initiative & rounds', text: 'Turn order, round counter, and a clear marker for whose turn it is.' },
  { title: 'HP, temp HP & death saves', text: 'Damage eats temp HP first, downed heroes get death-save pips.' },
  { title: 'Conditions', text: 'All 5e conditions plus exhaustion, visible at a glance on every row.' },
  { title: 'Monster lookup', text: 'SRD monsters from Open5e with HP, AC and ability scores ready to go.' },
  { title: 'AoE damage', text: 'Fireball five goblins at once, with half damage on a save.' },
  { title: 'Dice roller', text: 'd4 to d100, advantage and disadvantage, mixed pools.' },
]

export default function LandingPage() {
  const enterApp = useUIStore(s => s.enterApp)
  const { canInstall, isInstalled, isIos, promptInstall } = usePwaInstall()
  const [showIosHint, setShowIosHint] = useState(false)

  const showInstallButton = !isInstalled && (canInstall || isIos)

  const start = (demo) => {
    if (useLayoutStore.getState().modules.length === 0) {
      useLayoutStore.getState().applyDefaultLayout()
    }
    if (demo) {
      const { encounter, loadDemoEncounter } = useEncounterStore.getState()
      const hasWork = encounter.combatants.length > 0
      if (!hasWork || window.confirm('Replace your current encounter with the demo fight?')) {
        loadDemoEncounter()
      }
    }
    enterApp()
  }

  return (
    <div className="landing">
      <header className="landing-hero">
        <span className="landing-logo" aria-hidden="true">
          <D20Hero size={96} />
        </span>
        <p className="ornament">Battle Tracker</p>
        <h1 className="landing-title">
          Free D&amp;D 5e initiative &amp; combat tracker
        </h1>
        <p className="landing-lead">
          Track turn order, hit points and conditions for every encounter, right in your browser.
          Built for Dungeon Masters on a laptop or tablet at the table.
        </p>

        <div className="landing-ctas">
          <button className="btn-primary landing-cta" onClick={() => start(false)}>
            Start tracking
          </button>
          <button className="btn-ghost landing-cta" onClick={() => start(true)}>
            Try a demo fight
          </button>
        </div>
        <p className="landing-trust">No sign-up · Free · Works offline · Your data stays on your device</p>

        {showInstallButton && (
          <button
            className="landing-install"
            onClick={() => {
              if (canInstall) promptInstall()
              else if (isIos) setShowIosHint(v => !v)
            }}
          >
            <DownloadIcon /> Install as app
          </button>
        )}
        {showIosHint && (
          <div className="card landing-ios-hint">
            Tap the <strong>Share</strong> icon in Safari, then choose <strong>Add to Home Screen</strong>.
          </div>
        )}
      </header>

      <img
        className="landing-preview"
        src="/preview.webp"
        width="1600"
        height="1000"
        alt="Battle Tracker showing an initiative order, a goblin enemy table and a dice roller"
      />

      <section className="landing-section" aria-labelledby="how-title">
        <h2 id="how-title">How it works</h2>
        <ol className="landing-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card">
              <span className="landing-step-num">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section" aria-labelledby="features-title">
        <h2 id="features-title">Everything you need for combat, nothing you don't</h2>
        <ul className="landing-features">
          {FEATURES.map(f => (
            <li key={f.title}>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-section" aria-labelledby="faq-title">
        <h2 id="faq-title">FAQ</h2>
        <div className="landing-faq">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="card">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-section landing-final">
        <button className="btn-primary landing-cta" onClick={() => start(false)}>
          Start tracking
        </button>
      </section>

      <footer className="landing-footer">
        Monster data from the 5e SRD via Open5e. Battle Tracker is unofficial fan content and not
        affiliated with Wizards of the Coast.
      </footer>
    </div>
  )
}
