import type { Project } from '@/types'

const PFX = 'mc-menu-designer'

export function saveProject(p: Project): void {
  try {
    localStorage.setItem(`${PFX}:p:${p.id}`, JSON.stringify(p))
    const idx: string[] = JSON.parse(localStorage.getItem(`${PFX}:idx`) || '[]')
    if (!idx.includes(p.id)) {
      idx.push(p.id)
      localStorage.setItem(`${PFX}:idx`, JSON.stringify(idx))
    }
  } catch {}
}

export function loadProject(id: string): Project | null {
  try { return JSON.parse(localStorage.getItem(`${PFX}:p:${id}`) || 'null') }
  catch { return null }
}

export function loadProjectList(): string[] {
  try { return JSON.parse(localStorage.getItem(`${PFX}:idx`) || '[]') }
  catch { return [] }
}

export function deleteProject(id: string): void {
  try {
    localStorage.removeItem(`${PFX}:p:${id}`)
    const idx = loadProjectList().filter(x => x !== id)
    localStorage.setItem(`${PFX}:idx`, JSON.stringify(idx))
  } catch {}
}
