import { describe, it, expect } from 'vitest'
import { parseMM, seg2mm, seg2leg } from '../minimessage'

describe('parseMM', () => {
  it('parses plain text', () => {
    const segs = parseMM('Hello')
    expect(segs).toHaveLength(1)
    expect(segs[0].text).toBe('Hello')
    expect(segs[0].color).toBe('#FFFFFF')
  })

  it('parses hex color', () => {
    const segs = parseMM('<#FF0000>Red text')
    expect(segs[0].color).toBe('#FF0000')
    expect(segs[0].text).toBe('Red text')
  })

  it('parses named MC color', () => {
    const segs = parseMM('<gold>Golden')
    expect(segs[0].color).toBe('#FFAA00')
  })

  it('parses bold', () => {
    const segs = parseMM('<bold>Strong</bold>')
    expect(segs[0].bold).toBe(true)
    expect(segs[0].text).toBe('Strong')
  })

  it('parses gradient', () => {
    const segs = parseMM('<gradient:#FF0000:#0000FF>AB</gradient>')
    expect(segs).toHaveLength(2)
    expect(segs[0].color).toBe('#FF0000')
    expect(segs[1].color).toBe('#0000FF')
  })

  it('returns empty for empty input', () => {
    expect(parseMM('')).toEqual([])
    expect(parseMM('  ')).toEqual([])
  })

  it('merges adjacent same-style segments', () => {
    const segs = parseMM('<#FF0000>A<#FF0000>B')
    expect(segs).toHaveLength(1)
    expect(segs[0].text).toBe('AB')
  })
})

describe('seg2mm', () => {
  it('serializes to MiniMessage', () => {
    const segs = parseMM('<red>Hello')
    const mm = seg2mm(segs)
    expect(mm).toContain('Hello')
    expect(mm).toContain('red')
  })
})

describe('seg2leg', () => {
  it('serializes to legacy codes', () => {
    const segs = parseMM('<red>Hello')
    const leg = seg2leg(segs)
    expect(leg).toContain('\u00A7c')
    expect(leg).toContain('Hello')
  })
})

describe('gradient round-trip', () => {
  it('\u043F\u043E\u043C\u0435\u0447\u0430\u0435\u0442 \u0441\u0438\u043C\u0432\u043E\u043B\u044B \u0433\u0440\u0430\u0434\u0438\u0435\u043D\u0442\u0430 \u043E\u0431\u0449\u0438\u043C gradientId \u0438 \u0438\u0441\u0445\u043E\u0434\u043D\u044B\u043C\u0438 \u0441\u0442\u043E\u043F\u0430\u043C\u0438', () => {
    const segs = parseMM('<gradient:#FF0000:#0000FF>AB</gradient>')
    expect(segs).toHaveLength(2)
    expect(segs[0].gradientId).toBeDefined()
    expect(segs[0].gradientId).toBe(segs[1].gradientId)
    expect(segs[0].gradientStops).toEqual(['#FF0000', '#0000FF'])
  })

  it('\u043D\u0435 \u0441\u043A\u043B\u0435\u0438\u0432\u0430\u0435\u0442 \u0433\u0440\u0430\u0434\u0438\u0435\u043D\u0442 \u0441 \u0441\u043E\u0441\u0435\u0434\u043D\u0438\u043C \u043E\u0431\u044B\u0447\u043D\u044B\u043C \u0442\u0435\u043A\u0441\u0442\u043E\u043C', () => {
    const segs = parseMM('<gradient:#FF0000:#0000FF>AB</gradient>C')
    expect(segs.filter(s => s.gradientId)).toHaveLength(2)
    expect(segs[segs.length - 1].gradientId).toBeUndefined()
  })

  it('round-trip \u043F\u043E\u043B\u043D\u043E\u0433\u043E \u0433\u0440\u0430\u0434\u0438\u0435\u043D\u0442\u0430', () => {
    const mm = '<gradient:#FF0000:#0000FF>Hello</gradient>'
    expect(seg2mm(parseMM(mm))).toBe(mm)
  })

  it('round-trip \u0447\u0430\u0441\u0442\u0438\u0447\u043D\u043E\u0433\u043E \u0433\u0440\u0430\u0434\u0438\u0435\u043D\u0442\u0430 \u0432\u043D\u0443\u0442\u0440\u0438 \u0441\u0442\u0440\u043E\u043A\u0438', () => {
    const segs = parseMM('AB<gradient:#FF0000:#0000FF>XYZ</gradient>')
    expect(seg2mm(segs)).toContain('<gradient:#FF0000:#0000FF>XYZ</gradient>')
  })

  it('\u0431\u0435\u0437 \u0434\u0440\u0435\u0439\u0444\u0430 \u0446\u0432\u0435\u0442\u0430 \u0437\u0430 3 \u043F\u0440\u043E\u0445\u043E\u0434\u0430 (\u043C\u0443\u043B\u044C\u0442\u0438\u0441\u0442\u043E\u043F)', () => {
    const mm = '<gradient:#FF0000:#00FF00:#0000FF>Gradient</gradient>'
    let s = mm
    for (let i = 0; i < 3; i++) s = seg2mm(parseMM(s))
    expect(s).toBe(mm)
  })

  it('\u043E\u0431\u044B\u0447\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442, \u043D\u0430\u0447\u0438\u043D\u0430\u044E\u0449\u0438\u0439\u0441\u044F \u0441 \u043C\u0430\u0440\u043A\u0435\u0440-\u043F\u043E\u0434\u043E\u0431\u043D\u043E\u0439 \u0441\u0442\u0440\u043E\u043A\u0438, \u043D\u0435 \u0442\u0435\u0440\u044F\u0435\u0442\u0441\u044F', () => {
    const segs = parseMM(' g0 hello')
    expect(segs[0].text).toBe(' g0 hello')
    expect(segs[0].gradientId).toBeUndefined()
  })
})
