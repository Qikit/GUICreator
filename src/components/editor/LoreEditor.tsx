import { useState, useEffect, useRef } from 'react'
import type { TextSegment } from '@/types'
import { parseMM, seg2mm } from '@/utils/minimessage'
import { LORE_TPLS } from '@/data/loreTemplates'
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
  const tplBtnRef = useRef<HTMLButtonElement>(null)
  const [tplPos, setTplPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (showTpls && tplBtnRef.current) {
      const r = tplBtnRef.current.getBoundingClientRect()
      setTplPos({ top: r.top, left: Math.min(r.right - 220, window.innerWidth - 230) })
    }
  }, [showTpls])

  useEffect(() => {
    setText(lore.map(line => seg2mm(line)).join('\n'))
  }, [lore])

  const apply = (val: string) => {
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
        <div style={{ marginLeft: 'auto' }}>
          <button ref={tplBtnRef} className={s.addBtn} onClick={() => setShowTpls(!showTpls)}>Шаблоны ▾</button>
          {showTpls && tplPos && (
            <div style={{ position: 'fixed', zIndex: 1000, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: 2, boxShadow: '0 8px 32px rgba(0,0,0,.5)', width: 220, maxHeight: 240, overflowY: 'auto', top: tplPos.top, left: tplPos.left, transform: 'translateY(-100%)' }}>
              {LORE_TPLS.map((t, i) => (
                <button key={i} style={{ display: 'block', width: '100%', padding: '5px 8px', borderRadius: 2, cursor: 'pointer', fontSize: 11, border: 'none', background: 'none', color: 'var(--tx1)', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  onClick={() => insertTemplate(t.segments)}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
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
