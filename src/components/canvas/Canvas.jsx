import { useCallback, useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import { useLayoutStore } from '../../store/layoutStore'
import { useUIStore } from '../../store/uiStore'
import ModuleWrapper from './ModuleWrapper'
import ModulePicker from './ModulePicker'

import InitiativeTracker from '../modules/InitiativeTracker'
import CombatantTable from '../modules/CombatantTable'
import ConditionsPanel from '../modules/ConditionsPanel'
import DiceRoller from '../modules/DiceRoller'
import NotesPad from '../modules/NotesPad'
import PartyManager from '../modules/PartyManager'
import AoeDamage from '../modules/AoeDamage'

const ResponsiveGridLayout = WidthProvider(Responsive)

export const MODULE_COMPONENTS = {
  InitiativeTracker,
  CombatantTable,
  ConditionsPanel,
  DiceRoller,
  NotesPad,
  PartyManager,
  AoeDamage,
}

// Per-module minimum widths so info-heavy panels stay readable.
// lg = 12 cols (desktop), md = 8 cols (tablet). On sm (mobile) every module is forced full-width.
const MIN_W = {
  InitiativeTracker: { lg: 3, md: 4 },
  CombatantTable:    { lg: 4, md: 6 },
  ConditionsPanel:   { lg: 3, md: 4 },
  DiceRoller:        { lg: 2, md: 3 },
  NotesPad:          { lg: 2, md: 3 },
  PartyManager:      { lg: 3, md: 4 },
  AoeDamage:         { lg: 2, md: 3 },
}
const DEFAULT_MIN_W = { lg: 2, md: 3 }

export default function Canvas() {
  const { modules, setLayout } = useLayoutStore()
  const { showModulePicker, openModulePicker, closeModulePicker } = useUIStore()

  const buildLayout = (bp, cols) => modules.map((m, idx) => {
    const minW = (MIN_W[m.type] ?? DEFAULT_MIN_W)[bp] ?? DEFAULT_MIN_W[bp]
    const isMobile = bp === 'sm'
    return {
      i: m.i,
      x: isMobile ? 0 : m.x,
      y: isMobile ? idx : m.y,
      w: isMobile ? cols : Math.max(m.w, minW),
      h: m.minimized ? 1 : m.h,
      minW: isMobile ? cols : minW,
      minH: m.minimized ? 1 : 3,
      isDraggable: !isMobile,
      isResizable: !m.minimized && !isMobile,
    }
  })

  const layouts = {
    lg: buildLayout('lg', 12),
    md: buildLayout('md', 8),
    sm: buildLayout('sm', 4),
  }

  const [breakpoint, setBreakpoint] = useState('lg')

  const onLayoutChange = useCallback((layout) => {
    // Don't persist mobile layout — its positions are forced full-width per row.
    if (breakpoint === 'sm') return
    const updated = modules.map(m => {
      const l = layout.find(li => li.i === m.i)
      if (!l) return m
      return { ...m, x: l.x, y: l.y, w: l.w, h: m.minimized ? m.h : l.h }
    })
    setLayout(updated)
  }, [modules, setLayout, breakpoint])

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100%', background: 'var(--c-bg)' }}>
      {/* Empty state */}
      {modules.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20, pointerEvents: 'none',
          padding: 24, textAlign: 'center',
        }}>
          <span style={{ color: 'var(--c-accent)', display: 'flex', opacity: 0.6 }}>
            <svg width="88" height="88" viewBox="0 0 512 512">
              <polygon points="256,97.3 421.8,217.2 256,280.7" fill="currentColor" fillOpacity="0.95" />
              <polygon points="256,97.3 256,280.7 90.2,217.2" fill="currentColor" fillOpacity="0.75" />
              <polygon points="421.8,217.2 358.3,432.3 256,280.7" fill="currentColor" fillOpacity="0.55" />
              <polygon points="90.2,217.2 256,280.7 153.7,432.3" fill="currentColor" fillOpacity="0.45" />
              <polygon points="256,280.7 358.3,432.3 153.7,432.3" fill="currentColor" fillOpacity="0.3" />
              <polygon points="256,97.3 421.8,217.2 358.3,432.3 153.7,432.3 90.2,217.2" fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="display" style={{
            fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.22em',
            color: 'var(--c-muted2)', opacity: 0.45,
          }}>
            BATTLE TRACKER
          </div>
          <div className="ornament">Ready your party</div>
          <p style={{ color: 'var(--c-muted)', fontSize: '0.9rem', margin: 0, maxWidth: 340, lineHeight: 1.6 }}>
            Canvas is empty — tap <strong style={{ color: 'var(--c-accent)' }}>+ Module</strong> to summon your first panel.
          </p>
        </div>
      )}

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 768, md: 480, sm: 0 }}
        cols={{ lg: 12, md: 8, sm: 4 }}
        rowHeight={72}
        margin={[12, 12]}
        containerPadding={[12, 12]}
        draggableHandle=".drag-handle"
        onLayoutChange={onLayoutChange}
        onBreakpointChange={setBreakpoint}
        useCSSTransforms
        compactType="vertical"
        preventCollision={false}
      >
        {modules.map(m => {
          const Component = MODULE_COMPONENTS[m.type]
          if (!Component) return null
          return (
            <div key={m.i} style={{ height: '100%' }}>
              <ModuleWrapper
                id={m.i}
                type={m.type}
                config={m.config ?? {}}
                minimized={m.minimized}
              >
                <Component config={m.config ?? {}} />
              </ModuleWrapper>
            </div>
          )
        })}
      </ResponsiveGridLayout>

      {/* FAB */}
      <button
        onClick={openModulePicker}
        title="Add module"
        aria-label="Add module"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 40,
          width: 52, height: 52, minHeight: 'unset', minWidth: 'unset',
          borderRadius: '50%', background: 'var(--c-accent)', border: 'none',
          color: '#fff', fontSize: '1.7rem', fontWeight: 300,
          boxShadow: '0 6px 20px var(--c-accent-dim), 0 2px 6px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'filter 0.12s, transform 0.12s, box-shadow 0.12s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.filter = 'brightness(1.1)'
          e.currentTarget.style.transform = 'scale(1.08)'
          e.currentTarget.style.boxShadow = '0 10px 28px var(--c-accent-dim), 0 4px 10px rgba(0,0,0,0.35)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.filter = 'none'
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 6px 20px var(--c-accent-dim), 0 2px 6px rgba(0,0,0,0.3)'
        }}
      >+</button>

      {showModulePicker && <ModulePicker onClose={closeModulePicker} />}
    </div>
  )
}
