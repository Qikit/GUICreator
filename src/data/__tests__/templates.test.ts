import { describe, it, expect } from 'vitest'
import { BUILT_TPLS } from '@/data/templates'

describe('BUILT_TPLS', () => {
  it('все ключи слотов в границах rows × 9', () => {
    for (const t of BUILT_TPLS) {
      for (const key of Object.keys(t.slots)) {
        const [r, c] = key.split('-').map(Number)
        expect(r).toBeGreaterThanOrEqual(0)
        expect(r).toBeLessThan(t.rows)
        expect(c).toBeGreaterThanOrEqual(0)
        expect(c).toBeLessThan(9)
      }
    }
  })

  it('содержит новые generic-пресеты', () => {
    const names = BUILT_TPLS.map(t => t.name)
    expect(names).toContain('Рамка из стекла')
    expect(names).toContain('Список с пагинацией')
    expect(names).toContain('Меню-категории')
    expect(names).toContain('Панель профиля')
  })
})
