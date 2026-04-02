import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { TextSegment } from '@/types'
import { parseMM, seg2mm } from '@/utils/minimessage'
import { LORE_TPLS, MC_SYMBOLS } from '@/data/loreTemplates'
import { McText } from '@/components/shared'
import { ColorPickerModal } from '@/components/modals'
import { lerpColor } from '@/utils/color'
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [textCtx, setTextCtx] = useState<{ x: number; y: number; start: number; end: number; text: string } | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showGradient, setShowGradient] = useState(false)
  const [gradColor1, setGradColor1] = useState('#FF0000')
  const [gradColor2, setGradColor2] = useState('#0000FF')
  const [gradRaw, setGradRaw] = useState('')
  const caretPos = useRef(0)

  const parseGradientTag = (input: string) => {
    const m = input.match(/<gradient((?::#[0-9A-Fa-f]{6})+)>/i)
    if (!m) return
    const colors = m[1].split(':').filter(Boolean).map(c => c.toUpperCase())
    if (colors.length >= 2) {
      setGradColor1(colors[0])
      setGradColor2(colors[colors.length - 1])
    }
  }

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

  useEffect(() => {
    if (!textCtx || showColorPicker || showGradient) return
    const h = () => setTextCtx(null)
    const t = setTimeout(() => document.addEventListener('mousedown', h), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h) }
  }, [textCtx, showColorPicker, showGradient])

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
    const pos = caretPos.current
    const newText = text.slice(0, pos) + sym + text.slice(pos)
    apply(newText)
    setShowSymbols(false)
    requestAnimationFrame(() => {
      const ta = textareaRef.current
      if (ta) { ta.focus(); ta.setSelectionRange(pos + sym.length, pos + sym.length) }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.code === 'KeyD') {
      e.preventDefault()
      const ta = textareaRef.current
      if (!ta) return
      const pos = ta.selectionStart
      const lines = text.split('\n')
      let offset = 0, lineIdx = 0
      for (let i = 0; i < lines.length; i++) {
        if (offset + lines[i].length >= pos) { lineIdx = i; break }
        offset += lines[i].length + 1
      }
      const dupLine = lines[lineIdx]
      lines.splice(lineIdx + 1, 0, dupLine)
      const newText = lines.join('\n')
      apply(newText)
      const newPos = offset + dupLine.length + 1
      requestAnimationFrame(() => {
        if (ta) { ta.focus(); ta.setSelectionRange(newPos, newPos) }
      })
    }
  }

  const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    if (start === end) return
    e.preventDefault()
    setTextCtx({ x: e.clientX, y: e.clientY, start, end, text: text.slice(start, end) })
  }

  const applyColor = (hex: string) => {
    if (!textCtx) return
    const before = text.slice(0, textCtx.start)
    const after = text.slice(textCtx.end)
    apply(before + `<${hex}>${textCtx.text}</${hex}>` + after)
    setTextCtx(null)
    setShowColorPicker(false)
  }

  const applyGradient = () => {
    if (!textCtx) return
    const before = text.slice(0, textCtx.start)
    const after = text.slice(textCtx.end)
    apply(before + `<gradient:${gradColor1}:${gradColor2}>${textCtx.text}</gradient>` + after)
    setTextCtx(null)
    setShowGradient(false)
  }

  const gradPreview = (txt: string) => {
    if (!txt) return []
    return txt.split('').map((ch, i, arr) => {
      const t = arr.length <= 1 ? 0 : i / (arr.length - 1)
      const hex = lerpColor(gradColor1, gradColor2, t)
      return { text: ch, color: hex, bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false } as TextSegment
    })
  }

  const handleSegClick = (lineIdx: number, segIdx: number) => {
    const ta = textareaRef.current
    if (!ta) return
    const lines = text.split('\n')
    let offset = 0
    for (let l = 0; l < lineIdx && l < lines.length; l++) offset += lines[l].length + 1
    const lineText = lines[lineIdx] || ''
    const line = lore[lineIdx] || []
    const seg = line[segIdx]
    if (!seg) return
    const plainBefore = line.slice(0, segIdx).map(s => s.text).join('')
    let tagChars = 0, plainIdx = 0
    for (let k = 0; k < lineText.length && plainIdx < plainBefore.length; k++) {
      if (lineText[k] === '<') { const gt = lineText.indexOf('>', k); if (gt !== -1) { tagChars += gt - k + 1; k = gt; continue } }
      plainIdx++
    }
    const searchStart = offset + plainBefore.length + tagChars
    const pos = text.indexOf(seg.text, searchStart)
    if (pos >= 0) {
      ta.focus()
      ta.setSelectionRange(pos, pos + seg.text.length)
    }
  }

  return (
    <div className={s.section}>
      <div className={s.sectionTitle}>Описание (Lore)</div>
      <textarea
        ref={textareaRef}
        className={s.mmInput}
        value={text}
        onChange={e => { caretPos.current = e.target.selectionStart; apply(e.target.value) }}
        onSelect={e => { caretPos.current = (e.target as HTMLTextAreaElement).selectionStart }}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
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
        <div className={ss.prevBox} style={{ marginTop: 4, cursor: 'pointer' }}>
          {lore.map((line, lineIdx) => (
            <div key={lineIdx} className={ss.prevLine} style={{ fontSize: 12 }}>
              {line.map((seg, segIdx) => {
                const cls = [ss.mcText]
                if (seg.bold) cls.push(ss.mcBold)
                if (seg.italic) cls.push(ss.mcItalic)
                if (seg.underlined) cls.push(ss.mcUnderline)
                if (seg.strikethrough) cls.push(ss.mcStrikethrough)
                return (
                  <span key={segIdx} className={cls.join(' ')} style={{ color: seg.color, cursor: 'pointer' }}
                    onClick={() => handleSegClick(lineIdx, segIdx)}
                    title="Кликните чтобы выделить в редакторе">
                    {seg.obfuscated ? '????' : seg.text}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      )}
      {textCtx && !showColorPicker && !showGradient && createPortal(
        <div className={s.textCtxMenu} style={{ left: textCtx.x, top: textCtx.y }} onMouseDown={e => e.stopPropagation()}>
          <button className={s.textCtxItem} onClick={() => setShowColorPicker(true)}>Цвет</button>
          <button className={s.textCtxItem} onClick={() => setShowGradient(true)}>Градиент</button>
        </div>,
        document.body
      )}
      {showColorPicker && textCtx && createPortal(
        <ColorPickerModal onClose={() => { setShowColorPicker(false); setTextCtx(null) }} onApply={applyColor} />,
        document.body
      )}
      {showGradient && textCtx && createPortal(
        <div className={s.textCtxMenu} style={{ left: textCtx.x, top: textCtx.y + 30 }} onMouseDown={e => e.stopPropagation()}>
          <div style={{ padding: '6px 8px', fontSize: 10, color: 'var(--tx3)' }}>Градиент</div>
          <div className={s.gradInput}>
            <input type="color" value={gradColor1} onChange={e => setGradColor1(e.target.value.toUpperCase())} />
            <span style={{ color: 'var(--tx3)', fontSize: 10 }}>&rarr;</span>
            <input type="color" value={gradColor2} onChange={e => setGradColor2(e.target.value.toUpperCase())} />
            <button className={s.textCtxItem} style={{ padding: '3px 8px', width: 'auto' }} onClick={applyGradient}>OK</button>
          </div>
          <input
            value={gradRaw}
            onChange={e => { setGradRaw(e.target.value); parseGradientTag(e.target.value) }}
            placeholder="<gradient:#HEX1:#HEX2>"
            style={{ width: 'calc(100% - 16px)', margin: '2px 8px', padding: '3px 6px', fontSize: 10, background: 'var(--glass-surface)', border: '1px solid var(--glass-border)', borderRadius: 3, color: 'var(--tx1)', outline: 'none', fontFamily: 'monospace' }}
          />
          <div className={ss.prevLine} style={{ padding: '2px 8px', fontSize: 10 }}>
            <McText segs={gradPreview(textCtx.text)} />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
