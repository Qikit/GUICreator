import { useRef, useEffect } from 'react'
import s from '@/styles/shared.module.css'

export interface CtxMenuItem {
  label?: string
  danger?: boolean
  sep?: boolean
  fn?: () => void
}

interface Props {
  x: number
  y: number
  items: CtxMenuItem[]
  onClose: () => void
}

const isMobile = () => window.innerWidth < 768

export function CtxMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', h)
    document.addEventListener('touchstart', h)
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h) }
  }, [onClose])

  const posStyle = isMobile() ? undefined : { left: x, top: y }

  return (
    <div className={s.ctxMenu} ref={ref} style={posStyle}>
      {items.map((it, i) => {
        if (it.sep) return <div key={i} className={s.ctxSep} />
        return (
          <button
            key={i}
            className={s.ctxItem}
            style={it.danger ? { color: 'var(--er)' } : undefined}
            onClick={() => { it.fn?.(); onClose() }}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
