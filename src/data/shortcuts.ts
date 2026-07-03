export interface Binding {
  code: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
}

export interface ShortcutAction {
  id: string
  label: string
  defaults: Binding[]
}

// Настраиваемые действия. Матчинг по точным модификаторам разводит Ctrl+E и E.
export const SHORTCUT_ACTIONS: ShortcutAction[] = [
  { id: 'undo', label: 'Отменить', defaults: [{ code: 'KeyZ', ctrl: true }] },
  { id: 'redo', label: 'Повторить', defaults: [{ code: 'KeyY', ctrl: true }, { code: 'KeyZ', ctrl: true, shift: true }] },
  { id: 'copy', label: 'Копировать', defaults: [{ code: 'KeyC', ctrl: true }] },
  { id: 'paste', label: 'Вставить', defaults: [{ code: 'KeyV', ctrl: true }] },
  { id: 'duplicate', label: 'Дублировать слот', defaults: [{ code: 'KeyD', ctrl: true }] },
  { id: 'selectAll', label: 'Выделить всё', defaults: [{ code: 'KeyA', ctrl: true }] },
  { id: 'delete', label: 'Удалить слот', defaults: [{ code: 'Delete' }, { code: 'Backspace' }] },
  { id: 'eraser', label: 'Ластик', defaults: [{ code: 'KeyE' }] },
  { id: 'export', label: 'Экспорт', defaults: [{ code: 'KeyE', ctrl: true }] },
  { id: 'save', label: 'Сохранить', defaults: [{ code: 'KeyS', ctrl: true }] },
]

// Справочные, не настраиваются.
export const FIXED_SHORTCUTS: { label: string; keys: string }[] = [
  { label: 'Закрыть / снять выделение', keys: 'Esc' },
  { label: 'Переместить выделение', keys: '↑ ↓ ← →' },
  { label: 'Расширить выделение', keys: 'Shift + ↑↓←→' },
]
