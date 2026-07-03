import type { Binding, ShortcutAction } from '@/data/shortcuts'
import { SHORTCUT_ACTIONS } from '@/data/shortcuts'

// actionId -> override. Значение null = действие отключено; отсутствие ключа = дефолт.
export type Overrides = Record<string, Binding | null | undefined>

// Событие совпадает с биндом при точном совпадении модификаторов. Meta не поддерживается.
export function matchBinding(e: KeyboardEvent, b: Binding): boolean {
  return !e.metaKey
    && e.code === b.code
    && !!e.ctrlKey === !!b.ctrl
    && !!e.shiftKey === !!b.shift
    && !!e.altKey === !!b.alt
}

// Действующие бинды действия: оверрайд важнее дефолта, null = пусто.
export function effectiveBindings(action: ShortcutAction, overrides: Overrides): Binding[] {
  const o = overrides[action.id]
  if (o === null) return []
  if (o) return [o]
  return action.defaults
}

// Какое действие вызывает событие (или null).
export function matchAction(e: KeyboardEvent, overrides: Overrides): string | null {
  for (const a of SHORTCUT_ACTIONS) {
    if (effectiveBindings(a, overrides).some(b => matchBinding(e, b))) return a.id
  }
  return null
}

// Бинд из keydown при захвате. null — одиночный модификатор или meta.
export function parseEventToBinding(e: KeyboardEvent): Binding | null {
  if (/^(Control|Shift|Alt|Meta)(Left|Right)$/.test(e.code)) return null
  if (e.metaKey) return null
  const b: Binding = { code: e.code }
  if (e.ctrlKey) b.ctrl = true
  if (e.shiftKey) b.shift = true
  if (e.altKey) b.alt = true
  return b
}

export function bindingsEqual(a: Binding, b: Binding): boolean {
  return a.code === b.code && !!a.ctrl === !!b.ctrl && !!a.shift === !!b.shift && !!a.alt === !!b.alt
}

// Действие, которому уже назначен бинд b (кроме exceptId).
export function findConflict(b: Binding, overrides: Overrides, exceptId: string): ShortcutAction | null {
  for (const a of SHORTCUT_ACTIONS) {
    if (a.id === exceptId) continue
    if (effectiveBindings(a, overrides).some(x => bindingsEqual(x, b))) return a
  }
  return null
}

const CODE_LABELS: Record<string, string> = {
  Delete: 'Del', Backspace: 'Backspace', Escape: 'Esc', Space: 'Space', Enter: 'Enter', Tab: 'Tab',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
}

function codeLabel(code: string): string {
  if (CODE_LABELS[code]) return CODE_LABELS[code]
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6)
  return code
}

export function formatBinding(b: Binding): string {
  const parts: string[] = []
  if (b.ctrl) parts.push('Ctrl')
  if (b.shift) parts.push('Shift')
  if (b.alt) parts.push('Alt')
  parts.push(codeLabel(b.code))
  return parts.join('+')
}

// Строка для отображения действующих биндов: '—' если отключено.
export function formatEffective(action: ShortcutAction, overrides: Overrides): string {
  if (overrides[action.id] === null) return '—'
  return effectiveBindings(action, overrides).map(formatBinding).join(' / ')
}
