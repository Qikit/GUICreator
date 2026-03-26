import type { TextSegment } from '@/types'
import { defaultSegment } from '@/utils/slot'
import { TextEditor } from './TextEditor'
import s from '@/styles/editor.module.css'
import ss from '@/styles/shared.module.css'

interface Props {
  lore: TextSegment[][]
  onChange: (lore: TextSegment[][]) => void
}

export function LoreEditor({ lore, onChange }: Props) {
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
      <button className={s.addBtn} onClick={addLine}>+ Строка описания</button>
    </div>
  )
}
