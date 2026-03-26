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
