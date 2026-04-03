import { useEffect } from 'react'
import type { SlotData, Project } from '@/types'
import { useSelectionStore } from '@/store/selectionStore'

interface Params {
  proj: Project
  clipboard: { multi: boolean; data: Record<string, SlotData> | SlotData; keys?: string[]; rows?: number } | null
  setClipboard: (c: { multi: boolean; data: Record<string, SlotData> | SlotData; keys?: string[]; rows?: number } | null) => void
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
  onDuplicateProject?: (project: Project) => void
}

export function useKeyboardShortcuts(params: Params) {
  const {
    proj, clipboard, setClipboard,
    dispatch, undo, redo, saveProject, setSaveStatus,
    setShowExport, setShowTpls, setShowProjs, palItem, setPalItem, setPalPreset, setCtxMenu,
    onDuplicateProject,
  } = params

  const { selSlot, multiSel, selectSlot, setMultiSel, clearSlotSelection } = useSelectionStore()

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
      if (e.ctrlKey && !e.shiftKey && e.code === 'KeyZ') { e.preventDefault(); undo() }
      if (e.ctrlKey && (e.code === 'KeyY' || (e.shiftKey && e.code === 'KeyZ'))) { e.preventDefault(); redo() }
      if (e.ctrlKey && e.code === 'KeyE') { e.preventDefault(); setShowExport(true) }
      if (e.ctrlKey && e.code === 'KeyS') { e.preventDefault(); saveProject(proj); setSaveStatus('Saved') }
      if (e.key === 'Escape') { clearSlotSelection(); setCtxMenu(null); setShowExport(false); setShowTpls(false); setShowProjs(false); setPalItem(null); setPalPreset(null) }
      if (e.code === 'KeyE' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); if (palItem === '__eraser__') { setPalItem(null); setPalPreset(null) } else { setPalItem('__eraser__'); setPalPreset(null) } }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (multiSel.size > 0) { e.preventDefault(); dispatch({ type: 'RM', keys: [...multiSel] }); clearSlotSelection() }
        else if (selSlot && proj.slots[selSlot]) { e.preventDefault(); dispatch({ type: 'RS', key: selSlot }) }
      }
      if (e.ctrlKey && e.code === 'KeyA') {
        e.preventDefault()
        const all: string[] = []
        for (let r = 0; r < proj.rows; r++) for (let c = 0; c < 9; c++) all.push(`${r}-${c}`)
        useSelectionStore.getState().selectAll(all)
      }
      if (e.ctrlKey && e.code === 'KeyD') {
        e.preventDefault()
        if (selSlot && proj.slots[selSlot]) {
          const [r, c] = selSlot.split('-').map(Number)
          for (let nc = c + 1; nc < 9; nc++) {
            const nk = `${r}-${nc}`
            if (!proj.slots[nk]) { dispatch({ type: 'SS', key: nk, data: JSON.parse(JSON.stringify(proj.slots[selSlot])) }); selectSlot(nk); break }
          }
        }
      }
      if (e.ctrlKey && e.code === 'KeyC') {
        if (multiSel.size > 0) {
          e.preventDefault(); const d: Record<string, SlotData> = {}
          for (const k of multiSel) if (proj.slots[k]) d[k] = JSON.parse(JSON.stringify(proj.slots[k]))
          setClipboard({ multi: true, data: d, keys: [...multiSel] })
        } else if (selSlot && proj.slots[selSlot]) {
          e.preventDefault(); setClipboard({ multi: false, data: JSON.parse(JSON.stringify(proj.slots[selSlot])) })
        } else if (!selSlot && Object.keys(proj.slots).length > 0) {
          e.preventDefault()
          setClipboard({ multi: true, data: JSON.parse(JSON.stringify(proj.slots)), keys: Object.keys(proj.slots), rows: proj.rows })
        }
      }
      if (e.ctrlKey && e.code === 'KeyV' && clipboard) {
        e.preventDefault()
        if (clipboard.multi && clipboard.keys) {
          if (clipboard.rows && !selSlot) {
            if (onDuplicateProject) {
              onDuplicateProject({ id: '', name: proj.name + ' (\u043a\u043e\u043f\u0438\u044f)', rows: clipboard.rows, cols: 9, slots: JSON.parse(JSON.stringify(clipboard.data)), createdAt: Date.now(), updatedAt: Date.now() } as Project)
            } else {
              dispatch({ type: 'SR', rows: clipboard.rows })
              dispatch({ type: 'SM', slots: JSON.parse(JSON.stringify(clipboard.data)) })
            }
          } else if (selSlot) {
            const keys = clipboard.keys; if (!keys.length) return
            const [br, bc] = keys[0].split('-').map(Number); const [sr, sc] = selSlot.split('-').map(Number)
            const dr = sr - br, dc = sc - bc; const slots: Record<string, SlotData> = {}
            for (const k of keys) {
              const d = (clipboard.data as Record<string, SlotData>)[k]; if (!d) continue
              const [r, c] = k.split('-').map(Number); const nk = `${r + dr}-${c + dc}`
              if (r + dr >= 0 && r + dr < proj.rows && c + dc >= 0 && c + dc < 9) slots[nk] = JSON.parse(JSON.stringify(d))
            }
            dispatch({ type: 'SM', slots })
          }
        } else if (selSlot) { dispatch({ type: 'SS', key: selSlot, data: JSON.parse(JSON.stringify(clipboard.data)) }) }
      }
      if (selSlot && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); const [r, c] = selSlot.split('-').map(Number)
        let nr = r, nc = c
        if (e.key === 'ArrowUp') nr = Math.max(0, r - 1)
        if (e.key === 'ArrowDown') nr = Math.min(proj.rows - 1, r + 1)
        if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1)
        if (e.key === 'ArrowRight') nc = Math.min(8, c + 1)
        const nk = `${nr}-${nc}`
        if (e.shiftKey) {
          const n = new Set(multiSel); n.add(nk)
          useSelectionStore.setState({ multiSel: n, selSlot: nk })
        } else {
          selectSlot(nk)
        }
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [selSlot, proj, clipboard, multiSel, palItem, undo, redo, dispatch, onDuplicateProject])
}
