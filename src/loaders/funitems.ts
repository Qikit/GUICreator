import type { ItemDatabase } from '@/types'
import { parseMM } from '@/utils/minimessage'
import { intToHex } from '@/utils/color'

interface FunItemEntry {
  item?: string
  components?: string
  properties?: {
    identifier?: string
    display?: string
    lores?: string[]
    enchantments?: Record<string, number>
    skull?: { texture?: string }
  }
}

interface FunItemCategory {
  categoryId?: string
  items?: FunItemEntry[]
}

function parseMaterial(entry: FunItemEntry): string {
  if (entry.components) {
    const m = entry.components.match(/^minecraft:([a-z_]+)/)
    if (m) return m[1]
  }
  if (entry.item) {
    const m = entry.item.match(/^([A-Z_]+)/)
    if (m) return m[1].toLowerCase()
  }
  return 'stone'
}

function parsePotionColor(entry: FunItemEntry): string | null {
  if (entry.components) {
    const m = entry.components.match(/custom_color:\s*(\d+)/)
    if (m) return intToHex(parseInt(m[1]))
  }
  if (entry.item) {
    const m = entry.item.match(/CustomPotionColor:\s*(\d+)/)
    if (m) return intToHex(parseInt(m[1]))
  }
  return null
}

function parseCMD(entry: FunItemEntry): number | null {
  if (entry.components) {
    const m = entry.components.match(/custom_model_data=\{floats:\[(\d+)/) ||
              entry.components.match(/custom_model_data=(\d+)/)
    if (m) return parseInt(m[1])
  }
  if (entry.item) {
    const m = entry.item.match(/CustomModelData:\s*(\d+)/)
    if (m) return parseInt(m[1])
  }
  return null
}

function parseSkullTexture(entry: FunItemEntry): string | null {
  const skull = entry.properties?.skull
  if (skull?.texture) {
    try {
      const json = JSON.parse(atob(skull.texture))
      return json.textures?.SKIN?.url || null
    } catch { return null }
  }
  return null
}

let rpIndex: Record<string, string> = {}

export function setRPIndex(index: Record<string, string>) {
  rpIndex = index
}

export async function loadFunItems(db: ItemDatabase): Promise<number> {
  try {
    const r = await fetch('/assets/funitems/index.json')
    if (!r.ok) return 0
    const files: string[] = await r.json()

    const results = await Promise.all(
      files.map(f => fetch(`/assets/funitems/${f}`).then(r => r.ok ? r.json() as Promise<FunItemCategory> : null).catch(() => null))
    )

    let total = 0
    for (const data of results) {
      if (!data?.items) continue
      const catId = 'ft_' + (data.categoryId || 'misc').replace(/[^a-z0-9]/g, '_')
      const catLabel = 'FT: ' + (data.categoryId || 'misc').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      const items: Array<{ id: string; name: string; preset: Record<string, unknown> }> = []

      for (const entry of data.items) {
        const props = entry.properties
        if (!props) continue
        const mat = parseMaterial(entry)
        const display = props.display || props.identifier || mat
        const lores = props.lores || []
        const ench = !!props.enchantments && Object.keys(props.enchantments).length > 0
        const pc = parsePotionColor(entry)
        const skull = parseSkullTexture(entry)
        const cmd = parseCMD(entry)
        const rpTex = cmd ? rpIndex[`${mat}:${cmd}`] || null : null

        items.push({
          id: mat,
          name: (props.identifier || mat).replace(/[-_]/g, ' '),
          preset: {
            displayName: parseMM(display),
            lore: lores.map(l => parseMM(l)),
            enchanted: ench,
            potionColor: pc,
            skullTexture: skull,
            customModelData: cmd,
            rpTexture: rpTex,
          },
        })
        total++
      }
      if (items.length) db[catId] = { label: catLabel, preset: true, items: items as never }
    }
    return total
  } catch {
    return 0
  }
}
