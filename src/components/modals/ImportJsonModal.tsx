import { useState, useRef } from 'react'
import { parseInventoryJson } from '@/utils/importInventoryJson'
import { GlassModal, GlowButton, glassModalStyles } from '@/components/ui'
import s from '@/styles/giveModal.module.css'

interface Props {
  onImport: (data: { name: string; rows: number; slots: Record<string, import('@/types').SlotData> }) => void
  onClose: () => void
}

export function ImportJsonModal({ onImport, onClose }: Props) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const tryImport = (input: string) => {
    const result = parseInventoryJson(input)
    if (!result) {
      setError('Невалидный JSON. Убедитесь, что формат соответствует спецификации (v:1, title, size, slots).')
      return
    }
    onImport(result)
    onClose()
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      setText(content)
      tryImport(content)
    }
    reader.readAsText(file)
  }

  return (
    <GlassModal onClose={onClose} title="Импорт из JSON">
      <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 8 }}>
        Вставьте JSON, сгенерированный командой анализа GUI из игры, или загрузите файл.
      </div>

      <textarea
        className={s.commandArea}
        value={text}
        onChange={e => { setText(e.target.value); setError(null) }}
        placeholder='{"v":1,"title":"...","size":27,"slots":[...]}'
        style={{ minHeight: 120 }}
      />

      {error && (
        <div style={{ fontSize: 11, color: '#ff5555', marginTop: 4 }}>{error}</div>
      )}

      <div className={glassModalStyles.actions} style={{ marginTop: 12 }}>
        <GlowButton variant="primary" onClick={() => tryImport(text)} disabled={!text.trim()}>
          Импортировать
        </GlowButton>
        <GlowButton onClick={() => fileRef.current?.click()}>
          Загрузить файл
        </GlowButton>
        <GlowButton onClick={onClose}>Отмена</GlowButton>
      </div>

      <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFile} />
    </GlassModal>
  )
}
