const PFX = 'mc-menu-designer'

export function saveUserTemplates(templates: unknown[]): void {
  try { localStorage.setItem(`${PFX}:tpl`, JSON.stringify(templates)) } catch {}
}

export function loadUserTemplates(): unknown[] {
  try { return JSON.parse(localStorage.getItem(`${PFX}:tpl`) || '[]') }
  catch { return [] }
}
