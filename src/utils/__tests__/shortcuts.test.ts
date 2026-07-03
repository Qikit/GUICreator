import { describe, it, expect } from 'vitest'
import {
  matchBinding, matchAction, effectiveBindings, parseEventToBinding,
  bindingsEqual, findConflict, formatBinding, formatEffective,
} from '@/utils/shortcuts'
import { SHORTCUT_ACTIONS } from '@/data/shortcuts'
import type { Overrides } from '@/utils/shortcuts'

const ev = (code: string, mods: Partial<KeyboardEventInit> = {}) =>
  new KeyboardEvent('keydown', { code, ...mods })

const action = (id: string) => SHORTCUT_ACTIONS.find(a => a.id === id)!

describe('matchBinding', () => {
  it('точное совпадение модификаторов', () => {
    expect(matchBinding(ev('KeyZ', { ctrlKey: true }), { code: 'KeyZ', ctrl: true })).toBe(true)
    expect(matchBinding(ev('KeyZ', { ctrlKey: true, shiftKey: true }), { code: 'KeyZ', ctrl: true })).toBe(false)
    expect(matchBinding(ev('KeyZ'), { code: 'KeyZ', ctrl: true })).toBe(false)
  })

  it('meta никогда не матчится', () => {
    expect(matchBinding(ev('KeyZ', { ctrlKey: true, metaKey: true }), { code: 'KeyZ', ctrl: true })).toBe(false)
  })
})

describe('matchAction (дефолты)', () => {
  const none: Overrides = {}
  it('разводит Ctrl+E и E', () => {
    expect(matchAction(ev('KeyE', { ctrlKey: true }), none)).toBe('export')
    expect(matchAction(ev('KeyE'), none)).toBe('eraser')
  })
  it('redo по двум дефолтам', () => {
    expect(matchAction(ev('KeyY', { ctrlKey: true }), none)).toBe('redo')
    expect(matchAction(ev('KeyZ', { ctrlKey: true, shiftKey: true }), none)).toBe('redo')
    expect(matchAction(ev('KeyZ', { ctrlKey: true }), none)).toBe('undo')
  })
  it('delete по Delete и Backspace', () => {
    expect(matchAction(ev('Delete'), none)).toBe('delete')
    expect(matchAction(ev('Backspace'), none)).toBe('delete')
  })
  it('toggleArrows по L', () => {
    expect(matchAction(ev('KeyL'), none)).toBe('toggleArrows')
  })
  it('нераспознанное → null', () => {
    expect(matchAction(ev('KeyQ'), none)).toBeNull()
  })
})

describe('effectiveBindings / overrides', () => {
  it('оверрайд заменяет дефолт', () => {
    const o: Overrides = { undo: { code: 'KeyK', ctrl: true } }
    expect(matchAction(ev('KeyK', { ctrlKey: true }), o)).toBe('undo')
    expect(matchAction(ev('KeyZ', { ctrlKey: true }), o)).toBeNull()
  })
  it('null отключает действие', () => {
    const o: Overrides = { eraser: null }
    expect(effectiveBindings(action('eraser'), o)).toEqual([])
    expect(matchAction(ev('KeyE'), o)).toBeNull()
  })
  it('отсутствие ключа → дефолт', () => {
    expect(effectiveBindings(action('undo'), {})).toEqual([{ code: 'KeyZ', ctrl: true }])
  })
})

describe('parseEventToBinding', () => {
  it('одиночный модификатор → null', () => {
    expect(parseEventToBinding(ev('ControlLeft', { ctrlKey: true }))).toBeNull()
    expect(parseEventToBinding(ev('ShiftRight', { shiftKey: true }))).toBeNull()
  })
  it('meta → null', () => {
    expect(parseEventToBinding(ev('KeyK', { metaKey: true }))).toBeNull()
  })
  it('собирает модификаторы', () => {
    expect(parseEventToBinding(ev('KeyK', { ctrlKey: true }))).toEqual({ code: 'KeyK', ctrl: true })
    expect(parseEventToBinding(ev('KeyK', { ctrlKey: true, shiftKey: true, altKey: true })))
      .toEqual({ code: 'KeyK', ctrl: true, shift: true, alt: true })
  })
})

describe('findConflict', () => {
  it('находит занятую комбинацию', () => {
    const c = findConflict({ code: 'KeyC', ctrl: true }, {}, 'paste')
    expect(c?.id).toBe('copy')
  })
  it('исключает саму себя', () => {
    expect(findConflict({ code: 'KeyC', ctrl: true }, {}, 'copy')).toBeNull()
  })
  it('свободная комбинация — нет конфликта', () => {
    expect(findConflict({ code: 'KeyK', ctrl: true }, {}, 'undo')).toBeNull()
  })
})

describe('bindingsEqual', () => {
  it('сравнивает код и модификаторы', () => {
    expect(bindingsEqual({ code: 'KeyZ', ctrl: true }, { code: 'KeyZ', ctrl: true })).toBe(true)
    expect(bindingsEqual({ code: 'KeyZ', ctrl: true }, { code: 'KeyZ' })).toBe(false)
  })
})

describe('formatBinding', () => {
  it('порядок модификаторов и лейблы', () => {
    expect(formatBinding({ code: 'KeyZ', ctrl: true, shift: true })).toBe('Ctrl+Shift+Z')
    expect(formatBinding({ code: 'Delete' })).toBe('Del')
    expect(formatBinding({ code: 'Digit1' })).toBe('1')
    expect(formatBinding({ code: 'ArrowUp' })).toBe('↑')
  })
})

describe('formatEffective', () => {
  it('дефолты, оверрайд, отключение', () => {
    expect(formatEffective(action('undo'), {})).toBe('Ctrl+Z')
    expect(formatEffective(action('redo'), {})).toBe('Ctrl+Y / Ctrl+Shift+Z')
    expect(formatEffective(action('undo'), { undo: { code: 'KeyK', ctrl: true } })).toBe('Ctrl+K')
    expect(formatEffective(action('eraser'), { eraser: null })).toBe('—')
  })
})
