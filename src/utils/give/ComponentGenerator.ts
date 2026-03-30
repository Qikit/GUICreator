import type { SlotData } from '@/types'
import type { CommandGenerator, GiveOptions, GiveResult } from './types'
import { segmentsToJson, hexToDecimal, isDefaultName } from './textFormat'

export class ComponentGenerator implements CommandGenerator {

  formatItem(slot: SlotData, options: Omit<GiveOptions, 'container'>): string {
    const { target, prefix } = options
    const itemId = `minecraft:${slot.itemId}`
    const components = this.buildItemComponents(slot)
    const compStr = components ? `[${components}]` : ''
    return `${prefix}give ${target} ${itemId}${compStr} ${slot.amount}`
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
        const components = this.buildSnbtComponents(slot)
        const compStr = components ? `,components:{${components}}` : ''
        items.push(`{slot:${slotIndex},item:{id:"minecraft:${slot.itemId}",count:${slot.amount}${compStr}}}`)
      }
    }

    const containerId = `minecraft:${container.id}`
    return `${prefix}give ${target} ${containerId}[container=[${items.join(',')}]] 1`
  }

  private buildSnbtComponents(slot: SlotData): string {
    if (slot.funItemComponents && slot.funItemComponents.includes('[')) {
      return this.buildFunItemSnbt(slot)
    }
    if (slot.funItemTags || slot.funItemEnchantments) {
      return this.buildFunItemPropsSnbt(slot)
    }
    return this.buildVanillaSnbt(slot)
  }

  private buildVanillaSnbt(slot: SlotData): string {
    const parts: string[] = []

    if (slot.displayName.length > 0 && !isDefaultName(slot.displayName, slot.itemId)) {
      parts.push(`"minecraft:custom_name":${segmentsToJson(slot.displayName, { name: true })}`)
    }
    if (slot.lore.length > 0) {
      const lines = slot.lore.map(line => segmentsToJson(line, { lore: true })).join(',')
      parts.push(`"minecraft:lore":[${lines}]`)
    }
    if (slot.enchanted) {
      parts.push('"minecraft:enchantment_glint_override":true')
    }
    if (slot.customModelData !== null) {
      parts.push(`"minecraft:custom_model_data":${slot.customModelData}`)
    }
    if (slot.potionColor) {
      parts.push(`"minecraft:potion_contents":{custom_color:${hexToDecimal(slot.potionColor)}}`)
    }
    if (slot.skullTexture) {
      const value = this.encodeSkullTexture(slot.skullTexture)
      parts.push(`"minecraft:profile":{id:[I;0,0,0,0],properties:[{name:"textures",value:"${value}"}]}`)
    }
    if (slot.armorTrim) {
      parts.push(`"minecraft:trim":{material:"minecraft:${slot.armorTrim.material}",pattern:"minecraft:${slot.armorTrim.pattern}"}`)
    }
    return parts.join(',')
  }

  private buildFunItemSnbt(slot: SlotData): string {
    const raw = slot.funItemComponents!
    const bracketIdx = raw.indexOf('[')
    const rawComponents = raw.slice(bracketIdx + 1, raw.lastIndexOf(']'))

    const parts: string[] = []
    if (rawComponents) {
      const converted = this.bracketToSnbt(rawComponents)
      parts.push(converted)
    }

    if (slot.displayName.length > 0) {
      parts.push(`"minecraft:custom_name":${segmentsToJson(slot.displayName, { name: true })}`)
    }
    if (slot.lore.length > 0) {
      const lines = slot.lore.map(line => segmentsToJson(line, { lore: true })).join(',')
      parts.push(`"minecraft:lore":[${lines}]`)
    }
    if (slot.funItemEnchantments && Object.keys(slot.funItemEnchantments).length > 0) {
      if (!rawComponents.includes('enchantments')) {
        const levels = Object.entries(slot.funItemEnchantments)
          .map(([id, lvl]) => `"minecraft:${id}":${lvl}`)
          .join(',')
        parts.push(`"minecraft:enchantments":{levels:{${levels}}}`)
      }
    } else if (slot.enchanted && !rawComponents.includes('enchantment_glint_override')) {
      parts.push('"minecraft:enchantment_glint_override":true')
    }
    if (slot.customModelData !== null && !rawComponents.includes('custom_model_data')) {
      parts.push(`"minecraft:custom_model_data":${slot.customModelData}`)
    }
    if (slot.potionColor && !rawComponents.includes('potion_contents')) {
      parts.push(`"minecraft:potion_contents":{custom_color:${hexToDecimal(slot.potionColor)}}`)
    }
    if (slot.skullTexture && !rawComponents.includes('profile')) {
      const value = this.encodeSkullTexture(slot.skullTexture)
      parts.push(`"minecraft:profile":{id:[I;0,0,0,0],properties:[{name:"textures",value:"${value}"}]}`)
    }
    if (slot.armorTrim && !rawComponents.includes('trim')) {
      parts.push(`"minecraft:trim":{material:"minecraft:${slot.armorTrim.material}",pattern:"minecraft:${slot.armorTrim.pattern}"}`)
    }
    return parts.join(',')
  }

  private buildFunItemPropsSnbt(slot: SlotData): string {
    const parts: string[] = []

    if (slot.displayName.length > 0) {
      parts.push(`"minecraft:custom_name":${segmentsToJson(slot.displayName, { name: true })}`)
    }
    if (slot.lore.length > 0) {
      const lines = slot.lore.map(line => segmentsToJson(line, { lore: true })).join(',')
      parts.push(`"minecraft:lore":[${lines}]`)
    }
    if (slot.funItemTags && Object.keys(slot.funItemTags).length > 0) {
      const tagParts = this.serializeTags(slot.funItemTags)
      parts.push(`"minecraft:custom_data":{${tagParts}}`)
    }
    if (slot.funItemEnchantments && Object.keys(slot.funItemEnchantments).length > 0) {
      const levels = Object.entries(slot.funItemEnchantments)
        .map(([id, lvl]) => `"minecraft:${id}":${lvl}`)
        .join(',')
      parts.push(`"minecraft:enchantments":{levels:{${levels}}}`)
    } else if (slot.enchanted) {
      parts.push('"minecraft:enchantment_glint_override":true')
    }
    if (slot.customModelData !== null) {
      parts.push(`"minecraft:custom_model_data":${slot.customModelData}`)
    }
    if (slot.potionColor) {
      parts.push(`"minecraft:potion_contents":{custom_color:${hexToDecimal(slot.potionColor)}}`)
    }
    if (slot.skullTexture) {
      const value = this.encodeSkullTexture(slot.skullTexture)
      parts.push(`"minecraft:profile":{id:[I;0,0,0,0],properties:[{name:"textures",value:"${value}"}]}`)
    }
    if (slot.armorTrim) {
      parts.push(`"minecraft:trim":{material:"minecraft:${slot.armorTrim.material}",pattern:"minecraft:${slot.armorTrim.pattern}"}`)
    }
    if (slot.funItemAttributes && slot.funItemAttributes.length > 0) {
      const mods = slot.funItemAttributes.map(a => {
        const op = a.operation === 'ADD' ? 'add_value' : a.operation === 'MULTIPLY' ? 'add_multiplied_total' : 'add_multiplied_base'
        return `{type:"minecraft:${a.type}",amount:${a.amount},operation:"${op}",slot:"${a.slot.toLowerCase()}"${a.id ? `,id:"${a.id}"` : ''}}`
      }).join(',')
      parts.push(`"minecraft:attribute_modifiers":{modifiers:[${mods}]}`)
    }
    return parts.join(',')
  }

  private bracketToSnbt(bracketStr: string): string {
    return bracketStr.replace(/(\w[\w.:]*)=/g, (_, key) => {
      if (key.includes(':')) return `"${key}":`
      return `"minecraft:${key}":`
    })
  }

  private buildItemComponents(slot: SlotData): string {
    if (slot.funItemComponents && slot.funItemComponents.includes('[')) {
      return this.buildFunItemComponents(slot)
    }
    if (slot.funItemTags || slot.funItemEnchantments) {
      return this.buildFunItemFromProperties(slot)
    }
    return this.buildVanillaComponents(slot)
  }

  private buildVanillaComponents(slot: SlotData): string {
    const parts: string[] = []

    if (slot.displayName.length > 0 && !isDefaultName(slot.displayName, slot.itemId)) {
      parts.push(`custom_name='${segmentsToJson(slot.displayName, { name: true })}'`)
    }

    if (slot.lore.length > 0) {
      const lines = slot.lore.map(line => `'${segmentsToJson(line, { lore: true })}'`).join(',')
      parts.push(`lore=[${lines}]`)
    }

    if (slot.enchanted) {
      parts.push('enchantment_glint_override=true')
    }

    if (slot.customModelData !== null) {
      parts.push(`custom_model_data=${slot.customModelData}`)
    }

    if (slot.potionColor) {
      parts.push(`potion_contents={custom_color:${hexToDecimal(slot.potionColor)}}`)
    }

    if (slot.skullTexture) {
      const value = this.encodeSkullTexture(slot.skullTexture)
      parts.push(`profile={id:[I;0,0,0,0],properties:[{name:"textures",value:"${value}"}]}`)
    }

    if (slot.armorTrim) {
      parts.push(`trim={material:"minecraft:${slot.armorTrim.material}",pattern:"minecraft:${slot.armorTrim.pattern}"}`)
    }

    return parts.join(',')
  }

  private buildFunItemComponents(slot: SlotData): string {
    const raw = slot.funItemComponents!
    const bracketIdx = raw.indexOf('[')
    const rawComponents = raw.slice(bracketIdx + 1, raw.lastIndexOf(']'))

    const parts: string[] = []
    if (rawComponents) parts.push(rawComponents)

    if (slot.displayName.length > 0) {
      parts.push(`custom_name='${segmentsToJson(slot.displayName, { name: true })}'`)
    }
    if (slot.lore.length > 0) {
      const lines = slot.lore.map(line => `'${segmentsToJson(line, { lore: true })}'`).join(',')
      parts.push(`lore=[${lines}]`)
    }

    if (slot.funItemEnchantments && Object.keys(slot.funItemEnchantments).length > 0) {
      if (!rawComponents.includes('enchantments=')) {
        const levels = Object.entries(slot.funItemEnchantments)
          .map(([id, lvl]) => `"minecraft:${id}":${lvl}`)
          .join(',')
        parts.push(`enchantments={levels:{${levels}}}`)
      }
    } else if (slot.enchanted && !rawComponents.includes('enchantment_glint_override=')) {
      parts.push('enchantment_glint_override=true')
    }

    if (slot.customModelData !== null && !rawComponents.includes('custom_model_data=')) {
      parts.push(`custom_model_data=${slot.customModelData}`)
    }
    if (slot.potionColor && !rawComponents.includes('potion_contents=')) {
      parts.push(`potion_contents={custom_color:${hexToDecimal(slot.potionColor)}}`)
    }
    if (slot.skullTexture && !rawComponents.includes('profile=')) {
      const value = this.encodeSkullTexture(slot.skullTexture)
      parts.push(`profile={id:[I;0,0,0,0],properties:[{name:"textures",value:"${value}"}]}`)
    }
    if (slot.armorTrim && !rawComponents.includes('trim=')) {
      parts.push(`trim={material:"minecraft:${slot.armorTrim.material}",pattern:"minecraft:${slot.armorTrim.pattern}"}`)
    }

    return parts.join(',')
  }

  private buildFunItemFromProperties(slot: SlotData): string {
    const parts: string[] = []

    if (slot.displayName.length > 0) {
      parts.push(`custom_name='${segmentsToJson(slot.displayName, { name: true })}'`)
    }
    if (slot.lore.length > 0) {
      const lines = slot.lore.map(line => `'${segmentsToJson(line, { lore: true })}'`).join(',')
      parts.push(`lore=[${lines}]`)
    }

    if (slot.funItemTags && Object.keys(slot.funItemTags).length > 0) {
      const tagParts = this.serializeTags(slot.funItemTags)
      parts.push(`custom_data={${tagParts}}`)
    }

    if (slot.funItemEnchantments && Object.keys(slot.funItemEnchantments).length > 0) {
      const levels = Object.entries(slot.funItemEnchantments)
        .map(([id, lvl]) => `"minecraft:${id}":${lvl}`)
        .join(',')
      parts.push(`enchantments={levels:{${levels}}}`)
    } else if (slot.enchanted) {
      parts.push('enchantment_glint_override=true')
    }

    if (slot.customModelData !== null) {
      parts.push(`custom_model_data=${slot.customModelData}`)
    }
    if (slot.potionColor) {
      parts.push(`potion_contents={custom_color:${hexToDecimal(slot.potionColor)}}`)
    }
    if (slot.skullTexture) {
      const value = this.encodeSkullTexture(slot.skullTexture)
      parts.push(`profile={id:[I;0,0,0,0],properties:[{name:"textures",value:"${value}"}]}`)
    }
    if (slot.armorTrim) {
      parts.push(`trim={material:"minecraft:${slot.armorTrim.material}",pattern:"minecraft:${slot.armorTrim.pattern}"}`)
    }

    if (slot.funItemAttributes && slot.funItemAttributes.length > 0) {
      const mods = slot.funItemAttributes.map(a => {
        const op = a.operation === 'ADD' ? 'add_value' : a.operation === 'MULTIPLY' ? 'add_multiplied_total' : 'add_multiplied_base'
        return `{type:"minecraft:${a.type}",amount:${a.amount},operation:"${op}",slot:"${a.slot.toLowerCase()}"${a.id ? `,id:"${a.id}"` : ''}}`
      }).join(',')
      parts.push(`attribute_modifiers={modifiers:[${mods}]}`)
    }

    return parts.join(',')
  }

  private serializeTags(tags: Record<string, Record<string, unknown>>): string {
    const parts: string[] = []
    for (const [key, valueMap] of Object.entries(tags)) {
      for (const [type, val] of Object.entries(valueMap)) {
        if (type === 'BOOLEAN') parts.push(`"${key}":${val ? '1b' : '0b'}`)
        else if (type === 'STRING') parts.push(`"${key}":"${val}"`)
        else if (type === 'INT') parts.push(`"${key}":${val}`)
        else if (type === 'DOUBLE') parts.push(`"${key}":${val}d`)
        else if (type === 'FLOAT') parts.push(`"${key}":${val}f`)
        else parts.push(`"${key}":${JSON.stringify(val)}`)
      }
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
