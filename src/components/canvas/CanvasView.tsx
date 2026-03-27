import { useState, useRef } from 'react'
import type { Workspace, Project } from '@/types'
import { gid } from '@/utils/id'
import { newProject } from '@/utils/slot'
import { saveProject, loadProject, loadProjectList } from '@/storage'
import { CtxMenu } from '@/components/shared'
import { MiniMenu } from './MiniMenu'
import { GlowButton } from '@/components/ui'
import s from '@/styles/canvas.module.css'
import ss from '@/styles/shared.module.css'

interface ConnectingFrom { menuId: string; slot: string }

interface Props {
  workspace: Workspace
  onUpdateWS: (ws: Workspace) => void
  projects: Record<string, Project>
  activeProjectId: string | null
  selSlot: string | null
  onSlotSelect: (projectId: string, slotKey: string) => void
  palItem: string | null
  onPlaceItem: (projectId: string, slotKey: string) => void
  onRemoveItem: (projectId: string, slotKey: string) => void
}

export function CanvasView({ workspace, onUpdateWS, projects, activeProjectId, selSlot, onSlotSelect, palItem, onPlaceItem, onRemoveItem }: Props) {
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [connectMode, setConnectMode] = useState(false)
  const [connecting, setConnecting] = useState<ConnectingFrom | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [grabbing, setGrabbing] = useState(false)
  const [mmCtx, setMmCtx] = useState<{ x: number; y: number; idx: number } | null>(null)
  const [slotCtx, setSlotCtx] = useState<{ x: number; y: number; menuId: string; slotKey: string } | null>(null)
  const surfRef = useRef<HTMLDivElement>(null)

  const onBgDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(`.${s.miniMenu}`) || (e.target as HTMLElement).closest(`.${s.canvasTb}`) || (e.target as HTMLElement).closest(`.${ss.ctxMenu}`)) return
    if (e.button !== 0) return
    if (connecting) { setConnecting(null); return }
    setGrabbing(true)
    const sx = e.clientX - pan.x, sy = e.clientY - pan.y
    const mv = (ev: MouseEvent) => setPan({ x: ev.clientX - sx, y: ev.clientY - sy })
    const up = () => { setGrabbing(false); window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up)
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const rect = surfRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const d = e.deltaY > 0 ? 0.9 : 1.1
    const nz = Math.max(0.2, Math.min(3, zoom * d))
    setPan({ x: mx - (mx - pan.x) * nz / zoom, y: my - (my - pan.y) * nz / zoom })
    setZoom(nz)
  }

  const moveMenu = (idx: number, nx: number, ny: number) => {
    onUpdateWS({ ...workspace, menus: workspace.menus.map((m, i) => i === idx ? { ...m, x: Math.round((nx - pan.x) / zoom), y: Math.round((ny - pan.y) / zoom) } : m) })
  }

  const onSlotClick = (menuId: string, slot: string) => {
    if (connectMode) {
      if (!connecting) { setConnecting({ menuId, slot }) }
      else {
        if (connecting.menuId === menuId) return
        onUpdateWS({ ...workspace, connections: [...workspace.connections, { id: gid(), fromMenu: connecting.menuId, fromSlot: connecting.slot, toMenu: menuId }] })
        setConnecting(null)
      }
    } else if (palItem) {
      onPlaceItem(menuId, slot)
    } else {
      onSlotSelect(menuId, slot)
    }
  }

  const onSlotRightClick = (menuId: string, slotKey: string, cx: number, cy: number) => {
    onSlotSelect(menuId, slotKey)
    setSlotCtx({ x: (cx - pan.x) / zoom, y: (cy - pan.y) / zoom, menuId, slotKey })
  }

  const delConn = (id: string) => onUpdateWS({ ...workspace, connections: workspace.connections.filter(c => c.id !== id) })

  const addNew = () => {
    const p = newProject('Меню ' + (workspace.menus.length + 1), 3); saveProject(p)
    onUpdateWS({ ...workspace, menus: [...workspace.menus, { projectId: p.id, x: 200 + workspace.menus.length * 60, y: 200 + workspace.menus.length * 40 }] })
  }

  const addExisting = (id: string) => {
    if (workspace.menus.find(m => m.projectId === id)) return
    onUpdateWS({ ...workspace, menus: [...workspace.menus, { projectId: id, x: 200 + workspace.menus.length * 60, y: 200 + workspace.menus.length * 40 }] })
  }

  const removeFromCanvas = (idx: number) => {
    const pid = workspace.menus[idx].projectId
    onUpdateWS({ ...workspace, menus: workspace.menus.filter((_, i) => i !== idx), connections: workspace.connections.filter(c => c.fromMenu !== pid && c.toMenu !== pid) })
  }

  const getSlotCenter = (menuId: string, slot: string) => {
    const mi = workspace.menus.findIndex(m => m.projectId === menuId); if (mi < 0) return null
    const mm = workspace.menus[mi]; const [r, c] = slot.split('-').map(Number)
    return { x: mm.x + 3 + c * 21 + 10, y: mm.y + 28 + r * 21 + 10 }
  }

  const getMenuTop = (menuId: string) => {
    const mi = workspace.menus.findIndex(m => m.projectId === menuId); if (mi < 0) return null
    const mm = workspace.menus[mi]
    return { x: mm.x + (3 + 9 * 21) / 2, y: mm.y }
  }

  const toggleConnectMode = () => {
    setConnectMode(v => !v)
    setConnecting(null)
  }

  return (
    <div className={`${s.canvasWrap} ${grabbing ? s.grabbing : ''}`} onMouseDown={onBgDown} onWheel={onWheel}
      onMouseMove={e => setMousePos({ x: (e.clientX - pan.x) / zoom, y: (e.clientY - pan.y) / zoom })} ref={surfRef}
      onKeyDown={e => { if (e.key === 'Escape') { setConnecting(null); setConnectMode(false) } }} tabIndex={0}>
      <div className={s.gridBg} style={{ backgroundPosition: `${pan.x}px ${pan.y}px`, backgroundSize: `${40 * zoom}px ${40 * zoom}px` }} />
      <div className={s.canvasSurf} style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1, overflow: 'visible', pointerEvents: 'none', zIndex: 5 }}>
          <defs><marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="var(--ac)" /></marker></defs>
          {workspace.connections.map(c => {
            const from = getSlotCenter(c.fromMenu, c.fromSlot); const to = getMenuTop(c.toMenu)
            if (!from || !to) return null
            const dy = to.y - from.y
            return (
              <g key={c.id} style={{ pointerEvents: 'auto' }}>
                <path className={s.connLine} d={`M${from.x},${from.y} C${from.x},${from.y + dy * 0.5} ${to.x},${to.y - Math.abs(dy) * 0.3} ${to.x},${to.y}`} />
                <circle cx={(from.x + to.x) / 2} cy={(from.y + to.y) / 2} r={7} fill="var(--glass-surface)" stroke="var(--er)" strokeWidth={1.5}
                  style={{ cursor: 'pointer', opacity: 0 }} onClick={() => delConn(c.id)}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')} />
              </g>
            )
          })}
          {connectMode && connecting && getSlotCenter(connecting.menuId, connecting.slot) && (() => {
            const from = getSlotCenter(connecting.menuId, connecting.slot)!
            return <line x1={from.x} y1={from.y} x2={mousePos.x} y2={mousePos.y} stroke="var(--ac)" strokeWidth={2} strokeDasharray="6,4" style={{ pointerEvents: 'none' }} />
          })()}
        </svg>
        {workspace.menus.map((m, i) => {
          const p = projects[m.projectId]; if (!p) return null
          return <MiniMenu key={m.projectId} project={p} x={m.x} y={m.y}
            onDrag={(nx, ny) => moveMenu(i, nx, ny)}
            onSlotClick={onSlotClick}
            onSlotRightClick={onSlotRightClick}
            connectingFrom={connectMode ? connecting : null}
            onCtxMenu={(cx, cy) => setMmCtx({ x: (cx - pan.x) / zoom, y: (cy - pan.y) / zoom, idx: i })}
            isActive={m.projectId === activeProjectId}
            selectedSlot={m.projectId === activeProjectId ? selSlot : null}
          />
        })}
        {mmCtx && <CtxMenu x={mmCtx.x} y={mmCtx.y} onClose={() => setMmCtx(null)} items={[
          { label: 'Убрать с canvas', danger: true, fn: () => removeFromCanvas(mmCtx.idx) },
        ]} />}
        {slotCtx && (() => {
          const p = projects[slotCtx.menuId]
          const hasItem = p?.slots[slotCtx.slotKey]
          return <CtxMenu x={slotCtx.x} y={slotCtx.y} onClose={() => setSlotCtx(null)} items={[
            ...(hasItem ? [{ label: 'Удалить предмет', danger: true, fn: () => { onRemoveItem(slotCtx.menuId, slotCtx.slotKey); setSlotCtx(null) } }] : []),
          ]} />
        })()}
      </div>
      <div className={s.canvasTb}>
        <input value={workspace.name} onChange={e => onUpdateWS({ ...workspace, name: e.target.value })}
          style={{ background: 'var(--glass-panel)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '4px 8px', color: 'var(--tx1)', fontSize: 12, width: 160, textAlign: 'center' }} />
        <GlowButton onClick={addNew}>+ Новое</GlowButton>
        <select onChange={e => { if (e.target.value) addExisting(e.target.value); e.target.value = '' }}
          style={{ fontSize: 11, padding: '4px 6px', background: 'var(--glass-panel)', border: '1px solid var(--glass-border)', color: 'var(--tx1)', borderRadius: 4 }}>
          <option value="">+ Существующее...</option>
          {loadProjectList().filter(id => !workspace.menus.find(m => m.projectId === id)).map(id => {
            const p = loadProject(id); return p ? <option key={id} value={id}>{p.name}</option> : null
          })}
        </select>
        <GlowButton onClick={toggleConnectMode} variant={connectMode ? 'primary' : 'ghost'} title="Режим соединений">⇒ Связи</GlowButton>
        <span style={{ fontSize: 10, color: 'var(--tx3)' }}>{Math.round(zoom * 100)}%</span>
      </div>
      {connectMode && connecting && <div className={s.connHint}>Кликните по целевому меню · Esc — отмена</div>}
      {connectMode && !connecting && <div className={s.connHint}>Режим связей: кликните по слоту-источнику · Esc — выход</div>}
    </div>
  )
}
