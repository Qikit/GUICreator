import type { SlotData, TextSegment } from '@/types'
import { defaultSegment, defSlot } from '@/utils/slot'
import { parseMM } from '@/utils/minimessage'

/**
 * Parse FunMenu Kotlin class to extract slots
 */
export function parseFunMenu(code: string): { name: string; rows: number; slots: Record<string, SlotData> } | null {
  try {
    const slots: Record<string, SlotData> = {}

    // Extract pattern
    const patternMatch = code.match(/pattern\s*=\s*"([^"]+)"/)
    if (!patternMatch) return null
    const pattern = patternMatch[1]
    const rows = Math.ceil(pattern.length / 9)

    // Map pattern chars to slot positions
    const charToSlot: Record<string, string> = {}
    for (let i = 0; i < pattern.length; i++) {
      const ch = pattern[i]
      if (ch === ' ') continue
      const r = Math.floor(i / 9)
      const c = i % 9
      charToSlot[ch] = `${r}-${c}`
    }

    // Extract iconAt blocks
    const iconAtRegex = /iconAt\(\s*'(.)'\s*\)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs
    let m
    while ((m = iconAtRegex.exec(code)) !== null) {
      const ch = m[1]
      const body = m[2]
      const slotKey = charToSlot[ch]
      if (!slotKey) continue

      // Extract material
      const matMatch = body.match(/material\s*=\s*Material\.(\w+)/)
      const itemId = matMatch ? matMatch[1].toLowerCase() : 'stone'

      // Extract name (MiniMessage)
      const nameMatch = body.match(/name\s*=\s*mini\s*\{[^}]*"([^"]*)"/)
      const displayName: TextSegment[] = nameMatch ? parseMM(nameMatch[1]) : [defaultSegment(itemId, '#FFFFFF')]

      // Extract glow
      const glowMatch = body.match(/glowing\s*=\s*true/)
      const enchanted = !!glowMatch

      const slot = defSlot(itemId)
      slot.displayName = displayName
      slot.enchanted = enchanted
      slots[slotKey] = slot
    }

    // Extract title/name
    const titleMatch = code.match(/title\s*=\s*mini\s*\{[^}]*"([^"]*)"/) || code.match(/class\s+(\w+)/)
    const name = titleMatch ? titleMatch[1] : 'Imported Menu'

    return { name, rows, slots }
  } catch {
    return null
  }
}

/**
 * Parse AbstractMenus YAML config to extract slots
 */
export function parseAbstractMenus(yaml: string): { name: string; rows: number; slots: Record<string, SlotData> } | null {
  try {
    const slots: Record<string, SlotData> = {}
    const lines = yaml.split('\n')

    // Extract title
    let name = 'Imported Menu'
    const titleLine = lines.find(l => l.match(/^\s*title:/))
    if (titleLine) {
      const tm = titleLine.match(/title:\s*['"]?(.+?)['"]?\s*$/)
      if (tm) name = tm[1]
    }

    // Extract size
    let rows = 3
    const sizeLine = lines.find(l => l.match(/^\s*size:/))
    if (sizeLine) {
      const sm = sizeLine.match(/size:\s*(\d+)/)
      if (sm) rows = Math.ceil(parseInt(sm[1]) / 9)
    }

    // Extract items by slot number
    const itemRegex = /^\s*(\d+):\s*$/gm
    let im
    while ((im = itemRegex.exec(yaml)) !== null) {
      const slotNum = parseInt(im[1])
      const r = Math.floor(slotNum / 9)
      const c = slotNum % 9
      const key = `${r}-${c}`

      // Find material in following lines
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
