# Design Refresh — D&D-Flavored UI Pass

Branch: `feat/design-refresh`

## Goal
Lift the visual identity from generic SaaS-dark into a cohesive, understated D&D aesthetic without re-architecting. Keep the CSS-token system, keep layout behavior, keep all existing behavior.

## Scope

### Typography
- [x] Load Cinzel (display serif) + keep Inter (body) via Google Fonts in `index.html`
- [x] Introduce `--font-display` token; apply to logo, module titles, modal titles

### Color tokens (`src/index.css`)
- [x] Dark: warm near-black, slight plum undertone; refined borders/shadows
- [x] Light: parchment-tinged surface, warm stone borders
- [x] New tokens: `--c-accent-soft`, `--radius-card`, `--shadow-card`, `--shadow-card-hover`

### Component polish
- [x] Buttons: refined press state, better focus ring
- [x] Inputs: focus ring halo, better disabled state
- [x] `.card` gets subtle gradient + better shadow
- [x] `.module-header-accent` utility class — accent color stripe at top of module header

### TopBar
- [x] Logo uses display font + small die-d20 SVG emblem
- [x] Theme toggle becomes sun/moon icon
- [x] Save button gets disk icon
- [x] Better divider treatment

### Canvas
- [x] Empty state: D20 SVG, tagline, display-font heading

### ModulePicker
- [x] Icon per module, 2-col grid on wider screens
- [x] Display-font title

### ModuleWrapper
- [x] Accent stripe on header
- [x] Display-font module title
- [x] Refined control buttons

## Verification
- [x] `npm run build` succeeds
- [x] Run `npm run test` — no regressions
- [x] Theme toggle still works
- [x] Accent picker still propagates
- [x] Module add / remove / minimize / popout still works

## Review
(to fill in at end)

---

# AoE Damage/Heal Module

## Goal
A module where the DM multi-selects combatants, types a number, and applies it as damage or heal to all at once. Support "Save for half" toggle (floor-halves damage globally).

## Spec
- Mode toggle: **Damage** | **Heal**
- Amount input (numeric)
- Save-for-half toggle (damage mode only; halves amount, round down)
- Combatant list with checkboxes, grouped by Allies / Enemies
- Quick actions: All Allies, All Enemies, Clear
- Apply button — hits each selected via `updateHP`
- Shows live preview: "Apply -5 to 3 combatants"

## Files
- [ ] `src/components/modules/AoeDamage.jsx` (new)
- [ ] `src/components/modules/AoeDamage.test.jsx` (new — cover half-round-down, heal, selection)
- [ ] Register in `Canvas.jsx` (MODULE_COMPONENTS)
- [ ] Register in `ModuleWrapper.jsx` (MODULE_TITLES + MODULE_INFO)
- [ ] Register in `ModulePicker.jsx` (AVAILABLE_MODULES + icon)

## Verification
- [ ] Unit test for half-round-down math
- [ ] `npm run build` + `npm run test`

