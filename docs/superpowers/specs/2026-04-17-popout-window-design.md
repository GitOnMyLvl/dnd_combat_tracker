# Feature 2: Pop-out Window — Design Spec

**Date:** 2026-04-17  
**Status:** Approved

---

## Goal

Any module can be popped out into a separate browser window. The pop-out shows only the module content (no grid, no TopBar) plus a small close button. The pop-out stays live-synced with the main window via localStorage storage events.

---

## Architecture

### URL scheme

```
?popout=<type>&config=<encodeURIComponent(JSON.stringify(config))>
```

- `type` — module type string (e.g. `InitiativeTracker`, `CombatantTable`)
- `config` — the module's config object (e.g. `{ tableType: 'enemy' }`)
- Validate `type` against `MODULE_COMPONENTS` keys before rendering. Unknown type → render a friendly error + close button.
- Wrap `JSON.parse(config)` in try/catch; fall back to `{}` on malformed input (keeps the popout usable if a user edits the URL).

### Components

**`src/App.jsx`**
At the top, reads `URLSearchParams`. If `?popout` is present, renders `<PopoutApp>` and returns early — no TopBar, no Canvas.

**`src/components/PopoutApp.jsx`** (new)
- Registers a `storage` event listener on mount to trigger store rehydration when the main window writes to localStorage.
- Resolves `type` → component via the exported `MODULE_COMPONENTS` map.
- Renders: full-height container with the module component + a fixed close button (`window.close()`).
- Close button: top-right, small, matches existing `btnStyle` from ModuleWrapper. `aria-label="Close pop-out"`.
- Listens for `Escape` key to close (optional, nice-to-have).
- Sets `document.title` to the module title (e.g. "Initiative — D&D Battle Tracker") so the OS taskbar is readable.

**`src/components/canvas/Canvas.jsx`**
- Exports `MODULE_COMPONENTS` (currently a local const — just add `export`). Move it to `src/components/canvas/moduleRegistry.js` if the popout import would create a circular dep through `Canvas → ModuleWrapper → (popout button) → ...`.

**`src/components/canvas/ModuleWrapper.jsx`**
- Adds a ⧉ button to the header controls row (between minimize and remove buttons). `title="Open in new window"`, `aria-label` likewise.
- On click: encodes config, builds URL, calls `window.open(url, '_blank', 'popup=yes,width=W,height=H')`.
  - Use `popup=yes` — modern browsers gate "popup window" behavior on that feature, not on the legacy `menubar=no` flags.
  - Default size: use the module's current grid `w × rowHeight(h)` converted to pixels, clamped to a sane range (min 320×480, max 800×900). Falls back to 420×680 if not derivable.

---

## State Sync

- Zustand `persist` middleware already writes all state changes to localStorage under keys `dnd-tracker-encounter`, `dnd-tracker-characters`, `dnd-tracker-layout`, and the theme store key.
- Pop-out listens for `storage` events; when `e.key` matches a known persist key, it calls `useStore.persist.rehydrate()` on the corresponding store.
  - **Why `rehydrate()` instead of `setState(parsed.state)`:** rehydrate handles `version`/`migrate`/`merge` correctly and stays consistent if persist options change later. Directly setting state bypasses all of that.
- `storage` events fire only in *other* same-origin windows — the writer never receives its own event, so there is no feedback loop risk.
- **Sync direction:** main → pop-out only. The pop-out's own writes (e.g. HP edits, death saves, dice history) will not propagate back to the main window. See "Known limitation" below.
- Theme: subscribe to the theme store's persist key too, so toggling theme in the main window re-themes the pop-out. Alternatively, apply the theme class to `document.documentElement` on mount from the rehydrated theme store — simpler.

### Known limitation — one-way sync

The spec originally called this out, but it has real UX consequences worth naming:

- Clicking ✓/✗ death save pips, editing HP, or applying a condition inside a popped-out `InitiativeTracker` or `CombatantTable` will **not** update the main window. Users will likely expect it to.
- For v1 this is acceptable if we **document it in the info overlay** of the popped-out module (small banner: "Edits here won't sync back — edit in the main window").
- For v2, switch to `BroadcastChannel('dnd-tracker-sync')` which is bidirectional, same-origin, and avoids the `storage` event's write-then-read-then-dispatch overhead. Subscribe both windows; on any persisted store change, post a message; receivers call `rehydrate()`. The popout's own writes won't loop because zustand-persist writes to localStorage synchronously and the BC post can be keyed by a per-tab id.

---

## UI

- Pop-out background/text uses CSS variables (`--c-bg`, `--c-text`) — same as main app.
- Close button: `position: fixed`, top-right corner, `window.close()` on click. Styled as a ghost icon button matching the existing header `btnStyle`.
- No title bar, no drag handle, no minimize.
- The popped-out module's content area should use the same `padding: '10px 12px 12px'` as ModuleWrapper so visual density matches.
- Account for the fixed close button: give the content container a small top-right padding (or position the close button *outside* the scroll container) so it never overlaps the module's own controls.

---

## Out of Scope

- Syncing pop-out changes back to the main window (one-way only — see "Known limitation" above).
- Multiple simultaneous pop-outs of the same module (works naturally via shared localStorage + storage events — no special handling needed).
- PWA/standalone behavior. In an installed PWA, `window.open` typically opens in the user's default browser, not a detached PWA window. Acceptable for v1 but flag in release notes.
- Module IDs: the URL carries `type + config` only, not the module instance `id`. Two instances of the same type with the same config are indistinguishable, which is fine because they'd render identically.

---

## Risks & Open Questions

1. **Popup blockers**: `window.open` must be called synchronously from the click handler (it already is). Do not wrap it in a promise/timeout.
2. **URL length**: `config` is currently small (`{ tableType: 'enemy' }`). If configs ever grow (saved filters, layouts), move to passing only a reference key and letting the popout read full config from localStorage.
3. **Popout orphaned after main window closes**: popout keeps working with stale state — acceptable. Optionally, detect `window.opener === null || window.opener.closed` and show a subtle "disconnected" badge.
4. **Opener reference**: keep `window.opener` available (do not pass `noopener`) so a future bidirectional sync via `postMessage` is possible without reopening.
5. **Theme flash on load**: popout must apply the persisted theme *before* first paint to avoid a light/dark flash. Apply the theme class in `index.html` inline script or in the earliest possible React render.

---

## Verification

- Click ⧉ on any module → new window opens showing just that module + close button.
- Change state in main window (advance turn, apply damage) → pop-out updates within ~100ms.
- Toggle theme in main window → pop-out re-themes without reload.
- Click close button → pop-out closes, main window unaffected. Escape key does the same.
- Pop-out at 320px wide → module still usable.
- `CombatantTable` with `tableType: 'enemy'` → pop-out shows enemies table correctly.
- Malformed URL (`?popout=Bogus` or broken JSON `config`) → popout shows a friendly error, not a blank screen or console stack trace.
- Two simultaneous pop-outs of `InitiativeTracker` → both update on main-window state changes.
- Document that Playwright can't drive `window.open` popouts easily — verification is manual for v1, or use `page.context().waitForEvent('page')` in an e2e smoke test that only checks the popout renders (not sync behavior).
