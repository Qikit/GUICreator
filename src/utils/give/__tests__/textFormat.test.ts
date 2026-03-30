import { describe, it, expect } from 'vitest'
import { segmentsToJson, segmentToJson, hexToDecimal, isDefaultName } from '../textFormat'
import type { TextSegment } from '@/types'

const seg = (text: string, overrides: Partial<TextSegment> = {}): TextSegment => ({
  text, color: '#FFFFFF', bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false, ...overrides,
})

describe('segmentToJson', () => {
  it('plain white text, no formatting', () => {
    expect(segmentToJson(seg('Hello'))).toBe('{"text":"Hello"}')
  })
  it('colored bold text', () => {
    const result = JSON.parse(segmentToJson(seg('Fire', { color: '#FF5555', bold: true })))
    expect(result).toEqual({ text: 'Fire', color: '#FF5555', bold: true })
  })
  it('italic text', () => {
    const result = JSON.parse(segmentToJson(seg('Lore', { color: '#AAAAAA', italic: true })))
    expect(result.italic).toBe(true)
  })
  it('omits false formatting fields except color', () => {
    const json = segmentToJson(seg('Plain'))
    const parsed = JSON.parse(json)
    expect(parsed).toEqual({ text: 'Plain' })
    expect(parsed.bold).toBeUndefined()
  })
  it('white color is omitted', () => {
    const json = segmentToJson(seg('White'))
    expect(JSON.parse(json).color).toBeUndefined()
  })
})

describe('segmentsToJson', () => {
  it('single segment', () => {
    expect(segmentsToJson([seg('Solo')])).toBe('{"text":"Solo"}')
  })
  it('multiple segments as array', () => {
    const segs = [seg('Fire ', { color: '#FF5555', bold: true }), seg('Sword', { color: '#FFAA00' })]
    const result = segmentsToJson(segs)
    const parsed = JSON.parse(result)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].text).toBe('Fire ')
    expect(parsed[1].color).toBe('#FFAA00')
  })
  it('empty segments returns empty text', () => {
    expect(segmentsToJson([])).toBe('{"text":""}')
  })
  it('lore context adds italic:false when not italic', () => {
    const result = segmentsToJson([seg('Line')], { lore: true })
    const parsed = JSON.parse(result)
    expect(parsed.italic).toBe(false)
  })
  it('lore context adds color:white for white text', () => {
    const result = segmentsToJson([seg('White line')], { lore: true })
    const parsed = JSON.parse(result)
    expect(parsed.color).toBe('white')
  })
  it('lore context keeps non-white color as hex', () => {
    const result = segmentsToJson([seg('Red', { color: '#FF0000' })], { lore: true })
    const parsed = JSON.parse(result)
    expect(parsed.color).toBe('#FF0000')
  })
  it('name context adds italic:false and includes color', () => {
    const result = segmentsToJson([seg('Name')], { name: true })
    const parsed = JSON.parse(result)
    expect(parsed.italic).toBe(false)
    expect(parsed.color).toBe('#FFFFFF')
  })
})

describe('isDefaultName', () => {
  it('true for default name matching itemId', () => {
    expect(isDefaultName([seg('Diamond Sword')], 'diamond_sword')).toBe(true)
  })
  it('false for custom name', () => {
    expect(isDefaultName([seg('Fire Sword')], 'diamond_sword')).toBe(false)
  })
  it('false for colored name', () => {
    expect(isDefaultName([seg('Diamond Sword', { color: '#FF0000' })], 'diamond_sword')).toBe(false)
  })
  it('false for bold name', () => {
    expect(isDefaultName([seg('Diamond Sword', { bold: true })], 'diamond_sword')).toBe(false)
  })
  it('false for multi-segment name', () => {
    expect(isDefaultName([seg('Diamond '), seg('Sword')], 'diamond_sword')).toBe(false)
  })
})

describe('hexToDecimal', () => {
  it('converts #FF0000 to 16711680', () => { expect(hexToDecimal('#FF0000')).toBe(16711680) })
  it('converts #00FF00 to 65280', () => { expect(hexToDecimal('#00FF00')).toBe(65280) })
  it('converts #000000 to 0', () => { expect(hexToDecimal('#000000')).toBe(0) })
})
