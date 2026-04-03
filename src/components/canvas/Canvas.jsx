import { useCallback } from 'react'
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

const ResponsiveGridLayout = WidthProvider(Responsive)

const MODULE_COMPONENTS = {
  InitiativeTracker,
  CombatantTable,
  ConditionsPanel,
  DiceRoller,
  NotesPad,
  PartyManager,
}

export default function Canvas() {
  const { modules, setLayout } = useLayoutStore()
  const { showModulePicker, openModulePicker, closeModulePicker } = useUIStore()

  const layouts = {
    lg: modules.map(m => ({
      i: m.i,
      x: m.x, y: m.y, w: m.w, h: m.minimized ? 1 : m.h,
      minW: 2, minH: m.minimized ? 1 : 3,
      isDraggable: true,
      isResizable: !m.minimized,
    })),
  }

  const onLayoutChange = useCallback((layout) => {
    const updated = modules.map(m => {
      const l = layout.find(li => li.i === m.i)
      if (!l) return m
      return { ...m, x: l.x, y: l.y, w: l.w, h: m.minimized ? m.h : l.h }
    })
    setLayout(updated)
  }, [modules, setLayout])

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100%', background: 'var(--c-bg)' }}>
      {/* Empty state */}
      {modules.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, pointerEvents: 'none',
        }}>
          <div style={{ fontSize: '1.2rem', opacity: 0.15, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--c-muted)' }}>BATTLE TRACKER</div>
          <p style={{ color: 'var(--c-muted)', fontSize: '0.9rem', margin: 0 }}>
            Canvas is empty — tap <strong style={{ color: 'var(--c-muted2)' }}>+ Add Module</strong> to get started
          </p>
        </div>
      )}

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 768, md: 480, sm: 0 }}
        cols={{ lg: 12, md: 8, sm: 4 }}
        rowHeight={72}
        margin={[8, 8]}
        containerPadding={[8, 8]}
        draggableHandle=".drag-handle"
        onLayoutChange={onLayoutChange}
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
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 40,
          width: 48, height: 48, minHeight: 'unset', minWidth: 'unset',
          borderRadius: '50%', background: 'var(--c-accent)', border: 'none',
          color: '#fff', fontSize: '1.5rem', fontWeight: 300,
          boxShadow: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'opacity 0.12s, transform 0.12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'scale(1.08)' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
      >+</button>

      {showModulePicker && <ModulePicker onClose={closeModulePicker} />}
    </div>
  )
}
