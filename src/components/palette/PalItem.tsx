import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { SlotPreset } from '@/types'
import { ItemTexture, McText } from '@/components/shared'
import { ruName } from '@/utils/slot'
import ps from '@/styles/palette.module.css'
import ss from '@/styles/shared.module.css'

interface Props {
  id: string
  selected: boolean
  preset?: SlotPreset
  onSelect: (id: string, preset?: SlotPreset) => void
  size?: number
}

export function PalItem({ id, selected, preset, onSelect, size = 28 }: Props) {
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)

  return (
    <div
      className={`${ps.palItem} ${selected ? ps.palItemSel : ''}`}
      onClick={() => onSelect(id, preset)}
      onMouseEnter={e => {
        const r = e.currentTarget.getBoundingClientRect()
        setHover({ x: r.right + 4, y: r.top })
      }}
      onMouseLeave={() => setHover(null)}
    >
      <ItemTexture
        itemId={id}
        size={size}
        potionColor={preset?.potionColor}
        skullTexture={preset?.skullTexture}
        rpTexture={preset?.rpTexture}
      />
      {hover && createPortal(
        <div className={ss.hoverTT} style={{ left: hover.x, top: hover.y }}>
          <div className={ss.prevBox} style={{ padding: '4px 7px' }}>
            {preset ? (
              <>
                {preset.displayName && <div className={ss.prevLine}><McText segs={preset.displayName} /></div>}
                {preset.lore?.map((l, i) => <div key={i} className={ss.prevLine} style={{ fontSize: 11 }}><McText segs={l} /></div>)}
              </>
            ) : (
              <div className={ss.prevLine} style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                <span className={ss.mcText} style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{ruName(id)}</span>
              </div>
            )}
            <div style={{ color: '#555', fontSize: 9, fontFamily: "'Minecraft', 'Courier New', monospace" }}>minecraft:{id}</div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
