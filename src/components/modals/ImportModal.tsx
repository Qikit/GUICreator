import { useState, useRef, useMemo } from 'react'
import { parseAnyImport } from '@/utils/import'
import { GlassModal, GlowButton, glassModalStyles } from '@/components/ui'
import s from '@/styles/giveModal.module.css'

interface Props {
  onImport: (raw: string) => void
  onClose: () => void
}

export function ImportModal({ onImport, onClose }: Props) {
  const [text, setText] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const preview = useMemo(() => (text.trim() ? parseAnyImport(text) : null), [text])
  const label = !preview ? ''
    : preview.kind === 'workspace' ? `Обнаружен воркспейс — меню: ${preview.projects.length}`
    : preview.kind === 'menu' ? `Обнаружено меню: ${preview.project.name}`
    : preview.message
  const ok = preview != null && preview.kind !== 'error'

  const readFile = (f: File) => { const r = new FileReader(); r.onload = () => setText(String(r.result)); r.readAsText(f) }
  const apply = () => { onImport(text); onClose() }

  return (
    <GlassModal onClose={onClose} title="Импорт">
      <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 8 }}>
        Бэкап, экспорт-JSON, JSON из игры, ссылка #share=, конфиг FunMenu/AbstractMenus — формат определяется автоматически.
      </div>
      <textarea
        className={s.commandArea}
        value={text}
        onChange={e => setText(e.target.value)}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) readFile(f) }}
        placeholder="Вставьте содержимое или перетащите файл сюда…"
        style={{ minHeight: 140, outline: dragOver ? '2px dashed var(--accent)' : undefined }}
      />
      {label && <div style={{ fontSize: 11, color: ok ? '#55ff55' : '#ff5555', marginTop: 4 }}>{label}</div>}
      <div className={glassModalStyles.actions} style={{ marginTop: 12 }}>
        <GlowButton variant="primary" onClick={apply} disabled={!ok}>Импортировать</GlowButton>
        <GlowButton onClick={() => fileRef.current?.click()}>Загрузить файл</GlowButton>
        <GlowButton onClick={onClose}>Отмена</GlowButton>
      </div>
      <input ref={fileRef} type="file" accept=".json,.txt,.yml,.conf,.kt" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f) }} />
    </GlassModal>
  )
}
