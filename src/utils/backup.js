import { useEncounterStore } from '../store/encounterStore'
import { useCharacterStore } from '../store/characterStore'
import { useLayoutStore } from '../store/layoutStore'

export const BACKUP_FORMAT = 'dnd-battle-tracker-backup'
const STORE_KEYS = {
  'dnd-tracker-encounter': useEncounterStore,
  'dnd-tracker-characters': useCharacterStore,
  'dnd-tracker-layout': useLayoutStore,
}

// Everything the app persists, as one JSON-serialisable object.
export function createBackup() {
  const data = {}
  for (const key of Object.keys(STORE_KEYS)) {
    const raw = localStorage.getItem(key)
    if (raw) data[key] = JSON.parse(raw)
  }
  return { format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(), data }
}

// Throws with a user-readable message if `backup` isn't one of ours.
export function restoreBackup(backup) {
  if (!backup || backup.format !== BACKUP_FORMAT || typeof backup.data !== 'object') {
    throw new Error('This file is not a Battle Tracker backup.')
  }
  for (const [key, store] of Object.entries(STORE_KEYS)) {
    const value = backup.data[key]
    if (!value) continue
    localStorage.setItem(key, JSON.stringify(value))
    store.persist.rehydrate()
  }
}

export function downloadBackup() {
  const blob = new Blob([JSON.stringify(createBackup(), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `battle-tracker-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importBackupFile(file) {
  let parsed
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  restoreBackup(parsed)
}
