import { useState, useRef, useEffect } from 'react'
import type { Workspace, Project, SlotData } from '@/types'
import { gid } from '@/utils/id'
import { newProject } from '@/utils/slot'
import { saveProject, loadProject, loadProjectList } from '@/storage'
import { CtxMenu, HoverTooltip } from '@/components/shared'
import { MiniMenu } from './MiniMenu'
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
  showNums: boolean
  onActivateMenu: (projectId: string) => void
  onBrushPick: (itemId: string) => void
  onResizeMenu: (projectId: string, rows: number) => void
  onSetEraser: () => void
  onDeselect: () => void
  onClearAll: (projectId: string) => void
  onRenameMenu?: (projectId: string, name: string) => void
}

export function CanvasView({ workspace, onUpdateWS, projects, activeProjectId, selSlot, onSlotSelect, palItem, onPlaceItem, onRemoveItem, showNums, onActivateMenu, onBrushPick, onResizeMenu, onSetEraser, onDeselect, onClearAll, onRenameMenu }: Props) {
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [connectMode, setConnectMode] = useState(false)
  const [connecting, setConnecting] = useState<ConnectingFrom | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [grabbing, setGrabbing] = useState(false)
  const [mmCtx, setMmCtx] = useState<{ x: number; y: number; idx: number } | null>(null)
  const [slotCtx, setSlotCtx] = useState<{ x: number; y: number; menuId: string; slotKey: string } | null>(null)
  const [hoverData, setHoverData] = useState<{ data: SlotData; x: number; y: number } | null>(null)
  const [showAddPopover, setShowAddPopover] = useState(false)
  const [selBox, setSelBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const [selectedMenus, setSelectedMenus] = useState<Set<string>>(new Set())
  const popoverRef = useRef<HTMLDivElement>(null)
  const surfRef = useRef<HTMLDivElement>(null)

  const SLOT_SIZE = 48
  const SLOT_GAP = 2
  const FRAME_PAD = 7 + 3
  const HEADER_H = 32

  const onBgDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(`.${s.miniMenu}`) || (e.target as HTMLElement).closest(`.${s.canvasBottomBar}`) || (e.target as HTMLElement).closest(`.${s.wsName}`) || (e.target as HTMLElement).closest(`.${ss.ctxMenu}`)) return

    if (e.button === 2) {
      e.preventDefault()
      const startX = (e.clientX - pan.x) / zoom
      const startY = (e.clientY - pan.y) / zoom
      setSelBox({ x1: startX, y1: startY, x2: startX, y2: startY })
      const mv = (ev: MouseEvent) => {
        const cx = (ev.clientX - pan.x) / zoom
        const cy = (ev.clientY - pan.y) / zoom
        setSelBox(prev => prev ? { ...prev, x2: cx, y2: cy } : null)
      }
      const up = () => {
        setSelBox(prev => {
          if (prev) {
            const minX = Math.min(prev.x1, prev.x2), maxX = Math.max(prev.x1, prev.x2)
            const minY = Math.min(prev.y1, prev.y2), maxY = Math.max(prev.y1, prev.y2)
            const menuW = FRAME_PAD * 2 + 9 * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP
            const sel = new Set<string>()
            for (const m of workspace.menus) {
              const p = projects[m.projectId]; if (!p) continue
              const menuH = HEADER_H + FRAME_PAD * 2 + p.rows * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP
              if (m.x + menuW > minX && m.x < maxX && m.y + menuH > minY && m.y < maxY) {
                sel.add(m.projectId)
              }
            }
            setSelectedMenus(sel)
          }
          return null
        })
        window.removeEventListener('mousemove', mv)
        window.removeEventListener('mouseup', up)
      }
      window.addEventListener('mousemove', mv)
      window.addEventListener('mouseup', up)
      return
    }

    if (e.button !== 0) return
    if (connecting) { setConnecting(null); return }
    setSelectedMenus(new Set())
    onDeselect()
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

  const moveMenu = (idx: number, cx: number, cy: number) => {
    onUpdateWS({ ...workspace, menus: workspace.menus.map((m, i) => i === idx ? { ...m, x: Math.round(cx), y: Math.round(cy) } : m) })
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
    setSlotCtx({ x: cx, y: cy, menuId, slotKey })
  }

  const handleSlotMouseDown = (menuId: string, slot: string, e: React.MouseEvent) => {
    if (e.altKey) {
      const p = projects[menuId]
      if (p?.slots[slot]) {
        e.preventDefault()
        e.stopPropagation()
        onBrushPick(p.slots[slot].itemId)
      }
      return
    }
    if (e.button === 2 && palItem) {
      e.preventDefault()
      e.stopPropagation()
      onPlaceItem(menuId, slot)
    }
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
    return {
      x: mm.x + FRAME_PAD + c * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2,
      y: mm.y + HEADER_H + FRAME_PAD + r * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2,
    }
  }

  const getMenuTop = (menuId: string) => {
    const mi = workspace.menus.findIndex(m => m.projectId === menuId); if (mi < 0) return null
    const mm = workspace.menus[mi]
    const menuWidth = FRAME_PAD * 2 + 9 * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP
    return { x: mm.x + menuWidth / 2, y: mm.y }
  }

  const toggleConnectMode = () => {
    setConnectMode(v => !v)
    setConnecting(null)
  }

  const fitAll = () => {
    if (!surfRef.current || workspace.menus.length === 0) return
    const rect = surfRef.current.getBoundingClientRect()
    const SLOT_SIZE = 48, SLOT_GAP = 2, FRAME_PAD = 10, HEADER_H = 32
    const menuW = FRAME_PAD * 2 + 9 * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const m of workspace.menus) {
      const p = projects[m.projectId]; if (!p) continue
      const menuH = HEADER_H + FRAME_PAD * 2 + p.rows * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP
      minX = Math.min(minX, m.x); minY = Math.min(minY, m.y)
      maxX = Math.max(maxX, m.x + menuW); maxY = Math.max(maxY, m.y + menuH)
    }
    const pad = 40
    const scaleX = (rect.width - pad * 2) / (maxX - minX)
    const scaleY = (rect.height - pad * 2) / (maxY - minY)
    const nz = Math.max(0.2, Math.min(3, Math.min(scaleX, scaleY)))
    setPan({ x: pad - minX * nz, y: pad - minY * nz })
    setZoom(nz)
  }

  useEffect(() => {
    if (!showAddPopover) return
    const h = (e: MouseEvent) => { if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setShowAddPopover(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showAddPopover])

  return (
    <div className={`${s.canvasWrap} ${grabbing ? s.grabbing : ''}`} onMouseDown={onBgDown} onWheel={onWheel}
      onContextMenu={e => e.preventDefault()}
      onMouseMove={e => setMousePos({ x: (e.clientX - pan.x) / zoom, y: (e.clientY - pan.y) / zoom })} ref={surfRef}
      onKeyDown={e => {
        if (e.key === 'Escape') { setConnecting(null); setConnectMode(false) }
        if (e.key === 'Delete') {
          if (selectedMenus.size > 0) {
            const updated = { ...workspace,
              menus: workspace.menus.filter(m => !selectedMenus.has(m.projectId)),
              connections: workspace.connections.filter(c => !selectedMenus.has(c.fromMenu) && !selectedMenus.has(c.toMenu))
            }
            onUpdateWS(updated)
            setSelectedMenus(new Set())
          } else if (!selSlot) {
            const idx = workspace.menus.findIndex(m => m.projectId === activeProjectId)
            if (idx >= 0) removeFromCanvas(idx)
          }
        }
      }} tabIndex={0}>
      <div className={s.gridBg} style={{ backgroundPosition: `${pan.x}px ${pan.y}px`, backgroundSize: `${40 * zoom}px ${40 * zoom}px` }} />
      <div className={s.canvasSurf} style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1, overflow: 'visible', pointerEvents: 'none', zIndex: 5 }}>
          <defs><marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="var(--ac)" /></marker></defs>
          {workspace.connections.map(c => {
            const from = getSlotCenter(c.fromMenu, c.fromSlot); const to = getMenuTop(c.toMenu)
            if (!from || !to) return null
            const dy = to.y - from.y
            const pathD = `M${from.x},${from.y} C${from.x},${from.y + dy * 0.5} ${to.x},${to.y - Math.abs(dy) * 0.3} ${to.x},${to.y}`
            const midX = (from.x + to.x) / 2
            const midY = (from.y + to.y) / 2
            return (
              <g key={c.id} style={{ pointerEvents: 'auto' }}>
                <path d={pathD} stroke="transparent" strokeWidth={12} fill="none" style={{ cursor: 'pointer', pointerEvents: 'stroke' }} onClick={() => delConn(c.id)} />
                <path className={s.connLine} d={pathD} style={{ pointerEvents: 'none' }} />
                <circle cx={midX} cy={midY} r={8} fill="var(--glass-surface)" stroke="var(--er)" strokeWidth={1.5}
                  style={{ cursor: 'pointer', opacity: 0.4, transition: 'opacity 150ms' }}
                  onClick={() => delConn(c.id)}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.setAttribute('fill', 'rgba(248,113,113,0.9)') }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.setAttribute('fill', 'var(--glass-surface)') }} />
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
          return <MiniMenu key={m.projectId} project={p} x={m.x} y={m.y} zoom={zoom}
            onDrag={(nx, ny) => moveMenu(i, nx, ny)}
            onSlotClick={onSlotClick}
            onSlotRightClick={onSlotRightClick}
            connectingFrom={connectMode ? connecting : null}
            onCtxMenu={(cx, cy) => setMmCtx({ x: cx, y: cy, idx: i })}
            onSlotMouseDown={handleSlotMouseDown}
            onActivate={onActivateMenu}
            isActive={m.projectId === activeProjectId}
            selectedSlot={m.projectId === activeProjectId ? selSlot : null}
            showNums={showNums}
            onSlotHover={(data, x, y) => data ? setHoverData({ data, x, y }) : setHoverData(null)}
            palItem={palItem}
            onDeleteMenu={pid => {
              const idx = workspace.menus.findIndex(mm => mm.projectId === pid)
              if (idx >= 0) removeFromCanvas(idx)
            }}
            onResizeMenu={onResizeMenu}
            onSetEraser={onSetEraser}
            onClearAll={onClearAll}
            onRename={onRenameMenu}
            isMultiSelected={selectedMenus.has(m.projectId)}
          />
        })}
        {selBox && (
          <div style={{
            position: 'absolute',
            left: Math.min(selBox.x1, selBox.x2),
            top: Math.min(selBox.y1, selBox.y2),
            width: Math.abs(selBox.x2 - selBox.x1),
            height: Math.abs(selBox.y2 - selBox.y1),
            border: '2px dashed var(--accent)',
            background: 'rgba(139,92,246,0.08)',
            borderRadius: 4,
            pointerEvents: 'none',
            zIndex: 10,
          }} />
        )}
      </div>
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
      <input
        className={s.wsName}
        value={workspace.name}
        onChange={e => onUpdateWS({ ...workspace, name: e.target.value })}
        title="Название workspace"
      />
      <div className={s.canvasBottomBar}>
        <div className={s.bottomBarGroup}>
          <button className={s.bottomBtn} onClick={addNew} title="Новое меню">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <div style={{ position: 'relative' }} ref={popoverRef}>
            <button className={s.bottomBtn} onClick={() => setShowAddPopover(v => !v)} title="Добавить существующее">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h3l2-2h6a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            </button>
            {showAddPopover && (
              <div className={s.addExistingPopover}>
                {loadProjectList().filter(id => !workspace.menus.find(m => m.projectId === id)).map(id => {
                  const p = loadProject(id); return p ? <button key={id} onClick={() => { addExisting(id); setShowAddPopover(false) }}>{p.name}</button> : null
                })}
                {loadProjectList().filter(id => !workspace.menus.find(m => m.projectId === id)).length === 0 && (
                  <div style={{ padding: '6px 10px', fontSize: 11, color: 'var(--tx3)' }}>Нет проектов</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div style={{ width: 1, height: 20, background: 'var(--glass-border)' }} />
        <div className={s.bottomBarGroup}>
          <button className={`${s.bottomBtn} ${connectMode ? s.bottomBtnActive : ''}`} onClick={toggleConnectMode} title="Режим соединений">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className={s.bottomBtn} onClick={fitAll} title="Уместить всё">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ width: 1, height: 20, background: 'var(--glass-border)' }} />
        <span className={s.bottomZoom}>{Math.round(zoom * 100)}%</span>
      </div>
      {connectMode && connecting && <div className={s.connHint}>Кликните по целевому меню · Esc — отмена</div>}
      {connectMode && !connecting && <div className={s.connHint}>Режим связей: кликните по слоту-источнику · Esc — выход</div>}
      {hoverData && <HoverTooltip data={hoverData.data} x={hoverData.x} y={hoverData.y} />}
    </div>
  )
}
