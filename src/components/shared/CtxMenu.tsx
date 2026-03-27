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

export function CtxMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  return (
    <div className={s.ctxMenu} ref={ref} style={{ left: x, top: y }}>
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
