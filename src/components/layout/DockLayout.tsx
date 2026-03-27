import { useState, useCallback } from 'react'
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

const PANEL_WIDTHS: Record<string, number> = {
  palette: 260,
  editor: 440,
}

export function DockLayout({ panels }: Props) {
  const { dockOrder, setDockOrder, collapsed, toggleCollapse } = usePrefsStore()
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

  const positions: ('left' | 'center' | 'right')[] = ['left', 'center', 'right']

  return (
    <div className={s.layout}>
      {positions.map((pos, i) => {
        const panelId = dockOrder[i]
        const panel = panelMap[panelId]
        if (!panel) return null

        const isCollapsed = pos !== 'center' && collapsed[pos as 'left' | 'right']
        const width = PANEL_WIDTHS[panelId] || panel.width

        return (
          <DockPanel
            key={panelId}
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
        )
      })}
    </div>
  )
}
