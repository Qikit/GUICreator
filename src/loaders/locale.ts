import { setRuLocale } from '@/utils/slot'
import { assetUrl } from '@/utils/paths'

export async function loadLocale(): Promise<number> {
  try {
    const r = await fetch(assetUrl('assets/minecraft/lang/ru_ru.json'))
    if (!r.ok) return 0
    const data: Record<string, string> = await r.json()
    const result: Record<string, string> = {}
    for (const [key, val] of Object.entries(data)) {
      if (key.startsWith('item.minecraft.')) result[key.slice(15)] = val
      else if (key.startsWith('block.minecraft.') && !result[key.slice(16)]) result[key.slice(16)] = val
    }
    setRuLocale(result)
    return Object.keys(result).length
  } catch {
    return 0
  }
}
