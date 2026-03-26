import { useState } from 'react'
import type { TextSegment } from '@/types'
import { defaultSegment } from '@/utils/slot'
import { LORE_TPLS } from '@/data/loreTemplates'
import { TextEditor } from './TextEditor'
import s from '@/styles/editor.module.css'
import ss from '@/styles/shared.module.css'

interface Props {
  lore: TextSegment[][]
  onChange: (lore: TextSegment[][]) => void
}

export function LoreEditor({ lore, onChange }: Props) {
  const [showTpls, setShowTpls] = useState(false)
  const updateLine = (i: number, segs: TextSegment[]) => {
    onChange(lore.map((l, j) => j === i ? segs : l))
  }

  const removeLine = (i: number) => {
    onChange(lore.filter((_, j) => j !== i))
  }

  const addLine = () => {
    onChange([...lore, [defaultSegment('', '#AAAAAA')]])
  }

  const moveLine = (i: number, dir: -1 | 1) => {
    const ni = i + dir
    if (ni < 0 || ni >= lore.length) return
    const next = [...lore]
    ;[next[i], next[ni]] = [next[ni], next[i]]
    onChange(next)
  }

  return (
    <div className={s.section}>
      <div className={s.sectionTitle}>Описание (Lore)</div>
      {lore.map((line, i) => (
        <div key={i} className={s.loreLine}>
          <div className={s.loreHeader}>
            <span>Строка {i + 1}</span>
            <div style={{ display: 'flex', gap: 2 }}>
              <button className={s.fmtBtn} onClick={() => moveLine(i, -1)} title="Вверх">↑</button>
              <button className={s.fmtBtn} onClick={() => moveLine(i, 1)} title="Вниз">↓</button>
              <button className={s.segRemove} onClick={() => removeLine(i)}>✕</button>
            </div>
          </div>
          <TextEditor label="" segs={line} onChange={segs => updateLine(i, segs)} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button className={s.addBtn} onClick={addLine}>+ Строка</button>
        <div style={{ position: 'relative' }}>
          <button className={s.addBtn} onClick={() => setShowTpls(!showTpls)}>Шаблоны ▾</button>
          {showTpls && (
            <div style={{ position: 'absolute', zIndex: 100, background: 'var(--pan)', border: '1px solid var(--bd2)', borderRadius: 5, padding: 2, boxShadow: '0 6px 16px rgba(0,0,0,.5)', width: 220, maxHeight: 240, overflowY: 'auto', top: '100%', left: 0 }}>
              {LORE_TPLS.map((t, i) => (
                <button key={i} style={{ display: 'block', width: '100%', padding: '5px 8px', borderRadius: 2, cursor: 'pointer', fontSize: 11, border: 'none', background: 'none', color: 'var(--tx1)', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--hov)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  onClick={() => { onChange([...lore, [...t.segments]]); setShowTpls(false) }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
