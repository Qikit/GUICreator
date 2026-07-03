import { useState, useEffect } from 'react'
import { usePrefsStore } from '@/store/prefsStore'
import { SHORTCUT_ACTIONS, FIXED_SHORTCUTS } from '@/data/shortcuts'
import type { Binding } from '@/data/shortcuts'
import { formatBinding, formatEffective, parseEventToBinding, findConflict } from '@/utils/shortcuts'
import { GlowButton } from '@/components/ui'
import s from '@/styles/settings.module.css'

export function ShortcutsSettings() {
  const { shortcuts, setShortcut, resetShortcut, resetAllShortcuts } = usePrefsStore()
  const [capturing, setCapturing] = useState<string | null>(null)
  const [pending, setPending] = useState<Binding | null>(null)
  const [conflict, setConflict] = useState<{ id: string; label: string } | null>(null)

  const cancel = () => { setCapturing(null); setPending(null); setConflict(null) }

  // Захват комбинации. Capture-фаза + stopPropagation, чтобы не сработал глобальный хук.
  useEffect(() => {
    if (!capturing) return
    const h = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.code === 'Escape') { cancel(); return }
      const b = parseEventToBinding(e)
      if (!b) return
      const c = findConflict(b, shortcuts, capturing)
      if (c) { setPending(b); setConflict({ id: c.id, label: c.label }); return }
      setShortcut(capturing, b)
      cancel()
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [capturing, shortcuts, setShortcut])

  const confirmReassign = () => {
    if (!capturing || !pending || !conflict) return
    setShortcut(conflict.id, null)
    setShortcut(capturing, pending)
    cancel()
  }

  return (
    <div className={s.wrap}>
      <div className={s.list}>
        {SHORTCUT_ACTIONS.map(a => {
          const isCapturing = capturing === a.id
          return (
            <div key={a.id} className={s.row}>
              <span className={s.label}>{a.label}</span>
              {isCapturing ? (
                <span className={s.capture}>{pending ? formatBinding(pending) : 'Нажмите комбинацию…'}</span>
              ) : (
                <span className={`${s.chip} ${shortcuts[a.id] === null ? s.disabled : ''}`}>{formatEffective(a, shortcuts)}</span>
              )}
              <button className={s.iconBtn} title="Переназначить" disabled={isCapturing}
                onClick={() => { setCapturing(a.id); setPending(null); setConflict(null) }}>✎</button>
              <button className={s.iconBtn} title="По умолчанию"
                onClick={() => { if (isCapturing) cancel(); resetShortcut(a.id) }}>↺</button>
            </div>
          )
        })}
      </div>

      {conflict && (
        <div className={s.conflict}>
          Комбинация занята действием «{conflict.label}». Переназначить? Тогда «{conflict.label}» будет отключено.
          <div className={s.conflictActions}>
            <GlowButton variant="primary" onClick={confirmReassign}>Переназначить</GlowButton>
            <GlowButton onClick={cancel}>Отмена</GlowButton>
          </div>
        </div>
      )}

      <div className={s.fixed}>
        <div className={s.fixedTitle}>Не настраиваются</div>
        {FIXED_SHORTCUTS.map((f, i) => (
          <div key={i} className={s.row}>
            <span className={s.label}>{f.label}</span>
            <span className={`${s.chip} ${s.fixedChip}`}>{f.keys}</span>
          </div>
        ))}
      </div>

      <div className={s.footer}>
        <GlowButton onClick={resetAllShortcuts}>Сбросить всё</GlowButton>
      </div>
    </div>
  )
}
