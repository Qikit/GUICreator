import { useState } from 'react'
import { GlassModal, GlowButton, GlassInput, glassModalStyles } from '@/components/ui'

interface Props {
  initialName: string
  onSave: (t: { name: string; desc: string }) => void
  onClose: () => void
}

export function SaveTemplateModal({ initialName, onSave, onClose }: Props) {
  const [name, setName] = useState(initialName)
  const [desc, setDesc] = useState('')
  const save = () => { onSave({ name: name.trim(), desc: desc.trim() }); onClose() }
  return (
    <GlassModal onClose={onClose} title="Сохранить шаблон">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <GlassInput value={name} onChange={e => setName(e.target.value)} placeholder="Название" autoFocus />
        <GlassInput value={desc} onChange={e => setDesc(e.target.value)} placeholder="Описание (необязательно)" />
      </div>
      <div className={glassModalStyles.actions} style={{ marginTop: 12 }}>
        <GlowButton variant="primary" disabled={!name.trim()} onClick={save}>Сохранить</GlowButton>
        <GlowButton onClick={onClose}>Отмена</GlowButton>
      </div>
    </GlassModal>
  )
}
