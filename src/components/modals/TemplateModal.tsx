import { useState, useEffect } from 'react'
import type { SlotData } from '@/types'
import { GlassModal, GlowButton, glassModalStyles } from '@/components/ui'
import { TemplatePreview } from './TemplatePreview'

interface Template {
  name: string
  desc?: string
  rows: number
  slots: Record<string, unknown>
}

interface Props {
  builtIn: Template[]
  userTemplates: Template[]
  onApply: (t: Template) => void
  onDeleteUser: (i: number) => void
  onClose: () => void
}

export function TemplateModal({ builtIn, userTemplates, onApply, onDeleteUser, onClose }: Props) {
  const [altHeld, setAltHeld] = useState(false)
  const [hovered, setHovered] = useState<Template | null>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'AltLeft') setAltHeld(true) }
    const up = (e: KeyboardEvent) => { if (e.code === 'AltLeft') setAltHeld(false) }
    const blur = () => setAltHeld(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur) }
  }, [])

  const hoverProps = (t: Template) => ({
    onMouseEnter: (e: React.MouseEvent) => { setHovered(t); setMouse({ x: e.clientX, y: e.clientY }) },
    onMouseMove: (e: React.MouseEvent) => setMouse({ x: e.clientX, y: e.clientY }),
    onMouseLeave: () => setHovered(prev => (prev === t ? null : prev)),
  })

  return (
    <GlassModal onClose={onClose} title="Шаблоны">
      <div style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 8 }}>Зажмите <b>левый Alt</b> и наведите на шаблон — предпросмотр.</div>
      <div style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase' }}>Встроенные</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
        {builtIn.map((t, i) => (
          <div key={i} style={{ background: 'var(--glass-surface)', border: '1px solid var(--glass-border)', borderRadius: 5, padding: 12, cursor: 'pointer', transition: 'border-color .15s' }}
            onClick={() => onApply(t)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ac)'; setHovered(t); setMouse({ x: e.clientX, y: e.clientY }) }}
            onMouseMove={e => setMouse({ x: e.clientX, y: e.clientY })}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; setHovered(prev => (prev === t ? null : prev)) }}>
            <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 12 }}>{t.name}</div>
            {t.desc && <div style={{ fontSize: 10, color: 'var(--tx2)', marginBottom: 4 }}>{t.desc}</div>}
            <div style={{ fontSize: 9, color: 'var(--tx3)' }}>{t.rows}x9</div>
          </div>
        ))}
      </div>
      {userTemplates.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 12, marginBottom: 5, fontWeight: 600, textTransform: 'uppercase' }}>Мои шаблоны</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
            {userTemplates.map((t, i) => (
              <div key={i} style={{ background: 'var(--glass-surface)', border: '1px solid var(--glass-border)', borderRadius: 5, padding: 12 }}
                {...hoverProps(t)}>
                <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 12 }}>{t.name}</div>
                <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                  <GlowButton variant="primary" style={{ padding: '2px 6px' }} onClick={() => onApply(t)}>Use</GlowButton>
                  <GlowButton variant="danger" style={{ padding: '2px 6px' }} onClick={e => { e.stopPropagation(); onDeleteUser(i) }}>Del</GlowButton>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className={glassModalStyles.actions}>
        <GlowButton onClick={onClose}>Отмена</GlowButton>
      </div>
      {altHeld && hovered && (
        <TemplatePreview name={hovered.name} rows={hovered.rows} slots={hovered.slots as Record<string, SlotData>} x={mouse.x} y={mouse.y} />
      )}
    </GlassModal>
  )
}
