import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { TextSegment } from '@/types'
import { parseMM, seg2mm } from '@/utils/minimessage'
import { LORE_TPLS, MC_SYMBOLS } from '@/data/loreTemplates'
import { McText } from '@/components/shared'
import s from '@/styles/editor.module.css'
import ss from '@/styles/shared.module.css'

interface Props {
  lore: TextSegment[][]
  onChange: (lore: TextSegment[][]) => void
}

export function LoreEditor({ lore, onChange }: Props) {
  const [text, setText] = useState(() => lore.map(line => seg2mm(line)).join('\n'))
  const [showTpls, setShowTpls] = useState(false)
  const [showSymbols, setShowSymbols] = useState(false)
  const tplBtnRef = useRef<HTMLButtonElement>(null)
  const tplPopupRef = useRef<HTMLDivElement>(null)
  const symBtnRef = useRef<HTMLButtonElement>(null)
  const symPopupRef = useRef<HTMLDivElement>(null)

  const selfEdit = useRef(false)

  useEffect(() => {
    if (!selfEdit.current) setText(lore.map(line => seg2mm(line)).join('\n'))
    selfEdit.current = false
  }, [lore])

  useEffect(() => {
    if (!showTpls) return
    const h = (e: MouseEvent) => {
      if (tplBtnRef.current?.contains(e.target as Node)) return
      if (tplPopupRef.current?.contains(e.target as Node)) return
      setShowTpls(false)
    }
    const t = setTimeout(() => document.addEventListener('mousedown', h), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h) }
  }, [showTpls])

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

  const apply = (val: string) => {
    selfEdit.current = true
    setText(val)
    const lines = val.split('\n')
    onChange(lines.map(line => {
      const parsed = parseMM(line)
      return parsed.length ? parsed : parseMM(' ')
    }))
  }

  const insertTemplate = (segs: TextSegment[]) => {
    const mm = seg2mm(segs)
    const newText = text ? text + '\n' + mm : mm
    apply(newText)
    setShowTpls(false)
  }

  const insertSymbol = (sym: string) => {
    const newText = text + sym
    apply(newText)
    setShowSymbols(false)
  }

  return (
    <div className={s.section}>
      <div className={s.sectionTitle}>Описание (Lore)</div>
      <textarea
        className={s.mmInput}
        value={text}
        onChange={e => apply(e.target.value)}
        placeholder={'<gray>Первая строка описания\n<gold>Вторая строка'}
        rows={Math.max(4, lore.length + 1)}
        style={{ minHeight: 80 }}
      />
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
        <div className={s.mmHelp}>Каждая строка = строка лора</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button ref={symBtnRef} className={s.addBtn} data-tip="Символы" onClick={() => { setShowSymbols(!showSymbols); setShowTpls(false) }}>⚝</button>
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
          <button ref={tplBtnRef} className={s.addBtn} data-tip="Шаблоны" onClick={() => { setShowTpls(!showTpls); setShowSymbols(false) }}>Шаблоны ▾</button>
          {showTpls && (() => {
            const r = tplBtnRef.current?.getBoundingClientRect()
            if (!r) return null
            const above = r.top > 260
            const top = above ? r.top : r.bottom + 4
            const transform = above ? 'translateY(-100%)' : 'none'
            return createPortal(
              <div ref={tplPopupRef} style={{ position: 'fixed', zIndex: 1000, background: 'rgba(15, 7, 32, 0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 2, boxShadow: '0 8px 32px rgba(0,0,0,.5)', width: 220, maxHeight: 240, overflowY: 'auto', top, left: Math.min(r.right - 220, window.innerWidth - 230), transform }}>
                {LORE_TPLS.map((t, i) => (
                  <button key={i} style={{ display: 'block', width: '100%', padding: '5px 8px', borderRadius: 2, cursor: 'pointer', fontSize: 11, border: 'none', background: 'none', color: 'var(--tx1)', textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    onClick={() => insertTemplate(t.segments)}>
                    {t.label}
                  </button>
                ))}
              </div>,
              document.body
            )
          })()}
        </div>
      </div>
      {lore.length > 0 && (
        <div className={ss.prevBox} style={{ marginTop: 4 }}>
          {lore.map((line, i) => (
            <div key={i} className={ss.prevLine} style={{ fontSize: 12 }}>
              <McText segs={line} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
