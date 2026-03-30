import type { SlotData } from '@/types'
import type { CommandGenerator, GiveOptions, GiveResult } from './types'
import { segmentsToJson, hexToDecimal } from './textFormat'

export class NbtGenerator implements CommandGenerator {

  formatItem(slot: SlotData, options: Omit<GiveOptions, 'container'>): string {
    const { target, prefix } = options
    const itemId = `minecraft:${slot.itemId}`
    const tags = this.buildItemTags(slot)
    const nbt = tags ? `{${tags}}` : ''
    return `${prefix}give ${target} ${itemId}${nbt} ${slot.amount}`
  }

  formatContainer(slots: Record<string, SlotData>, rows: number, options: GiveOptions): GiveResult {
    const { container } = options
    const totalSlots = rows * 9
    const needsDouble = container.doubleAllowed && totalSlots > container.maxSlots

    if (needsDouble) {
      const cmd1 = this.buildContainerCommand(slots, 0, 3, options)
      const cmd2 = this.buildContainerCommand(slots, 3, rows, options)
      return { commands: [cmd1, cmd2], isDoubleChest: true }
    }

    const maxRow = Math.min(rows, Math.ceil(container.maxSlots / 9))
    const cmd = this.buildContainerCommand(slots, 0, maxRow, options)
    return { commands: [cmd], isDoubleChest: false }
  }

  private buildContainerCommand(
    slots: Record<string, SlotData>,
    startRow: number,
    endRow: number,
    options: GiveOptions,
  ): string {
    const { target, prefix, container } = options
    const items: string[] = []

    for (let r = startRow; r < endRow; r++) {
      for (let c = 0; c < 9; c++) {
        const key = `${r}-${c}`
        const slot = slots[key]
        if (!slot) continue
        const slotIndex = (r - startRow) * 9 + c
        if (slotIndex >= container.maxSlots) continue
        const tags = this.buildItemTags(slot)
        const tagStr = tags ? `,tag:{${tags}}` : ''
        items.push(`{Slot:${slotIndex}b,id:"minecraft:${slot.itemId}",Count:${slot.amount}b${tagStr}}`)
      }
    }

    const containerId = `minecraft:${container.id}`
    const itemsStr = items.join(',')
    return `${prefix}give ${target} ${containerId}{BlockEntityTag:{Items:[${itemsStr}]}} 1`
  }

  private buildItemTags(slot: SlotData): string {
    if (slot.funItemNbt) return this.buildFunItemNbtTags(slot)
    return this.buildVanillaTags(slot)
  }

  private buildVanillaTags(slot: SlotData): string {
    const parts: string[] = []

    const displayParts: string[] = []
    if (slot.displayName.length > 0) {
      displayParts.push(`Name:'${segmentsToJson(slot.displayName, { name: true })}'`)
    }
    if (slot.lore.length > 0) {
      const loreLines = slot.lore.map(line => `'${segmentsToJson(line, { lore: true })}'`).join(',')
      displayParts.push(`Lore:[${loreLines}]`)
    }
    if (displayParts.length > 0) {
      parts.push(`display:{${displayParts.join(',')}}`)
    }

    if (slot.enchanted) {
      parts.push('Enchantments:[{id:"minecraft:unbreaking",lvl:1s}]')
      const flags = slot.hideFlags | 1
      parts.push(`HideFlags:${flags}`)
    } else if (slot.hideFlags > 0) {
      parts.push(`HideFlags:${slot.hideFlags}`)
    }

    if (slot.customModelData !== null) {
      parts.push(`CustomModelData:${slot.customModelData}`)
    }

    if (slot.potionColor) {
      parts.push(`CustomPotionColor:${hexToDecimal(slot.potionColor)}`)
    }

    if (slot.skullTexture) {
      const value = this.encodeSkullTexture(slot.skullTexture)
      parts.push(`SkullOwner:{Id:[I;0,0,0,0],Properties:{textures:[{Value:"${value}"}]}}`)
    }

    if (slot.armorTrim) {
      parts.push(`Trim:{material:"minecraft:${slot.armorTrim.material}",pattern:"minecraft:${slot.armorTrim.pattern}"}`)
    }

    return parts.join(',')
  }

  private buildFunItemNbtTags(slot: SlotData): string {
    const raw = slot.funItemNbt!
    const braceIdx = raw.indexOf('{')
    const rawTags = braceIdx !== -1 ? raw.slice(braceIdx + 1, raw.lastIndexOf('}')) : ''

    const parts: string[] = []

    if (rawTags) parts.push(rawTags)

    const displayParts: string[] = []
    if (slot.displayName.length > 0) {
      displayParts.push(`Name:'${segmentsToJson(slot.displayName, { name: true })}'`)
    }
    if (slot.lore.length > 0) {
      const loreLines = slot.lore.map(line => `'${segmentsToJson(line, { lore: true })}'`).join(',')
      displayParts.push(`Lore:[${loreLines}]`)
    }
    if (displayParts.length > 0) {
      parts.push(`display:{${displayParts.join(',')}}`)
    }

    if (slot.funItemEnchantments && Object.keys(slot.funItemEnchantments).length > 0) {
      if (!rawTags.includes('Enchantments:')) {
        const enchs = Object.entries(slot.funItemEnchantments)
          .map(([id, lvl]) => `{id:"minecraft:${id}",lvl:${lvl}s}`)
          .join(',')
        parts.push(`Enchantments:[${enchs}]`)
      }
    } else if (slot.enchanted && !rawTags.includes('Enchantments:')) {
      parts.push('Enchantments:[{id:"minecraft:unbreaking",lvl:1s}]')
      parts.push(`HideFlags:${slot.hideFlags | 1}`)
    }

    if (slot.customModelData !== null && !rawTags.includes('CustomModelData:')) {
      parts.push(`CustomModelData:${slot.customModelData}`)
    }

    if (slot.potionColor && !rawTags.includes('CustomPotionColor:')) {
      parts.push(`CustomPotionColor:${hexToDecimal(slot.potionColor)}`)
    }

    if (slot.skullTexture && !rawTags.includes('SkullOwner:')) {
      const value = this.encodeSkullTexture(slot.skullTexture)
      parts.push(`SkullOwner:{Id:[I;0,0,0,0],Properties:{textures:[{Value:"${value}"}]}}`)
    }

    if (slot.armorTrim && !rawTags.includes('Trim:')) {
      parts.push(`Trim:{material:"minecraft:${slot.armorTrim.material}",pattern:"minecraft:${slot.armorTrim.pattern}"}`)
    }

    return parts.join(',')
  }

  private encodeSkullTexture(url: string): string {
    const isUrl = url.startsWith('http')
    if (!isUrl) return url
    const json = JSON.stringify({ textures: { SKIN: { url } } })
    return btoa(json)
  }
}
