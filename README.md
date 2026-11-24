# D&D Battle Tracker

A modular, tablet-first combat tracker for Dungeon Masters. Build your own layout by adding only the modules you need — drag, resize, and arrange them freely on a blank canvas.

## Features

- **Modular canvas** — add/remove/resize/minimize modules via drag-and-drop; pop any module out into its own window (synced live)
- **Initiative Tracker** — sorted turn order (DEX tie-break), Next/Prev, round counter, in/out-of-combat lists, death saves, quick tokens
- **Allies & Enemies tables** — inline HP editing with temp HP (damage hits temp HP first), AC, conditions, exhaustion, inspiration, spell DC
- **Monster search** — pull SRD monsters from the Open5e API, fully editable after import
- **AoE Damage** — damage or heal many combatants at once, with per-target save (½) and resistance
- **Conditions panel** — tap to toggle conditions on the selected combatant
- **Dice roller** — d4–d100, advantage/disadvantage, mixed dice pools, roll history
- **Party Manager** — save characters and parties and drop them into any encounter
- **Notes pad** — free text, auto-saved
- **Encounters** — multiple named encounters, plus JSON **export/import** for backups or moving to another device
- **Themes** — dark/light and a custom accent colour
- **Installable PWA** — works offline (fonts are self-hosted), tablet-first touch targets

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### On a tablet (same network)

```bash
npm run dev -- --host
```

Then open the **Network** URL shown in the terminal on your tablet.

## Scripts

```bash
npm run build      # production build → dist/
npm run preview    # preview the production build locally
npm run lint       # ESLint
npm test           # unit tests (Vitest)
npm run test:e2e   # end-to-end tests (Playwright, headless; test:e2e:headed to watch)
```

CI (GitHub Actions) runs lint, unit tests, build and the e2e suite on every pull request.

## Tech Stack

| | |
|---|---|
| Framework | React 18 + Vite |
| Grid canvas | react-grid-layout |
| State | Zustand (persisted to localStorage) |
| Styling | Tailwind CSS v4 |
| Monster data | [Open5e API](https://api.open5e.com) (SRD monsters, cached locally) |

## Usage

1. Click **+ Module** in the top bar (or the **+** FAB at the bottom right) to add modules
2. Drag modules by their header grip to reposition — they pack vertically automatically
3. Resize by dragging the bottom-right corner handle
4. Add combatants via **+ Add** (manual), **+ Monster** (Open5e search) or the Party Manager
5. Click a combatant row to expand it — edit HP, conditions, stats inline
6. Click any combatant in the Initiative Tracker or tables to select it, then use the Conditions panel to apply/remove conditions
7. Hit **Save** to store the encounter; load, export or import from the **Encounters** menu

All data stays in your browser (localStorage). Use **Encounters → Export** to keep a backup.

## Project Structure

```
src/
  api/            Open5e fetch + localStorage cache
  components/
    canvas/       Canvas grid, ModuleWrapper, ModulePicker
    landing/      Landing page
    modules/      InitiativeTracker, CombatantTable, ConditionsPanel, DiceRoller,
                  NotesPad, PartyManager, AoeDamage
    shared/       HPEditor, EditableField, ConditionBadge, MonsterSearch, Modal, ErrorBoundary
  hooks/          Cross-window sync, PWA install prompt
  store/          Zustand stores (encounter, characters, layout, theme, ui)
  utils/          Dice, abilities, colours, backup, ids
e2e/              Playwright specs
```

## Roadmap

See [ROADMAP.md](ROADMAP.md).
