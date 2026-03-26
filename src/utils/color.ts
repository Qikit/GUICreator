import { MC_COLORS } from '@/data/colors'

export interface RGB {
  r: number
  g: number
  b: number
}

export function hexToRgb(hex: string): RGB {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()
}

export function lerpColor(c1: string, c2: string, t: number): string {
  const a = hexToRgb(c1)
  const b = hexToRgb(c2)
  return rgbToHex(
    Math.round(a.r + (b.r - a.r) * t),
    Math.round(a.g + (b.g - a.g) * t),
    Math.round(a.b + (b.b - a.b) * t),
  )
}

export function closestMC(hex: string): string {
  hex = hex.toUpperCase()
  const exact = MC_COLORS.find(c => c.hex.toUpperCase() === hex)
  if (exact) return exact.code

  let best = MC_COLORS[15]
  let bestDist = Infinity
  const { r: r1, g: g1, b: b1 } = hexToRgb(hex)

  for (const c of MC_COLORS) {
    const { r: r2, g: g2, b: b2 } = hexToRgb(c.hex)
    const d = (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2
    if (d < bestDist) {
      bestDist = d
      best = c
    }
  }
  return best.code
}

export function mcName(hex: string): string | null {
  hex = hex.toUpperCase()
  const m = MC_COLORS.find(c => c.hex.toUpperCase() === hex)
  return m ? m.name : null
}

export function colorDist(c1: string, c2: string): number {
  const a = hexToRgb(c1)
  const b = hexToRgb(c2)
  return Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b))
}

export function hsv2hex(h: number, s: number, v: number): string {
  s /= 100
  v /= 100
  const c = v * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  )
}

export function intToHex(value: number): string {
  return '#' +
    ((value >> 16) & 0xFF).toString(16).padStart(2, '0') +
    ((value >> 8) & 0xFF).toString(16).padStart(2, '0') +
    (value & 0xFF).toString(16).padStart(2, '0')
}
