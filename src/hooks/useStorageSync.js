import { useEffect, useRef } from 'react'
import { useEncounterStore } from '../store/encounterStore'
import { useCharacterStore } from '../store/characterStore'
import { applyTheme, applyAccent, useThemeStore } from '../store/themeStore'

const TAB_ID = Math.random().toString(36).slice(2)

export function useStorageSync() {
  const suppressRef = useRef(false)

  useEffect(() => {
    const channel = new BroadcastChannel('dnd-tracker-sync')

    const broadcast = (key, value) => {
      if (!suppressRef.current) channel.postMessage({ tabId: TAB_ID, key, value })
    }

    channel.onmessage = (e) => {
      const { tabId, key, value } = e.data
      if (tabId === TAB_ID) return
      suppressRef.current = true
      try {
        if (key === 'dnd-tracker-encounter') useEncounterStore.persist.rehydrate()
        else if (key === 'dnd-tracker-characters') useCharacterStore.persist.rehydrate()
        else if (key === 'dnd-tracker-theme') { applyTheme(value); useThemeStore.setState({ theme: value }) }
        else if (key === 'dnd-tracker-accent') { applyAccent(value); useThemeStore.setState({ accent: value }) }
      } finally {
        suppressRef.current = false
      }
    }

    const unsubEncounter = useEncounterStore.subscribe(() => broadcast('dnd-tracker-encounter'))
    const unsubCharacters = useCharacterStore.subscribe(() => broadcast('dnd-tracker-characters'))
    const unsubTheme = useThemeStore.subscribe((state, prev) => {
      if (state.theme !== prev.theme) broadcast('dnd-tracker-theme', state.theme)
      if (state.accent !== prev.accent) broadcast('dnd-tracker-accent', state.accent)
    })

    return () => {
      channel.close()
      unsubEncounter()
      unsubCharacters()
      unsubTheme()
    }
  }, [])
}
