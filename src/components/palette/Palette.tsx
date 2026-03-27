import { useState, useMemo } from 'react'
import type { SlotPreset, ItemDatabase } from '@/types'
import { ItemTexture } from '@/components/shared'
import { ruName, ERASER_ID } from '@/utils/slot'
import { PalItem } from './PalItem'
import { GlowButton } from '@/components/ui'
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
  const [customId, setCustomId] = useState('')

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

  return (
    <div className={s.palette}>
      <div className={s.header}>
        <span>Предметы</span>
        <button
          className={`${s.eraserBtn} ${selItem === ERASER_ID ? s.eraserBtnSel : ''}`}
          onClick={() => onSelect(ERASER_ID)}
          title="Ластик"
        >🚫</button>
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
      <div className={s.body}>
        {recent.length > 0 && (
          <div className={s.category}>
            <div className={s.catHeader} onClick={() => toggle('__r')}>
              <ItemTexture itemId={recent[0] || 'clock'} size={14} />
              Недавние
            </div>
            {openCats.__r !== false && (
              <div className={s.itemGrid}>
                {recent.map(id => <PalItem key={id} id={id} selected={selItem === id} onSelect={onSelect} />)}
              </div>
            )}
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
            {(openCats[k] || search) && (
              <div className={s.itemGrid}>
                {cat.items.map((it, i) => (
                  <PalItem
                    key={`${it.id}-${i}`}
                    id={it.id}
                    selected={selItem === it.id && !it.preset}
                    preset={it.preset as SlotPreset | undefined}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={s.footer}>
        <input
          value={customId}
          onChange={e => setCustomId(e.target.value)}
          placeholder="custom_id"
          onKeyDown={e => { if (e.key === 'Enter' && customId) { onSelect(customId); setCustomId('') } }}
        />
        <GlowButton variant="primary" size="sm" style={{ padding: '2px 6px' }}
          onClick={() => { if (customId) { onSelect(customId); setCustomId('') } }}
        >+</GlowButton>
      </div>
    </div>
  )
}
