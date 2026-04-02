import { useState, useRef, useEffect, useMemo } from 'react'
import type { SlotData } from '@/types'
import { ITEM_DB } from '@/data/items'
import { ItemTexture, Preview } from '@/components/shared'
import { SkullFace } from '@/components/shared/SkullFace'
import { TINTABLE, TRIMMABLE, TRIM_MATERIALS, TRIM_PATTERNS } from '@/utils/slot'
import { itemName } from '@/utils/slot'
import { defaultSegment } from '@/utils/slot'
import { TextEditor } from './TextEditor'
import { LoreEditor } from './LoreEditor'
import { ColorPickerModal } from '@/components/modals'
import { GlassToggle, GlowButton } from '@/components/ui'
import s from '@/styles/editor.module.css'

interface Props {
  data: SlotData | null
  slotKey: string | null
  dispatch: (action: { type: string; [k: string]: unknown }) => void
}

export function ItemEditor({ data, slotKey, dispatch }: Props) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showMatPopup, setShowMatPopup] = useState(false)
  const [matSearch, setMatSearch] = useState('')
  const matRef = useRef<HTMLDivElement>(null)
  const matInputRef = useRef<HTMLInputElement>(null)

  const allItems = useMemo(() => {
    const items: { id: string; name: string }[] = []
    for (const cat of Object.values(ITEM_DB)) {
      if ((cat as { preset?: boolean }).preset) continue
      for (const item of cat.items) items.push({ id: item.id, name: item.name })
    }
    const seen = new Set<string>()
    return items.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true })
  }, [])

  const filteredMats = useMemo(() => {
    if (!matSearch) return allItems.slice(0, 50)
    const q = matSearch.toLowerCase()
    return allItems.filter(i => i.id.includes(q) || i.name.toLowerCase().includes(q)).slice(0, 50)
  }, [matSearch, allItems])

  useEffect(() => {
    if (!showMatPopup) return
    matInputRef.current?.focus()
    const h = (e: MouseEvent) => { if (matRef.current && !matRef.current.contains(e.target as Node)) setShowMatPopup(false) }
    const t = setTimeout(() => document.addEventListener('mousedown', h), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h) }
  }, [showMatPopup])

  if (!data || !slotKey) {
    return <div className={s.editor}><div className={s.empty}>Выберите слот для редактирования</div></div>
  }

  const upd = (ch: Partial<SlotData>) => dispatch({ type: 'SS', key: slotKey, data: { ...data, ...ch } })

  const changeMaterial = (newId: string) => {
    upd({ itemId: newId })
    setShowMatPopup(false)
    setMatSearch('')
  }

  return (
    <div className={s.editor}>
      <div className={s.body}>
        <div className={s.header}>
          <ItemTexture itemId={data.itemId} size={32} potionColor={data.potionColor} skullTexture={data.skullTexture} armorTrim={data.armorTrim} />
          <div style={{ flex: 1, position: 'relative' }} ref={matRef}>
            <div className={s.itemId} style={{ cursor: 'pointer' }} onClick={() => setShowMatPopup(v => !v)}>
              {data.itemId} <span style={{ fontSize: 9, color: 'var(--tx3)' }}>&#9662;</span>
            </div>
            {showMatPopup && (
              <div className={s.matPopup}>
                <input
                  ref={matInputRef}
                  className={s.matSearch}
                  value={matSearch}
                  onChange={e => setMatSearch(e.target.value)}
                  placeholder="Search item..."
                  onKeyDown={e => {
                    if (e.key === 'Escape') setShowMatPopup(false)
                    if (e.key === 'Enter' && filteredMats.length > 0) changeMaterial(filteredMats[0].id)
                  }}
                />
                {filteredMats.map(item => (
                  <button key={item.id} className={s.matItem} onClick={() => changeMaterial(item.id)}>
                    <ItemTexture itemId={item.id} size={16} />
                    {item.id}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setShowColorPicker(true)} data-tip="Цвета"
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', background: 'none', color: 'var(--tx2)', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="5" cy="5" r="1" fill="#f87171"/><circle cx="9" cy="5" r="1" fill="#4ade80"/><circle cx="5" cy="9" r="1" fill="#60a5fa"/><circle cx="9" cy="9" r="1" fill="#facc15"/></svg>
          </button>
        </div>

        <TextEditor label="Название" segs={data.displayName} onChange={segs => upd({ displayName: segs })} />
        <LoreEditor lore={data.lore} onChange={lore => upd({ lore })} />

        <div className={s.section}>
          <div className={s.sectionTitle}>Свойства</div>
          <div className={s.props}>
            <label>Количество</label>
            <div className={s.amount}>
              <GlowButton size="md" style={{ width: 32, padding: 0, justifyContent: 'center' }}
                onClick={() => upd({ amount: Math.max(1, data.amount - 1) })}>−</GlowButton>
              <input
                type="number"
                value={data.amount}
                min={1} max={64}
                onChange={e => upd({ amount: Math.max(1, Math.min(64, parseInt(e.target.value) || 1)) })}
                style={{ width: 50, textAlign: 'center', fontSize: 14, fontWeight: 600 }}
              />
              <GlowButton size="md" style={{ width: 32, padding: 0, justifyContent: 'center' }}
                onClick={() => upd({ amount: Math.min(64, data.amount + 1) })}>+</GlowButton>
            </div>

            <label>Зачарование</label>
            <GlassToggle checked={data.enchanted} onChange={v => upd({ enchanted: v })} />

            <label>CMD</label>
            <input
              type="number"
              value={data.customModelData || ''}
              placeholder="Custom Model Data"
              onChange={e => upd({ customModelData: e.target.value ? parseInt(e.target.value) : null })}
              style={{ width: 120, fontSize: 12 }}
            />

            {TINTABLE.has(data.itemId) && (
              <>
                <label>{['potion', 'splash_potion', 'lingering_potion', 'tipped_arrow'].includes(data.itemId) ? 'Цвет зелья' : 'Цвет кожи'}</label>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={data.potionColor || '#FF0000'}
                    onChange={e => upd({ potionColor: e.target.value.toUpperCase() })}
                    style={{ width: 28, height: 28, padding: 0, border: '1px solid var(--glass-border)', borderRadius: 3, cursor: 'pointer' }}
                  />
                  <input
                    value={data.potionColor || ''}
                    placeholder="#FF0000"
                    onChange={e => {
                      const v = e.target.value
                      if (/^#[0-9A-Fa-f]{6}$/.test(v)) upd({ potionColor: v.toUpperCase() })
                      else if (!v) upd({ potionColor: null })
                    }}
                    style={{ width: 80, fontSize: 11 }}
                  />
                  {data.potionColor && <GlowButton size="sm" onClick={() => upd({ potionColor: null })}>✕</GlowButton>}
                </div>
              </>
            )}

            {TRIMMABLE.has(data.itemId) && (
              <>
                <label>Отделка</label>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={data.armorTrim?.pattern || ''}
                    onChange={e => {
                      if (!e.target.value) { upd({ armorTrim: null }); return }
                      upd({ armorTrim: { pattern: e.target.value, material: data.armorTrim?.material || 'redstone' } })
                    }}
                    style={{ fontSize: 11, width: 100 }}
                  >
                    <option value="">Нет</option>
                    {TRIM_PATTERNS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {data.armorTrim && (
                    <select
                      value={data.armorTrim.material}
                      onChange={e => upd({ armorTrim: { ...data.armorTrim!, material: e.target.value } })}
                      style={{ fontSize: 11, width: 90 }}
                    >
                      {TRIM_MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  )}
                  {data.armorTrim && <GlowButton size="sm" onClick={() => upd({ armorTrim: null })}>✕</GlowButton>}
                </div>
              </>
            )}

            {data.itemId === 'player_head' && (
              <>
                <label>Текстура головы</label>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  {data.skullTexture && <SkullFace url={data.skullTexture} size={24} />}
                  <GlowButton size="sm" onClick={() => {
                    const v = prompt('Вставьте base64 текстуру или URL скина:')
                    if (!v) return
                    if (v.startsWith('http')) { upd({ skullTexture: v }); return }
                    try {
                      const j = JSON.parse(atob(v))
                      const u = j.textures?.SKIN?.url
                      if (u) upd({ skullTexture: u })
                      else alert('Не найден URL скина')
                    } catch (e) { alert('Ошибка парсинга') }
                  }}>{data.skullTexture ? 'Заменить' : 'Вставить'}</GlowButton>
                  {data.skullTexture && <GlowButton size="sm" onClick={() => upd({ skullTexture: null })}>✕</GlowButton>}
                </div>
              </>
            )}
          </div>
        </div>

        <div className={s.section}>
          <div className={s.sectionTitle}>Превью</div>
          <Preview name={data.displayName} lore={data.lore} itemId={data.itemId} />
        </div>

        <div className={s.actions}>
          <GlowButton onClick={() => upd({ displayName: [defaultSegment(itemName(data.itemId), '#FFFFFF')], lore: [], amount: 1, enchanted: false, customModelData: null, potionColor: null, skullTexture: null, armorTrim: null })}>Сбросить</GlowButton>
          <GlowButton variant="danger" onClick={() => dispatch({ type: 'RS', key: slotKey })}>Удалить</GlowButton>
        </div>
      </div>
      {showColorPicker && <ColorPickerModal onClose={() => setShowColorPicker(false)} />}
    </div>
  )
}
