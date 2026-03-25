# D&D 2024 Rules — Differences Relevant to the Battle Tracker

## 1. Exhaustion (Major Change)

**Old (2014):** 6 levels, each with specific named effects (disadvantage on checks, halved speed, etc.)
**New (2024):** 10 levels, simple stacking penalty system

| Level | Effect |
|-------|--------|
| 1–4   | −2 per level to all d20 Tests (attack rolls, ability checks, saving throws) |
| 5     | Speed halved |
| 6–9   | −2 continues stacking |
| 10    | Death |

**App impact:**
- Add Exhaustion as a trackable condition with a numeric level (1–10)
- Display the active d20 penalty (level × −2) and flag speed-halved at level 5
- Currently Exhaustion is just a toggle badge — needs a counter

---

## 2. Conditions — New & Changed

**Removed from 2014:** No conditions were removed, but some were clarified.

**Added in 2024:**
- **Dazed** (NEW): Can't take Bonus Actions; if you take the Dash action, you lose your free action that turn. Ends at the start of your next turn.

**Changed in 2024:**
- **Prone**: No change in mechanics, but crawling rules clarified (half speed still).
- **Frightened**: Same core rule, but now explicitly prevents moving *toward* the source even via teleportation.
- **Paralyzed**: Now explicitly auto-fails STR and DEX saves (was implied before).
- **Unconscious**: Same, but now also explicitly applies the Prone condition.
- **Exhaustion**: See section 1 above — full rework.

**App impact:**
- Add **Dazed** to the conditions list
- Exhaustion needs a counter, not just a badge (see above)
- No other conditions need removal

---

## 3. Initiative Tiebreaker

**Old (2014):** DM decides or re-roll.
**New (2024):** Ties broken by **higher Dexterity score** (not modifier). If still tied, simultaneous or DM decides.

**App impact:**
- `sortInitiative` tiebreak already uses initiative bonus (DEX mod), which is correct
- For full 2024 compliance: tiebreak should use raw DEX **score**, not modifier
- Low priority / cosmetic — in practice the mod difference is what matters

---

## 4. Bloodied State

**New in 2024:** A creature is **Bloodied** when at or below half its Hit Point maximum. Some monster abilities and spells now reference this threshold explicitly.

**App impact:**
- Not a formal condition, but worth showing visually on the HP display
- Could show a "Bloodied" indicator when `hp.current <= hp.max / 2`
- Currently the HP text turns red at 0 — could add an amber/orange state at ≤ 50%

---

## 5. Heroic Inspiration

**Old (2014):** Inspiration — binary, granted by DM, used for advantage on one roll.
**New (2024):** **Heroic Inspiration** — each player can hold one, used to reroll any d20 Test (keep the new result). Granted more frequently (class features, milestone rewards, etc.).

**App impact:**
- Could add a toggle per combatant (Inspiration: yes/no) — already common in trackers
- Currently not tracked at all

---

## 6. Death Saving Throws

**No change.** Roll d20, 10+ = success, 1 = two failures, 20 = regain 1 HP. Three successes = stable, three failures = dead.

**App impact:** None.

---

## 7. Concentration

**No change in rules.** Still a Constitution saving throw, DC = max(10, half damage taken).

**App impact:** Concentration is already tracked as a condition badge — no change needed.

---

## Summary: What to Actually Build

| Priority | Feature | Effort |
|----------|---------|--------|
| High | Exhaustion counter (1–10) with penalty display | Medium |
| High | Add "Dazed" to conditions list | Trivial |
| Medium | Bloodied visual indicator at ≤ 50% HP | Small |
| Low | Heroic Inspiration toggle per combatant | Small |
| Low | DEX score tiebreak (vs current DEX mod tiebreak) | Small |
