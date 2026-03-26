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
    rpTexture: null,
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
      rpTexture: preset.rpTexture || null,
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

export const TINTABLE = new Set(['potion', 'splash_potion', 'lingering_potion', 'tipped_arrow'])
