import { create } from 'zustand'
import type { Project, SlotData, UndoableState } from '@/types'
import { newProject } from '@/utils/slot'
import { saveProject, loadProject, loadProjectList, loadPrefs, savePrefs } from '@/storage'
import { getGuiType } from '@/data/guiTypes'

function applyAction(p: Project, action: ProjectStoreAction): Project {
  const r = { ...p, updatedAt: Date.now() }
  switch (action.type) {
    case 'SS': { const sl = { ...r.slots }; sl[action.key] = action.data; return { ...r, slots: sl } }
    case 'SM': { const sl = { ...r.slots }; for (const [k, v] of Object.entries(action.slots)) sl[k] = v; return { ...r, slots: sl } }
    case 'RS': { const sl = { ...r.slots }; delete sl[action.key]; return { ...r, slots: sl } }
    case 'RM': { const sl = { ...r.slots }; for (const k of action.keys) delete sl[k]; return { ...r, slots: sl } }
    case 'MV': {
      const sl = { ...r.slots }
      const s = sl[action.from], d = sl[action.to]
      if (s) sl[action.to] = s; else delete sl[action.to]
      if (d) sl[action.from] = d; else delete sl[action.from]
      return { ...r, slots: sl }
    }
    case 'SR': return { ...r, rows: action.rows, guiType: undefined }
    case 'SGT': return { ...r, guiType: action.guiType === 'generic' ? undefined : action.guiType }
    case 'CA': return { ...r, slots: {} }
    case 'FE': {
      const sl = { ...r.slots }
      const gt = getGuiType(r.guiType)
      if (gt) {
        for (const s of gt.slots) { if (!sl[s.key]) sl[s.key] = JSON.parse(JSON.stringify(action.data)) }
      } else {
        for (let row = 0; row < r.rows; row++)
          for (let c = 0; c < 9; c++) {
            const k = `${row}-${c}`
            if (!sl[k]) sl[k] = JSON.parse(JSON.stringify(action.data))
          }
      }
      return { ...r, slots: sl }
    }
    default: return r
  }
}

type ProjectStoreAction =
  | { type: 'SS'; key: string; data: SlotData }
  | { type: 'SM'; slots: Record<string, SlotData> }
  | { type: 'RS'; key: string }
  | { type: 'RM'; keys: string[] }
  | { type: 'MV'; from: string; to: string }
  | { type: 'SR'; rows: number }
  | { type: 'SGT'; guiType: string }
  | { type: 'CA' }
  | { type: 'FE'; data: SlotData }

interface ProjectStore {
  past: Project[]
  present: Project
  future: Project[]
  dispatch: (action: ProjectStoreAction) => void
  undo: () => void
  redo: () => void
  setName: (name: string) => void
  loadProject: (project: Project) => void
}

function getInitialProject(): Project {
  const prefs = loadPrefs()
  if (prefs.lastOpenProject) {
    const p = loadProject(prefs.lastOpenProject)
    if (p) return p
  }
  const list = loadProjectList()
  if (list.length) {
    const p = loadProject(list[list.length - 1])
    if (p) return p
  }
  return newProject()
}

export const useProjectStore = create<ProjectStore>((set) => ({
  past: [],
  present: getInitialProject(),
  future: [],

  dispatch: (action) => set((state) => ({
    past: [...state.past.slice(-49), state.present],
    present: applyAction(state.present, action),
    future: [],
  })),

  undo: () => set((state) => {
    if (!state.past.length) return state
    return {
      past: state.past.slice(0, -1),
      present: state.past[state.past.length - 1],
      future: [state.present, ...state.future.slice(0, 49)],
    }
  }),

  redo: () => set((state) => {
    if (!state.future.length) return state
    return {
      past: [...state.past.slice(-49), state.present],
      present: state.future[0],
      future: state.future.slice(1),
    }
  }),

  setName: (name) => set((state) => ({
    present: { ...state.present, name, updatedAt: Date.now() },
  })),

  loadProject: (project) => set(() => ({
    past: [],
    present: project,
    future: [],
  })),
}))
