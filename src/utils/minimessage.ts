import type { TextSegment } from '@/types'
import { MC_COLORS } from '@/data/colors'
import { lerpColor, closestMC, mcName, colorDist } from './color'

const DEF_STYLE: Omit<TextSegment, 'text'> = {
  color: '#FFFFFF', bold: false, italic: false,
  underlined: false, strikethrough: false, obfuscated: false,
}

const FMT: Record<string, keyof Omit<TextSegment, 'text' | 'color'>> = {
  bold: 'bold', b: 'bold',
  italic: 'italic', i: 'italic', em: 'italic',
  underlined: 'underlined', u: 'underlined',
  strikethrough: 'strikethrough', st: 'strikethrough',
  obfuscated: 'obfuscated', obf: 'obfuscated',
}

function expandGradients(str: string): string {
  return str.replace(/<gradient((?::#[0-9A-Fa-f]{6})+)>([\s\S]*?)<\/gradient>/gi,
    (_match, colorsStr: string, text: string) => {
      const colors = colorsStr.split(':').filter(Boolean).map((c: string) => c.toUpperCase())
      if (colors.length < 2 || text.length === 0) return text
      let result = ''
      const len = text.length
      for (let i = 0; i < len; i++) {
        const t = len === 1 ? 0 : i / (len - 1)
        const totalSegs = colors.length - 1
        const segIdx = Math.min(Math.floor(t * totalSegs), totalSegs - 1)
        const segT = (t * totalSegs) - segIdx
        const hex = lerpColor(colors[segIdx], colors[segIdx + 1], segT)
        result += `<${hex}>${text[i]}</${hex}>`
      }
      return result
    })
}

export function parseMM(input: string): TextSegment[] {
  if (!input || !input.trim()) return []
  const segs: TextSegment[] = []
  let pos = 0
  const stack: Array<Omit<TextSegment, 'text'>> = [{ ...DEF_STYLE }]
  const cur = () => stack[stack.length - 1]

  const expanded = expandGradients(input)

  while (pos < expanded.length) {
    if (expanded[pos] === '<') {
      const gt = expanded.indexOf('>', pos)
      if (gt === -1) { segs.push({ ...cur(), text: expanded.slice(pos) }); break }
      const tag = expanded.slice(pos + 1, gt).trim()
      pos = gt + 1
      if (tag.startsWith('/')) { if (stack.length > 1) stack.pop(); continue }
      if (tag === 'reset' || tag === 'r') { stack.length = 1; stack[0] = { ...DEF_STYLE }; continue }
      if (tag === 'newline' || tag === 'br') continue
      const st = { ...cur() }
      if (tag in FMT) { (st as unknown as Record<string, boolean>)[FMT[tag]] = true }
      else if (tag.startsWith('#') && /^#[0-9A-Fa-f]{6}$/.test(tag)) { st.color = tag.toUpperCase() }
      else if (tag.startsWith('color:') || tag.startsWith('c:')) {
        const cn = tag.split(':')[1]
        if (cn.startsWith('#') && /^#[0-9A-Fa-f]{6}$/.test(cn)) st.color = cn.toUpperCase()
        else { const mc = MC_COLORS.find(c => c.name === cn); if (mc) st.color = mc.hex }
      }
      else { const mc = MC_COLORS.find(c => c.name === tag); if (mc) st.color = mc.hex }
      stack.push(st)
    } else {
      let end = expanded.indexOf('<', pos)
      if (end === -1) end = expanded.length
      const text = expanded.slice(pos, end)
      pos = end
      if (text) {
        const s = cur()
        segs.push({ text, color: s.color, bold: s.bold, italic: s.italic, underlined: s.underlined, strikethrough: s.strikethrough, obfuscated: s.obfuscated })
      }
    }
  }

  const merged: TextSegment[] = []
  for (const s of segs) {
    const last = merged[merged.length - 1]
    if (last && last.color === s.color && last.bold === s.bold && last.italic === s.italic &&
        last.underlined === s.underlined && last.strikethrough === s.strikethrough && last.obfuscated === s.obfuscated) {
      last.text += s.text
    } else { merged.push({ ...s }) }
  }
  return merged
}

function detectGradientStops(colors: string[]): string[] | null {
  const n = colors.length
  if (n < 2) return null
  for (let k = 2; k <= Math.min(n, 12); k++) {
    const stops: string[] = []
    for (let i = 0; i < k; i++) {
      const idx = k === 1 ? 0 : Math.round(i * (n - 1) / (k - 1))
      stops.push(colors[idx])
    }
    let ok = true
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1)
      const ts = k - 1
      const si = Math.min(Math.floor(t * ts), ts - 1)
      const st = (t * ts) - si
      const exp = lerpColor(stops[si], stops[si + 1], st)
      if (colorDist(colors[i], exp) > 6) { ok = false; break }
    }
    if (ok) return stops
  }
  return null
}

export function seg2mm(segs: TextSegment[]): string {
  if (!segs || !segs.length) return ''
  if (segs.length >= 3 && segs.every(s => s.text.length === 1)) {
    const { bold, italic, underlined, strikethrough, obfuscated } = segs[0]
    if (segs.every(s => s.bold === bold && s.italic === italic && s.underlined === underlined && s.strikethrough === strikethrough && s.obfuscated === obfuscated)) {
      const stops = detectGradientStops(segs.map(s => s.color))
      if (stops) {
        let inner = segs.map(s => s.text).join('')
        if (obfuscated) inner = `<obfuscated>${inner}</obfuscated>`
        if (strikethrough) inner = `<strikethrough>${inner}</strikethrough>`
        if (underlined) inner = `<underlined>${inner}</underlined>`
        if (italic) inner = `<italic>${inner}</italic>`
        if (bold) inner = `<bold>${inner}</bold>`
        return `<gradient:${stops.join(':')}>${inner}</gradient>`
      }
    }
  }
  let r = ''
  for (const s of segs) {
    const cn = mcName(s.color) || s.color
    let inner = s.text
    if (s.obfuscated) inner = `<obfuscated>${inner}</obfuscated>`
    if (s.strikethrough) inner = `<strikethrough>${inner}</strikethrough>`
    if (s.underlined) inner = `<underlined>${inner}</underlined>`
    if (s.italic) inner = `<italic>${inner}</italic>`
    if (s.bold) inner = `<bold>${inner}</bold>`
    if (cn === 'white' || cn === '#FFFFFF') r += inner
    else r += `<${cn}>${inner}</${cn}>`
  }
  return r
}

export function seg2leg(segs: TextSegment[]): string {
  if (!segs || !segs.length) return ''
  let r = ''
  for (const s of segs) {
    r += closestMC(s.color)
    if (s.bold) r += '\u00A7l'
    if (s.italic) r += '\u00A7o'
    if (s.underlined) r += '\u00A7n'
    if (s.strikethrough) r += '\u00A7m'
    if (s.obfuscated) r += '\u00A7k'
    r += s.text
  }
  return r
}

export function seg2amText(segs: TextSegment[]): string {
  if (!segs || !segs.length) return ''
  let r = ''
  for (const s of segs) {
    r += '<' + s.color + '>'
    if (s.bold) r += '&l'
    if (s.italic) r += '&o'
    if (s.underlined) r += '&n'
    if (s.strikethrough) r += '&m'
    if (s.obfuscated) r += '&k'
    r += s.text
  }
  return r
}
