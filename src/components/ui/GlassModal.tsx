import { type ReactNode, useEffect } from 'react'
import s from './GlassModal.module.css'

interface Props {
  children: ReactNode
  onClose: () => void
  title?: string
}

export function GlassModal({ children, onClose, title }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className={s.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }} onWheel={e => e.stopPropagation()}>
      <div className={s.dialog}>
        {title && <div className={s.title}>{title}</div>}
        {children}
      </div>
    </div>
  )
}

export { s as glassModalStyles }
