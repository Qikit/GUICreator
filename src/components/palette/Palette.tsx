import { useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { SlotPreset, ItemDatabase } from '@/types'
import { ItemTexture } from '@/components/shared'
import { ruName, ERASER_ID } from '@/utils/slot'
import { PalItem } from './PalItem'
import { usePrefsStore } from '@/store/prefsStore'
import s from '@/styles/palette.module.css'

interface Props {
  itemDB: ItemDatabase
  selItem: string | null
  onSelect: (id: string, preset?: SlotPreset) => void
  recent: string[]
}

function TipBtn({ className, onClick, tip, children, style }: {
  className?: string; onClick: () => void; tip: string; children: React.ReactNode; style?: React.CSSProperties
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  return (
    <button
      className={className}
      onClick={onClick}
      style={style}
      onMouseEnter={e => {
        const r = e.currentTarget.getBoundingClientRect()
        setPos({ x: r.left + r.width / 2, y: r.bottom + 6 })
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && createPortal(
        <div style={{
          position: 'fixed', left: pos.x, top: pos.y, transform: 'translateX(-50%)',
          background: 'rgba(15,7,32,0.95)', color: '#e4e4e7', padding: '4px 10px',
          borderRadius: 6, fontSize: 10, whiteSpace: 'nowrap', pointerEvents: 'none',
          zIndex: 10000, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>{tip}</div>,
        document.body,
      )}
    </button>
  )
}

export function Palette({ itemDB, selItem, onSelect, recent }: Props) {
  const [search, setSearch] = useState('')
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({ glass_panes: true, functional: true })
  const { paletteView, setPaletteView } = usePrefsStore()

  const toggle = (k: string) => setOpenCats(p => ({ ...p, [k]: !p[k] }))

  const filtered = useMemo(() => {
    if (!search) return itemDB
    const q = search.toLowerCase()
    const r: ItemDatabase = {}
    for (const [k, cat] of Object.entries(itemDB)) {
      const items = cat.items.filter(i => {
        if (i.id.includes(q) || i.name.toLowerCase().includes(q) || ruName(i.id).toLowerCase().includes(q) || cat.label.toLowerCase().includes(q)) return true
        if (i.preset?.displayName) {
          const dt = i.preset.displayName.map(s => s.text).join('').toLowerCase()
          if (dt.includes(q)) return true
        }
        return false
      })
      if (items.length) r[k] = { ...cat, items }
    }
    return r
  }, [search, itemDB])

  const gridClass = paletteView === 'largeGrid' ? s.itemGridLarge : s.itemGrid
  const allOpen = Object.keys(filtered).every(k => openCats[k])

  const toggleAll = useCallback(() => {
    const allKeys = Object.keys(filtered)
    const shouldOpen = !allKeys.every(k => openCats[k])
    const next: Record<string, boolean> = { ...openCats }
    for (const k of allKeys) next[k] = shouldOpen
    next.__r = shouldOpen
    setOpenCats(next)
  }, [filtered, openCats])

  const renderItems = (items: ItemDatabase[string]['items'], keyPrefix: string, isRecent = false) => {
    if (paletteView === 'list') {
      return (
        <div className={s.itemList}>
          {items.map((it, i) => {
            const id = typeof it === 'string' ? it : it.id
            const preset = typeof it === 'string' ? undefined : it.preset as SlotPreset | undefined
            const selected = selItem === id && (isRecent || !preset)
            return (
              <div
                key={`${id}-${i}`}
                className={`${s.listItem} ${selected ? s.listItemSel : ''}`}
                onClick={() => onSelect(id, preset)}
              >
                <ItemTexture
                  itemId={id}
                  size={20}
                  potionColor={preset?.potionColor}
                  skullTexture={preset?.skullTexture}
                />
                <span>{ruName(id) || (typeof it === 'string' ? id : it.name)}</span>
              </div>
            )
          })}
        </div>
      )
    }

    if (isRecent) {
      return (
        <div className={gridClass}>
          {(items as unknown as string[]).map(id => (
            <PalItem key={id} id={id} selected={selItem === id} onSelect={onSelect} size={paletteView === 'largeGrid' ? 44 : 28} />
          ))}
        </div>
      )
    }

    return (
      <div className={gridClass}>
        {items.map((it, i) => (
          <PalItem
            key={`${keyPrefix}-${it.id}-${i}`}
            id={it.id}
            selected={selItem === it.id && !it.preset}
            preset={it.preset as SlotPreset | undefined}
            onSelect={onSelect}
            size={paletteView === 'largeGrid' ? 44 : 28}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={s.palette}>
      <div className={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <TipBtn className={`${s.viewBtn} ${paletteView === 'grid' ? s.viewBtnActive : ''}`}
            onClick={() => setPaletteView('grid')} tip="Мелкие значки">▦</TipBtn>
          <TipBtn className={`${s.viewBtn} ${paletteView === 'largeGrid' ? s.viewBtnActive : ''}`}
            onClick={() => setPaletteView('largeGrid')} tip="Крупные значки">▣</TipBtn>
          <TipBtn className={`${s.viewBtn} ${paletteView === 'list' ? s.viewBtnActive : ''}`}
            onClick={() => setPaletteView('list')} tip="Список">☰</TipBtn>
          <TipBtn className={`${s.eraserBtn} ${selItem === ERASER_ID ? s.eraserBtnSel : ''}`}
            onClick={() => onSelect(ERASER_ID)} tip="Ластик (E)">🚫</TipBtn>
          <TipBtn className={s.viewBtn} onClick={toggleAll}
            tip={allOpen ? 'Свернуть все' : 'Развернуть все'}>{allOpen ? '▴' : '▾'}</TipBtn>
        </div>
      </div>
      <div className={s.search}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск..."
          style={{ paddingRight: search ? 22 : 8 }}
        />
        {search && <button className={s.clearBtn} onClick={() => setSearch('')}>✕</button>}
      </div>
      <div className={`${s.body} ${paletteView === 'largeGrid' ? s.bodyLarge : ''}`}>
        {recent.length > 0 && (
          <div className={s.category}>
            <div className={s.catHeader} onClick={() => toggle('__r')}>
              <ItemTexture itemId={recent[0] || 'clock'} size={14} />
              Недавние
            </div>
            {openCats.__r !== false && renderItems(recent as any, '__r', true)}
          </div>
        )}

        {Object.entries(filtered).map(([k, cat]) => (
          <div key={k} className={s.category}>
            <div className={s.catHeader} onClick={() => toggle(k)}>
              <ItemTexture
                itemId={cat.items[0]?.id || 'stone'}
                size={14}
                potionColor={(cat.items[0] as { preset?: SlotPreset })?.preset?.potionColor}
                skullTexture={(cat.items[0] as { preset?: SlotPreset })?.preset?.skullTexture}
              />
              {cat.label}
              <span className={s.catCount}>({cat.items.length})</span>
            </div>
            {(openCats[k] || search) && renderItems(cat.items, k)}
          </div>
        ))}
      </div>
    </div>
  )
}
