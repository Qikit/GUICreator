import { ERASER_ID, itemName } from '@/utils/slot'
import s from '@/styles/toolbar.module.css'

interface Props {
  selSlot: string | null
  multiSel: Set<string>
  palItem: string | null
  rows: number
  slotCount: number
  saveStatus: string
}

export function StatusBar({ selSlot, multiSel, palItem, rows, slotCount, saveStatus }: Props) {
  return (
    <div className={s.statusBar}>
      <span>{selSlot ? `Slot ${selSlot} (#${parseInt(selSlot.split('-')[0]) * 9 + parseInt(selSlot.split('-')[1])})` : multiSel.size > 1 ? `${multiSel.size} selected` : ''}</span>
      <span>{palItem && palItem !== ERASER_ID ? `Размещение: ${itemName(palItem)}` : ''}</span>
      <span>{rows}x9 · {slotCount} предм. · {saveStatus}</span>
    </div>
  )
}
