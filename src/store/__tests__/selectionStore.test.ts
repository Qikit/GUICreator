import { describe, it, expect, beforeEach } from 'vitest'
import { useSelectionStore } from '@/store/selectionStore'

const reset = () => useSelectionStore.getState().clearSlotSelection()

describe('selectionStore drag rect', () => {
  beforeEach(reset)

  it('dragOverSlot заливает инклюзивный прямоугольник от якоря', () => {
    useSelectionStore.getState().startDragSel('m1', '2-2')
    useSelectionStore.getState().dragOverSlot('0-0')
    const sel = useSelectionStore.getState().multiSel
    for (let r = 0; r <= 2; r++) for (let c = 0; c <= 2; c++) expect(sel.has(`${r}-${c}`)).toBe(true)
    expect(sel.size).toBe(9)
  })

  it('обратное движение сжимает рамку (reverse shrink)', () => {
    useSelectionStore.getState().startDragSel('m1', '0-0')
    useSelectionStore.getState().dragOverSlot('0-3') // 4 ячейки
    useSelectionStore.getState().dragOverSlot('0-1') // назад → 2 ячейки
    const sel = useSelectionStore.getState().multiSel
    expect(sel.has('0-0')).toBe(true)
    expect(sel.has('0-1')).toBe(true)
    expect(sel.has('0-2')).toBe(false)
    expect(sel.size).toBe(2)
  })

  it('dragBase сохраняет прежнее выделение (аддитивность)', () => {
    useSelectionStore.getState().addToMulti('5-5')
    useSelectionStore.getState().startDragSel('m1', '0-0')
    useSelectionStore.getState().dragOverSlot('0-0')
    const sel = useSelectionStore.getState().multiSel
    expect(sel.has('5-5')).toBe(true)
    expect(sel.has('0-0')).toBe(true)
  })
})
