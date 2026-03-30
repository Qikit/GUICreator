import type { SlotData, TextSegment } from '@/types'
import { defaultSegment, itemName } from '@/utils/slot'

interface JsonTextComponent {
  text: string
  color?: string
  bold?: boolean
  italic?: boolean
  underlined?: boolean
  strikethrough?: boolean
  obfuscated?: boolean
}

interface JsonSlot {
  s: number
  id: string
  count: number
  name?: JsonTextComponent[]
  lore?: JsonTextComponent[][]
  enchantments?: Record<string, number>
  glint?: boolean
  cmd?: number
  potionColor?: string
  skull?: string
  trim?: { material: string; pattern: string }
  flags?: number
  nbt?: string
  components?: string
  ftid?: string
}

interface InventoryJson {
  v: number
  title: string
  size: number
  slots: JsonSlot[]
}

function mapTextComponent(tc: JsonTextComponent): TextSegment {
  return {
    text: tc.text ?? '',
    color: tc.color ?? '#FFFFFF',
    bold: tc.bold ?? false,
    italic: tc.italic ?? false,
    underlined: tc.underlined ?? false,
    strikethrough: tc.strikethrough ?? false,
    obfuscated: tc.obfuscated ?? false,
  }
}

export function parseInventoryJson(input: string): { name: string; rows: number; slots: Record<string, SlotData> } | null {
  try {
    const data: InventoryJson = JSON.parse(input)
    if (data.v !== 1 || !data.title || !data.size) return null

    const rows = Math.ceil(data.size / 9)
    const slots: Record<string, SlotData> = {}

    for (const js of (data.slots ?? [])) {
      const row = Math.floor(js.s / 9)
      const col = js.s % 9
      const key = `${row}-${col}`

      const displayName: TextSegment[] = js.name?.length
        ? js.name.map(mapTextComponent)
        : [defaultSegment(itemName(js.id), '#FFFFFF')]

      const lore: TextSegment[][] = js.lore?.length
        ? js.lore.map(line => line.map(mapTextComponent))
        : []

      const hasRealEnchants = js.enchantments && Object.keys(js.enchantments).length > 0
      const enchanted = hasRealEnchants || (js.glint ?? false)

      const slot: SlotData = {
        itemId: js.id,
        displayName,
        lore,
        amount: js.count ?? 1,
        enchanted,
        customModelData: js.cmd ?? null,
        hideFlags: js.flags ?? 0,
        potionColor: js.potionColor ?? null,
        skullTexture: js.skull ?? null,
        armorTrim: js.trim ? { material: js.trim.material, pattern: js.trim.pattern } : null,
        funItemId: js.ftid,
        funItemNbt: js.nbt,
        funItemComponents: js.components,
        funItemEnchantments: hasRealEnchants ? js.enchantments : undefined,
      }

      slots[key] = slot
    }

    return { name: data.title, rows, slots }
  } catch {
    return null
  }
}
