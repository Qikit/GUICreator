import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Project } from '@/types'
import type { SlotData } from '@/types'
import { ItemTexture } from '@/components/shared'
import { McText } from '@/components/shared'
import { parseMM } from '@/utils/minimessage'
import { GUI_TYPES, getGuiType } from '@/data/guiTypes'
import { assetUrl } from '@/utils/paths'
import { GlassModal } from '@/components/ui'
import s from '@/styles/canvas.module.css'

interface ConnectingFrom { menuId: string; slot: string }

interface Props {
  project: Project
  x: number; y: number
  zoom: number
  onDrag: (nx: number, ny: number) => void
  onSlotClick: (menuId: string, slot: string) => void
  onSlotRightClick?: (menuId: string, slot: string, x: number, y: number) => void
  onSlotMouseDown?: (menuId: string, slot: string, e: React.MouseEvent) => void
  connectingFrom: ConnectingFrom | null
  onCtxMenu?: (cx: number, cy: number) => void
  isActive?: boolean
  selectedSlot?: string | null
  showNums?: boolean
  onSlotHover?: (data: SlotData | null, x: number, y: number) => void
  onActivate?: (menuId: string) => void
  palItem?: string | null
  onDeleteMenu?: (menuId: string) => void
  onResizeMenu?: (menuId: string, rows: number) => void
  onSetGuiType?: (menuId: string, guiType: string) => void
  onSetEraser?: () => void
  onClearAll?: (menuId: string) => void
  onRename?: (menuId: string, name: string) => void
  isMultiSelected?: boolean
  onSlotEnter?: (menuId: string, slot: string) => void
}

const SCALE = 2

export function MiniMenu({ project, x, y, zoom, onDrag, onSlotClick, onSlotRightClick, onSlotMouseDown, connectingFrom, onCtxMenu, isActive, selectedSlot, showNums, onSlotHover, onActivate, palItem, onDeleteMenu, onResizeMenu, onSetGuiType, onSetEraser, onClearAll, onRename, onSlotEnter }: Props) {
  const [editingName, setEditingName] = useState(false)
  const [nameText, setNameText] = useState(project.name)
  const [showSizeMenu, setShowSizeMenu] = useState(false)
  const [showContainerModal, setShowContainerModal] = useState(false)

  const guiType = getGuiType(project.guiType)

  useEffect(() => {
    if (!showSizeMenu) return
    const h = (e: MouseEvent) => setShowSizeMenu(false)
    const t = setTimeout(() => document.addEventListener('mousedown', h), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h) }
  }, [showSizeMenu])

  const startDrag = (e: React.MouseEvent) => {
    if (e.button !== 0) return; e.stopPropagation()
    onActivate?.(project.id)
    const startMouseX = e.clientX, startMouseY = e.clientY
    const startX = x, startY = y
    const mv = (ev: MouseEvent) => {
      const dx = (ev.clientX - startMouseX) / zoom
      const dy = (ev.clientY - startMouseY) / zoom
      onDrag(startX + dx, startY + dy)
    }
    const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up)
  }

  const renderSlot = (key: string, d: SlotData | undefined, displayNum?: number | string, extraClass?: string) => {
    const isSrc = connectingFrom && connectingFrom.menuId === project.id && connectingFrom.slot === key
    const isSel = selectedSlot === key
    return (
      <div key={key} className={`${extraClass || s.mmSlot} ${isSrc ? s.mmSlotConn : ''} ${isSel ? s.mmSlotSel : ''}`}
        onClick={e => { e.stopPropagation(); onSlotClick(project.id, key) }}
        onMouseDown={e => { onSlotMouseDown?.(project.id, key, e) }}
        onContextMenu={e => {
          e.preventDefault(); e.stopPropagation()
          if (!palItem) onSlotRightClick?.(project.id, key, e.clientX, e.clientY)
        }}
        onMouseEnter={e => {
          if (d) onSlotHover?.(d, e.clientX, e.clientY)
          onSlotEnter?.(project.id, key)
        }}
        onMouseLeave={() => onSlotHover?.(null, 0, 0)}>
        {!extraClass && <div className={s.mmSlotHover} />}
        {showNums && <span className={s.mmSlotNum}>{displayNum !== undefined ? displayNum : key}</span>}
        {d && (
          <div className={s.mmSlotContent}>
            <ItemTexture itemId={d.itemId} potionColor={d.potionColor} skullTexture={d.skullTexture} rpTexture={d.rpTexture} />
          </div>
        )}
        {d?.enchanted && <div className={s.mmSlotEnchant} />}
        {d && d.amount > 1 && <span className={s.mmSlotAmount}>{d.amount}</span>}
      </div>
    )
  }

  const sizeBadgeText = guiType ? guiType.name : `${project.rows}x9`

  const header = (
    <div className={s.mmHeader} onMouseDown={editingName ? undefined : startDrag} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onCtxMenu?.(e.clientX, e.clientY) }}>
      {editingName ? (
        <input
          value={nameText}
          onChange={e => setNameText(e.target.value)}
          onBlur={() => { onRename?.(project.id, nameText); setEditingName(false) }}
          onKeyDown={e => {
            if (e.key === 'Enter') { onRename?.(project.id, nameText); setEditingName(false) }
            if (e.key === 'Escape') setEditingName(false)
          }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          autoFocus
          style={{ background: 'var(--glass-surface)', border: '1px solid var(--accent)', borderRadius: 3, padding: '1px 4px', color: 'var(--tx1)', fontSize: 11, fontWeight: 600, width: '100%', outline: 'none' }}
        />
      ) : (
        <span onDoubleClick={e => { e.stopPropagation(); setNameText(project.name); setEditingName(true) }}>
          <McText segs={parseMM(project.name)} />
        </span>
      )}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <span className={s.mmSizeBadge} onClick={e => { e.stopPropagation(); setShowSizeMenu(v => !v) }}>
          {sizeBadgeText}
        </span>
        {showSizeMenu && (
          <div className={s.mmSizeMenu} onClick={e => e.stopPropagation()}>
            {[1,2,3,4,5,6].map(n => (
              <button key={n} className={`${s.mmSizeOption} ${!guiType && project.rows === n ? s.mmSizeOptionActive : ''}`}
                onClick={() => { onResizeMenu?.(project.id, n); setShowSizeMenu(false) }}>
                {n}x9
              </button>
            ))}
            <div style={{ height: 1, background: 'var(--glass-border)', margin: '2px 0' }} />
            <button className={s.mmSizeOption}
              onClick={() => { setShowSizeMenu(false); setShowContainerModal(true) }}>
              Другие контейнеры...
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const toolbar = isActive ? (
    <div className={s.mmToolbar}>
      <button className={s.mmToolBtn} data-tip="Удалить меню"
        onClick={e => { e.stopPropagation(); if (confirm('Удалить меню с canvas?')) onDeleteMenu?.(project.id) }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1M4 4v7a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      </button>
      <button className={s.mmToolBtn} data-tip="Тип / размер"
        onClick={e => { e.stopPropagation(); setShowSizeMenu(v => !v) }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2h4M2 2v4M12 12H8M12 12V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      </button>
      <button className={`${s.mmToolBtn} ${palItem === '__eraser__' ? s.mmToolBtnActive : ''}`} data-tip="Ластик"
        onClick={e => { e.stopPropagation(); onSetEraser?.() }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 2.5l3 3-6 6H3L1.5 10l7-7.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      </button>
    </div>
  ) : null

  const containerModal = showContainerModal ? createPortal(
    <GlassModal onClose={() => setShowContainerModal(false)} title="Типы контейнеров">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, maxHeight: '60vh', overflowY: 'auto', padding: 4 }}>
        {GUI_TYPES.filter(t => t.id !== 'generic').map(t => (
          <div key={t.id}
            onClick={() => { onSetGuiType?.(project.id, t.id); setShowContainerModal(false) }}
            style={{ padding: 8, background: 'var(--glass-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'center' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--glass-surface)')}>
            {t.texture && (
              <img
                src={`${import.meta.env.BASE_URL}${t.texture}`}
                style={{ width: '100%', height: 60, objectFit: 'contain', imageRendering: 'pixelated', marginBottom: 4, display: 'block' }}
              />
            )}
            <div style={{ fontSize: 11, color: 'var(--tx1)' }}>{t.name}</div>
            <div style={{ fontSize: 9, color: 'var(--tx3)' }}>{t.slots.length} слотов</div>
          </div>
        ))}
      </div>
    </GlassModal>,
    document.body
  ) : null

  if (guiType && guiType.texture) {
    const w = guiType.containerWidth * SCALE
    const h = guiType.containerHeight * SCALE
    const texUrl = assetUrl(guiType.texture)

    return (
      <>
        <div className={`${s.miniMenu} ${isActive ? s.mmActive : ''}`} style={{ left: x, top: y }}
          onMouseDown={e => { e.stopPropagation(); onActivate?.(project.id) }}>
          <div className={s.mmMain}>
            {header}
            <div className={s.mmTexturedBody} style={{
              width: w,
              height: h,
              backgroundImage: `url(${texUrl})`,
              backgroundSize: `${256 * SCALE}px ${256 * SCALE}px`,
              backgroundPosition: '0 0',
              imageRendering: 'pixelated',
            }}>
              {guiType.slots.map(sl => {
                const d = project.slots[sl.key]
                return (
                  <div key={sl.key}
                    className={`${s.mmTexSlot} ${selectedSlot === sl.key ? s.mmSlotSel : ''} ${connectingFrom && connectingFrom.menuId === project.id && connectingFrom.slot === sl.key ? s.mmSlotConn : ''}`}
                    style={{ left: sl.x * SCALE, top: sl.y * SCALE, width: 18 * SCALE, height: 18 * SCALE }}
                    onClick={e => { e.stopPropagation(); onSlotClick(project.id, sl.key) }}
                    onMouseDown={e => { onSlotMouseDown?.(project.id, sl.key, e) }}
                    onContextMenu={e => { e.preventDefault(); e.stopPropagation(); if (!palItem) onSlotRightClick?.(project.id, sl.key, e.clientX, e.clientY) }}
                    onMouseEnter={e => { if (d) onSlotHover?.(d, e.clientX, e.clientY); onSlotEnter?.(project.id, sl.key) }}
                    onMouseLeave={() => onSlotHover?.(null, 0, 0)}>
                    {showNums && <span className={s.mmSlotNum}>{sl.key}</span>}
                    {d && <div className={s.mmSlotContent}><ItemTexture itemId={d.itemId} potionColor={d.potionColor} skullTexture={d.skullTexture} rpTexture={d.rpTexture} /></div>}
                    {d?.enchanted && <div className={s.mmSlotEnchant} />}
                    {d && d.amount > 1 && <span className={s.mmSlotAmount}>{d.amount}</span>}
                  </div>
                )
              })}
            </div>
          </div>
          {toolbar}
        </div>
        {containerModal}
      </>
    )
  }

  return (
    <>
      <div className={`${s.miniMenu} ${isActive ? s.mmActive : ''}`} style={{ left: x, top: y }}
        onMouseDown={e => { e.stopPropagation(); onActivate?.(project.id) }}>
        <div className={s.mmMain}>
          {header}
          <div className={s.mmBody}>
            <div className={s.mmGrid}>
              {Array.from({ length: project.rows }, (_, r) =>
                Array.from({ length: 9 }, (_, c) => {
                  const k = `${r}-${c}`; const d = project.slots[k]
                  return renderSlot(k, d, r * 9 + c)
                })
              )}
            </div>
          </div>
        </div>
        {toolbar}
      </div>
      {containerModal}
    </>
  )
}
