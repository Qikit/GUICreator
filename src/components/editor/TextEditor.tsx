import { useState, useEffect } from 'react'
import type { TextSegment } from '@/types'
import { parseMM, seg2mm } from '@/utils/minimessage'
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

export function TextEditor({ label, segs, onChange }: Props) {
  const [mmText, setMmText] = useState(() => seg2mm(segs))
  const [showSymbols, setShowSymbols] = useState(false)

  useEffect(() => { setMmText(seg2mm(segs)) }, [segs])

  const apply = (text: string) => {
    setMmText(text)
    const parsed = parseMM(text)
    if (parsed.length) onChange(parsed)
    else if (!text.trim()) onChange([defaultSegment('', '#FFFFFF')])
  }

  const insertSymbol = (sym: string) => {
    const newText = mmText + sym
    apply(newText)
    setShowSymbols(false)
  }

  return (
    <div className={s.section}>
      {label && <div className={s.sectionTitle}>{label}</div>}
      <div style={{ position: 'relative' }}>
        <textarea
          className={s.mmInput}
          value={mmText}
          onChange={e => apply(e.target.value)}
          placeholder="<red><bold>Текст</bold></red>"
          rows={2}
          style={{ minHeight: 42 }}
        />
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
          <div className={s.mmHelp}>{'<color> <bold> <italic> <gradient:#HEX1:#HEX2>'}</div>
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <button className={s.addBtn} onClick={() => setShowSymbols(!showSymbols)}>⚝</button>
            {showSymbols && (
              <div style={{ position: 'absolute', zIndex: 100, background: 'var(--pan)', border: '1px solid var(--bd2)', borderRadius: 5, padding: 6, boxShadow: '0 6px 16px rgba(0,0,0,.5)', width: 240, bottom: '100%', right: 0, marginBottom: 4 }}>
                {MC_SYMBOLS.map((g, gi) => (
                  <div key={gi} style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: 9, color: 'var(--tx3)', marginBottom: 2 }}>{g.group}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {g.symbols.map((sym, si) => (
                        <button key={si} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--bd)', borderRadius: 2, cursor: 'pointer', fontSize: 12, background: 'none', color: 'var(--tx1)' }}
                          onClick={() => insertSymbol(sym)} title={sym}>{sym}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={ss.prevBox} style={{ marginTop: 4 }}>
        <div className={ss.prevLine}><McText segs={segs} /></div>
      </div>
    </div>
  )
}
