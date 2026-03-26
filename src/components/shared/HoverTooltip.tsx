import { createPortal } from 'react-dom'
import type { SlotData } from '@/types'
import { Preview } from './Preview'
import s from '@/styles/shared.module.css'

interface Props {
  data: SlotData
  x: number
  y: number
}

export function HoverTooltip({ data, x, y }: Props) {
  return createPortal(
    <div className={s.hoverTT} style={{ left: x + 14, top: y - 8 }}>
      <Preview name={data.displayName} lore={data.lore} itemId={data.itemId} />
    </div>,
    document.body,
  )
}
