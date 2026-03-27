import type { SlotData, TextSegment } from '@/types'
import { defaultSegment, defSlot } from '@/utils/slot'
import { parseMM } from '@/utils/minimessage'

export function parseAbstractMenus(yaml: string): { name: string; rows: number; slots: Record<string, SlotData> } | null {
  try {
    const slots: Record<string, SlotData> = {}
    const lines = yaml.split('\n')

    let name = 'Imported Menu'
    const titleLine = lines.find(l => l.match(/^\s*title:/))
    if (titleLine) {
      const tm = titleLine.match(/title:\s*['"]?(.+?)['"]?\s*$/)
      if (tm) name = tm[1]
    }

    let rows = 3
    const sizeLine = lines.find(l => l.match(/^\s*size:/))
    if (sizeLine) {
      const sm = sizeLine.match(/size:\s*(\d+)/)
      if (sm) rows = Math.ceil(parseInt(sm[1]) / 9)
    }

    const itemRegex = /^\s*(\d+):\s*$/gm
    let im
    while ((im = itemRegex.exec(yaml)) !== null) {
      const slotNum = parseInt(im[1])
      const r = Math.floor(slotNum / 9)
      const c = slotNum % 9
      const key = `${r}-${c}`

      const afterMatch = yaml.slice(im.index + im[0].length)
      const matMatch = afterMatch.match(/material:\s*(\w+)/)
      const nameMatch = afterMatch.match(/name:\s*['"]?(.+?)['"]?\s*$/m)

      const itemId = matMatch ? matMatch[1].toLowerCase() : 'stone'
      const displayName: TextSegment[] = nameMatch ? parseMM(nameMatch[1]) : [defaultSegment(itemId, '#FFFFFF')]

      const slot = defSlot(itemId)
      slot.displayName = displayName
      slots[key] = slot
    }

    return { name, rows, slots }
  } catch {
    return null
  }
}
