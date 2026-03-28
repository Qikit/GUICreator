import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  const symBtnRef = useRef<HTMLButtonElement>(null)
  const symPopupRef = useRef<HTMLDivElement>(null)

  const selfEdit = useRef(false)

  useEffect(() => { if (!selfEdit.current) setMmText(seg2mm(segs)); selfEdit.current = false }, [segs])

  useEffect(() => {
    if (!showSymbols) return
    const h = (e: MouseEvent) => {
      if (symBtnRef.current?.contains(e.target as Node)) return
      if (symPopupRef.current?.contains(e.target as Node)) return
      setShowSymbols(false)
    }
    const t = setTimeout(() => document.addEventListener('mousedown', h), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h) }
  }, [showSymbols])

  const apply = (text: string) => {
    selfEdit.current = true
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
          <div style={{ marginLeft: 'auto' }}>
            <button ref={symBtnRef} className={s.addBtn} data-tip="Символы" onClick={() => setShowSymbols(!showSymbols)}>⚝</button>
            {showSymbols && (() => {
              const r = symBtnRef.current?.getBoundingClientRect()
              if (!r) return null
              const above = r.top > 260
              const top = above ? r.top : r.bottom + 4
              const transform = above ? 'translateY(-100%)' : 'none'
              return createPortal(
                <div ref={symPopupRef} style={{ position: 'fixed', zIndex: 1000, background: 'rgba(15, 7, 32, 0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 6, boxShadow: '0 8px 32px rgba(0,0,0,.5)', width: 240, maxHeight: 250, overflowY: 'auto', top, left: Math.min(r.right - 240, window.innerWidth - 250), transform }}>
                  {MC_SYMBOLS.map((g, gi) => (
                    <div key={gi} style={{ marginBottom: 4 }}>
                      <div style={{ fontSize: 9, color: 'var(--tx3)', marginBottom: 2 }}>{g.group}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {g.symbols.map((sym, si) => (
                          <button key={si} style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', borderRadius: 2, cursor: 'pointer', fontSize: 11, background: 'none', color: 'var(--tx1)' }}
                            onClick={() => insertSymbol(sym)} title={sym}>{sym}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>,
                document.body
              )
            })()}
          </div>
        </div>
      </div>
      <div className={ss.prevBox} style={{ marginTop: 4 }}>
        <div className={ss.prevLine}><McText segs={segs} /></div>
      </div>
    </div>
  )
}
