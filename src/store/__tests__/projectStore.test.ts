import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from '../projectStore'
import { defSlot } from '@/utils/slot'

describe('projectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      past: [],
      present: { id: 'test', name: 'Test', rows: 3, cols: 9, slots: {}, createdAt: 0, updatedAt: 0 },
      future: [],
    })
  })

  it('dispatches SS to set slot', () => {
    const store = useProjectStore.getState()
    store.dispatch({ type: 'SS', key: '0-0', data: defSlot('diamond') })
    const state = useProjectStore.getState()
    expect(state.present.slots['0-0']).toBeDefined()
    expect(state.present.slots['0-0'].itemId).toBe('diamond')
    expect(state.past).toHaveLength(1)
  })

  it('undo restores previous state', () => {
    const store = useProjectStore.getState()
    store.dispatch({ type: 'SS', key: '0-0', data: defSlot('diamond') })
    useProjectStore.getState().undo()
    const state = useProjectStore.getState()
    expect(state.present.slots['0-0']).toBeUndefined()
    expect(state.future).toHaveLength(1)
  })

  it('redo restores undone state', () => {
    const store = useProjectStore.getState()
    store.dispatch({ type: 'SS', key: '0-0', data: defSlot('diamond') })
    useProjectStore.getState().undo()
    useProjectStore.getState().redo()
    const state = useProjectStore.getState()
    expect(state.present.slots['0-0']).toBeDefined()
  })

  it('RS removes slot', () => {
    const store = useProjectStore.getState()
    store.dispatch({ type: 'SS', key: '1-1', data: defSlot('stone') })
    useProjectStore.getState().dispatch({ type: 'RS', key: '1-1' })
    expect(useProjectStore.getState().present.slots['1-1']).toBeUndefined()
  })

  it('setName updates name', () => {
    useProjectStore.getState().setName('New Name')
    expect(useProjectStore.getState().present.name).toBe('New Name')
  })
})
