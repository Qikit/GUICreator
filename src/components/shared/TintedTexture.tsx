import { useRef, useEffect } from 'react'
import { hexToRgb } from '@/utils/color'
import { assetUrl } from '@/utils/paths'
import s from '@/styles/shared.module.css'

const TEX = assetUrl('assets/minecraft/textures/')
const POTION_LAYERS: Record<string, { base: string; overlay: string }> = {
  potion: { base: `${TEX}item/potion.png`, overlay: `${TEX}item/potion_overlay.png` },
  splash_potion: { base: `${TEX}item/splash_potion.png`, overlay: `${TEX}item/potion_overlay.png` },
  lingering_potion: { base: `${TEX}item/lingering_potion.png`, overlay: `${TEX}item/potion_overlay.png` },
  tipped_arrow: { base: `${TEX}item/tipped_arrow_base.png`, overlay: `${TEX}item/tipped_arrow_head.png` },
}

const LEATHER_ITEMS = new Set([
  'leather_helmet', 'leather_chestplate', 'leather_leggings', 'leather_boots', 'leather_horse_armor',
])

interface Props {
  itemId: string
  color: string
  size?: number | string
  className?: string
}

export function TintedTexture({ itemId, color, size, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sz = size || '100%'

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    cv.width = 16
    cv.height = 16
    ctx.imageSmoothingEnabled = false

    if (LEATHER_ITEMS.has(itemId)) {
      const base = new Image()
      const overlay = new Image()
      base.crossOrigin = 'anonymous'
      overlay.crossOrigin = 'anonymous'
      let loaded = 0

      const draw = () => {
        if (++loaded < 2) return
        ctx.clearRect(0, 0, 16, 16)
        ctx.drawImage(base, 0, 0, 16, 16)
        const rgb = hexToRgb(color)
        const imgData = ctx.getImageData(0, 0, 16, 16)
        const d = imgData.data
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] === 0) continue
          d[i] = Math.round(d[i] * rgb.r / 255)
          d[i + 1] = Math.round(d[i + 1] * rgb.g / 255)
          d[i + 2] = Math.round(d[i + 2] * rgb.b / 255)
        }
        ctx.putImageData(imgData, 0, 0)
        ctx.drawImage(overlay, 0, 0, 16, 16)
      }

      base.onload = draw
      overlay.onload = draw
      base.src = `${TEX}item/${itemId}.png`
      overlay.src = `${TEX}item/${itemId}_overlay.png`
      return
    }

    const layers = POTION_LAYERS[itemId]
    if (!layers) return

    const base = new Image()
    const over = new Image()
    base.crossOrigin = 'anonymous'
    over.crossOrigin = 'anonymous'
    let loaded = 0

    const draw = () => {
      if (++loaded < 2) return
      ctx.clearRect(0, 0, 16, 16)
      ctx.drawImage(over, 0, 0, 16, 16)
      const rgb = hexToRgb(color)
      const imgData = ctx.getImageData(0, 0, 16, 16)
      const d = imgData.data
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.round(d[i] * rgb.r / 255)
        d[i + 1] = Math.round(d[i + 1] * rgb.g / 255)
        d[i + 2] = Math.round(d[i + 2] * rgb.b / 255)
      }
      ctx.putImageData(imgData, 0, 0)
      ctx.globalCompositeOperation = 'destination-over'
      ctx.drawImage(base, 0, 0, 16, 16)
      ctx.globalCompositeOperation = 'source-over'
    }

    base.onload = draw
    over.onload = draw
    base.src = layers.base
    over.src = layers.overlay
  }, [itemId, color])

  return (
    <canvas
      ref={canvasRef}
      className={`${s.itemTex} ${className || ''}`}
      style={{ width: sz, height: sz, imageRendering: 'pixelated' }}
      width={16}
      height={16}
    />
  )
}

export { POTION_LAYERS }
