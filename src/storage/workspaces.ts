import type { Workspace } from '@/types'
import { gid } from '@/utils/id'

const PFX = 'mc-menu-designer'

export function saveWorkspace(ws: Workspace): void {
  try {
    localStorage.setItem(`${PFX}:ws:${ws.id}`, JSON.stringify(ws))
    const idx: string[] = JSON.parse(localStorage.getItem(`${PFX}:wsi`) || '[]')
    if (!idx.includes(ws.id)) {
      idx.push(ws.id)
      localStorage.setItem(`${PFX}:wsi`, JSON.stringify(idx))
    }
  } catch {}
}

export function loadWorkspace(id: string): Workspace | null {
  try { return JSON.parse(localStorage.getItem(`${PFX}:ws:${id}`) || 'null') }
  catch { return null }
}

export function loadWorkspaceList(): string[] {
  try { return JSON.parse(localStorage.getItem(`${PFX}:wsi`) || '[]') }
  catch { return [] }
}

export function deleteWorkspace(id: string): void {
  try {
    localStorage.removeItem(`${PFX}:ws:${id}`)
    const idx = loadWorkspaceList().filter(x => x !== id)
    localStorage.setItem(`${PFX}:wsi`, JSON.stringify(idx))
  } catch {}
}

export function newWorkspace(name = 'Новый workspace'): Workspace {
  return { id: gid(), name, menus: [], connections: [] }
}
