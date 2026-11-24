import { useUIStore } from '../store/uiStore'
import { useEncounterStore } from '../store/encounterStore'

// First-visit hint strip. Dismissed once, never shown again.
export default function QuickGuide() {
  const dismissGuide = useUIStore(s => s.dismissGuide)
  const hasCombatants = useEncounterStore(s => s.encounter.combatants.length > 0)
  const loadDemoEncounter = useEncounterStore(s => s.loadDemoEncounter)

  return (
    <div className="quick-guide" role="note">
      <ol>
        <li><strong>Add</strong> heroes &amp; monsters with <em>+ Add</em> or <em>+ Monster</em></li>
        <li><strong>Type</strong> each initiative roll, then <em>Sort</em></li>
        <li><strong>Press Next</strong> to run turns; tap a row for HP &amp; conditions</li>
      </ol>
      <div className="quick-guide-actions">
        {!hasCombatants && (
          <button className="btn-ghost" onClick={loadDemoEncounter}>Load demo fight</button>
        )}
        <button className="btn-primary" onClick={dismissGuide}>Got it</button>
      </div>
    </div>
  )
}
