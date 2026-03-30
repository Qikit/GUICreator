import { describe, it, expect } from 'vitest'
import { NbtGenerator } from '../NbtGenerator'
import type { SlotData } from '@/types'

const gen = new NbtGenerator()
const baseOpts = { version: '1.16.5' as const, target: '@p', prefix: 'minecraft:' }

function slot(overrides: Partial<SlotData> = {}): SlotData {
  return {
    itemId: 'diamond_sword',
    displayName: [{ text: 'Sword', color: '#FFFFFF', bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false }],
    lore: [],
    amount: 1,
    enchanted: false,
    customModelData: null,
    hideFlags: 0,
    potionColor: null,
    skullTexture: null,
    armorTrim: null,
    ...overrides,
  }
}

describe('NbtGenerator.formatItem', () => {
  it('minimal item — no tags needed', () => {
    const cmd = gen.formatItem(slot(), baseOpts)
    expect(cmd).toBe('minecraft:give @p minecraft:diamond_sword{display:{Name:\'{"text":"Sword"}\'}} 1')
  })

  it('colored bold name', () => {
    const cmd = gen.formatItem(slot({
      displayName: [{ text: 'Fire', color: '#FF5555', bold: true, italic: false, underlined: false, strikethrough: false, obfuscated: false }],
    }), baseOpts)
    expect(cmd).toContain('"color":"#FF5555"')
    expect(cmd).toContain('"bold":true')
  })

  it('lore lines', () => {
    const cmd = gen.formatItem(slot({
      lore: [
        [{ text: 'Line 1', color: '#AAAAAA', bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false }],
        [{ text: 'Line 2', color: '#55FF55', bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false }],
      ],
    }), baseOpts)
    expect(cmd).toContain('Lore:[')
    expect(cmd).toContain('"italic":false')
  })

  it('enchanted glint', () => {
    const cmd = gen.formatItem(slot({ enchanted: true }), baseOpts)
    expect(cmd).toContain('Enchantments:[{id:"minecraft:unbreaking",lvl:1s}]')
    expect(cmd).toContain('HideFlags:')
  })

  it('custom model data', () => {
    const cmd = gen.formatItem(slot({ customModelData: 1001 }), baseOpts)
    expect(cmd).toContain('CustomModelData:1001')
  })

  it('potion color', () => {
    const cmd = gen.formatItem(slot({ itemId: 'potion', potionColor: '#FF0000' }), baseOpts)
    expect(cmd).toContain('CustomPotionColor:16711680')
  })

  it('skull texture', () => {
    const cmd = gen.formatItem(slot({ itemId: 'player_head', skullTexture: 'http://textures.minecraft.net/texture/abc123' }), baseOpts)
    expect(cmd).toContain('SkullOwner:')
    expect(cmd).toContain('textures')
  })

  it('armor trim', () => {
    const cmd = gen.formatItem(slot({ itemId: 'diamond_chestplate', armorTrim: { material: 'gold', pattern: 'sentry' } }), baseOpts)
    expect(cmd).toContain('Trim:{material:"minecraft:gold",pattern:"minecraft:sentry"}')
  })

  it('amount > 1', () => {
    const cmd = gen.formatItem(slot({ amount: 64 }), baseOpts)
    expect(cmd.endsWith(' 64')).toBe(true)
  })

  it('empty prefix', () => {
    const cmd = gen.formatItem(slot(), { ...baseOpts, prefix: '' })
    expect(cmd.startsWith('give @p minecraft:diamond_sword')).toBe(true)
  })

  it('custom prefix', () => {
    const cmd = gen.formatItem(slot(), { ...baseOpts, prefix: 'essentials:' })
    expect(cmd.startsWith('essentials:give @p')).toBe(true)
  })

  it('funItemNbt — uses raw NBT as base, merges display', () => {
    const cmd = gen.formatItem(slot({
      itemId: 'ender_eye',
      funItemNbt: 'ENDER_EYE{desorientation: 1b, don-item: "desorientation"}',
      funItemId: 'desorientation',
      displayName: [{ text: 'Desorient', color: '#00FF00', bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false }],
    }), baseOpts)
    expect(cmd).toContain('minecraft:ender_eye')
    expect(cmd).toContain('desorientation: 1b')
    expect(cmd).toContain('don-item: "desorientation"')
    expect(cmd).toContain('display:{Name:')
  })
})

describe('NbtGenerator.formatContainer', () => {
  it('single chest with items', () => {
    const slots: Record<string, SlotData> = {
      '0-0': slot(),
      '0-4': slot({ itemId: 'apple', displayName: [{ text: 'Apple', color: '#FFFFFF', bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false }] }),
    }
    const containerDef = { id: 'chest', label: 'Chest', maxSlots: 27, doubleAllowed: true }
    const result = gen.formatContainer(slots, 3, { ...baseOpts, container: containerDef })
    expect(result.commands).toHaveLength(1)
    expect(result.isDoubleChest).toBe(false)
    expect(result.commands[0]).toContain('BlockEntityTag:{Items:[')
    expect(result.commands[0]).toContain('Slot:0b')
    expect(result.commands[0]).toContain('Slot:4b')
  })

  it('double chest for 6 rows', () => {
    const slots: Record<string, SlotData> = {
      '0-0': slot(),
      '3-0': slot({ itemId: 'apple', displayName: [{ text: 'Apple', color: '#FFFFFF', bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false }] }),
    }
    const containerDef = { id: 'chest', label: 'Chest', maxSlots: 27, doubleAllowed: true }
    const result = gen.formatContainer(slots, 6, { ...baseOpts, container: containerDef })
    expect(result.commands).toHaveLength(2)
    expect(result.isDoubleChest).toBe(true)
    expect(result.commands[0]).toContain('Slot:0b')
    expect(result.commands[1]).toContain('Slot:0b')
  })
})
