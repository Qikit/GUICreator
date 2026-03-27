import { type ReactNode } from 'react'
import { GlassPanel } from '@/components/ui'
import s from '@/styles/dock.module.css'

interface Props {
  id: string
  title: string
  position: 'left' | 'center' | 'right'
  collapsed?: boolean
  onCollapse?: () => void
  onDragStart?: (id: string) => void
  onDragOver?: (id: string) => void
  onDragEnd?: () => void
  isDropTarget?: boolean
  children: ReactNode
  width?: number | string
  isResizing?: boolean
  headerExtra?: ReactNode
}

export function DockPanel({
  id, title, position, collapsed, onCollapse, onDragStart, onDragOver, onDragEnd,
  isDropTarget, children, width, isResizing, headerExtra,
}: Props) {
  const posClass = position === 'left' ? s.panelLeft : position === 'right' ? s.panelRight : s.panelCenter

  if (collapsed && position !== 'center') {
    return (
      <div className={`${s.panel} ${posClass} ${s.collapsed}`}>
        <div className={s.collapsedIcon} onClick={onCollapse} title={title}>
          {title}
        </div>
      </div>
    )
  }

  const style: React.CSSProperties = { position: 'relative' }
  if (position !== 'center' && width) {
    style.width = typeof width === 'number' ? `${width}px` : width
    style.minWidth = style.width
  }

  return (
    <GlassPanel
      className={`${s.panel} ${posClass} ${!isResizing ? s.panelAnimated : ''}`}
      style={style}
    >
      <div
        className={s.dragHandle}
        draggable
        onDragStart={e => {
          e.dataTransfer.setData('text/plain', id)
          onDragStart?.(id)
        }}
        onDragEnd={() => onDragEnd?.()}
      >
        <div className={s.grip}>
          <div className={s.gripDot} />
          <div className={s.gripDot} />
          <div className={s.gripDot} />
        </div>
        {title}
        {headerExtra}
        {position !== 'center' && onCollapse && (
          <button className={s.collapseBtn} onClick={onCollapse} data-tip="Свернуть">
            {position === 'left' ? '◂' : '▸'}
          </button>
        )}
      </div>
      <div
        className={s.panelContent}
        onDragOver={e => { e.preventDefault(); onDragOver?.(id) }}
      >
        {children}
      </div>
      {isDropTarget && <div className={s.dropZone} />}
    </GlassPanel>
  )
}
