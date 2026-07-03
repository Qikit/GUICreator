import { create } from 'zustand'
import type { Binding } from '@/data/shortcuts'

type DockOrder = [string, string, string]

interface PrefsStore {
  showNums: boolean
  showConns: boolean
  animations: boolean
  dockOrder: DockOrder
  collapsed: { left: boolean; right: boolean }
  panelWidths: { left: number; right: number }
  paletteView: 'grid' | 'largeGrid' | 'list'
  giveVersion: '1.16.5' | '1.20.5+'
  giveTarget: string
  givePrefix: string
  giveContainer: string
  giveShulkerColor: string
  shortcuts: Record<string, Binding | null>
  setGiveVersion: (v: '1.16.5' | '1.20.5+') => void
  setGiveTarget: (t: string) => void
  setGivePrefix: (p: string) => void
  setGiveContainer: (c: string) => void
  setGiveShulkerColor: (c: string) => void
  toggleNums: () => void
  toggleConns: () => void
  toggleAnimations: () => void
  setDockOrder: (order: DockOrder) => void
  toggleCollapse: (side: 'left' | 'right') => void
  setPanelWidth: (side: 'left' | 'right', width: number) => void
  resetPanelWidth: (side: 'left' | 'right') => void
  setPaletteView: (view: 'grid' | 'largeGrid' | 'list') => void
  setShortcut: (id: string, b: Binding | null) => void
  resetShortcut: (id: string) => void
  resetAllShortcuts: () => void
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
    showConns: state.showConns,
    animations: state.animations,
    dockOrder: state.dockOrder,
    collapsed: state.collapsed,
    panelWidths: state.panelWidths,
    paletteView: state.paletteView,
    giveVersion: state.giveVersion,
    giveTarget: state.giveTarget,
    givePrefix: state.givePrefix,
    giveContainer: state.giveContainer,
    giveShulkerColor: state.giveShulkerColor,
    shortcuts: state.shortcuts,
  }))
}

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const persisted = loadPersistedPrefs()

export const usePrefsStore = create<PrefsStore>((set, get) => ({
  showNums: persisted.showNums ?? false,
  showConns: persisted.showConns ?? true,
  animations: persisted.animations ?? !prefersReduced,
  dockOrder: (persisted as { dockOrder?: DockOrder }).dockOrder ?? ['palette', 'grid', 'editor'],
  collapsed: (persisted as { collapsed?: { left: boolean; right: boolean } }).collapsed ?? { left: false, right: false },
  panelWidths: (persisted as { panelWidths?: { left: number; right: number } }).panelWidths ?? DEFAULT_PANEL_WIDTHS,
  paletteView: (persisted as { paletteView?: 'grid' | 'largeGrid' | 'list' }).paletteView ?? 'grid',
  giveVersion: (persisted as any).giveVersion ?? '1.20.5+',
  giveTarget: (persisted as any).giveTarget ?? '@p',
  givePrefix: (persisted as any).givePrefix ?? 'minecraft:',
  giveContainer: (persisted as any).giveContainer ?? 'chest',
  giveShulkerColor: (persisted as any).giveShulkerColor ?? '',
  shortcuts: (persisted as { shortcuts?: Record<string, Binding | null> }).shortcuts ?? {},
  setGiveVersion: (v) => { set({ giveVersion: v }); persistPrefs(get()) },
  setGiveTarget: (t) => { set({ giveTarget: t }); persistPrefs(get()) },
  setGivePrefix: (p) => { set({ givePrefix: p }); persistPrefs(get()) },
  setGiveContainer: (c) => { set({ giveContainer: c }); persistPrefs(get()) },
  setGiveShulkerColor: (c) => { set({ giveShulkerColor: c }); persistPrefs(get()) },
  toggleNums: () => { set(s => ({ showNums: !s.showNums })); persistPrefs(get()) },
  toggleConns: () => { set(s => ({ showConns: !s.showConns })); persistPrefs(get()) },
  toggleAnimations: () => { set(s => ({ animations: !s.animations })); persistPrefs(get()) },
  setDockOrder: (order) => { set({ dockOrder: order }); persistPrefs(get()) },
  toggleCollapse: (side) => { set(s => ({ collapsed: { ...s.collapsed, [side]: !s.collapsed[side] } })); persistPrefs(get()) },
  setPanelWidth: (side, width) => { set(s => ({ panelWidths: { ...s.panelWidths, [side]: width } })); persistPrefs(get()) },
  resetPanelWidth: (side) => { set(s => ({ panelWidths: { ...s.panelWidths, [side]: DEFAULT_PANEL_WIDTHS[side] } })); persistPrefs(get()) },
  setPaletteView: (view) => { set({ paletteView: view }); persistPrefs(get()) },
  setShortcut: (id, b) => { set(s => ({ shortcuts: { ...s.shortcuts, [id]: b } })); persistPrefs(get()) },
  resetShortcut: (id) => { set(s => { const n = { ...s.shortcuts }; delete n[id]; return { shortcuts: n } }); persistPrefs(get()) },
  resetAllShortcuts: () => { set({ shortcuts: {} }); persistPrefs(get()) },
}))
