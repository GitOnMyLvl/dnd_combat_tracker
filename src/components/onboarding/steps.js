// Step descriptors for the onboarding walkthrough.
// kind: 'modal' (centered welcome/closing) or 'spotlight' (highlight a target element).
// target: CSS selector for spotlight steps.

export const STEPS = [
  {
    id: 'welcome',
    kind: 'modal',
    title: 'Welcome to Battle Tracker',
    body: "Let's run a 30-second mock fight so you can see how everything fits together. We'll spin up a small encounter — your party vs. two goblins — and walk through the essentials.",
  },
  {
    id: 'initiative',
    kind: 'spotlight',
    target: '[data-onboarding="module-InitiativeTracker"]',
    title: 'Turn order lives here',
    body: "Initiative is already rolled. Tap the ▶ button to advance turns; the active combatant glows and gets a ▶ marker. Use DMG/HEAL on each row to update HP — bars shift green → orange → red as things go south.",
    placement: 'right',
  },
  {
    id: 'combatants',
    kind: 'spotlight',
    target: '[data-onboarding="module-CombatantTable-ally"]',
    title: 'Track HP, AC, conditions',
    body: "Allies sit on top, enemies underneath. Click a row to expand it for ability scores and notes, or to select that combatant so the Conditions module targets them. Edit any value inline.",
    placement: 'bottom',
  },
  {
    id: 'party',
    kind: 'spotlight',
    target: '[data-onboarding="module-PartyManager"]',
    title: 'Save your party once',
    body: "Build out your real characters here — stats, AC, the works — and load the whole group into any future encounter with one click. No re-typing names every session.",
    placement: 'left',
  },
  {
    id: 'add-module',
    kind: 'spotlight',
    target: '[data-onboarding="fab-add-module"]',
    title: 'More tools when you need them',
    body: "Tap this to add Dice Roller, Notes, AoE Damage, or anything else. Drag panels by their headers to rearrange, or grab a corner to resize.",
    placement: 'top',
  },
  {
    id: 'finish',
    kind: 'modal',
    title: "You're set",
    body: "That's the core loop. Want to keep this demo encounter to play with, or wipe it and start clean? You can replay this tour anytime from the ? button in the top bar.",
  },
]
