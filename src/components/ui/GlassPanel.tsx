import { type ReactNode, type ElementType, type CSSProperties, forwardRef } from 'react'
import s from './GlassPanel.module.css'

interface Props {
  children: ReactNode
  className?: string
  as?: ElementType
  style?: CSSProperties
}

export const GlassPanel = forwardRef<HTMLDivElement, Props>(
  ({ children, className, as: Tag = 'div', style }, ref) => {
    return <Tag ref={ref} className={`${s.panel} ${className || ''}`} style={style}>{children}</Tag>
  },
)

GlassPanel.displayName = 'GlassPanel'
