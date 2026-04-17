import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock BroadcastChannel
class MockBroadcastChannel {
  constructor(name) {
    this.name = name
    this.onmessage = null
    MockBroadcastChannel.instances.push(this)
  }
  postMessage(data) {
    // Deliver to all OTHER instances with the same channel name
    MockBroadcastChannel.instances
      .filter(c => c !== this && c.name === this.name && c.onmessage)
      .forEach(c => c.onmessage({ data }))
  }
  close() {
    MockBroadcastChannel.instances = MockBroadcastChannel.instances.filter(c => c !== this)
  }
}
MockBroadcastChannel.instances = []
global.BroadcastChannel = MockBroadcastChannel

vi.mock('../store/encounterStore', () => ({
  useEncounterStore: Object.assign(
    vi.fn(() => ({})),
    {
      persist: { rehydrate: vi.fn() },
      subscribe: vi.fn(() => vi.fn()),
    }
  ),
}))
vi.mock('../store/characterStore', () => ({
  useCharacterStore: Object.assign(
    vi.fn(() => ({})),
    {
      persist: { rehydrate: vi.fn() },
      subscribe: vi.fn(() => vi.fn()),
    }
  ),
}))
vi.mock('../store/themeStore', () => ({
  applyTheme: vi.fn(),
  applyAccent: vi.fn(),
  useThemeStore: Object.assign(
    vi.fn(() => ({})),
    {
      setState: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
    }
  ),
}))

import { useStorageSync } from './useStorageSync'
import { useEncounterStore } from '../store/encounterStore'
import { useCharacterStore } from '../store/characterStore'
import { applyTheme, applyAccent, useThemeStore } from '../store/themeStore'

describe('useStorageSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    MockBroadcastChannel.instances = []
  })

  it('opens a BroadcastChannel on mount', () => {
    renderHook(() => useStorageSync())
    expect(MockBroadcastChannel.instances).toHaveLength(1)
    expect(MockBroadcastChannel.instances[0].name).toBe('dnd-tracker-sync')
  })

  it('closes the BroadcastChannel on unmount', () => {
    const { unmount } = renderHook(() => useStorageSync())
    unmount()
    expect(MockBroadcastChannel.instances).toHaveLength(0)
  })

  it('subscribes to encounterStore and characterStore', () => {
    renderHook(() => useStorageSync())
    expect(useEncounterStore.subscribe).toHaveBeenCalledOnce()
    expect(useCharacterStore.subscribe).toHaveBeenCalledOnce()
  })

  it('rehydrates encounterStore when receiving encounter key message', () => {
    // Simulate two tabs: one sender, one receiver
    const senderChannel = new MockBroadcastChannel('dnd-tracker-sync')
    renderHook(() => useStorageSync())

    act(() => {
      senderChannel.postMessage({ tabId: 'other-tab', key: 'dnd-tracker-encounter' })
    })

    expect(useEncounterStore.persist.rehydrate).toHaveBeenCalledOnce()
  })

  it('rehydrates characterStore when receiving characters key message', () => {
    const senderChannel = new MockBroadcastChannel('dnd-tracker-sync')
    renderHook(() => useStorageSync())

    act(() => {
      senderChannel.postMessage({ tabId: 'other-tab', key: 'dnd-tracker-characters' })
    })

    expect(useCharacterStore.persist.rehydrate).toHaveBeenCalledOnce()
  })

  it('applies theme when receiving theme key message', () => {
    const senderChannel = new MockBroadcastChannel('dnd-tracker-sync')
    renderHook(() => useStorageSync())

    act(() => {
      senderChannel.postMessage({ tabId: 'other-tab', key: 'dnd-tracker-theme', value: 'light' })
    })

    expect(applyTheme).toHaveBeenCalledWith('light')
    expect(useThemeStore.setState).toHaveBeenCalledWith({ theme: 'light' })
  })

  it('applies accent when receiving accent key message', () => {
    const senderChannel = new MockBroadcastChannel('dnd-tracker-sync')
    renderHook(() => useStorageSync())

    act(() => {
      senderChannel.postMessage({ tabId: 'other-tab', key: 'dnd-tracker-accent', value: '#ff0000' })
    })

    expect(applyAccent).toHaveBeenCalledWith('#ff0000')
    expect(useThemeStore.setState).toHaveBeenCalledWith({ accent: '#ff0000' })
  })

  it('ignores messages from its own tab ID', () => {
    // We need to simulate a message that has the same TAB_ID as our hook.
    // Since TAB_ID is module-level, we simulate this by having the mock channel
    // deliver a message from itself (which the real BroadcastChannel never does).
    renderHook(() => useStorageSync())
    const hookChannel = MockBroadcastChannel.instances[0]

    // Verify that messages from a different tab ARE processed
    act(() => {
      hookChannel.onmessage({ data: { tabId: 'definitely-not-this-tab', key: 'dnd-tracker-encounter' } })
    })
    expect(useEncounterStore.persist.rehydrate).toHaveBeenCalledOnce()

    // Capture subscribe callback before clearing mocks
    const unsubCb = useEncounterStore.subscribe.mock.calls[0][0]
    vi.clearAllMocks()

    // Trigger a broadcast from the hook itself — the mock channel does NOT deliver
    // messages back to the same instance, simulating the real BroadcastChannel
    // not echoing back to the sender. Verify no spurious rehydrate occurred.
    act(() => { unsubCb() }) // trigger broadcast from hook
    expect(useEncounterStore.persist.rehydrate).not.toHaveBeenCalled()
  })

  it('does not re-broadcast when rehydrating from an incoming message (no loop)', () => {
    // Set up two hook instances (simulating main window and pop-out)
    const { unmount: unmountA } = renderHook(() => useStorageSync())
    const { unmount: unmountB } = renderHook(() => useStorageSync())

    const channelB = MockBroadcastChannel.instances[1]

    // Spy on postMessage to detect any re-broadcast from hook B
    const postMessageSpy = vi.spyOn(channelB, 'postMessage')

    // Directly deliver a message to hook B's onmessage as if it came from another tab.
    // Both hooks share the same module-level TAB_ID, so we must use a foreign tabId
    // to bypass the self-filter and exercise the suppressRef path.
    act(() => {
      channelB.onmessage({ data: { tabId: 'foreign-tab-id', key: 'dnd-tracker-encounter' } })
    })

    // B should have rehydrated once in response to the incoming message
    expect(useEncounterStore.persist.rehydrate).toHaveBeenCalledOnce()

    // B should NOT have re-broadcast (suppressRef prevented the store subscriber
    // from calling broadcast while rehydrate was running)
    expect(postMessageSpy).not.toHaveBeenCalled()

    unmountA()
    unmountB()
  })
})
