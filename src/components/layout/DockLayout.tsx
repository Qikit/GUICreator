import { useState, useCallback, Fragment } from 'react'
import { usePrefsStore } from '@/store/prefsStore'
import { DockPanel } from './DockPanel'
import s from '@/styles/dock.module.css'

interface PanelConfig {
  id: string
  title: string
  width?: number
  content: React.ReactNode
}

interface Props {
  panels: PanelConfig[]
}

export function DockLayout({ panels }: Props) {
  const { dockOrder, setDockOrder, collapsed, toggleCollapse, panelWidths, setPanelWidth, resetPanelWidth } = usePrefsStore()
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  const panelMap = Object.fromEntries(panels.map(p => [p.id, p]))

  const handleDragOver = useCallback((targetId: string) => {
    if (dragId && targetId !== dragId) setDropTarget(targetId)
  }, [dragId])

  const handleDragEnd = useCallback(() => {
    if (dragId && dropTarget) {
      const newOrder = [...dockOrder] as [string, string, string]
      const fromIdx = newOrder.indexOf(dragId)
      const toIdx = newOrder.indexOf(dropTarget)
      if (fromIdx !== -1 && toIdx !== -1) {
        newOrder[fromIdx] = dropTarget
        newOrder[toIdx] = dragId
        setDockOrder(newOrder)
      }
    }
    setDragId(null)
    setDropTarget(null)
  }, [dragId, dropTarget, dockOrder, setDockOrder])

  const startResize = (side: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = panelWidths[side]
    const onMove = (ev: MouseEvent) => {
      const delta = side === 'left' ? ev.clientX - startX : startX - ev.clientX
      const newWidth = Math.max(200, Math.min(window.innerWidth * 0.5, startWidth + delta))
      setPanelWidth(side, newWidth)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const positions: ('left' | 'center' | 'right')[] = ['left', 'center', 'right']

  return (
    <div className={s.layout}>
      {positions.map((pos, i) => {
        const panelId = dockOrder[i]
        const panel = panelMap[panelId]
        if (!panel) return null

        const isCollapsed = pos !== 'center' && collapsed[pos as 'left' | 'right']
        const width = pos !== 'center' ? panelWidths[pos as 'left' | 'right'] : panel.width

        return (
          <Fragment key={panelId}>
            {pos === 'center' && (
              <div
                className={s.resizeHandle}
                onMouseDown={startResize('left')}
                onDoubleClick={() => resetPanelWidth('left')}
              />
            )}
            <DockPanel
              id={panelId}
              title={panel.title}
              position={pos}
              collapsed={isCollapsed}
              onCollapse={pos !== 'center' ? () => toggleCollapse(pos as 'left' | 'right') : undefined}
              onDragStart={setDragId}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              isDropTarget={dropTarget === panelId}
              width={width}
            >
              {panel.content}
            </DockPanel>
            {pos === 'center' && (
              <div
                className={s.resizeHandle}
                onMouseDown={startResize('right')}
                onDoubleClick={() => resetPanelWidth('right')}
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
