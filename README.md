# D&D Battle Tracker

A modular, tablet-first combat tracker for Dungeon Masters. Build your own layout by adding only the modules you need — drag, resize, and arrange them freely on a blank canvas.

## Features

- **Modular canvas** — add/remove/resize modules on demand via drag-and-drop
- **Initiative Tracker** — sorted turn order, Next/Prev buttons, round counter
- **Allies & Enemies tables** — inline HP editing, AC, conditions, spell DC
- **Monster search** — pull monster stats from the Open5e API (SRD), fully editable after import
- **Conditions panel** — tap to toggle conditions on a selected combatant
- **Dice roller** — d4–d100, advantage/disadvantage, custom expressions (e.g. `3d6+2`)
- **Notes pad** — free text, auto-saved to localStorage
- **Encounter save/load** — multiple named encounters persisted in the browser
- **Dark & light theme** — toggle in the top bar
- **Tablet-first** — touch-friendly tap targets, works great on iPad in landscape

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

## Build

```bash
npm run build    # production build → dist/
npm run preview  # preview the production build locally
```

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
4. Add combatants via **+ Add** (manual) or **+ Monster** (Open5e search)
5. Click a combatant row to expand it — edit HP, conditions, stats inline
6. Click any combatant in the Initiative Tracker or tables to select it, then use the Conditions panel to apply/remove conditions
7. Hit **Save** to persist the encounter; load previous encounters from **Encounters** dropdown

## Project Structure

```
src/
  api/            Open5e fetch + localStorage cache
  components/
    canvas/       Canvas grid, ModuleWrapper, ModulePicker
    modules/      InitiativeTracker, CombatantTable, ConditionsPanel, DiceRoller, NotesPad
    shared/       HPEditor, EditableField, ConditionBadge, MonsterSearch
  store/          Zustand stores (encounter, layout)
```

## Roadmap

- [ ] Spell slot tracker module
- [ ] Death saves tracker
- [ ] Legendary actions pips
- [ ] Tauri wrapper for desktop executable
- [ ] Multiplayer / shared view for players
