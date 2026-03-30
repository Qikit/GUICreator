import { useState, useMemo } from 'react'
import type { Project } from '@/types'
import { usePrefsStore } from '@/store/prefsStore'
import { getGenerator, CONTAINERS, SHULKER_COLORS, getContainerId, filterContainers } from '@/utils/give'
import type { McVersion } from '@/utils/give'
import { GlassModal } from '@/components/ui'
import s from '@/styles/giveModal.module.css'

const PREFIX_PRESETS = ['minecraft:', 'essentials:', '']

interface Props {
  project: Project
  onClose: () => void
}

export function GiveContainerModal({ project, onClose }: Props) {
  const prefs = usePrefsStore()
  const [version, setVersion] = useState<McVersion>(prefs.giveVersion)
  const [target, setTarget] = useState(prefs.giveTarget)
  const [prefix, setPrefix] = useState(prefs.givePrefix)
  const [customPrefix, setCustomPrefix] = useState('')
  const [containerId, setContainerId] = useState(prefs.giveContainer)
  const [shulkerColor, setShulkerColor] = useState(prefs.giveShulkerColor)
  const [copied, setCopied] = useState<number | null>(null)

  const totalSlots = project.rows * 9
  const filtered = useMemo(() => filterContainers(totalSlots), [totalSlots])
  const containerDef = CONTAINERS.find(c => c.id === containerId) ?? CONTAINERS[0]
  const filterInfo = filtered.find(f => f.container.id === containerId)

  const effectivePrefix = PREFIX_PRESETS.includes(prefix) ? prefix : customPrefix

  const result = useMemo(() => {
    const gen = getGenerator(version)
    const actualId = getContainerId(containerDef.id, shulkerColor)
    const container = { ...containerDef, id: actualId }
    return gen.formatContainer(project.slots, project.rows, {
      version, target, prefix: effectivePrefix, container,
    })
  }, [version, target, effectivePrefix, containerDef, shulkerColor, project.slots, project.rows])

  const persist = () => {
    prefs.setGiveVersion(version)
    prefs.setGiveTarget(target)
    prefs.setGivePrefix(effectivePrefix)
    prefs.setGiveContainer(containerId)
    prefs.setGiveShulkerColor(shulkerColor)
  }

  const copy = (idx: number) => {
    navigator.clipboard.writeText(result.commands[idx])
    setCopied(idx)
    persist()
    setTimeout(() => setCopied(null), 1500)
  }

  const copyAll = () => {
    navigator.clipboard.writeText(result.commands.join('\n'))
    setCopied(-1)
    persist()
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <GlassModal onClose={onClose} title="Генерация /give">
      <div className={s.field}>
        <label>Версия:</label>
        <select value={version} onChange={e => setVersion(e.target.value as McVersion)}>
          <option value="1.16.5">1.16.5</option>
          <option value="1.20.5+">1.20.5+</option>
        </select>
      </div>

      <div className={s.field}>
        <label>Контейнер:</label>
        <select value={containerId} onChange={e => setContainerId(e.target.value)}>
          {filtered.map(({ container: c, status }) => (
            <option key={c.id} value={c.id}>
              {c.label} ({c.maxSlots} сл.)
              {status === 'fits' ? ' \u2713' : status === 'double' ? ' \u2194 Double' : ' \u26A0 Обрезка'}
            </option>
          ))}
        </select>
      </div>

      {containerId === 'shulker_box' && (
        <div className={s.field}>
          <label>Цвет:</label>
          <select value={shulkerColor} onChange={e => setShulkerColor(e.target.value)}>
            {SHULKER_COLORS.map(c => (
              <option key={c} value={c}>{c || 'Без цвета'}</option>
            ))}
          </select>
        </div>
      )}

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

      {result.isDoubleChest && (
        <div className={s.doubleNote}>
          Double chest: 2 команды. При размещении двух сундуков рядом получится полное меню.
        </div>
      )}

      {filterInfo?.status === 'truncated' && (
        <div className={s.doubleNote} style={{ color: '#ff5555' }}>
          Контейнер вмещает {containerDef.maxSlots} слотов, в меню {totalSlots}. Лишние слоты обрезаны.
        </div>
      )}

      {result.commands.map((cmd, i) => (
        <div key={i} style={{ marginTop: 8 }}>
          {result.isDoubleChest && <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 4 }}>Сундук {i + 1}:</div>}
          <textarea className={s.commandArea} readOnly value={cmd} onClick={e => (e.target as HTMLTextAreaElement).select()} />
        </div>
      ))}

      <div className={s.actions}>
        {result.commands.length === 1 ? (
          <button className={s.copyBtn} onClick={() => copy(0)}>
            {copied === 0 ? 'Скопировано!' : 'Скопировать'}
          </button>
        ) : (
          <>
            <button className={s.copyBtn} onClick={() => copy(0)}>
              {copied === 0 ? 'Скопировано!' : 'Копировать 1-й'}
            </button>
            <button className={s.copyBtn} onClick={() => copy(1)}>
              {copied === 1 ? 'Скопировано!' : 'Копировать 2-й'}
            </button>
            <button className={s.copyBtn} onClick={copyAll}>
              {copied === -1 ? 'Скопировано!' : 'Копировать все'}
            </button>
          </>
        )}
      </div>
    </GlassModal>
  )
}
