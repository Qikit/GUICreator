import { useState, useMemo } from 'react'
import type { SlotData } from '@/types'
import { usePrefsStore } from '@/store/prefsStore'
import { getGenerator } from '@/utils/give'
import type { McVersion } from '@/utils/give'
import { GlassModal } from '@/components/ui'
import s from '@/styles/giveModal.module.css'

const PREFIX_PRESETS = ['minecraft:', 'essentials:', '']

interface Props {
  slot: SlotData
  onClose: () => void
}

export function GiveItemModal({ slot, onClose }: Props) {
  const prefs = usePrefsStore()
  const [version, setVersion] = useState<McVersion>(prefs.giveVersion)
  const [target, setTarget] = useState(prefs.giveTarget)
  const [prefix, setPrefix] = useState(prefs.givePrefix)
  const [customPrefix, setCustomPrefix] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const effectivePrefix = PREFIX_PRESETS.includes(prefix) ? prefix : customPrefix

  const command = useMemo(() => {
    const gen = getGenerator(version)
    return gen.formatItem(slot, { version, target, prefix: effectivePrefix })
  }, [version, target, effectivePrefix, slot])

  const ftidCommand = slot.funItemId
    ? `ftid give ${target} ${slot.funItemId} ${slot.amount}`
    : null

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <GlassModal onClose={onClose} title="/give предмета">
      <div className={s.field}>
        <label>Версия:</label>
        <select value={version} onChange={e => setVersion(e.target.value as McVersion)}>
          <option value="1.16.5">1.16.5</option>
          <option value="1.20.5+">1.20.5+</option>
        </select>
      </div>

      <div className={s.field}>
        <label>Цель:</label>
        <input value={target} onChange={e => setTarget(e.target.value)} placeholder="@p" />
      </div>

      <div className={s.field}>
        <label>Префикс:</label>
        <select value={PREFIX_PRESETS.includes(prefix) ? prefix : '__custom__'} onChange={e => {
          const v = e.target.value
          if (v === '__custom__') setPrefix(customPrefix)
          else setPrefix(v)
        }}>
          {PREFIX_PRESETS.map(p => (
            <option key={p} value={p}>{p || '(без префикса)'}</option>
          ))}
          <option value="__custom__">Другой...</option>
        </select>
        {!PREFIX_PRESETS.includes(prefix) && (
          <input value={customPrefix} onChange={e => { setCustomPrefix(e.target.value); setPrefix(e.target.value) }} placeholder="custom:" style={{ maxWidth: 100 }} />
        )}
      </div>

      <textarea className={s.commandArea} readOnly value={command} onClick={e => (e.target as HTMLTextAreaElement).select()} />

      <div className={s.actions}>
        <button className={s.copyBtn} onClick={() => copy(command, 'give')}>
          {copied === 'give' ? 'Скопировано!' : 'Скопировать'}
        </button>
      </div>

      {ftidCommand && (
        <>
          <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 16, marginBottom: 4 }}>FunTime реестр:</div>
          <textarea className={s.commandArea} readOnly value={ftidCommand} style={{ minHeight: 36 }} onClick={e => (e.target as HTMLTextAreaElement).select()} />
          <div className={s.actions}>
            <button className={s.copyBtn} onClick={() => copy(ftidCommand, 'ftid')}>
              {copied === 'ftid' ? 'Скопировано!' : 'Скопировать'}
            </button>
          </div>
        </>
      )}
    </GlassModal>
  )
}
