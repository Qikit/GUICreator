import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Workspace, Project, SlotData } from '@/types'
import { gid } from '@/utils/id'
import { newProject } from '@/utils/slot'
import { saveProject, loadProject, loadProjectList } from '@/storage'
import { useProjectStore } from '@/store/projectStore'
import { useSelectionStore } from '@/store/selectionStore'
import { ItemTexture, CtxMenu, HoverTooltip } from '@/components/shared'
import { getGuiType } from '@/data/guiTypes'
import { MiniMenu } from './MiniMenu'
import { GiveContainerModal, GiveItemModal } from '@/components/modals'
import s from '@/styles/canvas.module.css'
import ss from '@/styles/shared.module.css'

interface ConnectingFrom { menuId: string; slot: string }

interface Props {
  workspace: Workspace
  onUpdateWS: (ws: Workspace) => void
  projects: Record<string, Project>
  activeProjectId: string | null
  onSlotSelect: (projectId: string, slotKey: string) => void
  palItem: string | null
  onPlaceItem: (projectId: string, slotKey: string) => void
  onRemoveItem: (projectId: string, slotKey: string) => void
  onMoveSlot: (projectId: string, from: string, to: string) => void
  showNums: boolean
  onActivateMenu: (projectId: string) => void
  onBrushPick: (itemId: string) => void
  onSlotPickup: (projectId: string, slotKey: string) => void
  onResizeMenu: (projectId: string, rows: number) => void
  onSetGuiType: (projectId: string, guiType: string) => void
  onSetEraser: () => void
  onMultiToggle: (projectId: string, slotKey: string) => void
  onDeselectPalette: () => void
  onClearAll: (projectId: string) => void
  onRenameMenu?: (projectId: string, name: string) => void
  onMenuRemoved?: (projectId: string) => void
  clipboard?: { multi: boolean; data: Record<string, SlotData> | SlotData; keys?: string[] } | null
  setClipboard?: (c: { multi: boolean; data: Record<string, SlotData> | SlotData; keys?: string[] } | null) => void
}

export function CanvasView({ workspace, onUpdateWS, projects, activeProjectId, onSlotSelect, palItem, onPlaceItem, onRemoveItem, onMoveSlot, showNums, onActivateMenu, onBrushPick, onSlotPickup, onResizeMenu, onSetGuiType, onSetEraser, onMultiToggle, onDeselectPalette, onClearAll, onRenameMenu, onMenuRemoved, clipboard, setClipboard }: Props) {
  const { dispatch } = useProjectStore()
  const { selSlot, multiSel, selectSlot, toggleMulti, clearSlotSelection, selectedMenus, setSelectedMenus, clearMenuSelection, toggleMenu } = useSelectionStore()
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [connectMode, setConnectMode] = useState(false)
  const [connecting, setConnecting] = useState<ConnectingFrom | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [grabbing, setGrabbing] = useState(false)
  const [mmCtx, setMmCtx] = useState<{ x: number; y: number; idx: number } | null>(null)
  const [slotCtx, setSlotCtx] = useState<{ x: number; y: number; menuId: string; slotKey: string } | null>(null)
  const [hoverData, setHoverData] = useState<{ data: SlotData; x: number; y: number } | null>(null)
  const [giveContainerMenuId, setGiveContainerMenuId] = useState<string | null>(null)
  const [giveItemSlot, setGiveItemSlot] = useState<SlotData | null>(null)
  const [showAddPopover, setShowAddPopover] = useState(false)
  const [selBox, setSelBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const groupDragStart = useRef<Map<string, { x: number; y: number }> | null>(null)
  const [painting, setPainting] = useState(false)
  const [draggingSlot, setDraggingSlot] = useState<{ menuId: string; key: string; data: SlotData } | null>(null)
  const [dragMousePos, setDragMousePos] = useState({ x: 0, y: 0 })
  const wasDraggingRef = useRef(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const surfRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef(workspace)
  wsRef.current = workspace

  const SLOT_SIZE = 48
  const SLOT_GAP = 2
  const FRAME_PAD = 7 + 3
  const HEADER_H = 32

  const onBgDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(`.${s.miniMenu}`) || (e.target as HTMLElement).closest(`.${s.canvasBottomBar}`) || (e.target as HTMLElement).closest(`.${s.wsName}`) || (e.target as HTMLElement).closest(`.${ss.ctxMenu}`)) return

    if (e.button === 2) {
      e.preventDefault()
      const rect = surfRef.current!.getBoundingClientRect()
      const startX = (e.clientX - rect.left - pan.x) / zoom
      const startY = (e.clientY - rect.top - pan.y) / zoom
      setSelBox({ x1: startX, y1: startY, x2: startX, y2: startY })
      const mv = (ev: MouseEvent) => {
        const cx = (ev.clientX - rect.left - pan.x) / zoom
        const cy = (ev.clientY - rect.top - pan.y) / zoom
        setSelBox(prev => prev ? { ...prev, x2: cx, y2: cy } : null)
      }
      const up = () => {
        setSelBox(prev => {
          if (prev) {
            const minX = Math.min(prev.x1, prev.x2), maxX = Math.max(prev.x1, prev.x2)
            const minY = Math.min(prev.y1, prev.y2), maxY = Math.max(prev.y1, prev.y2)
            const sel = new Set<string>()
            for (const m of workspace.menus) {
              const p = projects[m.projectId]; if (!p) continue
              const gt = getGuiType(p.guiType)
              const menuW = gt && gt.texture ? gt.containerWidth * 2 : FRAME_PAD * 2 + 9 * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP
              const menuH = gt && gt.texture ? HEADER_H + gt.containerHeight * 2 : HEADER_H + FRAME_PAD * 2 + p.rows * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP
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
    clearMenuSelection()
    clearSlotSelection()
    onDeselectPalette()
    setGrabbing(true)
    const sx = e.clientX - pan.x, sy = e.clientY - pan.y
    const mv = (ev: MouseEvent) => setPan({ x: ev.clientX - sx, y: ev.clientY - sy })
    const up = () => { setGrabbing(false); window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up)
  }

  const onWheelRef = useRef<(e: WheelEvent) => void>()
  onWheelRef.current = (e: WheelEvent) => {
    e.preventDefault()
    const rect = surfRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const d = e.deltaY > 0 ? 0.9 : 1.1
    const nz = Math.max(0.2, Math.min(3, zoom * d))
    setPan({ x: mx - (mx - pan.x) * nz / zoom, y: my - (my - pan.y) * nz / zoom })
    setZoom(nz)
  }

  useEffect(() => {
    const el = surfRef.current
    if (!el) return
    const handler = (e: WheelEvent) => onWheelRef.current?.(e)
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const SNAP_DISTANCE = 10

  const getMenuDims = (p: Project) => {
    const gt = getGuiType(p.guiType)
    if (gt && gt.texture) return { w: gt.containerWidth * 2, h: HEADER_H + gt.containerHeight * 2 }
    const w = FRAME_PAD * 2 + 9 * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP
    const h = HEADER_H + FRAME_PAD * 2 + p.rows * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP
    return { w, h }
  }

  const snapMenu = (idx: number, rawX: number, rawY: number) => {
    const ws = wsRef.current
    let sx = rawX, sy = rawY
    const myP = projects[ws.menus[idx]?.projectId]
    const myDims = myP ? getMenuDims(myP) : { w: 460, h: 200 }

    for (let j = 0; j < ws.menus.length; j++) {
      if (j === idx) continue
      const other = ws.menus[j]
      const op = projects[other.projectId]; if (!op) continue
      const od = getMenuDims(op)
      const otherCenterX = other.x + od.w / 2
      const myCenterX = rawX + myDims.w / 2

      if (Math.abs(myCenterX - otherCenterX) < SNAP_DISTANCE) sx = other.x + od.w / 2 - myDims.w / 2
      if (Math.abs(rawX - other.x) < SNAP_DISTANCE) sx = other.x
      if (Math.abs((rawX + myDims.w) - (other.x + od.w)) < SNAP_DISTANCE) sx = other.x + od.w - myDims.w

      if (Math.abs(rawY - (other.y + od.h + 20)) < SNAP_DISTANCE) sy = other.y + od.h + 20
      if (Math.abs(rawY - other.y) < SNAP_DISTANCE) sy = other.y
    }

    return { x: Math.round(sx), y: Math.round(sy) }
  }

  const moveMenu = (idx: number, cx: number, cy: number) => {
    const ws = wsRef.current
    const { x, y } = snapMenu(idx, cx, cy)
    onUpdateWS({ ...ws, menus: ws.menus.map((m, i) => i === idx ? { ...m, x, y } : m) })
  }

  const onSlotClick = (menuId: string, slot: string, e?: React.MouseEvent) => {
    if (wasDraggingRef.current) return
    if (connectMode) {
      if (!connecting) { setConnecting({ menuId, slot }) }
      else {
        if (connecting.menuId === menuId) return
        onUpdateWS({ ...workspace, connections: [...workspace.connections, { id: gid(), fromMenu: connecting.menuId, fromSlot: connecting.slot, toMenu: menuId }] })
        setConnecting(null)
      }
    } else if (palItem) {
      onPlaceItem(menuId, slot)
    } else if (e?.shiftKey) {
      onMultiToggle(menuId, slot)
    } else {
      onSlotSelect(menuId, slot)
    }
  }

  const onSlotRightClick = (menuId: string, slotKey: string, cx: number, cy: number, asCtx?: boolean) => {
    if (asCtx) {
      onSlotSelect(menuId, slotKey)
      setHoverData(null)
      setSlotCtx({ x: cx, y: cy, menuId, slotKey })
      return
    }
    if (!palItem) {
      onMultiToggle(menuId, slotKey)
    }
  }

  const handleSlotMouseDown = (menuId: string, slot: string, e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault()
      const p = projects[menuId]
      if (p?.slots[slot]) onSlotPickup(menuId, slot)
      return
    }
    if (e.altKey && e.button === 0 && palItem) {
      e.preventDefault(); e.stopPropagation()
      setPainting(true)
      onPlaceItem(menuId, slot)
      return
    }
    if (e.altKey && !palItem) {
      const p = projects[menuId]
      if (p?.slots[slot]) {
        e.preventDefault(); e.stopPropagation()
        onBrushPick(p.slots[slot].itemId)
      }
      return
    }
    if (e.button === 2 && palItem) {
      e.preventDefault(); e.stopPropagation()
      setPainting(true)
      onPlaceItem(menuId, slot)
      return
    }
    if (e.button === 2 && !palItem) {
      e.preventDefault(); e.stopPropagation()
      onActivateMenu(menuId)
      const sel = useSelectionStore.getState()
      if (sel.multiSel.has(slot) && sel.multiSel.size > 1) {
        setHoverData(null)
        setSlotCtx({ x: e.clientX, y: e.clientY, menuId, slotKey: slot })
        return
      }
      sel.startDragSel(menuId, slot)
      const onUp = () => {
        window.removeEventListener('mouseup', onUp)
        useSelectionStore.getState().endDragSel()
      }
      window.addEventListener('mouseup', onUp)
      return
    }
    if (e.button === 0 && !palItem && !connectMode) {
      const p = projects[menuId]
      if (p?.slots[slot]) {
        e.stopPropagation()
        const startX = e.clientX, startY = e.clientY
        let started = false
        const sel = useSelectionStore.getState()
        const isGroupDrag = sel.multiSel.has(slot) && sel.multiSel.size > 1
        const groupKeys = isGroupDrag ? [...sel.multiSel] : null

        const mv = (ev: MouseEvent) => {
          if (!started && (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4)) {
            started = true
            wasDraggingRef.current = true
            setDraggingSlot({ menuId, key: slot, data: p.slots[slot] })
            setDragMousePos({ x: ev.clientX, y: ev.clientY })
          }
          if (started) setDragMousePos({ x: ev.clientX, y: ev.clientY })
        }
        const up = (ev: MouseEvent) => {
          window.removeEventListener('mousemove', mv)
          window.removeEventListener('mouseup', up)
          if (started) {
            setDraggingSlot(null)
            const el = document.elementFromPoint(ev.clientX, ev.clientY)
            const slotEl = el?.closest('[data-slot-key]') as HTMLElement | null
            if (slotEl) {
              const targetKey = slotEl.getAttribute('data-slot-key')!
              const targetMenu = slotEl.getAttribute('data-menu-id')!
              if (targetMenu === menuId && targetKey !== slot) {
                if (isGroupDrag && groupKeys) {
                  const [sr, sc] = slot.split('-').map(Number)
                  const [tr, tc] = targetKey.split('-').map(Number)
                  const dr = tr - sr, dc = tc - sc
                  const newSlots: Record<string, SlotData> = {}
                  const removeKeys: string[] = []
                  for (const k of groupKeys) {
                    if (!p.slots[k]) continue
                    const [r, c] = k.split('-').map(Number)
                    const nr = r + dr, nc = c + dc
                    if (nr >= 0 && nr < p.rows && nc >= 0 && nc < 9) {
                      newSlots[`${nr}-${nc}`] = JSON.parse(JSON.stringify(p.slots[k]))
                    }
                    removeKeys.push(k)
                  }
                  dispatch({ type: 'REPL', remove: removeKeys, set: newSlots })
                  useSelectionStore.getState().setMultiSel(new Set(Object.keys(newSlots)))
                } else {
                  onMoveSlot(menuId, slot, targetKey)
                }
              }
            }
            setTimeout(() => { wasDraggingRef.current = false }, 0)
          } else {
            wasDraggingRef.current = false
          }
        }
        window.addEventListener('mousemove', mv)
        window.addEventListener('mouseup', up)
      }
    }
  }

  const duplicateMenu = (menuId: string, nx: number, ny: number) => {
    const src = projects[menuId]
    if (!src) return
    const dup = { ...JSON.parse(JSON.stringify(src)), id: gid(), name: src.name + ' (копия)', createdAt: Date.now(), updatedAt: Date.now() }
    saveProject(dup)
    onUpdateWS({ ...workspace, menus: [...workspace.menus, { projectId: dup.id, x: nx, y: ny }] })
  }

  const delConn = (id: string) => onUpdateWS({ ...workspace, connections: workspace.connections.filter(c => c.id !== id) })

  const viewportCenter = () => {
    const rect = surfRef.current?.getBoundingClientRect()
    const cx = rect ? ((rect.width / 2 - pan.x) / zoom) : 200
    const cy = rect ? ((rect.height / 2 - pan.y) / zoom) : 200
    return { cx, cy }
  }

  const addNew = () => {
    const p = newProject('Меню ' + (workspace.menus.length + 1), 3); saveProject(p)
    const { cx, cy } = viewportCenter()
    onUpdateWS({ ...workspace, menus: [...workspace.menus, { projectId: p.id, x: Math.round(cx - 200), y: Math.round(cy - 100) }] })
  }

  const addExisting = (id: string) => {
    if (workspace.menus.find(m => m.projectId === id)) return
    const { cx, cy } = viewportCenter()
    onUpdateWS({ ...workspace, menus: [...workspace.menus, { projectId: id, x: Math.round(cx - 200), y: Math.round(cy - 100) }] })
  }

  const removeFromCanvas = (idx: number) => {
    const pid = workspace.menus[idx].projectId
    onUpdateWS({ ...workspace, menus: workspace.menus.filter((_, i) => i !== idx), connections: workspace.connections.filter(c => c.fromMenu !== pid && c.toMenu !== pid) })
    onMenuRemoved?.(pid)
  }

  const getSlotCenter = (menuId: string, slot: string) => {
    const mi = workspace.menus.findIndex(m => m.projectId === menuId); if (mi < 0) return null
    const mm = workspace.menus[mi]
    const p = projects[menuId]
    const gt = p ? getGuiType(p.guiType) : null
    if (gt && gt.texture) {
      const scale = 2
      const sl = gt.slots.find(s => s.key === slot)
      if (!sl) return null
      return { x: mm.x + sl.x * scale + 9 * scale, y: mm.y + HEADER_H + sl.y * scale + 9 * scale }
    }
    const [r, c] = slot.split('-').map(Number)
    return {
      x: mm.x + FRAME_PAD + c * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2,
      y: mm.y + HEADER_H + FRAME_PAD + r * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2,
    }
  }

  const getMenuTop = (menuId: string) => {
    const mi = workspace.menus.findIndex(m => m.projectId === menuId); if (mi < 0) return null
    const mm = workspace.menus[mi]
    const p = projects[menuId]
    const gt = p ? getGuiType(p.guiType) : null
    const menuWidth = gt && gt.texture ? gt.containerWidth * 2 : FRAME_PAD * 2 + 9 * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP
    return { x: mm.x + menuWidth / 2, y: mm.y }
  }

  const toggleConnectMode = () => {
    setConnectMode(v => !v)
    setConnecting(null)
  }

  const fitAll = () => {
    if (!surfRef.current || workspace.menus.length === 0) return
    const rect = surfRef.current.getBoundingClientRect()
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const m of workspace.menus) {
      const p = projects[m.projectId]; if (!p) continue
      const d = getMenuDims(p)
      minX = Math.min(minX, m.x); minY = Math.min(minY, m.y)
      maxX = Math.max(maxX, m.x + d.w); maxY = Math.max(maxY, m.y + d.h)
    }
    const pad = 40
    const scaleX = (rect.width - pad * 2) / (maxX - minX)
    const scaleY = (rect.height - pad * 2) / (maxY - minY)
    const nz = Math.max(0.2, Math.min(3, Math.min(scaleX, scaleY)))
    setPan({ x: pad - minX * nz, y: pad - minY * nz })
    setZoom(nz)
  }

  useEffect(() => {
    requestAnimationFrame(() => fitAll())
  }, [workspace.id])

  useEffect(() => {
    const stop = () => setPainting(false)
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [])

  useEffect(() => {
    if (!showAddPopover) return
    const h = (e: MouseEvent) => { if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setShowAddPopover(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showAddPopover])

  return (
    <div className={`${s.canvasWrap} ${grabbing || draggingSlot ? s.grabbing : ''}`} onMouseDown={onBgDown}
      onContextMenu={e => e.preventDefault()}
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      onMouseMove={e => {
        const r = surfRef.current!.getBoundingClientRect()
        setMousePos({ x: (e.clientX - r.left - pan.x) / zoom, y: (e.clientY - r.top - pan.y) / zoom })
      }} ref={surfRef}
      onKeyDown={e => {
        if (e.key === 'Escape') { setConnecting(null); setConnectMode(false) }
        if (e.key === 'Delete') {
          if (selectedMenus.size > 0) {
            const updated = { ...workspace,
              menus: workspace.menus.filter(m => !selectedMenus.has(m.projectId)),
              connections: workspace.connections.filter(c => !selectedMenus.has(c.fromMenu) && !selectedMenus.has(c.toMenu))
            }
            onUpdateWS(updated)
            clearMenuSelection()
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
            onDrag={(nx, ny) => {
              if (selectedMenus.has(m.projectId) && selectedMenus.size > 1) {
                if (!groupDragStart.current) {
                  groupDragStart.current = new Map()
                  for (const mm of workspace.menus) {
                    if (selectedMenus.has(mm.projectId)) groupDragStart.current.set(mm.projectId, { x: mm.x, y: mm.y })
                  }
                }
                const start = groupDragStart.current.get(m.projectId)!
                const dx = nx - start.x, dy = ny - start.y
                const newMenus = workspace.menus.map(mm => {
                  const ms = groupDragStart.current!.get(mm.projectId)
                  if (ms) return { ...mm, x: Math.round(ms.x + dx), y: Math.round(ms.y + dy) }
                  return mm
                })
                onUpdateWS({ ...workspace, menus: newMenus })
              } else {
                moveMenu(i, nx, ny)
              }
            }}
            onDragEnd={() => { groupDragStart.current = null }}
            onToggleMenuSelect={pid => toggleMenu(pid)}
            onSlotClick={onSlotClick}
            onSlotRightClick={onSlotRightClick}
            connectingFrom={connectMode ? connecting : null}
            onCtxMenu={(cx, cy) => setMmCtx({ x: cx, y: cy, idx: i })}
            onSlotMouseDown={handleSlotMouseDown}
            onActivate={onActivateMenu}
            isActive={m.projectId === activeProjectId}
            selectedSlot={m.projectId === activeProjectId ? selSlot : null}
            multiSel={m.projectId === activeProjectId ? multiSel : undefined}
            showNums={showNums}
            onSlotHover={(data, x, y) => data ? setHoverData({ data, x, y }) : setHoverData(null)}
            palItem={palItem}
            onDeleteMenu={pid => {
              const idx = workspace.menus.findIndex(mm => mm.projectId === pid)
              if (idx >= 0) removeFromCanvas(idx)
            }}
            onResizeMenu={onResizeMenu}
            onSetGuiType={onSetGuiType}
            onSetEraser={onSetEraser}
            onClearAll={onClearAll}
            onDuplicateDrag={duplicateMenu}
            onGiveCommand={(menuId) => setGiveContainerMenuId(menuId)}
            onRename={onRenameMenu}
            isMultiSelected={selectedMenus.has(m.projectId)}
            onSlotEnter={(menuId, slot) => {
              if (painting && palItem) onPlaceItem(menuId, slot)
              const { isDragSel, dragMenuId, dragOverSlot } = useSelectionStore.getState()
              if (isDragSel && dragMenuId === menuId) dragOverSlot(slot)
            }}
            dragSourceKeys={draggingSlot?.menuId === m.projectId
              ? (multiSel.has(draggingSlot.key) && multiSel.size > 1 ? multiSel : new Set([draggingSlot.key]))
              : null}
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
      {mmCtx && createPortal(<CtxMenu x={mmCtx.x} y={mmCtx.y} onClose={() => setMmCtx(null)} items={[
        { label: 'Убрать с canvas', danger: true, fn: () => removeFromCanvas(mmCtx.idx) },
      ]} />, document.body)}
      {slotCtx && (() => {
        const p = projects[slotCtx.menuId]
        const ms = multiSel
        const isMultiCtx = ms.size > 1 && ms.has(slotCtx.slotKey)

        if (isMultiCtx && p) {
          return createPortal(<CtxMenu x={slotCtx.x} y={slotCtx.y} onClose={() => setSlotCtx(null)} items={[
            { label: `Копировать (${ms.size})`, fn: () => {
              const d: Record<string, SlotData> = {}
              for (const k of ms) if (p.slots[k]) d[k] = JSON.parse(JSON.stringify(p.slots[k]))
              setClipboard?.({ multi: true, data: d, keys: [...ms] })
              setSlotCtx(null)
            }},
            { label: 'Отзеркалить \u2194', fn: () => {
              const keys = [...ms]
              const filledKeys = keys.filter(k => p.slots[k])
              if (filledKeys.length === 0) { setSlotCtx(null); return }
              const cols = filledKeys.map(k => parseInt(k.split('-')[1]))
              const minC = Math.min(...cols), maxC = Math.max(...cols)
              const newSlots: Record<string, SlotData> = {}
              const removeKeys: string[] = []
              for (const k of filledKeys) {
                const [r, c] = k.split('-').map(Number)
                const mc = maxC - c + minC
                const nk = `${r}-${mc}`
                newSlots[nk] = JSON.parse(JSON.stringify(p.slots[k]))
                removeKeys.push(k)
              }
              dispatch({ type: 'REPL', remove: removeKeys, set: newSlots })
              useSelectionStore.getState().setMultiSel(new Set(Object.keys(newSlots)))
              setSlotCtx(null)
            }},
            { sep: true },
            { label: `Удалить (${ms.size})`, danger: true, fn: () => {
              dispatch({ type: 'RM', keys: [...ms] })
              clearSlotSelection()
              setSlotCtx(null)
            }},
          ]} />, document.body)
        }

        const hasItem = p?.slots[slotCtx.slotKey]
        return createPortal(<CtxMenu x={slotCtx.x} y={slotCtx.y} onClose={() => setSlotCtx(null)} items={[
          ...(hasItem ? [
            { label: 'Скопировать /give', fn: () => { setGiveItemSlot(hasItem); setSlotCtx(null) } },
            { sep: true },
            { label: 'Удалить предмет', danger: true, fn: () => { onRemoveItem(slotCtx.menuId, slotCtx.slotKey); setSlotCtx(null) } },
          ] : []),
        ]} />, document.body)
      })()}
      <input
        className={s.wsName}
        value={workspace.name}
        onChange={e => onUpdateWS({ ...workspace, name: e.target.value })}
        title="Название workspace"
      />
      <div className={s.canvasBottomBar}>
        <div className={s.bottomBarGroup}>
          <button className={s.bottomBtn} onClick={addNew} data-tip="Новое меню">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <div style={{ position: 'relative' }} ref={popoverRef}>
            <button className={s.bottomBtn} onClick={() => setShowAddPopover(v => !v)} data-tip="Добавить существующее">
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
          <button className={`${s.bottomBtn} ${connectMode ? s.bottomBtnActive : ''}`} onClick={toggleConnectMode} data-tip="Режим соединений">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className={s.bottomBtn} onClick={fitAll} data-tip="Уместить всё">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ width: 1, height: 20, background: 'var(--glass-border)' }} />
        <span className={s.bottomZoom}>{Math.round(zoom * 100)}%</span>
      </div>
      {connectMode && connecting && <div className={s.connHint}>Кликните по целевому меню · Esc — отмена</div>}
      {connectMode && !connecting && <div className={s.connHint}>Режим связей: кликните по слоту-источнику · Esc — выход</div>}
      {hoverData && !draggingSlot && <HoverTooltip data={hoverData.data} x={hoverData.x} y={hoverData.y} />}
      {draggingSlot && (() => {
        const isGroup = multiSel.has(draggingSlot.key) && multiSel.size > 1
        if (isGroup) {
          const p = projects[draggingSlot.menuId]
          if (!p) return null
          const [baseR, baseC] = draggingSlot.key.split('-').map(Number)
          return createPortal(
            <div style={{ position: 'fixed', left: dragMousePos.x - 20, top: dragMousePos.y - 20, pointerEvents: 'none', zIndex: 9999 }}>
              {[...multiSel].map(k => {
                const d = p.slots[k]; if (!d) return null
                const [r, c] = k.split('-').map(Number)
                return (
                  <div key={k} style={{ position: 'absolute', left: (c - baseC) * 50, top: (r - baseR) * 50, width: 40, height: 40, opacity: 0.85, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>
                    <ItemTexture itemId={d.itemId} potionColor={d.potionColor} skullTexture={d.skullTexture} armorTrim={d.armorTrim} />
                  </div>
                )
              })}
            </div>,
            document.body,
          )
        }
        return createPortal(
          <div style={{ position: 'fixed', left: dragMousePos.x - 20, top: dragMousePos.y - 20, width: 40, height: 40, pointerEvents: 'none', zIndex: 9999, opacity: 0.85, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>
            <ItemTexture itemId={draggingSlot.data.itemId} potionColor={draggingSlot.data.potionColor} skullTexture={draggingSlot.data.skullTexture} armorTrim={draggingSlot.data.armorTrim} />
          </div>,
          document.body,
        )
      })()}
      {giveContainerMenuId && (() => {
        const p = projects[giveContainerMenuId]
        return p ? createPortal(<GiveContainerModal project={p} onClose={() => setGiveContainerMenuId(null)} />, document.body) : null
      })()}
      {giveItemSlot && createPortal(<GiveItemModal slot={giveItemSlot} onClose={() => setGiveItemSlot(null)} />, document.body)}
    </div>
  )
}
