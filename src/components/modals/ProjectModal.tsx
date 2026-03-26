import { useState, useEffect } from 'react'
import type { Project } from '@/types'
import { loadProject } from '@/storage'
import s from '@/styles/shared.module.css'

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
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modalDialog} onClick={e => e.stopPropagation()}>
        <div className={s.modalTitle}>Проекты</div>
        {!projects.length && <div style={{ color: 'var(--tx3)', padding: 12 }}>Нет проектов</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
          {projects.map(p => (
            <div key={p.id} style={{ background: 'var(--srf)', border: '1px solid var(--bd)', borderRadius: 5, padding: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 12 }}>{p.name}</div>
              <div style={{ fontSize: 9, color: 'var(--tx3)' }}>{p.rows}x9 · {Object.keys(p.slots).length} предм.</div>
              <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                <button className={`${s.btn} ${s.btnPrimary}`} style={{ padding: '2px 6px' }} onClick={() => onOpen(p)}>Открыть</button>
                <button className={`${s.btn} ${s.btnDanger}`} style={{ padding: '2px 6px' }} onClick={e => { e.stopPropagation(); onDelete(p.id) }}>Del</button>
              </div>
            </div>
          ))}
        </div>
        <div className={s.modalActions}>
          <button className={s.btn} onClick={onClose} style={{ border: '1px solid var(--bd2)' }}>Закрыть</button>
        </div>
      </div>
    </div>
  )
}
