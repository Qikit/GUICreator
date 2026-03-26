import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('TypeScript works', () => {
    const x: number = 1 + 1
    expect(x).toBe(2)
  })

  it('imports resolve with @/ alias', async () => {
    const types = await import('@/types')
    expect(types).toBeDefined()
  })
})
