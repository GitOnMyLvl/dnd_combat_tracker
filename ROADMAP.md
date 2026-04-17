# Feature Roadmap — D&D Battle Tracker

Each feature below is self-contained. When the user says "let's work on Feature X", execute only that section.

---

## Feature 1: PWA (Progressive Web App)

**Goal:** Make the app installable on desktop and mobile (Android homescreen, iPad, Windows/Mac). Enables offline use and a native app feel. Required foundation for Features 2–3.

### Dependencies to install
```bash
npm install -D vite-plugin-pwa
```

### Files to create
- `public/icon-192.png` — 192×192 app icon (D20 or sword SVG rasterized, or generate programmatically)
- `public/icon-512.png` — 512×512 app icon

### Files to modify

**`vite.config.js`** — add VitePWA plugin:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'D&D Battle Tracker',
        short_name: 'Battle Tracker',
        description: 'D&D 5e combat tracker for dungeon masters',
        theme_color: '#0c0c0e',
        background_color: '#0d0d12',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open5e\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'open5e-api',
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  test: { setupFiles: ['./src/test/setup.js'], exclude: ['e2e/**', 'node_modules'] },
})
```

### Icon generation
Create `scripts/generate-icons.mjs` and run once with `node scripts/generate-icons.mjs`:
```js
// Uses canvas to draw a simple D20 shape and save as PNG
// Or: use any 192/512px PNG and drop in public/
```
Simplest option: find a free D20 SVG, convert to PNG at both sizes, drop in `public/`.

### Verification
- `npm run build` → check `dist/` for `manifest.webmanifest` and `sw.js`
- Open built app in Chrome → DevTools → Application → Manifest → should show app info
- Application → Service Workers → should show registered SW
- "Install" prompt should appear in Chrome address bar
- On Android: "Add to Home Screen" option in browser menu

---

## Feature 2: Pop-out Window

**Goal:** Any module can be "popped out" into a separate browser window — useful for putting initiative tracker on a second monitor or a second app window on tablet.

### How it works
- ModuleWrapper gets a ⧉ button in the header
- Click opens `window.open(currentURL + '?popout=<type>&config=<json>')` sized to the module
- App detects `?popout` param on load → renders just that module fullscreen (no TopBar, no Canvas)
- Pop-out window auto-syncs with main window via `storage` events (Zustand writes to localStorage → storage event fires in other same-origin windows → pop-out re-reads state)

### Files to modify

**`src/App.jsx`** — detect popout mode at the top:
```jsx
import PopoutApp from './components/PopoutApp'

export default function App() {
  const params = new URLSearchParams(window.location.search)
  const popoutType = params.get('popout')
  const popoutConfig = params.has('config') ? JSON.parse(decodeURIComponent(params.get('config'))) : {}

  if (popoutType) return <PopoutApp type={popoutType} config={popoutConfig} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <TopBar />
      <Canvas />
    </div>
  )
}
```

**`src/components/canvas/ModuleWrapper.jsx`** — add ⧉ button to header (after minimize button, before remove button):
```jsx
const popOut = () => {
  const cfg = encodeURIComponent(JSON.stringify(config))
  const url = `${window.location.origin}${window.location.pathname}?popout=${type}&config=${cfg}`
  window.open(url, '_blank', 'width=420,height=680,menubar=no,toolbar=no,location=no')
}

// In header JSX, add before the remove button:
<button onClick={popOut} title="Pop out" style={{ ...headerBtnStyle }}>⧉</button>
```

### Files to create

**`src/components/PopoutApp.jsx`**:
```jsx
import { useEffect } from 'react'
import { useEncounterStore } from '../store/encounterStore'
import { useCharacterStore } from '../store/characterStore'
import { MODULE_COMPONENTS } from './canvas/Canvas'  // export this map from Canvas.jsx

export default function PopoutApp({ type, config }) {
  // Sync state when main window updates localStorage
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'dnd-tracker-encounter' && e.newValue) {
        const { state } = JSON.parse(e.newValue)
        useEncounterStore.setState(state)
      }
      if (e.key === 'dnd-tracker-characters' && e.newValue) {
        const { state } = JSON.parse(e.newValue)
        useCharacterStore.setState(state)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const Component = MODULE_COMPONENTS[type]
  if (!Component) return <div>Unknown module: {type}</div>

  return (
    <div style={{ height: '100dvh', padding: 12, background: 'var(--c-bg)', color: 'var(--c-text)', display: 'flex', flexDirection: 'column' }}>
      <Component config={config} />
    </div>
  )
}
```

**`src/components/canvas/Canvas.jsx`** — export `MODULE_COMPONENTS` so PopoutApp can import it:
```js
export const MODULE_COMPONENTS = { InitiativeTracker, CombatantTable, ... }
```

### Verification
- Add a combatant → click ⧉ on Initiative Tracker → new window opens showing the tracker
- Advance turn in main window → pop-out updates within ~100ms
- Pop-out at narrow width should still be usable (test at 320px wide)
- Close pop-out → main window unaffected

---

## Feature 3: Document Picture-in-Picture (PiP)

**Goal:** Float any module as an always-on-top overlay window over other apps. Chrome 116+ only. Ideal for iPad/desktop "keep-on-top" use while reading PDFs or notes.

**Note:** Uses the same JavaScript context as the main page — Zustand stores are automatically shared with no sync needed.

### Browser support check
Only show PiP button when `'documentPictureInPicture' in window`. Falls back gracefully on unsupported browsers.

### Files to create

**`src/hooks/useDocumentPiP.js`**:
```js
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'

export function useDocumentPiP() {
  const [pipWindow, setPipWindow] = useState(null)
  const supported = 'documentPictureInPicture' in window

  const openPiP = async ({ width = 420, height = 650 } = {}) => {
    if (!supported) return
    const win = await window.documentPictureInPicture.requestWindow({ width, height })

    // Copy all stylesheets into PiP window
    ;[...document.styleSheets].forEach(sheet => {
      try {
        const style = win.document.createElement('style')
        style.textContent = [...sheet.cssRules].map(r => r.cssText).join('')
        win.document.head.appendChild(style)
      } catch (_) {}
    })

    win.document.body.style.cssText = 'margin:0;background:var(--c-bg);color:var(--c-text)'
    win.addEventListener('pagehide', () => setPipWindow(null))
    setPipWindow(win)
  }

  const closePiP = () => { pipWindow?.close(); setPipWindow(null) }

  const PiPPortal = ({ children }) =>
    pipWindow ? createPortal(
      <div style={{ height: '100dvh', padding: 12, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>,
      pipWindow.document.body
    ) : null

  return { openPiP, closePiP, isPiP: !!pipWindow, supported, PiPPortal }
}
```

### Files to modify

**`src/components/canvas/ModuleWrapper.jsx`** — add PiP button (only when supported):
```jsx
import { useDocumentPiP } from '../../hooks/useDocumentPiP'

// Inside ModuleWrapper:
const { openPiP, closePiP, isPiP, supported, PiPPortal } = useDocumentPiP()

// In header, add before pop-out button:
{supported && (
  <button onClick={isPiP ? closePiP : openPiP} title={isPiP ? 'Close PiP' : 'Picture-in-Picture'}>
    {isPiP ? '▣' : '⛶'}
  </button>
)}

// After the main module content, add:
<PiPPortal>
  <Component config={config} />
</PiPPortal>
```

### Verification
- Open in Chrome 116+ → Initiative Tracker → header shows ⛶ button
- Click ⛶ → floating always-on-top window appears with the tracker
- Switch to another app (e.g., browser with PDF) → PiP window stays on top
- Advance turn in main window → PiP updates instantly (same JS context)
- Non-Chrome browsers → ⛶ button does not appear

---

## Feature 4: Player View (Share URL)

**Goal:** A read-only initiative view that players can see. Two modes:
- **Same device / second screen:** Pop-out or PiP the PlayerView module (uses Features 2–3)
- **Cross-device snapshot:** DM clicks "Share" → gets a URL encoding current encounter state → players open it on their phones/tablets → see a frozen snapshot (they can refresh when DM reshares)

### New module: PlayerView

Displayed initiative order, round counter, HP bars (optional), conditions. No editing controls.

**`src/components/modules/PlayerView.jsx`**:
```jsx
import { useEncounterStore } from '../../store/encounterStore'

export default function PlayerView({ config = {} }) {
  const { showHP = true, hideEnemyNames = false } = config
  const { encounter } = useEncounterStore()
  const { initiativeOrder, combatants, currentTurnIndex, round } = encounter

  const ordered = initiativeOrder
    .map(id => combatants.find(c => c.id === id))
    .filter(Boolean)
  const currentId = initiativeOrder[currentTurnIndex]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Round */}
      <div style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 800, color: 'var(--c-accent)' }}>
        Round {round}
      </div>

      {/* Initiative list */}
      {ordered.map((c, idx) => {
        const isActive = c.id === currentId
        const pct = c.hp.max > 0 ? c.hp.current / c.hp.max : 0
        const barColor = pct > 0.5 ? 'var(--c-success)' : pct > 0.25 ? '#f97316' : 'var(--c-danger)'
        const displayName = hideEnemyNames && c.type === 'enemy' ? '???' : c.name

        return (
          <div key={c.id} style={{
            borderRadius: 8, padding: '8px 10px',
            border: isActive ? '1px solid var(--c-accent)' : '1px solid var(--c-border)',
            background: isActive ? 'var(--c-accent-dim)' : 'var(--c-surface)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.75rem', color: isActive ? 'var(--c-accent)' : 'var(--c-muted)', fontWeight: 700, width: 16, flexShrink: 0 }}>
                {isActive ? '▶' : idx + 1}
              </span>
              <span style={{ color: c.type === 'ally' ? 'var(--c-success)' : 'var(--c-danger)', fontSize: '0.65rem', flexShrink: 0 }}>●</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem' }}>{displayName}</span>
              {c.conditions.length > 0 && (
                <span style={{ fontSize: '0.78rem', color: 'var(--c-accent)' }}>{c.conditions.join(', ')}</span>
              )}
            </div>
            {showHP && (
              <div style={{ marginTop: 4, marginLeft: 24, height: 4, borderRadius: 2, background: 'var(--c-elevated)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct * 100}%`, background: barColor, transition: 'width 0.3s' }} />
              </div>
            )}
          </div>
        )
      })}

      {ordered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--c-muted)', padding: '24px 0' }}>Waiting for combat to start…</div>
      )}
    </div>
  )
}
```

### Register the new module

**`src/components/canvas/Canvas.jsx`** — add to MODULE_COMPONENTS:
```js
import PlayerView from '../modules/PlayerView'
const MODULE_COMPONENTS = { ..., PlayerView }
```

**`src/components/canvas/ModulePicker.jsx`** — add to AVAILABLE_MODULES:
```js
{ type: 'PlayerView', label: 'Player View', config: { showHP: true, hideEnemyNames: false } }
```

**`src/store/layoutStore.js`** — add to DEFAULT_SIZES:
```js
PlayerView: { w: 3, h: 7 }
```

### Share Snapshot (cross-device)

**`src/components/TopBar.jsx`** — add Share button:
```jsx
const [copied, setCopied] = useState(false)

const shareEncounter = () => {
  const state = useEncounterStore.getState().encounter
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(state))))
  const url = `${window.location.origin}${window.location.pathname}?view=player&e=${encoded}`
  navigator.clipboard.writeText(url)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
}

// In TopBar JSX:
<button onClick={shareEncounter} className="btn-ghost" style={{ ... }}>
  {copied ? '✓ Copied' : '⎘ Share'}
</button>
```

**`src/App.jsx`** — detect `?view=player` URL param:
```jsx
const params = new URLSearchParams(window.location.search)
if (params.get('view') === 'player' && params.has('e')) {
  const encounter = JSON.parse(decodeURIComponent(escape(atob(params.get('e')))))
  return <PlayerViewApp encounter={encounter} />
}
```

**`src/components/PlayerViewApp.jsx`** — fullscreen read-only view (for snapshot URL visits):
```jsx
export default function PlayerViewApp({ encounter }) {
  // Renders PlayerView with the snapshot encounter data (not from store)
  // Shows a "Snapshot — ask DM for latest link" notice at the top
}
```

### Config options (via ModuleWrapper info/config)
- `showHP: true/false` — show HP bars
- `hideEnemyNames: true/false` — show "???" instead of enemy names

### Verification
- Add PlayerView module → shows initiative in read-only format
- Pop-out PlayerView → second window stays live-synced (uses Feature 2)
- Click Share in TopBar → copies URL to clipboard
- Open shared URL in another browser → shows snapshot of initiative
- `hideEnemyNames: true` → enemy rows show "???" for names

---

## Feature 5: AoE Multi-Target Damage

**Goal:** Select multiple combatants in a table, enter a damage value, and apply full or half damage to all at once (for spells like Fireball, AoE attacks).

### UX flow
1. DM clicks "⚔ Multi" button in CombatantTable toolbar → enters multi-select mode
2. Each combatant row shows a checkbox on the left; clicking toggles selection (no longer expands)
3. Once ≥1 targets selected, an AoE bar appears at the bottom of the module
4. AoE bar: `[N targets] · [amount input] · [FULL DMG] [HALF DMG] [HEAL]`
5. Clicking any action button applies damage/heal to all selected, then clears selection
6. Click "⚔ Multi" again or press Escape to exit multi-select mode

### Files to modify

**`src/components/modules/CombatantTable.jsx`**

In `CombatantTable` (the default export):
- Add state: `const [multiMode, setMultiMode] = useState(false)` and `const [aoeSelected, setAoeSelected] = useState(new Set())`
- Add "⚔ Multi" button to toolbar (next to existing + Add button):
  ```jsx
  <button
    onClick={() => { setMultiMode(v => !v); setAoeSelected(new Set()) }}
    className={multiMode ? 'btn-primary' : 'btn-ghost'}
    style={{ minHeight: 36, minWidth: 'unset', fontSize: '0.85rem' }}
  >⚔ Multi</button>
  ```
- Pass `multiMode`, `isAoeSelected={aoeSelected.has(c.id)}`, and `onAoeToggle` to each `CombatantRow`
- Add `AoeBar` at the bottom (after the rows div) when `multiMode && aoeSelected.size > 0`

In `CombatantRow`:
- Accept `multiMode`, `isAoeSelected`, `onAoeToggle` props
- When `multiMode` is true: clicking the summary row calls `onAoeToggle(combatant.id)` instead of expanding; show a checkbox circle on the left of the row:
  ```jsx
  {multiMode && (
    <span style={{
      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
      border: `2px solid ${isAoeSelected ? 'var(--c-accent)' : 'var(--c-border)'}`,
      background: isAoeSelected ? 'var(--c-accent-dim)' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.65rem', color: 'var(--c-accent)',
    }}>
      {isAoeSelected ? '✓' : ''}
    </span>
  )}
  ```
- Summary row onClick: `multiMode ? onAoeToggle(combatant.id) : (selectCombatant + setExpanded)`

### Files to create

**`src/components/shared/AoeBar.jsx`**:
```jsx
import { useState } from 'react'
import { useEncounterStore } from '../../store/encounterStore'

export default function AoeBar({ selectedIds, onClear }) {
  const [amount, setAmount] = useState('')
  const { updateHP } = useEncounterStore()

  const apply = (type) => {
    const n = parseInt(amount, 10)
    if (isNaN(n) || n <= 0) return
    selectedIds.forEach(id => {
      if (type === 'dmg') updateHP(id, -n)
      else if (type === 'half') updateHP(id, -Math.floor(n / 2))
      else if (type === 'heal') updateHP(id, n)
    })
    setAmount('')
    onClear()
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '8px 0', borderTop: '1px solid var(--c-border)',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--c-muted)', flexShrink: 0 }}>
        {selectedIds.size} target{selectedIds.size !== 1 ? 's' : ''}
      </span>
      <input
        type="number" min={1} placeholder="Amount"
        value={amount} onChange={e => setAmount(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && apply('dmg')}
        style={{ width: 80, flexShrink: 0, minHeight: 36, padding: '2px 8px' }}
      />
      <button onClick={() => apply('dmg')}
        style={{ background: 'var(--c-danger-dim)', border: '1px solid var(--c-danger)', color: 'var(--c-danger)', borderRadius: 7, padding: '0 8px', minHeight: 36, minWidth: 'unset', fontSize: '0.75rem', fontWeight: 600 }}>
        FULL
      </button>
      <button onClick={() => apply('half')}
        style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid #f97316', color: '#f97316', borderRadius: 7, padding: '0 8px', minHeight: 36, minWidth: 'unset', fontSize: '0.75rem', fontWeight: 600 }}>
        HALF
      </button>
      <button onClick={() => apply('heal')}
        style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid var(--c-success)', color: 'var(--c-success)', borderRadius: 7, padding: '0 8px', minHeight: 36, minWidth: 'unset', fontSize: '0.75rem', fontWeight: 600 }}>
        HEAL
      </button>
    </div>
  )
}
```

### Wire AoeBar into CombatantTable (bottom of module, above modals)
```jsx
{multiMode && aoeSelected.size > 0 && (
  <AoeBar
    selectedIds={aoeSelected}
    onClear={() => { setAoeSelected(new Set()); setMultiMode(false) }}
  />
)}
```

### Verification
- Click ⚔ Multi → rows show checkboxes, row click no longer expands
- Select 3 enemies → AoE bar appears at bottom showing "3 targets"
- Enter 20 → FULL → each enemy takes 20 damage, selection clears
- Enter 20 → HALF → each enemy takes 10 damage (floor for odd numbers)
- Click ⚔ Multi again → exits multi mode, selection cleared
- Normal row expand/collapse works when NOT in multi mode

---

## Architecture Reference

| Store | localStorage key | Main state |
|---|---|---|
| encounterStore | `dnd-tracker-encounter` | combatants, initiativeOrder, round |
| characterStore | `dnd-tracker-characters` | characters, parties |
| layoutStore | `dnd-tracker-layout` | modules (positions, types, configs) |
| themeStore | `dnd-tracker-theme` | theme, accent |

| Key files | Role |
|---|---|
| `src/components/canvas/Canvas.jsx` | MODULE_COMPONENTS map, grid layout |
| `src/components/canvas/ModulePicker.jsx` | AVAILABLE_MODULES list |
| `src/store/layoutStore.js` | DEFAULT_SIZES per module type |
| `src/components/canvas/ModuleWrapper.jsx` | Header, minimize, info overlay |
| `src/components/shared/HPEditor.jsx` | HP bar + DMG/HEAL/TMP UI |
| `src/components/modules/CombatantTable.jsx` | Allies/enemies table |
| `src/components/modules/InitiativeTracker.jsx` | Initiative order tracker |
