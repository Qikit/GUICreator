import { useState } from 'react'
import type { TextSegment } from '@/types'
import { lerpColor } from '@/utils/color'
import { parseMM, seg2mm, seg2leg } from '@/utils/minimessage'
import { GRAD_PRESETS } from '@/data/gradientPresets'
import { McText } from '@/components/shared'
import { GlassModal, GlowButton, glassModalStyles } from '@/components/ui'
import s from '@/styles/shared.module.css'

interface Props {
  onClose: () => void
}

const FORMATS = [
  { id: 'minimessage', name: 'MiniMessage', template: '<gradient:$colors>$text</gradient>' },
  { id: 'ampersand_hex', name: '&#rrggbb', example: '&#FFE12CТ&#E6E430е' },
  { id: 'json', name: 'JSON', example: '{"text":"","extra":[...]}' },
  { id: 'section_hex', name: '§x§r§r§g§g§b§b', example: '§x§F§F§E§1§2§CТ' },
  { id: 'amp_x_hex', name: '&x&r&r&g&g&b&b', example: '&x&F&F&E&1&2&CТ' },
  { id: 'tag_hex', name: '<#rrggbb>', example: '<#FFE12C>Т<#E6E430>е' },
  { id: 'bbcode', name: 'BBCode [COLOR]', example: '[COLOR=#FFE12C]Т[/COLOR]' },
  { id: 'custom', name: 'Свой формат', example: '' },
]

export function GradientModal({ onClose }: Props) {
  const [text, setText] = useState('Пример текста')
  const [colors, setColors] = useState(() => {
    const rnd = () => '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase()
    return [rnd(), rnd()]
  })
  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(false)
  const [copied, setCopied] = useState('')
  const [showPresets, setShowPresets] = useState(false)
  const [format, setFormat] = useState('minimessage')
  const [customFormat, setCustomFormat] = useState('$1$c')
  const [preInvert, setPreInvert] = useState<string[] | null>(null)

  const genSegs = (): TextSegment[] => {
    if (!text) return []
    const segs: TextSegment[] = []
    const len = text.length
    const totalS = colors.length - 1
    for (let i = 0; i < len; i++) {
      const t = len === 1 ? 0 : i / (len - 1)
      const si = Math.min(Math.floor(t * totalS), totalS - 1)
      const st = (t * totalS) - si
      const hex = lerpColor(colors[si], colors[si + 1], st)
      segs.push({ text: text[i], color: hex, bold, italic, underlined: false, strikethrough: false, obfuscated: false })
    }
    return segs
  }

  const segs = genSegs()
  const gradTag = `<gradient:${colors.join(':')}>${bold ? '<bold>' : ''}${italic ? '<italic>' : ''}${text}${italic ? '</italic>' : ''}${bold ? '</bold>' : ''}</gradient>`

  const copy = (t: string, label: string) => {
    navigator.clipboard.writeText(t).then(() => { setCopied(label); setTimeout(() => setCopied(''), 1500) })
  }

  const generateFormatted = (): string => {
    const s = genSegs()
    if (!s.length) return ''
    switch (format) {
      case 'minimessage': return gradTag
      case 'ampersand_hex': return s.map(seg => `&#${seg.color.slice(1)}${seg.text}`).join('')
      case 'json': {
        const extra = s.map(seg => ({ text: seg.text, color: seg.color }))
        return JSON.stringify({ text: '', extra })
      }
      case 'section_hex': return s.map(seg => {
        const hex = seg.color.slice(1)
        return '§x' + hex.split('').map(c => '§' + c).join('') + seg.text
      }).join('')
      case 'amp_x_hex': return s.map(seg => {
        const hex = seg.color.slice(1)
        return '&x' + hex.split('').map(c => '&' + c).join('') + seg.text
      }).join('')
      case 'tag_hex': return s.map(seg => `<${seg.color}>${seg.text}`).join('')
      case 'bbcode': return s.map(seg => `[COLOR=${seg.color}]${seg.text}[/COLOR]`).join('')
      case 'custom': return s.map(seg => {
        let f = customFormat
        const hex = seg.color.slice(1)
        for (let i = 0; i < 6 && i < hex.length; i++) f = f.replace(`$${i + 1}`, hex[i])
        f = f.replace('$c', seg.text)
        return f
      }).join('')
      default: return gradTag
    }
  }

  return (
    <GlassModal onClose={onClose} title="Градиент-генератор">
      <div style={{ width: 520, maxWidth: '100%' }}>
      <GlowButton onClick={() => setShowPresets(true)} style={{ marginBottom: 8 }}>Пресеты</GlowButton>

      {showPresets && (
        <GlassModal onClose={() => setShowPresets(false)} title="Пресеты градиентов">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {GRAD_PRESETS.map((p, i) => (
              <GlowButton key={i} size="md"
                style={{ background: `linear-gradient(90deg,${p.colors.join(',')})`, color: '#fff', textShadow: '0 1px 2px #000', padding: '6px 14px' }}
                onClick={() => { setColors([...p.colors]); setText(p.text); setShowPresets(false) }}>
                {p.name}
              </GlowButton>
            ))}
          </div>
        </GlassModal>
      )}

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Текст</div>
        <textarea value={text} onChange={e => setText(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', fontSize: 14, borderRadius: 'var(--radius-md)', resize: 'vertical', minHeight: 40, maxHeight: 120, fontFamily: 'inherit' }}
          placeholder="Введите текст..." rows={1} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Цвета</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {colors.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <input type="color" value={c} onChange={e => setColors(colors.map((v, j) => j === i ? e.target.value.toUpperCase() : v))} style={{ width: 28, height: 28, padding: 0, border: '1px solid var(--glass-border)', borderRadius: 3, cursor: 'pointer' }} />
              <input value={c} onChange={e => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) setColors(colors.map((v, j) => j === i ? e.target.value.toUpperCase() : v)) }} style={{ width: 72, fontSize: 11, fontFamily: 'monospace' }} />
              {colors.length > 2 && <GlowButton style={{ padding: '0 4px', fontSize: 10 }} onClick={() => setColors(colors.filter((_, j) => j !== i))}>✕</GlowButton>}
            </div>
          ))}
          <GlowButton onClick={() => setColors([...colors, '#FFFFFF'])} style={{ padding: '2px 8px' }}>+</GlowButton>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        <button className={s.gradBtn} data-tip="Рандом" onClick={() => {
          setColors(colors.map(() => '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase()))
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10l3-3 2 2 5-5M9 4h3v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button className={s.gradBtn} data-tip="Развернуть" onClick={() => setColors([...colors].reverse())}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M3 7l2-2M3 7l2 2M11 7l-2-2M11 7l-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button className={s.gradBtn} data-tip="Перемешать" onClick={() => {
          const shuffled = [...colors]; for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]] }; setColors(shuffled)
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h2l2 3-2 3H2M12 4h-2l-2 3 2 3h2M5 5l4 4M5 9l4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button className={s.gradBtn} data-tip="Инверсия" onClick={() => {
          if (preInvert) { setColors(preInvert); setPreInvert(null) }
          else { setPreInvert([...colors]); setColors(colors.map(c => { const hex = c.slice(1); const inv = (0xFFFFFF - parseInt(hex, 16)).toString(16).padStart(6, '0'); return '#' + inv.toUpperCase() })) }
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 2v10" stroke="currentColor" strokeWidth="1.3"/><path d="M7 2a5 5 0 010 10" fill="currentColor" opacity="0.3"/></svg>
        </button>
        <button className={s.gradBtn} data-tip="Дублировать" onClick={() => setColors([...colors, ...colors])}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="5" y="1" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <GlowButton variant={bold ? 'primary' : 'ghost'} onClick={() => setBold(!bold)} style={{ fontWeight: 700 }}>B</GlowButton>
        <GlowButton variant={italic ? 'primary' : 'ghost'} onClick={() => setItalic(!italic)} style={{ fontStyle: 'italic' }}>I</GlowButton>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Превью</div>
        <div className={s.prevBox} style={{ padding: '10px 14px' }}>
          <div className={s.prevLine} style={{ fontSize: 18 }}><McText segs={segs} /></div>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 10, color: 'var(--tx3)', fontWeight: 600, textTransform: 'uppercase' }}>Формат</div>
          <select value={format} onChange={e => setFormat(e.target.value)} style={{ fontSize: 11, flex: 1 }}>
            {FORMATS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        {format === 'custom' && (
          <div style={{ marginBottom: 4 }}>
            <input value={customFormat} onChange={e => setCustomFormat(e.target.value)}
              placeholder="$1$c" style={{ width: '100%', fontSize: 11, fontFamily: 'monospace' }} />
            <div style={{ fontSize: 9, color: 'var(--tx3)', marginTop: 2 }}>$1-$6 = символы HEX, $c = символ текста</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          <div className={glassModalStyles.code} style={{ flex: 1, fontSize: 11, padding: '8px 10px', maxHeight: 80 }}>
            {generateFormatted()}
          </div>
          <GlowButton size="md" onClick={() => copy(generateFormatted(), 'fmt')} style={{ minWidth: 80 }}>
            {copied === 'fmt' ? 'Скопировано' : 'Копировать'}
          </GlowButton>
        </div>
      </div>

      <div className={glassModalStyles.actions}>
        <GlowButton size="md" onClick={onClose}>Закрыть</GlowButton>
      </div>
      </div>
    </GlassModal>
  )
}
