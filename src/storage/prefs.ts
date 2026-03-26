const PFX = 'mc-menu-designer'

export interface Prefs {
  lastOpenProject?: string
  [key: string]: unknown
}

export function savePrefs(p: Prefs): void {
  try { localStorage.setItem(`${PFX}:prf`, JSON.stringify(p)) } catch {}
}

export function loadPrefs(): Prefs {
  try { return JSON.parse(localStorage.getItem(`${PFX}:prf`) || '{}') }
  catch { return {} }
}
