import { create } from 'zustand'

interface SelectionStore {
  selSlot: string | null
  multiSel: Set<string>
  selectedMenus: Set<string>
  isDragSel: boolean
  dragMenuId: string | null
  dragAnchor: string | null
  dragBase: Set<string>

  selectSlot: (key: string | null) => void
  toggleMulti: (key: string) => void
  setMultiSel: (keys: Set<string>) => void
  addToMulti: (key: string) => void
  selectAll: (keys: string[]) => void
  clearSlotSelection: () => void

  toggleMenu: (id: string) => void
  setSelectedMenus: (ids: Set<string>) => void
  clearMenuSelection: () => void

  startDragSel: (menuId: string, key: string) => void
  dragOverSlot: (key: string) => void
  endDragSel: () => void
}

export const useSelectionStore = create<SelectionStore>((set) => ({
  selSlot: null,
  multiSel: new Set(),
  selectedMenus: new Set(),
  isDragSel: false,
  dragMenuId: null,
  dragAnchor: null,
  dragBase: new Set(),

  selectSlot: (key) => set({ selSlot: key, multiSel: new Set() }),
  toggleMulti: (key) => set((s) => {
    const n = new Set(s.multiSel)
    if (n.has(key)) n.delete(key); else n.add(key)
    return { multiSel: n, selSlot: key }
  }),
  setMultiSel: (keys) => set({ multiSel: keys }),
  addToMulti: (key) => set((s) => {
    const n = new Set(s.multiSel); n.add(key)
    return { multiSel: n }
  }),
  selectAll: (keys) => set({ multiSel: new Set(keys) }),
  clearSlotSelection: () => set({ selSlot: null, multiSel: new Set() }),

  toggleMenu: (id) => set((s) => {
    const n = new Set(s.selectedMenus)
    if (n.has(id)) n.delete(id); else n.add(id)
    return { selectedMenus: n }
  }),
  setSelectedMenus: (ids) => set({ selectedMenus: ids }),
  clearMenuSelection: () => set({ selectedMenus: new Set() }),

  startDragSel: (menuId, key) => set((s) => {
    const base = new Set(s.multiSel)
    const n = new Set(base); n.add(key)
    return { isDragSel: true, dragMenuId: menuId, dragAnchor: key, dragBase: base, multiSel: n, selSlot: key }
  }),
  dragOverSlot: (key) => set((s) => {
    if (!s.isDragSel || !s.dragAnchor) return s
    const [ar, ac] = s.dragAnchor.split('-').map(Number)
    const [br, bc] = key.split('-').map(Number)
    if (Number.isNaN(br) || Number.isNaN(bc)) return s
    const r0 = Math.min(ar, br), r1 = Math.max(ar, br)
    const c0 = Math.min(ac, bc), c1 = Math.max(ac, bc)
    const n = new Set(s.dragBase)
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) n.add(`${r}-${c}`)
    return { multiSel: n }
  }),
  endDragSel: () => set({ isDragSel: false, dragMenuId: null }),
}))
