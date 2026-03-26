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
    const layers = POTION_LAYERS[itemId]
    if (!layers) return
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!

    const base = new Image()
    const over = new Image()
    base.crossOrigin = 'anonymous'
    over.crossOrigin = 'anonymous'
    let loaded = 0

    const draw = () => {
      if (++loaded < 2) return
      cv.width = 16
      cv.height = 16
      ctx.imageSmoothingEnabled = false
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
