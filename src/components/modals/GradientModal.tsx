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
  onApply?: ((segs: TextSegment[]) => void) | null
}

export function GradientModal({ onClose, onApply }: Props) {
  const [text, setText] = useState('Пример текста')
  const [colors, setColors] = useState(['#FF0000', '#00FF00'])
  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(false)
  const [copied, setCopied] = useState('')

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

  return (
    <GlassModal onClose={onClose} title="Градиент-генератор">
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Пресеты</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {GRAD_PRESETS.map((p, i) => (
            <GlowButton key={i} style={{ background: `linear-gradient(90deg,${p.colors.join(',')})`, color: '#fff', textShadow: '0 1px 2px #000', fontSize: 10, padding: '3px 8px' }}
              onClick={() => { setColors([...p.colors]); setText(p.text) }}>{p.name}</GlowButton>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Текст</div>
        <input value={text} onChange={e => setText(e.target.value)} style={{ width: '100%', padding: '8px 12px', fontSize: 14, borderRadius: 'var(--radius-md)' }} placeholder="Введите текст..." />
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

      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>MiniMessage</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div className={glassModalStyles.code} style={{ flex: 1, fontSize: 11, padding: '8px 10px', maxHeight: 80 }}>{gradTag}</div>
          <GlowButton onClick={() => copy(gradTag, 'mm')}>{copied === 'mm' ? '✓' : 'Коп.'}</GlowButton>
        </div>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>§-коды</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div className={glassModalStyles.code} style={{ flex: 1, fontSize: 11, padding: '8px 10px', maxHeight: 80 }}>{seg2leg(segs)}</div>
          <GlowButton onClick={() => copy(seg2leg(segs), 'leg')}>{copied === 'leg' ? '✓' : 'Коп.'}</GlowButton>
        </div>
      </div>

      <div className={glassModalStyles.actions}>
        {onApply && <GlowButton variant="primary" onClick={() => { onApply(parseMM(gradTag)); onClose() }}>Применить к имени</GlowButton>}
        <GlowButton onClick={onClose}>Закрыть</GlowButton>
      </div>
    </GlassModal>
  )
}
