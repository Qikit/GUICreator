import { describe, it, expect } from 'vitest'
import { hexToRgb, rgbToHex, lerpColor, hsv2hex, intToHex } from '../color'

describe('color utils', () => {
  it('hexToRgb parses correctly', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 })
    expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 })
  })

  it('rgbToHex formats correctly', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#FF0000')
    expect(rgbToHex(0, 128, 255)).toBe('#0080FF')
  })

  it('lerpColor interpolates', () => {
    expect(lerpColor('#000000', '#FFFFFF', 0.5)).toBe('#808080')
    expect(lerpColor('#FF0000', '#FF0000', 0.5)).toBe('#FF0000')
  })

  it('hsv2hex converts', () => {
    expect(hsv2hex(0, 100, 100)).toBe('#FF0000')
    expect(hsv2hex(120, 100, 100)).toBe('#00FF00')
    expect(hsv2hex(0, 0, 100)).toBe('#FFFFFF')
  })

  it('intToHex converts MC int colors', () => {
    expect(intToHex(16738740)).toBe('#ff69b4')
    expect(intToHex(16777215)).toBe('#ffffff')
    expect(intToHex(0)).toBe('#000000')
  })
})
