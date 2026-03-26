import { describe, it, expect } from 'vitest'
import { gid } from '../id'

describe('gid', () => {
  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => gid()))
    expect(ids.size).toBe(100)
  })

  it('returns string', () => {
    expect(typeof gid()).toBe('string')
    expect(gid().length).toBeGreaterThan(5)
  })
})
