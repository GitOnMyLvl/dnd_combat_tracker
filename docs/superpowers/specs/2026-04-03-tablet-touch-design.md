# Tablet Touch UX — Design Spec
Date: 2026-04-03

## Goal

Make the D&D Battle Tracker comfortable to use on a tablet (touch primary). The app is used during live sessions — fast, accurate taps on HP, initiative, and conditions are the critical path.

## Approach

Keep the existing free-form drag-and-drop grid (react-grid-layout). Make every interactive element meet the 44px minimum touch target standard. No structural changes to layout or navigation.

---

## Section 1 — Module Header (`ModuleWrapper.jsx`)

| Property | Before | After |
|---|---|---|
| Header height | 40px | 52px |
| Info `?` button | 36×36px | 44×44px |
| Minimize `↓` button | 36×36px | 44×44px |
| Close `✕` button | 36×36px | 44×44px |

- The drag handle zone (grip dots + title text) fills the remaining header width — no change needed structurally, the taller header naturally increases the draggable area
- Button style stays icon-only (no labels)

---

## Section 2 — In-Module Elements

All interactive elements inside modules go to **44px min-height**. Font sizes scale up slightly where needed for readability.

### Initiative Tracker (`InitiativeTracker.jsx`)

- Initiative roll input: 44px tall
- ± amount input: 44px tall
- DMG button: 44px tall
- HEAL button: 44px tall
- Remove / Yes / No confirmation buttons: 44px tall
- ▲ / ▼ reorder buttons: each 22px tall (pair stacks to 44px total within the row)
- Death save pips: increase clickable area around each pip to ~24×24px
- **HP bar stays unchanged** — it is a visual indicator only, not a tap target

### Combatant Table (`CombatantTable.jsx`)

- AC / HP `EditableField` inputs: 44px tall
- Spell DC / Spell Atk / Init Bonus `StatPill` inputs: 44px tall
- DMG / HEAL buttons: 44px tall
- Remove / Yes / No confirmation buttons: 44px tall
- Condition toggle buttons: min-height 44px, padding increased
- Exhaustion − / + buttons: 44px tall
- Save / Reset to Default / Inspire buttons: 44px tall

### Party Manager (`PartyManager.jsx`)

- Edit, + Add, Load All buttons on character/party cards: 44px tall
- ✕ remove buttons on cards: 44×44px
- New Character / New Party buttons: 44px tall

### Dice Roller (`DiceRoller.jsx`)

- All die buttons (d4, d6, d8, d10, d12, d20, d100): 44px tall
- Custom expression input: 44px tall
- Roll / Advantage / Disadvantage buttons: 44px tall

### Notes Pad (`NotesPad.jsx`)

- Textarea: no change needed — already fills available space

---

## Section 3 — Grid & Layout Defaults (`Canvas.jsx`, `layoutStore.js`)

| Property | Before | After |
|---|---|---|
| `rowHeight` | 60px | 72px |
| Default module `h` values | sized for 60px rows | scaled down proportionally to match same physical height at 72px |

- Column count and breakpoints unchanged
- FAB (+ button): already 48×48px — no change
- `minH` stays at 3 rows (now 216px instead of 180px)

---

## Files Changed

| File | Change |
|---|---|
| `src/components/canvas/ModuleWrapper.jsx` | Header 52px, buttons 44×44px |
| `src/components/canvas/Canvas.jsx` | `rowHeight` 60 → 72 |
| `src/store/layoutStore.js` | Default module `h` values adjusted |
| `src/components/modules/InitiativeTracker.jsx` | All touch targets → 44px |
| `src/components/modules/CombatantTable.jsx` | All touch targets → 44px |
| `src/components/modules/PartyManager.jsx` | All touch targets → 44px |
| `src/components/modules/DiceRoller.jsx` | All touch targets → 44px |

---

## Out of Scope

- Tab-based or preset layout modes
- Changes to navigation or app shell
- Any new features or module content changes
