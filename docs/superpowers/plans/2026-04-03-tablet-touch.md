# Tablet Touch UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every interactive element in the app meet the 44px minimum touch target standard for tablet use, and bump the grid row height to give modules more room.

**Architecture:** Pure style changes across 7 files — no logic, no new state, no new components. Each task is independent and safe to commit on its own. Since all changes are visual, the verification step for each task is running `npm run dev` and checking the result in a browser rather than automated tests (existing unit tests should still pass throughout).

**Tech Stack:** React 18, react-grid-layout, Zustand, Tailwind CSS v4, Vite

---

### Task 1: Grid row height + layout defaults

**Files:**
- Modify: `src/components/canvas/Canvas.jsx`
- Modify: `src/store/layoutStore.js`

Bump `rowHeight` from 60 → 72px. Adjust default `h` values so modules open at roughly the same physical size as before.

Physical height mapping (old rowHeight=60 → new rowHeight=72):
- h=8 at 60px = 480px → h=7 at 72px = 504px ✓
- h=7 at 60px = 420px → h=6 at 72px = 432px ✓
- h=6 at 60px = 360px → h=5 at 72px = 360px ✓

- [ ] **Step 1: Update rowHeight in Canvas.jsx**

In `src/components/canvas/Canvas.jsx`, change line 69:
```jsx
rowHeight={72}
```

- [ ] **Step 2: Update default h values in layoutStore.js**

In `src/store/layoutStore.js`, replace `DEFAULT_SIZES`:
```js
const DEFAULT_SIZES = {
  InitiativeTracker: { w: 3, h: 7 },
  CombatantTable:    { w: 5, h: 7 },
  ConditionsPanel:   { w: 4, h: 5 },
  DiceRoller:        { w: 4, h: 6 },
  NotesPad:          { w: 4, h: 5 },
  PartyManager:      { w: 4, h: 7 },
}
```

- [ ] **Step 3: Verify**

Run `npm run dev`. Add a few modules — confirm they open at a reasonable size (roughly the same physical height as before). Resize the browser window to confirm the grid still works.

- [ ] **Step 4: Verify existing tests still pass**

```bash
npm run test
```
Expected: all tests pass (no logic was changed).

- [ ] **Step 5: Commit**

```bash
git add src/components/canvas/Canvas.jsx src/store/layoutStore.js
git commit -m "feat: bump grid rowHeight to 72px for tablet touch targets"
```

---

### Task 2: Module header touch targets (ModuleWrapper)

**Files:**
- Modify: `src/components/canvas/ModuleWrapper.jsx`

Increase header height from 40px → 52px. Increase the three header buttons (info, minimize, close) from 36×36px → 44×44px.

- [ ] **Step 1: Update btnStyle and header height**

In `src/components/canvas/ModuleWrapper.jsx`, replace the `btnStyle` object and the header `height` style:

Change `btnStyle` (around line 99):
```jsx
const btnStyle = {
  height: 44, width: 44, minHeight: 44, minWidth: 44,
  background: 'none', border: 'none',
  color: 'var(--c-muted)', fontSize: '0.85rem',
  borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
}
```

Change the header div height (around line 112):
```jsx
style={{
  height: 52,
  borderBottom: minimized ? 'none' : '1px solid var(--c-border)',
}}
```

- [ ] **Step 2: Verify**

Run `npm run dev`. Open a module — confirm the header is taller, the three buttons are larger and easy to tap. Drag still works via the title area. Info overlay still opens/closes.

- [ ] **Step 3: Commit**

```bash
git add src/components/canvas/ModuleWrapper.jsx
git commit -m "feat: increase module header to 52px, buttons to 44x44 for tablet"
```

---

### Task 3: Initiative Tracker touch targets

**Files:**
- Modify: `src/components/modules/InitiativeTracker.jsx`

Increase all interactive elements to 44px min-height. HP bar stays unchanged. Death save pips increase from 10px → 20px diameter.

- [ ] **Step 1: Update InitInput style**

In `InitiativeTracker.jsx`, find the `InitInput` component. Update the `style` prop passed to it in `CombatantRow` (the ordered list, around line 110):
```jsx
style={{ width: 44, textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', minHeight: 44, padding: '2px 4px' }}
```

And in the "Not in initiative" section (around line 393):
```jsx
style={{ width: 44, textAlign: 'center', fontSize: '0.82rem', minHeight: 44, padding: '2px 4px' }}
```

- [ ] **Step 2: Update ± amount input and DMG/HEAL buttons**

In `CombatantRow`, find the HP section (around line 205). Update the ± input and the DMG/HEAL buttons:
```jsx
<input
  type="text"
  inputMode="numeric"
  placeholder="±"
  value={amt}
  onChange={e => setAmt(e.target.value)}
  onKeyDown={e => { if (e.key === 'Enter') applyHP('dmg') }}
  style={{ width: 44, minHeight: 44, padding: '0 4px', fontSize: '0.82rem', textAlign: 'center' }}
/>
<button
  onClick={() => applyHP('dmg')}
  style={{ background: 'var(--c-danger-dim)', border: '1px solid var(--c-danger)', color: 'var(--c-danger)', borderRadius: 5, padding: '0 8px', minHeight: 44, minWidth: 'unset', fontSize: '0.72rem', fontWeight: 600 }}
>DMG</button>
<button
  onClick={() => applyHP('heal')}
  style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid var(--c-success)', color: 'var(--c-success)', borderRadius: 5, padding: '0 8px', minHeight: 44, minWidth: 'unset', fontSize: '0.72rem', fontWeight: 600 }}
>HEAL</button>
```

- [ ] **Step 3: Update Remove / Yes / No buttons**

Find the `!confirmRemove` block in `CombatantRow` (around line 165). Update all three buttons to `minHeight: 44`:
```jsx
{!confirmRemove ? (
  <button
    onClick={e => { e.stopPropagation(); setConfirmRemove(true) }}
    style={{
      background: 'none', border: '1px solid var(--c-border)', color: 'var(--c-muted)',
      minHeight: 44, minWidth: 'unset', padding: '0 8px', fontSize: '0.65rem', fontWeight: 600,
      cursor: 'pointer', flexShrink: 0, borderRadius: 5,
    }}
    onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-danger)'; e.currentTarget.style.borderColor = 'var(--c-danger)' }}
    onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-muted)'; e.currentTarget.style.borderColor = 'var(--c-border)' }}
  >Remove</button>
) : (
  <div className="flex" style={{ gap: 3, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
    <button
      onClick={() => onRemove(c.id)}
      style={{
        background: 'var(--c-danger-dim)', border: '1px solid var(--c-danger)', color: 'var(--c-danger)',
        minHeight: 44, minWidth: 'unset', padding: '0 8px', fontSize: '0.65rem', fontWeight: 700,
        cursor: 'pointer', borderRadius: 5,
      }}
    >Yes</button>
    <button
      onClick={() => setConfirmRemove(false)}
      style={{
        background: 'none', border: '1px solid var(--c-border)', color: 'var(--c-muted)',
        minHeight: 44, minWidth: 'unset', padding: '0 8px', fontSize: '0.65rem', fontWeight: 600,
        cursor: 'pointer', borderRadius: 5,
      }}
    >No</button>
  </div>
)}
```

- [ ] **Step 4: Update ▲ / ▼ reorder buttons**

The two reorder buttons stack vertically. Make each one `minHeight: 22` (pair = 44px). Find the reorder `div` in `CombatantRow` (around line 152):
```jsx
<div className="flex flex-col" style={{ gap: 1, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
  <button
    onClick={onMoveUp}
    disabled={idx === 0}
    style={{ background: 'none', border: 'none', color: 'var(--c-muted)', minHeight: 22, minWidth: 44, padding: '1px 4px', fontSize: '0.7rem', lineHeight: 1, opacity: idx === 0 ? 0.2 : 0.6 }}
  >▲</button>
  <button
    onClick={onMoveDown}
    disabled={isLast}
    style={{ background: 'none', border: 'none', color: 'var(--c-muted)', minHeight: 22, minWidth: 44, padding: '1px 4px', fontSize: '0.7rem', lineHeight: 1, opacity: isLast ? 0.2 : 0.6 }}
  >▼</button>
</div>
```

- [ ] **Step 5: Update death save pips**

Find the `Pips` component inside `DeathSaves` (around line 38). Increase pip size from 10px → 20px:
```jsx
<span
  key={i}
  onClick={e => { e.stopPropagation(); setDeathSave(combatant.id, type, i < count ? i : i + 1) }}
  style={{
    width: 20, height: 20, borderRadius: '50%', cursor: 'pointer',
    background: i < count ? color : 'var(--c-elevated)',
    border: `1px solid ${i < count ? color : 'var(--c-border)'}`,
    transition: 'background 0.1s',
  }}
/>
```

- [ ] **Step 6: Update Next/Prev turn and Sort buttons**

Find the round row buttons (around line 308). Update to `minHeight: 44`:
```jsx
<button
  onClick={prevTurn}
  className="btn-ghost"
  style={{ minHeight: 44, minWidth: 44, padding: 0, justifyContent: 'center', fontSize: '0.8rem' }}
  disabled={initiativeOrder.length === 0}
>◀</button>
<button
  onClick={nextTurn}
  className="btn-primary"
  style={{ minHeight: 44, minWidth: 'unset', padding: '0 16px', fontSize: '0.8rem' }}
  disabled={initiativeOrder.length === 0}
>Next ▶</button>
```

Find the Sort button (around line 341):
```jsx
<button
  onClick={sortInitiative}
  className="btn-ghost"
  style={{ flex: 1, minHeight: 44, minWidth: 'unset', justifyContent: 'center', fontSize: '0.78rem' }}
  disabled={combatants.length === 0}
>Sort by Initiative</button>
```

Find the mode toggle buttons (around line 327):
```jsx
<button
  key={m}
  onClick={() => setInitiativeMode(m)}
  style={{
    minHeight: 44, minWidth: 'unset', padding: '0 12px', fontSize: '0.72rem', fontWeight: 600,
    borderRadius: 0, border: 'none',
    background: initiativeMode === m ? 'var(--c-accent-dim)' : 'transparent',
    color: initiativeMode === m ? 'var(--c-accent)' : 'var(--c-muted)',
    textTransform: 'capitalize',
  }}
>{m}</button>
```

- [ ] **Step 7: Verify**

Run `npm run dev`. Open the Initiative Tracker module. Confirm: roll inputs, DMG/HEAL buttons, ± input, Remove/Yes/No, ▲▼, death save pips, Next/Prev, Sort — all comfortably tappable. HP bar is unchanged.

- [ ] **Step 8: Commit**

```bash
git add src/components/modules/InitiativeTracker.jsx
git commit -m "feat: increase initiative tracker touch targets to 44px for tablet"
```

---

### Task 4: Combatant Table touch targets

**Files:**
- Modify: `src/components/modules/CombatantTable.jsx`

- [ ] **Step 1: Update Remove / Yes / No buttons**

In `CombatantRow` (around line 264), update the three buttons:
```jsx
{!confirmRemove ? (
  <button
    onClick={() => setConfirmRemove(true)}
    className="btn-danger"
    style={{ minHeight: 44, minWidth: 'unset', fontSize: '0.75rem' }}
  >Remove</button>
) : (
  <div className="flex" style={{ gap: 4 }}>
    <button
      onClick={() => removeCombatant(combatant.id)}
      style={{
        background: 'var(--c-danger-dim)', border: '1px solid var(--c-danger)', color: 'var(--c-danger)',
        minHeight: 44, minWidth: 'unset', padding: '0 12px', fontSize: '0.75rem', fontWeight: 700,
        cursor: 'pointer', borderRadius: 6,
      }}
    >Yes</button>
    <button
      onClick={() => setConfirmRemove(false)}
      style={{
        background: 'none', border: '1px solid var(--c-border)', color: 'var(--c-muted)',
        minHeight: 44, minWidth: 'unset', padding: '0 12px', fontSize: '0.75rem', fontWeight: 600,
        cursor: 'pointer', borderRadius: 6,
      }}
    >No</button>
  </div>
)}
```

- [ ] **Step 2: Update Inspire, Save, Reset to Default buttons**

Find the actions row (around line 264):
```jsx
<button
  onClick={() => toggleInspiration(combatant.id)}
  className="btn-ghost"
  style={{
    minHeight: 44, minWidth: 'unset', fontSize: '0.75rem',
    color: inspiration ? '#60a5fa' : undefined,
    border: inspiration ? '1px solid #1d4ed888' : undefined,
    background: inspiration ? '#1d4ed822' : undefined,
  }}
>
  ✦ {inspiration ? 'Inspired' : 'Inspire'}
</button>
<button
  onClick={() => {
    saveCharacter(combatantToTemplate(combatant))
    setSaveFlash(true)
    setTimeout(() => setSaveFlash(false), 1200)
  }}
  className="btn-ghost"
  style={{ minHeight: 44, minWidth: 'unset', fontSize: '0.75rem', color: saveFlash ? 'var(--c-success)' : undefined }}
>
  {saveFlash ? 'Saved!' : 'Save'}
</button>
{combatant._source === 'api' && combatant._apiData && (
  <button onClick={() => resetCombatantToApi(combatant.id)} className="btn-ghost" style={{ minHeight: 44, minWidth: 'unset', fontSize: '0.75rem' }}>
    Reset to Default
  </button>
)}
```

- [ ] **Step 3: Update Exhaustion − / + buttons**

Find the exhaustion row (around line 191):
```jsx
<button
  onClick={() => setExhaustion(combatant.id, exhaustion - 1)}
  disabled={exhaustion === 0}
  style={{ background: 'none', border: '1px solid var(--c-border)', borderRadius: 6, minHeight: 44, minWidth: 44, padding: 0, fontSize: '1rem', color: 'var(--c-muted)' }}
>−</button>
<span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: 16, textAlign: 'center', color: exhaustion > 0 ? '#f97316' : 'var(--c-muted)' }}>
  {exhaustion}
</span>
<button
  onClick={() => setExhaustion(combatant.id, exhaustion + 1)}
  disabled={exhaustion === 10}
  style={{ background: 'none', border: '1px solid var(--c-border)', borderRadius: 6, minHeight: 44, minWidth: 44, padding: 0, fontSize: '1rem', color: 'var(--c-muted)' }}
>+</button>
```

- [ ] **Step 4: Update condition toggle buttons**

Find the condition buttons (around line 237):
```jsx
<button
  key={cond}
  onClick={() => toggleCondition(combatant.id, cond)}
  style={{
    padding: '3px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 600,
    minHeight: 44, minWidth: 'unset',
    border: active ? '1px solid var(--c-accent)' : '1px solid var(--c-border)',
    background: active ? 'var(--c-accent-dim)' : 'transparent',
    color: active ? 'var(--c-accent)' : 'var(--c-muted2)',
    transition: 'all 0.1s',
  }}
>{cond}</button>
```

- [ ] **Step 5: Update toolbar buttons (+ Add, + Monster)**

Find the toolbar (around line 319):
```jsx
<button onClick={() => setShowSearch(true)} className="btn-ghost" style={{ minHeight: 44, minWidth: 'unset', fontSize: '0.75rem' }}>
  + Monster
</button>
<button onClick={() => setShowManual(true)} className="btn-primary" style={{ minHeight: 44, minWidth: 'unset', fontSize: '0.75rem' }}>
  + Add
</button>
```

- [ ] **Step 6: Verify**

Run `npm run dev`. Open an Allies or Enemies module. Expand a combatant row. Confirm: Remove/Yes/No, Inspire/Save, Exhaustion ±, conditions, toolbar buttons — all 44px tall and easy to tap.

- [ ] **Step 7: Commit**

```bash
git add src/components/modules/CombatantTable.jsx
git commit -m "feat: increase combatant table touch targets to 44px for tablet"
```

---

### Task 5: Party Manager touch targets

**Files:**
- Modify: `src/components/modules/PartyManager.jsx`

- [ ] **Step 1: Update CharacterCard buttons**

In the `CharacterCard` component (around line 33), update Edit, actions, and ✕ buttons:
```jsx
{onEdit && (
  <button
    onClick={onEdit}
    className="btn-primary"
    style={{ minHeight: 44, minWidth: 'unset', fontSize: '0.75rem', padding: '0 12px', borderRadius: 6 }}
  >Edit</button>
)}
{actions}
{onRemove && (
  <button
    onClick={onRemove}
    style={{
      background: 'none', border: 'none', color: 'var(--c-muted)',
      minHeight: 44, minWidth: 44, fontSize: '0.85rem', borderRadius: 6, padding: 0,
    }}
    title="Delete"
  >✕</button>
)}
```

- [ ] **Step 2: Update CharactersTab New Character button and + Add inline button**

Find `CharactersTab` (around line 67):
```jsx
<button onClick={() => setShowNew(true)} className="btn-primary" style={{ minHeight: 44, minWidth: 'unset', fontSize: '0.75rem' }}>+ New Character</button>
```

Find the `+ Add` button inside `characters.map` (around line 87):
```jsx
<button
  onClick={() => addToEncounter(char)}
  className="btn-primary"
  style={{ minHeight: 44, minWidth: 'unset', fontSize: '0.75rem', padding: '0 12px', borderRadius: 6 }}
>+ Add</button>
```

- [ ] **Step 3: Update PartiesTab buttons**

Find `PartiesTab` (around line 258). Update New Party, + Add, Load All, and ✕ party buttons:
```jsx
<button
  onClick={() => setShowCreate(true)}
  className="btn-primary"
  style={{ minHeight: 44, minWidth: 'unset', fontSize: '0.75rem' }}
>+ New Party</button>
```

Find the party header buttons (around line 291):
```jsx
<button
  onClick={() => setAddingToParty(party)}
  className="btn-primary"
  style={{ minHeight: 44, minWidth: 'unset', fontSize: '0.75rem', padding: '0 12px', borderRadius: 6 }}
>+ Add</button>
<button
  onClick={() => loadParty(party)}
  className="btn-primary"
  style={{ minHeight: 44, minWidth: 'unset', fontSize: '0.75rem', padding: '0 12px', borderRadius: 6 }}
>Load All</button>
<button
  onClick={() => { if (window.confirm(`Delete party "${party.name}"?`)) removeParty(party.id) }}
  style={{
    background: 'none', border: 'none', color: 'var(--c-muted)',
    minHeight: 44, minWidth: 44, fontSize: '0.85rem', borderRadius: 6, padding: 0,
  }}
  title="Delete party"
>✕</button>
```

- [ ] **Step 4: Update tab bar buttons**

Find the tab bar in `PartyManager` (around line 354):
```jsx
const tabStyle = (active) => ({
  flex: 1, minHeight: 44, minWidth: 'unset',
  fontSize: '0.75rem', fontWeight: 600, borderRadius: 6,
  background: active ? 'var(--c-accent-dim)' : 'transparent',
  color: active ? 'var(--c-accent)' : 'var(--c-muted)',
  border: active ? '1px solid var(--c-accent)' : '1px solid transparent',
  transition: 'all 0.12s',
})
```

- [ ] **Step 5: Verify**

Run `npm run dev`. Open the Party Manager module. Confirm: all card buttons, tab bar, New Character/Party, Load All — all 44px tall.

- [ ] **Step 6: Commit**

```bash
git add src/components/modules/PartyManager.jsx
git commit -m "feat: increase party manager touch targets to 44px for tablet"
```

---

### Task 6: Dice Roller touch targets

**Files:**
- Modify: `src/components/modules/DiceRoller.jsx`

- [ ] **Step 1: Update die buttons**

Find the dice grid (around line 36). Change `minHeight: 42` → `minHeight: 44`:
```jsx
style={{
  background: 'var(--c-elevated)', border: '1px solid var(--c-border)',
  borderRadius: 8, fontWeight: 700, fontSize: '0.72rem',
  color: 'var(--c-text)', minHeight: 44, minWidth: 'unset',
  transition: 'background 0.1s, border-color 0.1s',
}}
```

- [ ] **Step 2: Update advantage toggle buttons**

Find the advantage grid (around line 57). Change `minHeight: 32` → `minHeight: 44`:
```jsx
style={{
  minHeight: 44, minWidth: 'unset', fontSize: '0.75rem', fontWeight: 600, borderRadius: 7,
  border: `1px solid ${advantage === mode ? color : 'var(--c-border)'}`,
  background: advantage === mode ? `${color}18` : 'transparent',
  color: advantage === mode ? color : 'var(--c-muted)',
  transition: 'all 0.1s',
}}
```

- [ ] **Step 3: Update custom expression input and Roll button**

Find the custom expression row (around line 73). Change `minHeight: 40` → `minHeight: 44` on both:
```jsx
<input
  type="text"
  placeholder="e.g. 2d6+3+4d8+7"
  value={expr}
  onChange={e => setExpr(e.target.value)}
  onKeyDown={e => e.key === 'Enter' && rollExpr()}
  style={{ flex: 1, minHeight: 44 }}
/>
<button onClick={rollExpr} className="btn-primary" style={{ minHeight: 44, minWidth: 'unset', padding: '0 16px' }}>Roll</button>
```

- [ ] **Step 4: Verify**

Run `npm run dev`. Open the Dice Roller. Confirm: all die buttons, advantage toggles, custom input, Roll button — all 44px tall and easy to tap.

- [ ] **Step 5: Run full test suite**

```bash
npm run test
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/modules/DiceRoller.jsx
git commit -m "feat: increase dice roller touch targets to 44px for tablet"
```
