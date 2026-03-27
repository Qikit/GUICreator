import { useState, useEffect } from 'react'
import type { Project } from '@/types'
import { loadProject } from '@/storage'
import { GlassModal, GlowButton, glassModalStyles } from '@/components/ui'

interface Props {
  list: string[]
  onOpen: (p: Project) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function ProjectModal({ list, onOpen, onDelete, onClose }: Props) {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    setProjects(list.map(id => loadProject(id)).filter(Boolean) as Project[])
  }, [list])

  return (
    <GlassModal onClose={onClose} title="Проекты">
      {!projects.length && <div style={{ color: 'var(--tx3)', padding: 12 }}>Нет проектов</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
        {projects.map(p => (
          <div key={p.id} style={{ background: 'var(--glass-surface)', border: '1px solid var(--glass-border)', borderRadius: 5, padding: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 12 }}>{p.name}</div>
            <div style={{ fontSize: 9, color: 'var(--tx3)' }}>{p.rows}x9 · {Object.keys(p.slots).length} предм.</div>
            <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
              <GlowButton variant="primary" style={{ padding: '2px 6px' }} onClick={() => onOpen(p)}>Открыть</GlowButton>
              <GlowButton variant="danger" style={{ padding: '2px 6px' }} onClick={e => { e.stopPropagation(); onDelete(p.id) }}>Del</GlowButton>
            </div>
          </div>
        ))}
      </div>
      <div className={glassModalStyles.actions}>
        <GlowButton onClick={onClose}>Закрыть</GlowButton>
      </div>
    </GlassModal>
  )
}
