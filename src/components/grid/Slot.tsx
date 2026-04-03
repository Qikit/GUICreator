import { useRef, useCallback } from 'react'
import type { SlotData } from '@/types'
import { ItemTexture } from '@/components/shared'
import s from '@/styles/grid.module.css'

interface Props {
  row: number
  col: number
  data: SlotData | undefined
  selected: boolean
  multiSel: boolean
  showNums: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onMouseEnter: (e: React.MouseEvent) => void
  onMouseLeave: () => void
  onDragEnd?: (key: string) => void
}

const isTouchDevice = () => 'ontouchstart' in window

export function Slot({
  row, col, data, selected, multiSel, showNums,
  onMouseDown, onContextMenu, onDrop, onMouseEnter, onMouseLeave, onDragEnd,
}: Props) {
  const cls = [s.slot]
  if (selected) cls.push(s.slotSelected)
  if (multiSel) cls.push(s.slotMulti)

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchMoved = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchMoved.current = false
    longPressTimer.current = setTimeout(() => {
      if (!touchMoved.current) {
        const touch = e.touches[0]
        const synth = new MouseEvent('contextmenu', { clientX: touch.clientX, clientY: touch.clientY, bubbles: true })
        onContextMenu(synth as unknown as React.MouseEvent)
      }
    }, 500)
  }, [onContextMenu])

  const handleTouchMove = useCallback(() => {
    touchMoved.current = true
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
  }, [])

  return (
    <div
      className={cls.join(' ')}
      onMouseDown={e => { if (e.button === 1) e.preventDefault(); onMouseDown(e) }}
      onAuxClick={e => { if (e.button === 1) e.preventDefault() }}
      onContextMenu={onContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      draggable={!!data && !isTouchDevice()}
      onDragStart={e => {
        if (data) {
          e.dataTransfer.setData('text/plain', `${row}-${col}`)
          e.dataTransfer.effectAllowed = 'move'
        }
      }}
      onDragEnd={e => {
        if (e.dataTransfer.dropEffect === 'none' && onDragEnd) onDragEnd(`${row}-${col}`)
      }}
      onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add(s.slotDrop) }}
      onDragLeave={e => { e.currentTarget.classList.remove(s.slotDrop) }}
      onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove(s.slotDrop); onDrop?.(e) }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={s.slotHover} />
      {showNums && <span className={s.slotNum}>{row * 9 + col}</span>}
      {data && (
        <div className={s.slotContent}>
          <ItemTexture
            itemId={data.itemId}
            potionColor={data.potionColor}
            skullTexture={data.skullTexture}
            armorTrim={data.armorTrim}
          />
        </div>
      )}
      {data?.enchanted && <div className={s.slotEnchant} />}
      {data && data.amount > 1 && <span className={s.slotAmount}>{data.amount}</span>}
    </div>
  )
}
