import { describe, it, expect } from 'vitest'
import { parseInventoryJson } from '../importInventoryJson'

describe('parseInventoryJson', () => {
  it('parses minimal valid JSON', () => {
    const json = JSON.stringify({
      v: 1,
      title: 'Test',
      size: 27,
      slots: [
        { s: 0, id: 'diamond', count: 64, name: [{ text: 'Diamond' }], lore: [] },
      ],
    })
    const result = parseInventoryJson(json)
    expect(result).not.toBeNull()
    expect(result!.name).toBe('Test')
    expect(result!.rows).toBe(3)
    expect(result!.slots['0-0']).toBeDefined()
    expect(result!.slots['0-0'].itemId).toBe('diamond')
    expect(result!.slots['0-0'].amount).toBe(64)
    expect(result!.slots['0-0'].displayName[0].text).toBe('Diamond')
  })

  it('maps slot index to row-col correctly', () => {
    const json = JSON.stringify({
      v: 1, title: 'Test', size: 27,
      slots: [
        { s: 13, id: 'stone', count: 1, name: [{ text: 'Stone' }], lore: [] },
      ],
    })
    const result = parseInventoryJson(json)!
    expect(result.slots['1-4']).toBeDefined()
    expect(result.slots['1-4'].itemId).toBe('stone')
  })

  it('parses text components with formatting', () => {
    const json = JSON.stringify({
      v: 1, title: 'Test', size: 9,
      slots: [{
        s: 0, id: 'diamond_sword', count: 1,
        name: [
          { text: 'Fire ', color: '#FF5555', bold: true },
          { text: 'Sword', color: '#FFAA00' },
        ],
        lore: [
          [{ text: 'Legendary', color: '#AAAAAA', italic: false }],
          [{ text: '+10 dmg', color: '#55FF55' }],
        ],
      }],
    })
    const result = parseInventoryJson(json)!
    const slot = result.slots['0-0']
    expect(slot.displayName).toHaveLength(2)
    expect(slot.displayName[0].color).toBe('#FF5555')
    expect(slot.displayName[0].bold).toBe(true)
    expect(slot.displayName[1].color).toBe('#FFAA00')
    expect(slot.lore).toHaveLength(2)
    expect(slot.lore[0][0].text).toBe('Legendary')
  })

  it('parses enchantments and glint', () => {
    const json = JSON.stringify({
      v: 1, title: 'T', size: 9,
      slots: [{
        s: 0, id: 'bow', count: 1, name: [{ text: 'Bow' }], lore: [],
        enchantments: { power: 5, infinity: 1 },
        glint: true,
      }],
    })
    const result = parseInventoryJson(json)!
    expect(result.slots['0-0'].enchanted).toBe(true)
    expect(result.slots['0-0'].funItemEnchantments).toEqual({ power: 5, infinity: 1 })
  })

  it('parses optional fields: cmd, potionColor, skull, trim', () => {
    const json = JSON.stringify({
      v: 1, title: 'T', size: 9,
      slots: [{
        s: 0, id: 'potion', count: 1, name: [{ text: 'P' }], lore: [],
        cmd: 42, potionColor: '#00FF00',
        skull: 'abc123base64',
        trim: { material: 'gold', pattern: 'sentry' },
        flags: 3,
      }],
    })
    const result = parseInventoryJson(json)!
    const s = result.slots['0-0']
    expect(s.customModelData).toBe(42)
    expect(s.potionColor).toBe('#00FF00')
    expect(s.skullTexture).toBe('abc123base64')
    expect(s.armorTrim).toEqual({ material: 'gold', pattern: 'sentry' })
    expect(s.hideFlags).toBe(3)
  })

  it('parses FunItem fields (nbt, components, ftid)', () => {
    const json = JSON.stringify({
      v: 1, title: 'T', size: 9,
      slots: [{
        s: 0, id: 'ender_eye', count: 1, name: [{ text: 'X' }], lore: [],
        nbt: 'ENDER_EYE{test:1b}',
        components: 'minecraft:ender_eye[custom_data={test:1b}]',
        ftid: 'test_item',
      }],
    })
    const result = parseInventoryJson(json)!
    const s = result.slots['0-0']
    expect(s.funItemNbt).toBe('ENDER_EYE{test:1b}')
    expect(s.funItemComponents).toBe('minecraft:ender_eye[custom_data={test:1b}]')
    expect(s.funItemId).toBe('test_item')
  })

  it('calculates rows from size', () => {
    expect(parseInventoryJson(JSON.stringify({ v: 1, title: 'T', size: 9, slots: [] }))!.rows).toBe(1)
    expect(parseInventoryJson(JSON.stringify({ v: 1, title: 'T', size: 54, slots: [] }))!.rows).toBe(6)
  })

  it('returns null for invalid JSON', () => {
    expect(parseInventoryJson('not json')).toBeNull()
    expect(parseInventoryJson('{}')).toBeNull()
    expect(parseInventoryJson(JSON.stringify({ v: 2 }))).toBeNull()
  })

  it('handles empty name gracefully', () => {
    const json = JSON.stringify({
      v: 1, title: 'T', size: 9,
      slots: [{ s: 0, id: 'stone', count: 1 }],
    })
    const result = parseInventoryJson(json)!
    expect(result.slots['0-0'].displayName.length).toBeGreaterThan(0)
  })
})
