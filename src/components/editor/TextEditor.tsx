import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { TextSegment } from '@/types'
import { parseMM, seg2mm } from '@/utils/minimessage'
import { defaultSegment } from '@/utils/slot'
import { MC_SYMBOLS } from '@/data/loreTemplates'
import { McText } from '@/components/shared'
import { ColorPickerModal } from '@/components/modals'
import { lerpColor } from '@/utils/color'
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [textCtx, setTextCtx] = useState<{ x: number; y: number; start: number; end: number; text: string } | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showGradient, setShowGradient] = useState(false)
  const [gradColor1, setGradColor1] = useState('#FF0000')
  const [gradColor2, setGradColor2] = useState('#0000FF')
  const [gradRaw, setGradRaw] = useState('')

  const parseGradientTag = (input: string) => {
    const m = input.match(/<gradient((?::#[0-9A-Fa-f]{6})+)>/i)
    if (!m) return
    const colors = m[1].split(':').filter(Boolean).map(c => c.toUpperCase())
    if (colors.length >= 2) {
      setGradColor1(colors[0])
      setGradColor2(colors[colors.length - 1])
    }
  }

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

  useEffect(() => {
    if (!textCtx || showColorPicker || showGradient) return
    const h = () => setTextCtx(null)
    const t = setTimeout(() => document.addEventListener('mousedown', h), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h) }
  }, [textCtx, showColorPicker, showGradient])

  const apply = (text: string) => {
    selfEdit.current = true
    setMmText(text)
    const parsed = parseMM(text)
    if (parsed.length) onChange(parsed)
    else if (!text.trim()) onChange([defaultSegment('', '#FFFFFF')])
  }

  const caretPos = useRef(0)

  const insertSymbol = (sym: string) => {
    const pos = caretPos.current
    const newText = mmText.slice(0, pos) + sym + mmText.slice(pos)
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
      apply(mmText + mmText)
    }
  }

  const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    if (start === end) return
    e.preventDefault()
    setTextCtx({ x: e.clientX, y: e.clientY, start, end, text: mmText.slice(start, end) })
  }

  const applyColor = (hex: string) => {
    if (!textCtx) return
    const before = mmText.slice(0, textCtx.start)
    const after = mmText.slice(textCtx.end)
    apply(before + `<${hex}>${textCtx.text}</${hex}>` + after)
    setTextCtx(null)
    setShowColorPicker(false)
  }

  const applyGradient = () => {
    if (!textCtx) return
    const before = mmText.slice(0, textCtx.start)
    const after = mmText.slice(textCtx.end)
    apply(before + `<gradient:${gradColor1}:${gradColor2}>${textCtx.text}</gradient>` + after)
    setTextCtx(null)
    setShowGradient(false)
  }

  const gradPreview = (text: string) => {
    if (!text) return []
    return text.split('').map((ch, i, arr) => {
      const t = arr.length <= 1 ? 0 : i / (arr.length - 1)
      const hex = lerpColor(gradColor1, gradColor2, t)
      return { text: ch, color: hex, bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false } as TextSegment
    })
  }

  const handleSegClick = (segIdx: number) => {
    const ta = textareaRef.current
    if (!ta) return
    const seg = segs[segIdx]
    const plainBefore = segs.slice(0, segIdx).map(s => s.text).join('')
    let tagChars = 0, plainIdx = 0
    for (let k = 0; k < mmText.length && plainIdx < plainBefore.length; k++) {
      if (mmText[k] === '<') { const gt = mmText.indexOf('>', k); if (gt !== -1) { tagChars += gt - k + 1; k = gt; continue } }
      plainIdx++
    }
    const searchStart = plainBefore.length + tagChars
    const pos = mmText.indexOf(seg.text, searchStart)
    if (pos >= 0) {
      ta.focus()
      ta.setSelectionRange(pos, pos + seg.text.length)
    }
  }

  return (
    <div className={s.section}>
      {label && <div className={s.sectionTitle}>{label}</div>}
      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          className={s.mmInput}
          value={mmText}
          onChange={e => { caretPos.current = e.target.selectionStart; apply(e.target.value) }}
          onSelect={e => { caretPos.current = (e.target as HTMLTextAreaElement).selectionStart }}
          onKeyDown={handleKeyDown}
          onContextMenu={handleContextMenu}
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
      <div className={ss.prevBox} style={{ marginTop: 4, cursor: 'pointer' }}>
        <div className={ss.prevLine}>
          {segs.map((seg, i) => {
            const cls = [ss.mcText]
            if (seg.bold) cls.push(ss.mcBold)
            if (seg.italic) cls.push(ss.mcItalic)
            if (seg.underlined) cls.push(ss.mcUnderline)
            if (seg.strikethrough) cls.push(ss.mcStrikethrough)
            return (
              <span key={i} className={cls.join(' ')} style={{ color: seg.color, cursor: 'pointer' }}
                onClick={() => handleSegClick(i)}
                title="Кликните чтобы выделить в редакторе">
                {seg.obfuscated ? '????' : seg.text}
              </span>
            )
          })}
        </div>
      </div>
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
