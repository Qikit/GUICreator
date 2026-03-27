import { useEffect } from 'react'
import type { SlotData, Project } from '@/types'

interface Params {
  selSlot: string | null
  setSelSlot: (s: string | null) => void
  multiSel: Set<string>
  setMultiSel: (s: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  proj: Project
  clipboard: { multi: boolean; data: Record<string, SlotData> | SlotData; keys?: string[] } | null
  setClipboard: (c: { multi: boolean; data: Record<string, SlotData> | SlotData; keys?: string[] } | null) => void
  dispatch: (action: { type: string; [k: string]: unknown }) => void
  undo: () => void
  redo: () => void
  saveProject: (p: Project) => void
  setSaveStatus: (s: string) => void
  setShowExport: (v: boolean) => void
  setShowTpls: (v: boolean) => void
  setShowProjs: (v: boolean) => void
  palItem: string | null
  setPalItem: (v: string | null) => void
  setPalPreset: (v: unknown) => void
  setCtxMenu: (v: null) => void
}

export function useKeyboardShortcuts(params: Params) {
  const {
    selSlot, setSelSlot, multiSel, setMultiSel, proj, clipboard, setClipboard,
    dispatch, undo, redo, saveProject, setSaveStatus,
    setShowExport, setShowTpls, setShowProjs, palItem, setPalItem, setPalPreset, setCtxMenu,
  } = params

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo() }
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo() }
      if (e.ctrlKey && e.key === 'e') { e.preventDefault(); setShowExport(true) }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveProject(proj); setSaveStatus('Saved') }
      if (e.key === 'Escape') { setSelSlot(null); setMultiSel(new Set()); setCtxMenu(null); setShowExport(false); setShowTpls(false); setShowProjs(false); setPalItem(null); setPalPreset(null) }
      if (e.code === 'KeyE' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); if (palItem === '__eraser__') { setPalItem(null); setPalPreset(null) } else { setPalItem('__eraser__'); setPalPreset(null) } }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (multiSel.size > 0) { e.preventDefault(); dispatch({ type: 'RM', keys: [...multiSel] }); setMultiSel(new Set()); setSelSlot(null) }
        else if (selSlot && proj.slots[selSlot]) { e.preventDefault(); dispatch({ type: 'RS', key: selSlot }) }
      }
      if (e.ctrlKey && e.key === 'a') { e.preventDefault(); const all = new Set<string>(); for (let r = 0; r < proj.rows; r++) for (let c = 0; c < 9; c++) all.add(`${r}-${c}`); setMultiSel(all) }
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault()
        if (selSlot && proj.slots[selSlot]) {
          const [r, c] = selSlot.split('-').map(Number)
          for (let nc = c + 1; nc < 9; nc++) {
            const nk = `${r}-${nc}`
            if (!proj.slots[nk]) { dispatch({ type: 'SS', key: nk, data: JSON.parse(JSON.stringify(proj.slots[selSlot])) }); setSelSlot(nk); break }
          }
        }
      }
      // Copy
      if (e.ctrlKey && e.key === 'c') {
        if (multiSel.size > 0) {
          e.preventDefault(); const d: Record<string, SlotData> = {}
          for (const k of multiSel) if (proj.slots[k]) d[k] = JSON.parse(JSON.stringify(proj.slots[k]))
          setClipboard({ multi: true, data: d, keys: [...multiSel] })
        } else if (selSlot && proj.slots[selSlot]) {
          e.preventDefault(); setClipboard({ multi: false, data: JSON.parse(JSON.stringify(proj.slots[selSlot])) })
        }
      }
      // Paste
      if (e.ctrlKey && e.key === 'v' && clipboard && selSlot) {
        e.preventDefault()
        if (clipboard.multi && clipboard.keys) {
          const keys = clipboard.keys; if (!keys.length) return
          const [br, bc] = keys[0].split('-').map(Number); const [sr, sc] = selSlot.split('-').map(Number)
          const dr = sr - br, dc = sc - bc; const slots: Record<string, SlotData> = {}
          for (const k of keys) {
            const d = (clipboard.data as Record<string, SlotData>)[k]; if (!d) continue
            const [r, c] = k.split('-').map(Number); const nk = `${r + dr}-${c + dc}`
            if (r + dr >= 0 && r + dr < proj.rows && c + dc >= 0 && c + dc < 9) slots[nk] = JSON.parse(JSON.stringify(d))
          }
          dispatch({ type: 'SM', slots })
        } else { dispatch({ type: 'SS', key: selSlot, data: JSON.parse(JSON.stringify(clipboard.data)) }) }
      }
      // Arrow keys
      if (selSlot && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); const [r, c] = selSlot.split('-').map(Number)
        let nr = r, nc = c
        if (e.key === 'ArrowUp') nr = Math.max(0, r - 1)
        if (e.key === 'ArrowDown') nr = Math.min(proj.rows - 1, r + 1)
        if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1)
        if (e.key === 'ArrowRight') nc = Math.min(8, c + 1)
        const nk = `${nr}-${nc}`
        if (e.shiftKey) setMultiSel(prev => { const n = new Set(prev); n.add(nk); return n })
        else setMultiSel(new Set())
        setSelSlot(nk)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [selSlot, proj, clipboard, multiSel, palItem, undo, redo, dispatch])
}
