import { useState, useMemo } from 'react'
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
                  rpTexture={preset?.rpTexture}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            <button
              className={`${s.viewBtn} ${paletteView === 'grid' ? s.viewBtnActive : ''}`}
              onClick={() => setPaletteView('grid')}
              data-tip="Мелкие значки"
            >▦</button>
            <button
              className={`${s.viewBtn} ${paletteView === 'largeGrid' ? s.viewBtnActive : ''}`}
              onClick={() => setPaletteView('largeGrid')}
              data-tip="Крупные значки"
            >▣</button>
            <button
              className={`${s.viewBtn} ${paletteView === 'list' ? s.viewBtnActive : ''}`}
              onClick={() => setPaletteView('list')}
              data-tip="Список"
            >☰</button>
          </div>
          <button
            className={`${s.eraserBtn} ${selItem === ERASER_ID ? s.eraserBtnSel : ''}`}
            onClick={() => onSelect(ERASER_ID)}
            data-tip="Ластик"
          >🚫</button>
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
