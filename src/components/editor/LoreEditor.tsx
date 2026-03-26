import { useState, useEffect } from 'react'
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
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <button className={s.addBtn} onClick={() => setShowTpls(!showTpls)}>Шаблоны ▾</button>
          {showTpls && (
            <div style={{ position: 'absolute', zIndex: 100, background: 'var(--pan)', border: '1px solid var(--bd2)', borderRadius: 5, padding: 2, boxShadow: '0 6px 16px rgba(0,0,0,.5)', width: 220, maxHeight: 240, overflowY: 'auto', bottom: '100%', right: 0, marginBottom: 4 }}>
              {LORE_TPLS.map((t, i) => (
                <button key={i} style={{ display: 'block', width: '100%', padding: '5px 8px', borderRadius: 2, cursor: 'pointer', fontSize: 11, border: 'none', background: 'none', color: 'var(--tx1)', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--hov)')}
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
