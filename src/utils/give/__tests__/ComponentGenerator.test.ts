import { describe, it, expect } from 'vitest'
import { ComponentGenerator } from '../ComponentGenerator'
import type { SlotData } from '@/types'

const gen = new ComponentGenerator()
const baseOpts = { version: '1.20.5+' as const, target: '@p', prefix: 'minecraft:' }

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

describe('ComponentGenerator.formatItem', () => {
  it('minimal item', () => {
    const cmd = gen.formatItem(slot(), baseOpts)
    expect(cmd).toBe("minecraft:give @p minecraft:diamond_sword[custom_name='{\"text\":\"Sword\",\"color\":\"#FFFFFF\",\"italic\":false}'] 1")
  })

  it('colored bold name', () => {
    const cmd = gen.formatItem(slot({
      displayName: [{ text: 'Fire', color: '#FF5555', bold: true, italic: false, underlined: false, strikethrough: false, obfuscated: false }],
    }), baseOpts)
    expect(cmd).toContain("custom_name='")
    expect(cmd).toContain('"color":"#FF5555"')
    expect(cmd).toContain('"bold":true')
  })

  it('lore', () => {
    const cmd = gen.formatItem(slot({
      lore: [[{ text: 'Desc', color: '#AAAAAA', bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false }]],
    }), baseOpts)
    expect(cmd).toContain("lore=[")
  })

  it('enchantment glint override', () => {
    const cmd = gen.formatItem(slot({ enchanted: true }), baseOpts)
    expect(cmd).toContain('enchantment_glint_override=true')
    expect(cmd).not.toContain('Enchantments')
  })

  it('custom model data', () => {
    const cmd = gen.formatItem(slot({ customModelData: 1001 }), baseOpts)
    expect(cmd).toContain('custom_model_data=1001')
  })

  it('potion color', () => {
    const cmd = gen.formatItem(slot({ itemId: 'potion', potionColor: '#FF0000' }), baseOpts)
    expect(cmd).toContain('potion_contents={custom_color:16711680}')
  })

  it('skull texture', () => {
    const cmd = gen.formatItem(slot({ itemId: 'player_head', skullTexture: 'http://textures.minecraft.net/texture/abc123' }), baseOpts)
    expect(cmd).toContain('profile=')
    expect(cmd).toContain('textures')
  })

  it('armor trim', () => {
    const cmd = gen.formatItem(slot({ itemId: 'diamond_chestplate', armorTrim: { material: 'gold', pattern: 'sentry' } }), baseOpts)
    expect(cmd).toContain('trim={material:"minecraft:gold",pattern:"minecraft:sentry"}')
  })

  it('funItemComponents with components — uses as base', () => {
    const cmd = gen.formatItem(slot({
      itemId: 'ender_eye',
      funItemComponents: 'minecraft:ender_eye[minecraft:custom_data={desorientation:1b}]',
      funItemId: 'desorientation',
    }), baseOpts)
    expect(cmd).toContain('minecraft:ender_eye[')
    expect(cmd).toContain('custom_data={desorientation:1b}')
    expect(cmd).toContain("custom_name='")
  })

  it('funItemTags without funItemComponents — generates custom_data', () => {
    const cmd = gen.formatItem(slot({
      itemId: 'sugar',
      funItemId: 'sheerdust',
      funItemTags: { 'don-item': { STRING: 'sheerdust' }, sheerdust: { BOOLEAN: true } },
    }), baseOpts)
    expect(cmd).toContain('custom_data=')
  })
})

describe('ComponentGenerator.formatContainer', () => {
  it('single chest', () => {
    const slots: Record<string, SlotData> = {
      '0-0': slot(),
    }
    const containerDef = { id: 'chest', label: 'Chest', maxSlots: 27, doubleAllowed: true }
    const result = gen.formatContainer(slots, 3, { ...baseOpts, container: containerDef })
    expect(result.commands).toHaveLength(1)
    expect(result.isDoubleChest).toBe(false)
    expect(result.commands[0]).toContain('container=[')
    expect(result.commands[0]).toContain('slot:0')
  })

  it('uses SNBT syntax with ":" and namespaced keys inside container items', () => {
    const slots: Record<string, SlotData> = {
      '0-0': slot({ enchanted: true }),
    }
    const containerDef = { id: 'chest', label: 'Chest', maxSlots: 27, doubleAllowed: true }
    const result = gen.formatContainer(slots, 3, { ...baseOpts, container: containerDef })
    const cmd = result.commands[0]
    expect(cmd).toContain('"minecraft:custom_name":')
    expect(cmd).toContain('"minecraft:enchantment_glint_override":true')
    expect(cmd).not.toContain('custom_name=')
    expect(cmd).not.toContain('enchantment_glint_override=')
  })

  it('container items use JSON strings for text components', () => {
    const slots: Record<string, SlotData> = {
      '0-0': slot({
        displayName: [{ text: 'Test', color: '#FF0000', bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false }],
        lore: [[{ text: 'Line', color: '#AAAAAA', bold: false, italic: true, underlined: false, strikethrough: false, obfuscated: false }]],
      }),
    }
    const containerDef = { id: 'chest', label: 'Chest', maxSlots: 27, doubleAllowed: true }
    const result = gen.formatContainer(slots, 3, { ...baseOpts, container: containerDef })
    const cmd = result.commands[0]
    expect(cmd).toContain(`"minecraft:custom_name":'{"text":"Test","color":"#FF0000","italic":false}'`)
    expect(cmd).toContain(`'{"text":"Line","color":"#AAAAAA","italic":true}'`)
  })

  it('double chest', () => {
    const slots: Record<string, SlotData> = {
      '0-0': slot(),
      '5-0': slot({ itemId: 'apple', displayName: [{ text: 'Apple', color: '#FFFFFF', bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false }] }),
    }
    const containerDef = { id: 'chest', label: 'Chest', maxSlots: 27, doubleAllowed: true }
    const result = gen.formatContainer(slots, 6, { ...baseOpts, container: containerDef })
    expect(result.commands).toHaveLength(2)
    expect(result.isDoubleChest).toBe(true)
  })
})
