import { create } from 'zustand'

type DockOrder = [string, string, string]

interface PrefsStore {
  showNums: boolean
  showRP: boolean
  animations: boolean
  dockOrder: DockOrder
  collapsed: { left: boolean; right: boolean }
  panelWidths: { left: number; right: number }
  paletteView: 'grid' | 'largeGrid' | 'list'
  toggleNums: () => void
  toggleRP: () => void
  toggleAnimations: () => void
  setDockOrder: (order: DockOrder) => void
  toggleCollapse: (side: 'left' | 'right') => void
  setPanelWidth: (side: 'left' | 'right', width: number) => void
  resetPanelWidth: (side: 'left' | 'right') => void
  setPaletteView: (view: 'grid' | 'largeGrid' | 'list') => void
}

const STORAGE_KEY = 'guicreator-prefs'

function loadPersistedPrefs(): Partial<PrefsStore> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

const DEFAULT_PANEL_WIDTHS = { left: 260, right: 440 }

function persistPrefs(state: PrefsStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    showNums: state.showNums,
    showRP: state.showRP,
    animations: state.animations,
    dockOrder: state.dockOrder,
    collapsed: state.collapsed,
    panelWidths: state.panelWidths,
    paletteView: state.paletteView,
  }))
}

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const persisted = loadPersistedPrefs()

export const usePrefsStore = create<PrefsStore>((set, get) => ({
  showNums: persisted.showNums ?? false,
  showRP: persisted.showRP ?? true,
  animations: persisted.animations ?? !prefersReduced,
  dockOrder: (persisted as { dockOrder?: DockOrder }).dockOrder ?? ['palette', 'grid', 'editor'],
  collapsed: (persisted as { collapsed?: { left: boolean; right: boolean } }).collapsed ?? { left: false, right: false },
  panelWidths: (persisted as { panelWidths?: { left: number; right: number } }).panelWidths ?? DEFAULT_PANEL_WIDTHS,
  paletteView: (persisted as { paletteView?: 'grid' | 'largeGrid' | 'list' }).paletteView ?? 'grid',
  toggleNums: () => { set(s => ({ showNums: !s.showNums })); persistPrefs(get()) },
  toggleRP: () => { set(s => ({ showRP: !s.showRP })); persistPrefs(get()) },
  toggleAnimations: () => { set(s => ({ animations: !s.animations })); persistPrefs(get()) },
  setDockOrder: (order) => { set({ dockOrder: order }); persistPrefs(get()) },
  toggleCollapse: (side) => { set(s => ({ collapsed: { ...s.collapsed, [side]: !s.collapsed[side] } })); persistPrefs(get()) },
  setPanelWidth: (side, width) => { set(s => ({ panelWidths: { ...s.panelWidths, [side]: width } })); persistPrefs(get()) },
  resetPanelWidth: (side) => { set(s => ({ panelWidths: { ...s.panelWidths, [side]: DEFAULT_PANEL_WIDTHS[side] } })); persistPrefs(get()) },
  setPaletteView: (view) => { set({ paletteView: view }); persistPrefs(get()) },
}))
