import { describe, it, expect } from 'vitest'
import { enToRu, ruToEn } from '@/utils/keyboardLayout'

describe('keyboardLayout', () => {
  it('enToRu: латиница в QWERTY → кириллица ЙЦУКЕН', () => {
    expect(enToRu('ldthm')).toBe('дверь')
    expect(enToRu('rybuf')).toBe('книга')
  })
  it('ruToEn: обратное преобразование', () => {
    expect(ruToEn('дверь')).toBe('ldthm')
  })
  it('сохраняет пробелы и незамапленные символы', () => {
    expect(enToRu('ab 12')).toBe('фи 12')
  })
  it('идемпотентен на незамапленных символах (цифры)', () => {
    expect(ruToEn('123')).toBe('123')
  })
})
