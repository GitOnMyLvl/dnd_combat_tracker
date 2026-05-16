# Pop-out Window Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a ⧉ button to each module header that opens the module in a standalone browser window, live-synced with the main window via localStorage storage events.

**Architecture:** `ModuleWrapper` opens `?popout=<type>&config=<json>` in a new window. `App.jsx` detects this param and renders `PopoutApp` instead of the normal layout. `PopoutApp` listens for `storage` events and calls `persist.rehydrate()` on the relevant Zustand stores to stay in sync.

**Tech Stack:** React 18, Zustand v5 (`persist.rehydrate()`), localStorage storage events, `window.open` with `popup=yes`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/components/canvas/Canvas.jsx` | Modify | Export `MODULE_COMPONENTS` |
| `src/store/themeStore.js` | Modify | Export `applyTheme` and `applyAccent` helpers |
| `src/components/PopoutApp.jsx` | Create | Pop-out container: state sync + module render + close button |
| `src/App.jsx` | Modify | Detect `?popout` and render `PopoutApp` early |
| `src/components/canvas/ModuleWrapper.jsx` | Modify | Add ⧉ button that calls `window.open` |
| `src/components/PopoutApp.test.jsx` | Create | Unit tests for PopoutApp |
| `src/components/canvas/ModuleWrapper.test.jsx` | Create | Unit tests for the pop-out button |

---

## Task 1: Export MODULE_COMPONENTS from Canvas.jsx

**Files:**
- Modify: `src/components/canvas/Canvas.jsx`

- [ ] **Step 1: Add `export` to the MODULE_COMPONENTS const**

In `src/components/canvas/Canvas.jsx`, change line 17 from:
```js
const MODULE_COMPONENTS = {
```
to:
```js
export const MODULE_COMPONENTS = {
```

- [ ] **Step 2: Verify the app still builds**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors, `dist/` produced.

- [ ] **Step 3: Commit**

```bash
git add src/components/canvas/Canvas.jsx
git commit -m "refactor: export MODULE_COMPONENTS from Canvas"
```

---

## Task 2: Export applyTheme and applyAccent from themeStore

**Files:**
- Modify: `src/store/themeStore.js`

The pop-out needs to re-apply theme when `storage` events fire. `applyTheme` and `applyAccent` are currently private functions in themeStore.js.

- [ ] **Step 1: Export the two helpers**

In `src/store/themeStore.js`, change:
```js
function applyTheme(theme) {
```
to:
```js
export function applyTheme(theme) {
```

And change:
```js
function applyAccent(color) {
```
to:
```js
export function applyAccent(color) {
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/store/themeStore.js
git commit -m "refactor: export applyTheme and applyAccent from themeStore"
```

---

## Task 3: Create PopoutApp.jsx

**Files:**
- Create: `src/components/PopoutApp.jsx`
- Create: `src/components/PopoutApp.test.jsx`

### Step-by-step

- [ ] **Step 1: Write the failing tests first**

Create `src/components/PopoutApp.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock stores
vi.mock('../store/encounterStore', () => ({
  useEncounterStore: Object.assign(() => ({}), {
    persist: { rehydrate: vi.fn() },
  }),
}))
vi.mock('../store/characterStore', () => ({
  useCharacterStore: Object.assign(() => ({}), {
    persist: { rehydrate: vi.fn() },
  }),
}))
vi.mock('../store/themeStore', () => ({
  applyTheme: vi.fn(),
  applyAccent: vi.fn(),
  useThemeStore: { setState: vi.fn() },
}))
vi.mock('./canvas/Canvas', () => ({
  MODULE_COMPONENTS: {
    DiceRoller: () => <div>DiceRoller</div>,
  },
}))

import PopoutApp from './PopoutApp'
import { useEncounterStore } from '../store/encounterStore'
import { useCharacterStore } from '../store/characterStore'
import { applyTheme, applyAccent } from '../store/themeStore'

describe('PopoutApp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.close = vi.fn()
  })

  it('renders the matching module component', () => {
    render(<PopoutApp type="DiceRoller" config={{}} />)
    expect(screen.getByText('DiceRoller')).toBeInTheDocument()
  })

  it('renders an error for an unknown type', () => {
    render(<PopoutApp type="Bogus" config={{}} />)
    expect(screen.getByText(/unknown module/i)).toBeInTheDocument()
  })

  it('renders a close button', () => {
    render(<PopoutApp type="DiceRoller" config={{}} />)
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('close button calls window.close', async () => {
    render(<PopoutApp type="DiceRoller" config={{}} />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(window.close).toHaveBeenCalledOnce()
  })

  it('Escape key calls window.close', async () => {
    render(<PopoutApp type="DiceRoller" config={{}} />)
    await userEvent.keyboard('{Escape}')
    expect(window.close).toHaveBeenCalledOnce()
  })

  it('rehydrates encounterStore on storage event for encounter key', () => {
    render(<PopoutApp type="DiceRoller" config={{}} />)
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'dnd-tracker-encounter' }))
    })
    expect(useEncounterStore.persist.rehydrate).toHaveBeenCalledOnce()
  })

  it('rehydrates characterStore on storage event for characters key', () => {
    render(<PopoutApp type="DiceRoller" config={{}} />)
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'dnd-tracker-characters' }))
    })
    expect(useCharacterStore.persist.rehydrate).toHaveBeenCalledOnce()
  })

  it('applies theme on storage event for theme key', () => {
    render(<PopoutApp type="DiceRoller" config={{}} />)
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'dnd-tracker-theme', newValue: 'light' }))
    })
    expect(applyTheme).toHaveBeenCalledWith('light')
  })

  it('applies accent on storage event for accent key', () => {
    render(<PopoutApp type="DiceRoller" config={{}} />)
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'dnd-tracker-accent', newValue: '#ff0000' }))
    })
    expect(applyAccent).toHaveBeenCalledWith('#ff0000')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- PopoutApp --reporter=verbose 2>&1 | tail -20
```
Expected: multiple FAIL — `PopoutApp` does not exist yet.

- [ ] **Step 3: Create PopoutApp.jsx**

Create `src/components/PopoutApp.jsx`:

```jsx
import { useEffect } from 'react'
import { MODULE_COMPONENTS } from './canvas/Canvas'
import { useEncounterStore } from '../store/encounterStore'
import { useCharacterStore } from '../store/characterStore'
import { applyTheme, applyAccent, useThemeStore } from '../store/themeStore'

const MODULE_TITLES = {
  InitiativeTracker: 'Initiative',
  CombatantTable: 'Combatants',
  ConditionsPanel: 'Conditions',
  DiceRoller: 'Dice',
  NotesPad: 'Notes',
  PartyManager: 'Party',
}

export default function PopoutApp({ type, config }) {
  const Component = MODULE_COMPONENTS[type]

  useEffect(() => {
    const title = MODULE_TITLES[type] ?? type
    document.title = `${title} — D&D Battle Tracker`
  }, [type])

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'dnd-tracker-encounter') {
        useEncounterStore.persist.rehydrate()
      } else if (e.key === 'dnd-tracker-characters') {
        useCharacterStore.persist.rehydrate()
      } else if (e.key === 'dnd-tracker-theme' && e.newValue) {
        applyTheme(e.newValue)
        useThemeStore.setState({ theme: e.newValue })
      } else if (e.key === 'dnd-tracker-accent' && e.newValue) {
        applyAccent(e.newValue)
        useThemeStore.setState({ accent: e.newValue })
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') window.close() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const btnStyle = {
    position: 'fixed', top: 8, right: 8, zIndex: 50,
    height: 36, width: 36, minHeight: 36, minWidth: 36,
    background: 'none', border: 'none',
    color: 'var(--c-muted)', fontSize: '0.85rem',
    borderRadius: 6, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  if (!Component) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--c-bg)', color: 'var(--c-text)', gap: 12 }}>
        <p style={{ color: 'var(--c-muted)', fontSize: '0.9rem' }}>Unknown module: <strong>{type}</strong></p>
        <button style={btnStyle} onClick={() => window.close()} aria-label="Close pop-out">✕</button>
      </div>
    )
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--c-bg)', color: 'var(--c-text)', overflow: 'hidden' }}>
      <div style={{ flex: 1, minHeight: 0, padding: '10px 12px 12px', overflowY: 'auto', overflowX: 'hidden' }}>
        <Component config={config} />
      </div>
      {/* One-way sync notice */}
      <div style={{ flexShrink: 0, padding: '4px 12px 6px', borderTop: '1px solid var(--c-border)', fontSize: '0.7rem', color: 'var(--c-muted)', textAlign: 'center' }}>
        Edits here won't sync back — edit in the main window
      </div>
      <button
        style={btnStyle}
        onClick={() => window.close()}
        aria-label="Close pop-out"
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-text)'; e.currentTarget.style.background = 'var(--c-elevated)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'none' }}
      >✕</button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test -- PopoutApp --reporter=verbose 2>&1 | tail -20
```
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/PopoutApp.jsx src/components/PopoutApp.test.jsx
git commit -m "feat: add PopoutApp with state sync and close controls"
```

---

## Task 4: Update App.jsx to detect ?popout

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Write the failing tests**

Create `src/App.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('./components/TopBar', () => ({ default: () => <div>TopBar</div> }))
vi.mock('./components/canvas/Canvas', () => ({
  default: () => <div>Canvas</div>,
  MODULE_COMPONENTS: { DiceRoller: () => <div>DiceRoller</div> },
}))
vi.mock('./components/PopoutApp', () => ({ default: ({ type }) => <div>PopoutApp:{type}</div> }))

import App from './App'

describe('App', () => {
  const setSearch = (search) => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search },
      writable: true,
    })
  }

  it('renders normal layout when no ?popout param', () => {
    setSearch('')
    render(<App />)
    expect(screen.getByText('TopBar')).toBeInTheDocument()
    expect(screen.getByText('Canvas')).toBeInTheDocument()
  })

  it('renders PopoutApp when ?popout param is present', () => {
    setSearch('?popout=DiceRoller&config=%7B%7D')
    render(<App />)
    expect(screen.getByText('PopoutApp:DiceRoller')).toBeInTheDocument()
    expect(screen.queryByText('TopBar')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- App.test --reporter=verbose 2>&1 | tail -10
```
Expected: `renders PopoutApp` test FAILS (App doesn't detect ?popout yet).

- [ ] **Step 3: Update App.jsx**

Replace the entire `src/App.jsx` with:

```jsx
import TopBar from './components/TopBar'
import Canvas from './components/canvas/Canvas'
import PopoutApp from './components/PopoutApp'

export default function App() {
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test -- App.test --reporter=verbose 2>&1 | tail -10
```
Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/App.test.jsx
git commit -m "feat: detect ?popout param and render PopoutApp"
```

---

## Task 5: Add ⧉ button to ModuleWrapper

**Files:**
- Modify: `src/components/canvas/ModuleWrapper.jsx`
- Create: `src/components/canvas/ModuleWrapper.test.jsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/canvas/ModuleWrapper.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../store/layoutStore', () => ({
  useLayoutStore: () => ({
    removeModule: vi.fn(),
    toggleMinimize: vi.fn(),
  }),
}))

import ModuleWrapper from './ModuleWrapper'

describe('ModuleWrapper pop-out button', () => {
  beforeEach(() => {
    window.open = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:5173', pathname: '/' },
      writable: true,
    })
  })

  it('renders the pop-out button', () => {
    render(
      <ModuleWrapper id="test-1" type="DiceRoller" config={{}}>
        <div>content</div>
      </ModuleWrapper>
    )
    expect(screen.getByTitle('Open in new window')).toBeInTheDocument()
  })

  it('calls window.open with correct popout URL on click', async () => {
    render(
      <ModuleWrapper id="test-1" type="DiceRoller" config={{ foo: 'bar' }}>
        <div>content</div>
      </ModuleWrapper>
    )
    await userEvent.click(screen.getByTitle('Open in new window'))
    expect(window.open).toHaveBeenCalledOnce()
    const [url, target, features] = window.open.mock.calls[0]
    expect(url).toContain('popout=DiceRoller')
    expect(url).toContain('config=')
    expect(target).toBe('_blank')
    expect(features).toContain('popup=yes')
  })

  it('encodes the config correctly in the URL', async () => {
    render(
      <ModuleWrapper id="test-1" type="CombatantTable" config={{ tableType: 'enemy' }}>
        <div>content</div>
      </ModuleWrapper>
    )
    await userEvent.click(screen.getByTitle('Open in new window'))
    const [url] = window.open.mock.calls[0]
    const params = new URLSearchParams(url.split('?')[1])
    const decoded = JSON.parse(decodeURIComponent(params.get('config')))
    expect(decoded).toEqual({ tableType: 'enemy' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- ModuleWrapper.test --reporter=verbose 2>&1 | tail -10
```
Expected: all three tests FAIL.

- [ ] **Step 3: Add ⧉ button to ModuleWrapper**

In `src/components/canvas/ModuleWrapper.jsx`, add a `useRef` import and the pop-out logic. Replace the entire file:

```jsx
import { useState, useRef } from 'react'
import { useLayoutStore } from '../../store/layoutStore'

const MODULE_TITLES = {
  InitiativeTracker: 'Initiative',
  CombatantTable:    null,
  ConditionsPanel:   'Conditions',
  DiceRoller:        'Dice',
  NotesPad:          'Notes',
  PartyManager:      'Party',
}

const MODULE_INFO = {
  InitiativeTracker: {
    title: 'Initiative Tracker',
    body: `Manages turn order, HP, and round count during combat.

Turn Order
• Enter each combatant's dice roll in the small input on the left of their name
• Auto mode: final initiative = roll + bonus. Manual mode: you type the total directly
• Hit "Sort by Initiative" to lock in the order
• Use ▲ / ▼ to manually reorder combatants after sorting
• ▶ / ◀ buttons step forward or backward through turns
• The active combatant is highlighted and marked with ▶
• Combatants not yet added to the order appear in a "Not in initiative" section at the bottom — give them a roll and hit + to include them

HP & Damage
• Use the ± input + DMG / HEAL buttons on each row to update HP on the fly
• The HP bar changes color: green → orange → red as HP drops
• When HP hits 0, the combatant gets a DOWN badge and a red border

Death Saves
• Death save pips appear automatically when a combatant is downed (HP = 0)
• Click the ✓ pips to record successes, ✗ pips for failures
• 3 successes → STABLE · 3 failures → DEAD
• Hit ↺ to reset death saves

Ability Scores
• When the panel is wide enough, each combatant's six ability scores are shown for quick reference`,
  },
  CombatantTable_ally: {
    title: 'Allies Table',
    body: `Tracks your party members during combat.

• Click "+ Add Ally" to create a character manually
• Click any row to expand it — shows HP editor, conditions, ability scores, spell stats and notes
• Edit stats inline by clicking on any value (AC, abilities, etc.)
• Load saved characters from the Party Manager module
• Conditions applied here are reflected in the Conditions panel`,
  },
  CombatantTable_enemy: {
    title: 'Enemies Table',
    body: `Tracks monsters and enemies during combat.

• Click "+ Add Enemy" to create one manually, or use "Search Monsters" to look up any creature from the D&D 5e SRD
• Click any row to expand it — shows HP editor, AC, conditions, ability scores and more
• The reset button (↺) on API-sourced monsters restores all stats to the original values
• Click a row to select that combatant — the Conditions panel will then apply to them`,
  },
  ConditionsPanel: {
    title: 'Conditions',
    body: `Apply and remove status conditions from combatants.

• First select a combatant by clicking their row in the Allies or Enemies table
• Then click any condition to toggle it on or off
• Active conditions are highlighted and shown as badges on the combatant's row
• Hover a condition name for a short rules reminder`,
  },
  DiceRoller: {
    title: 'Dice Roller',
    body: `Roll any standard dice with modifiers.

• Click a die button (d4, d6, d8, d10, d12, d20, d100) to roll it once
• Advantage: rolls twice, takes the higher result
• Disadvantage: rolls twice, takes the lower result
• Custom field: type any expression like 2d6+3 or d20-1 and press Enter
• The last 20 rolls are shown in the history below`,
  },
  NotesPad: {
    title: 'Notes',
    body: `A free-text scratch pad for the session.

• Type anything — spell slots, loot, reminders, NPC names
• Auto-saved to your browser`,
  },
  PartyManager: {
    title: 'Party Manager',
    body: `Save and reuse characters across encounters.

• Characters tab: create reusable character cards with full stats. Load any character directly into the current encounter
• Parties tab: group characters into a named party and load the whole group into the encounter at once
• Characters saved here persist between sessions`,
  },
}

function getInfo(type, config) {
  if (type === 'CombatantTable') {
    return MODULE_INFO[`CombatantTable_${config.tableType ?? 'ally'}`]
  }
  return MODULE_INFO[type] ?? null
}

export default function ModuleWrapper({ id, type, config = {}, minimized, children }) {
  const { removeModule, toggleMinimize } = useLayoutStore()
  const [infoOpen, setInfoOpen] = useState(false)
  const wrapperRef = useRef(null)

  let title = MODULE_TITLES[type] ?? type
  if (type === 'CombatantTable') {
    title = config.tableType === 'ally' ? 'Allies' : 'Enemies'
  }

  const info = getInfo(type, config)

  const btnStyle = {
    height: 44, width: 44, minHeight: 44, minWidth: 44,
    background: 'none', border: 'none',
    color: 'var(--c-muted)', fontSize: '0.85rem',
    borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  const popOut = () => {
    const el = wrapperRef.current
    const w = el ? Math.max(320, Math.min(800, el.offsetWidth)) : 420
    const h = el ? Math.max(480, Math.min(900, el.offsetHeight)) : 680
    const cfg = encodeURIComponent(JSON.stringify(config))
    const url = `${window.location.origin}${window.location.pathname}?popout=${type}&config=${cfg}`
    window.open(url, '_blank', `popup=yes,width=${w},height=${h}`)
  }

  return (
    <div ref={wrapperRef} className="card flex flex-col h-full" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 flex-shrink-0 select-none"
        style={{
          height: 52,
          borderBottom: minimized ? 'none' : '1px solid var(--c-border)',
        }}
      >
        {/* Drag handle: grip + title */}
        <div className="drag-handle flex items-center gap-2" style={{ flex: 1, cursor: 'grab', height: '100%' }}>
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none" style={{ opacity: 0.25, flexShrink: 0 }}>
            {[0,4,8,12].map(y => [0,4].map(x => (
              <circle key={`${x}-${y}`} cx={x+1} cy={y+2} r={1} fill="currentColor"/>
            )))}
          </svg>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--c-muted2)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {title}
          </span>
        </div>

        {/* Controls — outside drag handle */}
        <div className="flex items-center" style={{ gap: 4 }}>
          {info && (
            <button
              onClick={() => setInfoOpen(o => !o)}
              title="About this module"
              style={{ ...btnStyle, color: infoOpen ? 'var(--c-accent)' : 'var(--c-muted)', fontWeight: 700, fontSize: '0.8rem' }}
              onMouseEnter={e => { e.currentTarget.style.color = infoOpen ? 'var(--c-accent)' : 'var(--c-text)'; e.currentTarget.style.background = 'var(--c-elevated)' }}
              onMouseLeave={e => { e.currentTarget.style.color = infoOpen ? 'var(--c-accent)' : 'var(--c-muted)'; e.currentTarget.style.background = 'none' }}
            >?</button>
          )}
          <button
            onClick={popOut}
            title="Open in new window"
            aria-label="Open in new window"
            style={btnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-text)'; e.currentTarget.style.background = 'var(--c-elevated)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'none' }}
          >⧉</button>
          <button
            onClick={() => toggleMinimize(id)}
            title={minimized ? 'Expand' : 'Collapse'}
            style={btnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-text)'; e.currentTarget.style.background = 'var(--c-elevated)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'none' }}
          >
            {minimized ? '↑' : '↓'}
          </button>
          <button
            onClick={() => removeModule(id)}
            title="Remove"
            style={btnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-danger)'; e.currentTarget.style.background = 'var(--c-elevated)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'none' }}
          >✕</button>
        </div>
      </div>

      {/* Content */}
      {!minimized && (
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <div style={{ position: 'absolute', inset: 0, padding: '10px 12px 12px', overflowY: 'auto', overflowX: 'hidden' }}>
            {children}
          </div>

          {/* Info overlay */}
          {infoOpen && info && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'var(--c-bg)', overflowY: 'auto', padding: '14px 16px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{info.title}</span>
                <button
                  onClick={() => setInfoOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--c-muted)', minHeight: 28, minWidth: 28, fontSize: '0.9rem', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-text)'; e.currentTarget.style.background = 'var(--c-elevated)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.background = 'none' }}
                >✕</button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)', whiteSpace: 'pre-line', lineHeight: 1.7, margin: 0 }}>
                {info.body}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test -- ModuleWrapper.test --reporter=verbose 2>&1 | tail -15
```
Expected: all three tests PASS.

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npm run test 2>&1 | tail -10
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/canvas/ModuleWrapper.jsx src/components/canvas/ModuleWrapper.test.jsx
git commit -m "feat: add pop-out button to module headers"
```

---

## Task 6: Manual Verification

- [ ] Start the dev server: `npm run dev`
- [ ] Add an InitiativeTracker module → add 2 combatants → verify ⧉ button appears in header
- [ ] Click ⧉ → new window opens with just the tracker + close button + sync notice at the bottom
- [ ] Advance turn in main window → pop-out highlights the next combatant within ~100ms
- [ ] Toggle dark/light theme in main window → pop-out re-themes without reload
- [ ] Click close button in pop-out → window closes, main window unaffected
- [ ] Press Escape in pop-out → window closes
- [ ] Pop-out a CombatantTable (enemy) → enemies table renders correctly (not allies)
- [ ] Navigate to `http://localhost:5173/?popout=Bogus` → friendly "Unknown module: Bogus" error shown
- [ ] Navigate to `http://localhost:5173/?popout=DiceRoller&config=INVALID` → DiceRoller renders with empty config (no crash)
- [ ] Build for production: `npm run build` → no errors

- [ ] **Commit final verification**

```bash
git add -p  # stage any last fixes
git commit -m "feat: pop-out window — Feature 2 complete"
```
