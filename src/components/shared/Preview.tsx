import type { TextSegment } from '@/types'
import { McText } from './McText'
import { ItemTexture } from './ItemTexture'
import s from '@/styles/shared.module.css'

interface Props {
  name: TextSegment[]
  lore: TextSegment[][]
  itemId: string
  showIcon?: boolean
}

export function Preview({ name, lore, itemId, showIcon = true }: Props) {
  return (
    <div className={s.prevBox}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        {showIcon && <ItemTexture itemId={itemId} size={32} />}
        <div>
          <div className={s.prevLine}><McText segs={name} /></div>
          {lore.map((line, i) => (
            <div key={i} className={s.prevLine} style={{ fontSize: 12 }}>
              <McText segs={line} />
            </div>
          ))}
        </div>
      </div>
      <div className={s.prevId}>minecraft:{itemId}</div>
    </div>
  )
}
