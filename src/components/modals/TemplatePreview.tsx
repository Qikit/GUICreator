import type { SlotData } from '@/types'
import { ItemTexture } from '@/components/shared'

interface Props {
  name: string
  rows: number
  slots: Record<string, SlotData>
  x: number
  y: number
}

const SLOT = 22

export function TemplatePreview({ name, rows, slots, x, y }: Props) {
  const width = 9 * SLOT + 20
  const height = rows * SLOT + 52
  const left = Math.max(8, Math.min(x + 18, window.innerWidth - width - 8))
  const top = Math.max(8, Math.min(y + 18, window.innerHeight - height - 8))
  return (
    <div style={{
      position: 'fixed', left, top, zIndex: 1000, pointerEvents: 'none',
      background: 'var(--glass-panel)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)',
      border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 8,
      boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx1)', marginBottom: 6 }}>
        {name} <span style={{ color: 'var(--tx3)', fontWeight: 400 }}>{rows}x9</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(9, ${SLOT}px)`, gap: 1, background: '#373737', border: '2px solid #373737', borderRadius: 2 }}>
        {Array.from({ length: rows * 9 }, (_, i) => {
          const d = slots[`${Math.floor(i / 9)}-${i % 9}`]
          return (
            <div key={i} style={{ width: SLOT, height: SLOT, background: '#8b8b8b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {d && <ItemTexture itemId={d.itemId} potionColor={d.potionColor} skullTexture={d.skullTexture} armorTrim={d.armorTrim} size={SLOT - 4} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
