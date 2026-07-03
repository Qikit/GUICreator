import { describe, it, expect } from 'vitest'
import { parseAnyImport } from '@/utils/import/parseAnyImport'

const seg = (text: string) => ({ text, color: '#FFFFFF', bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false })

describe('parseAnyImport', () => {
  it('backup {workspace, projects} → workspace', () => {
    const raw = JSON.stringify({ workspace: { id: 'w', name: 'W', menus: [], connections: [] }, projects: [{ id: 'p' }], templates: [{ name: 't' }] })
    const r = parseAnyImport(raw)
    expect(r.kind).toBe('workspace')
    if (r.kind === 'workspace') { expect(r.projects.length).toBe(1); expect(r.templates?.length).toBe(1) }
  })

  it('export-JSON {menu, slots} → menu', () => {
    const raw = JSON.stringify({ menu: { title: 'M', size: 9, rows: 1 }, slots: [{ slot: 0, material: 'STONE', displayName: { segments: [seg('s')] }, lore: { segments: [] }, amount: 1, enchanted: false }] })
    const r = parseAnyImport(raw)
    expect(r.kind).toBe('menu')
    if (r.kind === 'menu') expect(r.project.slots['0-0'].itemId).toBe('stone')
  })

  it('inventory {v:1,...} → menu', () => {
    const raw = JSON.stringify({ v: 1, title: 'Инв', size: 9, slots: [{ s: 0, id: 'dirt', count: 1 }] })
    const r = parseAnyImport(raw)
    expect(r.kind).toBe('menu')
    if (r.kind === 'menu') expect(r.project.slots['0-0'].itemId).toBe('dirt')
  })

  it('мусор и пустая строка → error', () => {
    expect(parseAnyImport('').kind).toBe('error')
    expect(parseAnyImport('не json и не конфиг').kind).toBe('error')
    expect(parseAnyImport('{"foo":1}').kind).toBe('error')
  })
})
