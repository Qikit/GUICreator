import type { Workspace, Project } from '@/types'
import { parseInventoryJson } from '@/utils/importInventoryJson'
import { parseAbstractMenus } from '@/utils/importMenu'
import { decodeShareUrl } from '@/utils/shareUrl'
import { newProject } from '@/utils/slot'
import { fromExportJson } from './fromExportJson'

export type ImportResult =
  | { kind: 'workspace'; workspace: Workspace; projects: Project[]; templates?: unknown[] }
  | { kind: 'menu'; project: Project }
  | { kind: 'error'; message: string }

function menuFrom(parsed: { name: string; rows: number; slots: Project['slots'] } | null): ImportResult | null {
  if (!parsed) return null
  const p = newProject(parsed.name, parsed.rows)
  p.slots = parsed.slots
  return { kind: 'menu', project: p }
}

export function parseAnyImport(raw: string): ImportResult {
  const s = raw.trim()
  if (!s) return { kind: 'error', message: 'Пустой ввод' }

  if (s.includes('#share=')) {
    const data = decodeShareUrl(s)
    return data
      ? { kind: 'workspace', workspace: data.workspace, projects: data.projects }
      : { kind: 'error', message: 'Не удалось декодировать ссылку' }
  }

  let json: any = null
  try { json = JSON.parse(s) } catch { json = null }
  if (json && typeof json === 'object') {
    if (json.workspace && Array.isArray(json.projects)) {
      return { kind: 'workspace', workspace: json.workspace, projects: json.projects, templates: Array.isArray(json.templates) ? json.templates : undefined }
    }
    if (json.menu && Array.isArray(json.slots)) {
      const p = fromExportJson(json)
      return p ? { kind: 'menu', project: p } : { kind: 'error', message: 'Не удалось прочитать экспорт-JSON' }
    }
    if (json.v === 1 && json.title && json.size) {
      const r = menuFrom(parseInventoryJson(s))
      return r ?? { kind: 'error', message: 'Невалидный inventory JSON' }
    }
    return { kind: 'error', message: 'Неизвестный JSON-формат' }
  }

  // parseAbstractMenus никогда не возвращает null (даёт пустое меню на любом
  // тексте), поэтому пускаем в текстовые парсеры только похожее на конфиг.
  const looksLikeConfig = /^\s*title\s*:|^\s*size\s*:|material\s*:/im.test(s)
  if (looksLikeConfig) {
    const r = menuFrom(parseAbstractMenus(s))
    if (r) return r
  }
  return { kind: 'error', message: 'Не удалось распознать формат (JSON / AbstractMenus)' }
}
