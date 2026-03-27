import { useState } from 'react'
import type { SlotData } from '@/types'
import { ItemTexture, Preview } from '@/components/shared'
import { SkullFace } from '@/components/shared/SkullFace'
import { TINTABLE } from '@/utils/slot'
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

  if (!data || !slotKey) {
    return <div className={s.editor}><div className={s.empty}>Выберите слот для редактирования</div></div>
  }

  const upd = (ch: Partial<SlotData>) => dispatch({ type: 'SS', key: slotKey, data: { ...data, ...ch } })

  return (
    <div className={s.editor}>
      <div className={s.body}>
        <div className={s.header}>
          <ItemTexture itemId={data.itemId} size={32} potionColor={data.potionColor} skullTexture={data.skullTexture} rpTexture={data.rpTexture} />
          <div style={{ flex: 1 }}><div className={s.itemId}>{data.itemId}</div></div>
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
                <label>{['potion', 'splash_potion', 'lingering_potion', 'tipped_arrow'].includes(data.itemId) ? 'Цвет зелья' : 'Цвет'}</label>
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
          <GlowButton onClick={() => upd({ displayName: [defaultSegment(itemName(data.itemId), '#FFFFFF')], lore: [], amount: 1, enchanted: false, customModelData: null, potionColor: null, skullTexture: null })}>Сбросить</GlowButton>
          <GlowButton variant="danger" onClick={() => dispatch({ type: 'RS', key: slotKey })}>Удалить</GlowButton>
        </div>
      </div>
      {showColorPicker && <ColorPickerModal onClose={() => setShowColorPicker(false)} />}
    </div>
  )
}
