import { useState } from 'react'
import type { TextSegment } from '@/types'
import { parseMM } from '@/utils/minimessage'
import { defaultSegment } from '@/utils/slot'
import { MC_SYMBOLS } from '@/data/loreTemplates'
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
  const [showSymbols, setShowSymbols] = useState(false)

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
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button className={s.addBtn} onClick={addSeg}>+ Сегмент</button>
            <div style={{ position: 'relative' }}>
              <button className={s.addBtn} onClick={() => setShowSymbols(!showSymbols)}>⚝ Символы</button>
              {showSymbols && (
                <div style={{ position: 'absolute', zIndex: 100, background: 'var(--pan)', border: '1px solid var(--bd2)', borderRadius: 5, padding: 6, boxShadow: '0 6px 16px rgba(0,0,0,.5)', width: 240, top: '100%', left: 0 }}>
                  {MC_SYMBOLS.map((g, gi) => (
                    <div key={gi} style={{ marginBottom: 4 }}>
                      <div style={{ fontSize: 9, color: 'var(--tx3)', marginBottom: 2 }}>{g.group}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {g.symbols.map((sym, si) => (
                          <button key={si} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--bd)', borderRadius: 2, cursor: 'pointer', fontSize: 12, background: 'none', color: 'var(--tx1)' }}
                            onClick={() => {
                              const last = segs.length - 1
                              if (last >= 0) updateSeg(last, { text: segs[last].text + sym })
                              else onChange([defaultSegment(sym)])
                              setShowSymbols(false)
                            }}
                            title={sym}>{sym}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
