import type { TextSegment } from '@/types'

interface FormatOptions {
  lore?: boolean
  name?: boolean
}

export function segmentToJson(seg: TextSegment, opts: FormatOptions = {}): string {
  const obj: Record<string, unknown> = { text: seg.text }

  const needExplicitColor = opts.lore || opts.name
  if (needExplicitColor || seg.color !== '#FFFFFF') {
    obj.color = seg.color === '#FFFFFF' && opts.lore ? 'white' : seg.color
  }

  if (seg.bold) obj.bold = true
  if (seg.italic) obj.italic = true
  if (seg.underlined) obj.underlined = true
  if (seg.strikethrough) obj.strikethrough = true
  if (seg.obfuscated) obj.obfuscated = true

  if ((opts.lore || opts.name) && !seg.italic) obj.italic = false

  return JSON.stringify(obj)
}

export function segmentsToJson(segs: TextSegment[], opts: FormatOptions = {}): string {
  if (segs.length === 0) return '{"text":""}'
  if (segs.length === 1) return segmentToJson(segs[0], opts)
  return '[' + segs.map(s => segmentToJson(s, opts)).join(',') + ']'
}

export function hexToDecimal(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}

export function isDefaultName(segs: TextSegment[], itemId: string): boolean {
  if (segs.length !== 1) return false
  const s = segs[0]
  if (s.bold || s.italic || s.underlined || s.strikethrough || s.obfuscated) return false
  if (s.color !== '#FFFFFF') return false
  const expected = itemId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return s.text === expected
}
