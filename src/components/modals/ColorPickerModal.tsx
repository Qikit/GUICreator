import { useState, useRef, useEffect } from 'react'
import { hexToRgb, rgbToHex, hsv2hex } from '@/utils/color'
import { MC_COLORS } from '@/data/colors'
import { GlassModal, GlowButton } from '@/components/ui'

interface Props {
  onClose: () => void
  onApply?: ((hex: string) => void) | null
}

export function ColorPickerModal({ onClose, onApply }: Props) {
  const [hue, setHue] = useState(0)
  const [sat, setSat] = useState(100)
  const [val, setVal] = useState(100)
  const [hex, setHex] = useState('#FF0000')
  const [copied, setCopied] = useState(false)
  const sqRef = useRef<HTMLCanvasElement>(null)
  const hueRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => { setHex(hsv2hex(hue, sat, val)) }, [hue, sat, val])

  useEffect(() => {
    const c = sqRef.current; if (!c) return
    const ctx = c.getContext('2d')!; const w = c.width, h = c.height
    const base = hsv2hex(hue, 100, 100)
    const gh = ctx.createLinearGradient(0, 0, w, 0); gh.addColorStop(0, '#FFFFFF'); gh.addColorStop(1, base)
    ctx.fillStyle = gh; ctx.fillRect(0, 0, w, h)
    const gv = ctx.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(1, '#000000')
    ctx.fillStyle = gv; ctx.fillRect(0, 0, w, h)
  }, [hue])

  useEffect(() => {
    const c = hueRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, 0, c.height)
    ;['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000'].forEach((cl, i) => g.addColorStop(i / 6, cl))
    ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height)
  }, [])

  const drag = (ref: React.RefObject<HTMLCanvasElement | null>, fn: (x: number, y: number) => void) => (e: React.MouseEvent) => {
    const handle = (ev: MouseEvent) => {
      const r = ref.current!.getBoundingClientRect()
      fn(Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height)))
    }
    handle(e.nativeEvent)
    const up = () => { window.removeEventListener('mousemove', handle); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', handle); window.addEventListener('mouseup', up)
  }

  const fromHex = (h: string) => {
    const { r, g, b } = hexToRgb(h)
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
    let hh = 0
    if (d > 0) {
      if (mx === r) hh = 60 * (((g - b) / d) % 6)
      else if (mx === g) hh = 60 * ((b - r) / d + 2)
      else hh = 60 * ((r - g) / d + 4)
    }
    if (hh < 0) hh += 360
    setHue(Math.round(hh)); setSat(Math.round(mx ? d / mx * 100 : 0)); setVal(Math.round(mx / 255 * 100)); setHex(h)
  }

  const copyHex = () => { navigator.clipboard.writeText('<' + hex + '>'); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  return (
    <GlassModal onClose={onClose} title="Палитра цветов">
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ position: 'relative' }}>
          <canvas ref={sqRef} width={200} height={200} style={{ borderRadius: 4, cursor: 'crosshair' }} onMouseDown={drag(sqRef, (x, y) => { setSat(Math.round(x * 100)); setVal(Math.round((1 - y) * 100)) })} />
          <div style={{ position: 'absolute', width: 12, height: 12, border: '2px solid #fff', borderRadius: '50%', boxShadow: '0 0 3px rgba(0,0,0,.5)', pointerEvents: 'none', transform: 'translate(-50%,-50%)', left: sat * 2, top: (100 - val) * 2 }} />
        </div>
        <div style={{ position: 'relative' }}>
          <canvas ref={hueRef} width={20} height={200} style={{ borderRadius: 4, cursor: 'pointer' }} onMouseDown={drag(hueRef, (_, y) => { setHue(Math.round(y * 360)) })} />
          <div style={{ position: 'absolute', width: 24, height: 6, border: '2px solid #fff', borderRadius: 3, boxShadow: '0 0 3px rgba(0,0,0,.5)', pointerEvents: 'none', left: -2, top: hue / 360 * 200 - 3 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <div style={{ width: '100%', height: 48, borderRadius: 4, border: '1px solid var(--glass-border)', background: hex }} />
          <input value={hex} onChange={e => { const v = e.target.value; setHex(v); if (/^#[0-9A-Fa-f]{6}$/.test(v)) fromHex(v.toUpperCase()) }} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }} />
          <GlowButton variant="primary" onClick={copyHex}>{copied ? 'Скопировано!' : 'Копировать <#>'}</GlowButton>
          {onApply && <GlowButton onClick={() => { onApply(hex); onClose() }}>Применить</GlowButton>}
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--tx2)', marginBottom: 4 }}>MC ЦВЕТА</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 3 }}>
          {MC_COLORS.map((c, i) => (
            <div key={i} style={{ width: 24, height: 24, borderRadius: 3, cursor: 'pointer', background: c.hex, border: '2px solid transparent' }} onClick={() => fromHex(c.hex)} title={c.name} />
          ))}
        </div>
      </div>
    </GlassModal>
  )
}
