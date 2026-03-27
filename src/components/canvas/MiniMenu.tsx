import { useRef } from 'react'
import type { Project } from '@/types'
import { ItemTexture } from '@/components/shared'
import s from '@/styles/canvas.module.css'

interface ConnectingFrom { menuId: string; slot: string }

interface Props {
  project: Project
  x: number; y: number
  onDrag: (nx: number, ny: number) => void
  onSlotClick: (menuId: string, slot: string) => void
  onSlotRightClick?: (menuId: string, slot: string, x: number, y: number) => void
  connectingFrom: ConnectingFrom | null
  onCtxMenu?: (cx: number, cy: number) => void
  isActive?: boolean
  selectedSlot?: string | null
}

export function MiniMenu({ project, x, y, onDrag, onSlotClick, onSlotRightClick, connectingFrom, onCtxMenu, isActive, selectedSlot }: Props) {
  const startDrag = (e: React.MouseEvent) => {
    if (e.button !== 0) return; e.stopPropagation()
    const sx = e.clientX - x, sy = e.clientY - y
    const mv = (ev: MouseEvent) => onDrag(ev.clientX - sx, ev.clientY - sy)
    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up)
  }

  return (
    <div className={`${s.miniMenu} ${isActive ? s.mmActive : ''}`} style={{ left: x, top: y }}>
      <div className={s.mmHeader} onMouseDown={startDrag} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onCtxMenu?.(e.clientX, e.clientY) }}>
        <span>{project.name}</span>
        <span style={{ fontSize: 9, color: 'var(--tx3)' }}>{project.rows}x9</span>
      </div>
      <div className={s.mmGrid}>
        {Array.from({ length: project.rows }, (_, r) =>
          Array.from({ length: 9 }, (_, c) => {
            const k = `${r}-${c}`; const d = project.slots[k]
            const isSrc = connectingFrom && connectingFrom.menuId === project.id && connectingFrom.slot === k
            const isSel = selectedSlot === k
            return (
              <div key={k} className={`${s.mmSlot} ${isSrc ? s.mmSlotConn : ''} ${isSel ? s.mmSlotSel : ''}`}
                onClick={e => { e.stopPropagation(); onSlotClick(project.id, k) }}
                onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onSlotRightClick?.(project.id, k, e.clientX, e.clientY) }}>
                {d && <ItemTexture itemId={d.itemId} size={16} potionColor={d.potionColor} skullTexture={d.skullTexture} rpTexture={d.rpTexture} />}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
