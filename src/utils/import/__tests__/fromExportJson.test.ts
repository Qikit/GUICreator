import { describe, it, expect } from 'vitest'
import { fromExportJson } from '@/utils/import/fromExportJson'

const seg = (text: string, color = '#FFFFFF') => ({ text, color, bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false })

describe('fromExportJson', () => {
  it('generic: индекс слота → row-col, material → itemId, segments', () => {
    const data = {
      menu: { title: 'Тест', size: 27, rows: 3 },
      slots: [{ slot: 10, material: 'DIAMOND_SWORD', displayName: { segments: [seg('Меч', '#55FF55')] }, lore: { segments: [[seg('строка')]] }, amount: 2, enchanted: true, customModelData: 5, potionColor: null, skullTexture: null, rpTexture: null, armorTrim: null, hideFlags: 0 }],
    }
    const p = fromExportJson(data)!
    expect(p.rows).toBe(3)
    expect(p.name).toBe('Тест')
    expect(p.slots['1-1'].itemId).toBe('diamond_sword')
    expect(p.slots['1-1'].displayName[0].text).toBe('Меч')
    expect(p.slots['1-1'].lore[0][0].text).toBe('строка')
    expect(p.slots['1-1'].amount).toBe(2)
    expect(p.slots['1-1'].enchanted).toBe(true)
  })

  it('guiType: числовой слот = ключ; сохраняет guiType', () => {
    const data = { menu: { title: 'GUI', size: 5, rows: 1, guiType: 'hopper' }, slots: [{ slot: 2, material: 'PAPER', displayName: { segments: [seg('X')] }, lore: { segments: [] }, amount: 1, enchanted: false, customModelData: null }] }
    const p = fromExportJson(data)!
    expect(p.guiType).toBe('hopper')
    expect(p.slots['2'].itemId).toBe('paper')
  })

  it('дефолтит отсутствующие поля и возвращает null на мусоре', () => {
    expect(fromExportJson({ foo: 1 })).toBeNull()
    const p = fromExportJson({ menu: { title: 'A', rows: 1 }, slots: [{ slot: 0, material: 'STONE', displayName: { segments: [seg('s')] }, lore: { segments: [] }, amount: 1, enchanted: false }] })!
    expect(p.slots['0-0'].hideFlags).toBe(0)
    expect(p.slots['0-0'].potionColor).toBeNull()
  })
})
