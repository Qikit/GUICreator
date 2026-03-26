import { useState } from 'react'
import type { TextSegment } from '@/types'
import { parseMM } from '@/utils/minimessage'
import { defaultSegment } from '@/utils/slot'
import { McText } from '@/components/shared'
import s from '@/styles/editor.module.css'
import ss from '@/styles/shared.module.css'

interface Props {
  label: string
  segs: TextSegment[]
  onChange: (segs: TextSegment[]) => void
}

const FORMATS: Array<{ key: keyof TextSegment; label: string }> = [
  { key: 'bold', label: 'B' },
  { key: 'italic', label: 'I' },
  { key: 'underlined', label: 'U' },
  { key: 'strikethrough', label: 'S' },
  { key: 'obfuscated', label: 'K' },
]

export function TextEditor({ label, segs, onChange }: Props) {
  const [mode, setMode] = useState<'visual' | 'mm'>('visual')
  const [mmText, setMmText] = useState('')

  const updateSeg = (i: number, patch: Partial<TextSegment>) => {
    const next = segs.map((seg, j) => j === i ? { ...seg, ...patch } : seg)
    onChange(next)
  }

  const removeSeg = (i: number) => {
    if (segs.length <= 1) return
    onChange(segs.filter((_, j) => j !== i))
  }

  const addSeg = () => {
    onChange([...segs, defaultSegment('', segs[segs.length - 1]?.color || '#FFFFFF')])
  }

  const applyMM = () => {
    const parsed = parseMM(mmText)
    if (parsed.length) onChange(parsed)
  }

  return (
    <div className={s.section}>
      <div className={s.sectionTitle}>{label}</div>
      <div style={{ display: 'flex', gap: 1, marginBottom: 6 }}>
        <button className={`${s.fmtBtn} ${mode === 'visual' ? s.fmtBtnOn : ''}`} onClick={() => setMode('visual')} style={{ width: 'auto', padding: '2px 8px' }}>Visual</button>
        <button className={`${s.fmtBtn} ${mode === 'mm' ? s.fmtBtnOn : ''}`} onClick={() => setMode('mm')} style={{ width: 'auto', padding: '2px 8px' }}>MM</button>
      </div>

      {mode === 'visual' ? (
        <>
          {segs.map((seg, i) => (
            <div key={i} className={s.segRow}>
              <input
                type="color"
                className={s.segColor}
                value={seg.color}
                onChange={e => updateSeg(i, { color: e.target.value.toUpperCase() })}
              />
              <input
                className={s.segText}
                value={seg.text}
                onChange={e => updateSeg(i, { text: e.target.value })}
                placeholder="текст..."
              />
              <div className={s.segFormats}>
                {FORMATS.map(f => (
                  <button
                    key={f.key}
                    className={`${s.fmtBtn} ${seg[f.key] ? s.fmtBtnOn : ''}`}
                    onClick={() => updateSeg(i, { [f.key]: !seg[f.key] })}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button className={s.segRemove} onClick={() => removeSeg(i)}>✕</button>
            </div>
          ))}
          <button className={s.addBtn} onClick={addSeg}>+ Сегмент</button>
        </>
      ) : (
        <>
          <textarea
            className={s.mmInput}
            value={mmText}
            onChange={e => setMmText(e.target.value)}
            placeholder="<red><bold>Название</bold></red>"
          />
          <div className={s.mmHelp}>{'<color>text</color> <bold> <italic> <gradient:#HEX1:#HEX2>text</gradient>'}</div>
          <button className={`${ss.btn} ${ss.btnPrimary}`} onClick={applyMM} style={{ marginTop: 4, fontSize: 10 }}>Применить</button>
        </>
      )}

      <div className={ss.prevBox} style={{ marginTop: 4 }}>
        <div className={ss.prevLine}><McText segs={segs} /></div>
      </div>
    </div>
  )
}
