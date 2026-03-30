import { describe, it, expect } from 'vitest'
import { CONTAINERS, SHULKER_COLORS, getContainerId, filterContainers } from '../containers'

describe('CONTAINERS', () => {
  it('has 7 container types', () => { expect(CONTAINERS).toHaveLength(7) })
  it('chest has 27 slots and doubleAllowed', () => {
    const chest = CONTAINERS.find(c => c.id === 'chest')!
    expect(chest.maxSlots).toBe(27)
    expect(chest.doubleAllowed).toBe(true)
  })
  it('hopper has 5 slots', () => {
    const hopper = CONTAINERS.find(c => c.id === 'hopper')!
    expect(hopper.maxSlots).toBe(5)
    expect(hopper.doubleAllowed).toBe(false)
  })
})

describe('getContainerId', () => {
  it('returns plain id when no color', () => { expect(getContainerId('shulker_box', '')).toBe('shulker_box') })
  it('returns colored shulker id', () => { expect(getContainerId('shulker_box', 'red')).toBe('red_shulker_box') })
  it('ignores color for non-shulker', () => { expect(getContainerId('chest', 'red')).toBe('chest') })
})

describe('filterContainers', () => {
  it('marks chest as fit for 27 slots', () => {
    const results = filterContainers(27)
    const chest = results.find(r => r.container.id === 'chest')!
    expect(chest.status).toBe('fits')
  })
  it('marks chest as double for 54 slots', () => {
    const results = filterContainers(54)
    const chest = results.find(r => r.container.id === 'chest')!
    expect(chest.status).toBe('double')
  })
  it('marks hopper as truncated for 27 slots', () => {
    const results = filterContainers(27)
    const hopper = results.find(r => r.container.id === 'hopper')!
    expect(hopper.status).toBe('truncated')
  })
  it('marks barrel as truncated for 54 slots', () => {
    const results = filterContainers(54)
    const barrel = results.find(r => r.container.id === 'barrel')!
    expect(barrel.status).toBe('truncated')
  })
  it('marks dispenser as fit for 9 slots', () => {
    const results = filterContainers(9)
    const disp = results.find(r => r.container.id === 'dispenser')!
    expect(disp.status).toBe('fits')
  })
})
