import type { TextSegment, SlotData, SlotPreset, Project } from '@/types'
import { gid } from './id'

let ruLoaded: Record<string, string> = {}

export function setRuLocale(data: Record<string, string>) {
  ruLoaded = data
}

export function ruName(id: string): string {
  if (ruLoaded[id]) return ruLoaded[id]
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function itemName(id: string): string {
  return ruName(id)
}

export function defaultSegment(
  text = '', color = '#FFFFFF', bold = false,
): TextSegment {
  return { text, color, bold, italic: false, underlined: false, strikethrough: false, obfuscated: false }
}

export function defSlot(id: string): SlotData {
  return {
    itemId: id,
    displayName: [defaultSegment(itemName(id), '#FFFFFF')],
    lore: [],
    amount: 1,
    enchanted: false,
    customModelData: null,
    hideFlags: 0,
    potionColor: null,
    skullTexture: null,
    armorTrim: null,
  }
}

export function makeSlot(id: string, preset?: SlotPreset | null): SlotData {
  if (preset) {
    return {
      itemId: id,
      displayName: JSON.parse(JSON.stringify(preset.displayName || [defaultSegment(itemName(id))])),
      lore: JSON.parse(JSON.stringify(preset.lore || [])),
      amount: preset.amount || 1,
      enchanted: preset.enchanted || false,
      customModelData: preset.customModelData || null,
      hideFlags: 0,
      potionColor: preset.potionColor || null,
      skullTexture: preset.skullTexture || null,
      armorTrim: preset.armorTrim ? { ...preset.armorTrim } : null,
    }
  }
  return defSlot(id)
}

export function newProject(name = 'Новое меню', rows = 6): Project {
  return {
    id: gid(),
    name,
    rows,
    cols: 9,
    slots: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export const ERASER_ID = '__eraser__'

export const TINTABLE = new Set([
  'potion', 'splash_potion', 'lingering_potion', 'tipped_arrow',
  'leather_helmet', 'leather_chestplate', 'leather_leggings', 'leather_boots',
  'leather_horse_armor',
])

export const TRIMMABLE = new Set([
  'leather_helmet', 'leather_chestplate', 'leather_leggings', 'leather_boots',
  'chainmail_helmet', 'chainmail_chestplate', 'chainmail_leggings', 'chainmail_boots',
  'iron_helmet', 'iron_chestplate', 'iron_leggings', 'iron_boots',
  'golden_helmet', 'golden_chestplate', 'golden_leggings', 'golden_boots',
  'diamond_helmet', 'diamond_chestplate', 'diamond_leggings', 'diamond_boots',
  'netherite_helmet', 'netherite_chestplate', 'netherite_leggings', 'netherite_boots',
  'turtle_helmet',
])

export const TRIM_PIECE: Record<string, string> = {
  leather_helmet: 'helmet', leather_chestplate: 'chestplate', leather_leggings: 'leggings', leather_boots: 'boots',
  chainmail_helmet: 'helmet', chainmail_chestplate: 'chestplate', chainmail_leggings: 'leggings', chainmail_boots: 'boots',
  iron_helmet: 'helmet', iron_chestplate: 'chestplate', iron_leggings: 'leggings', iron_boots: 'boots',
  golden_helmet: 'helmet', golden_chestplate: 'chestplate', golden_leggings: 'leggings', golden_boots: 'boots',
  diamond_helmet: 'helmet', diamond_chestplate: 'chestplate', diamond_leggings: 'leggings', diamond_boots: 'boots',
  netherite_helmet: 'helmet', netherite_chestplate: 'chestplate', netherite_leggings: 'leggings', netherite_boots: 'boots',
  turtle_helmet: 'helmet',
}

export const TRIM_MATERIALS = [
  'amethyst', 'copper', 'diamond', 'emerald', 'gold', 'iron', 'lapis', 'netherite', 'quartz', 'redstone', 'resin',
] as const

export const TRIM_PATTERNS = [
  'bolt', 'coast', 'dune', 'eye', 'flow', 'host', 'raiser', 'rib',
  'sentry', 'shaper', 'silence', 'snout', 'spire', 'tide', 'vex', 'ward', 'wayfinder', 'wild',
] as const

const DARKER_MATERIALS: Record<string, string> = {
  iron_helmet: 'iron', iron_chestplate: 'iron', iron_leggings: 'iron', iron_boots: 'iron',
  golden_helmet: 'gold', golden_chestplate: 'gold', golden_leggings: 'gold', golden_boots: 'gold',
  diamond_helmet: 'diamond', diamond_chestplate: 'diamond', diamond_leggings: 'diamond', diamond_boots: 'diamond',
  netherite_helmet: 'netherite', netherite_chestplate: 'netherite', netherite_leggings: 'netherite', netherite_boots: 'netherite',
}

export function trimPaletteName(itemId: string, material: string): string {
  const darkerBase = DARKER_MATERIALS[itemId]
  if (darkerBase && darkerBase === material) return `${material}_darker`
  return material
}
