import { useState, useRef, useEffect } from 'react'

/**
 * Click to edit inline. Supports text and number types.
 * Props: value, onChange, type='text'|'number', className, min, max, placeholder
 */
export default function EditableField({ value, onChange, type = 'text', className = '', style, min, max, placeholder = '—' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? ''))
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) {
      setDraft(String(value ?? ''))
      setTimeout(() => inputRef.current?.select(), 0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  const commit = () => {
    setEditing(false)
    if (type === 'number') {
      if (draft === '') return
      const parsed = Number(draft)
      if (!isNaN(parsed)) onChange(parsed)
    } else {
      onChange(draft)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type === 'number' ? 'text' : type}
        inputMode={type === 'number' ? 'numeric' : undefined}
        value={draft}
        min={min}
        max={max}
        className={`w-full ${className}`}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setEditing(false)
        }}
        style={{ minHeight: 44, textAlign: 'inherit', ...style }}
      />
    )
  }

  const isCentered = className.includes('text-center') || style?.textAlign === 'center'
  return (
    <span
      role="button"
      tabIndex={0}
      className={`cursor-pointer select-none hover:underline decoration-dotted ${className}`}
      style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', ...(isCentered ? { justifyContent: 'center', width: '100%' } : {}), ...style }}
      onClick={() => setEditing(true)}
      onKeyDown={e => e.key === 'Enter' && setEditing(true)}
    >
      {value !== null && value !== undefined && value !== '' ? value : <span className="opacity-40">{placeholder}</span>}
    </span>
  )
}
