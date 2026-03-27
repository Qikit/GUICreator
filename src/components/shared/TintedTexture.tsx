import { useRef, useEffect } from 'react'
import { hexToRgb } from '@/utils/color'
import { assetUrl } from '@/utils/paths'
import { trimPaletteName } from '@/utils/slot'
import type { ArmorTrim } from '@/types'
import s from '@/styles/shared.module.css'

const TEX = assetUrl('assets/minecraft/textures/')
const TRIMS = assetUrl('assets/minecraft/textures/trims/')

const POTION_LAYERS: Record<string, { base: string; overlay: string }> = {
  potion: { base: `${TEX}item/potion.png`, overlay: `${TEX}item/potion_overlay.png` },
  splash_potion: { base: `${TEX}item/splash_potion.png`, overlay: `${TEX}item/potion_overlay.png` },
  lingering_potion: { base: `${TEX}item/lingering_potion.png`, overlay: `${TEX}item/potion_overlay.png` },
  tipped_arrow: { base: `${TEX}item/tipped_arrow_base.png`, overlay: `${TEX}item/tipped_arrow_head.png` },
}

const LEATHER_ITEMS = new Set([
  'leather_helmet', 'leather_chestplate', 'leather_leggings', 'leather_boots', 'leather_horse_armor',
])

const PIECE_MAP: Record<string, string> = {
  leather_helmet: 'helmet', leather_chestplate: 'chestplate', leather_leggings: 'leggings', leather_boots: 'boots',
  chainmail_helmet: 'helmet', chainmail_chestplate: 'chestplate', chainmail_leggings: 'leggings', chainmail_boots: 'boots',
  iron_helmet: 'helmet', iron_chestplate: 'chestplate', iron_leggings: 'leggings', iron_boots: 'boots',
  golden_helmet: 'helmet', golden_chestplate: 'chestplate', golden_leggings: 'leggings', golden_boots: 'boots',
  diamond_helmet: 'helmet', diamond_chestplate: 'chestplate', diamond_leggings: 'leggings', diamond_boots: 'boots',
  netherite_helmet: 'helmet', netherite_chestplate: 'chestplate', netherite_leggings: 'leggings', netherite_boots: 'boots',
  turtle_helmet: 'helmet',
}

const TRIM_PALETTE_GRAY = [224, 192, 160, 128, 96, 64, 32, 0]

const paletteCache = new Map<string, ImageData | null>()

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function loadPalette(name: string): Promise<ImageData | null> {
  if (paletteCache.has(name)) return paletteCache.get(name)!
  try {
    const img = await loadImage(`${TRIMS}color_palettes/${name}.png`)
    const cv = document.createElement('canvas')
    cv.width = img.width; cv.height = 1
    const ctx = cv.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, img.width, 1)
    paletteCache.set(name, data)
    return data
  } catch {
    paletteCache.set(name, null)
    return null
  }
}

function applyTintToImageData(imgData: ImageData, r: number, g: number, b: number) {
  const d = imgData.data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    d[i] = Math.round(d[i] * r / 255)
    d[i + 1] = Math.round(d[i + 1] * g / 255)
    d[i + 2] = Math.round(d[i + 2] * b / 255)
  }
}

function applyPaletteToTrim(trimData: ImageData, paletteData: ImageData) {
  const d = trimData.data
  const pd = paletteData.data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    const gray = d[i]
    const idx = TRIM_PALETTE_GRAY.indexOf(gray)
    if (idx === -1) continue
    const pi = idx * 4
    d[i] = pd[pi]
    d[i + 1] = pd[pi + 1]
    d[i + 2] = pd[pi + 2]
  }
}

interface Props {
  itemId: string
  color?: string | null
  trim?: ArmorTrim | null
  size?: number | string
  className?: string
}

export function TintedTexture({ itemId, color, trim, size, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sz = size || '100%'

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    cv.width = 16
    cv.height = 16
    ctx.imageSmoothingEnabled = false
    let cancelled = false

    const render = async () => {
      if (LEATHER_ITEMS.has(itemId)) {
        const [base, overlay] = await Promise.all([
          loadImage(`${TEX}item/${itemId}.png`),
          loadImage(`${TEX}item/${itemId}_overlay.png`),
        ])
        if (cancelled) return
        ctx.clearRect(0, 0, 16, 16)
        ctx.drawImage(base, 0, 0, 16, 16)
        if (color) {
          const rgb = hexToRgb(color)
          const imgData = ctx.getImageData(0, 0, 16, 16)
          applyTintToImageData(imgData, rgb.r, rgb.g, rgb.b)
          ctx.putImageData(imgData, 0, 0)
        }
        ctx.drawImage(overlay, 0, 0, 16, 16)
      } else if (POTION_LAYERS[itemId]) {
        const layers = POTION_LAYERS[itemId]
        const [base, over] = await Promise.all([
          loadImage(layers.base),
          loadImage(layers.overlay),
        ])
        if (cancelled) return
        ctx.clearRect(0, 0, 16, 16)
        ctx.drawImage(over, 0, 0, 16, 16)
        if (color) {
          const rgb = hexToRgb(color)
          const imgData = ctx.getImageData(0, 0, 16, 16)
          applyTintToImageData(imgData, rgb.r, rgb.g, rgb.b)
          ctx.putImageData(imgData, 0, 0)
        }
        ctx.globalCompositeOperation = 'destination-over'
        ctx.drawImage(base, 0, 0, 16, 16)
        ctx.globalCompositeOperation = 'source-over'
      } else {
        const base = await loadImage(`${TEX}item/${itemId}.png`).catch(() => null)
        if (cancelled || !base) return
        ctx.clearRect(0, 0, 16, 16)
        ctx.drawImage(base, 0, 0, 16, 16)
      }

      if (trim && PIECE_MAP[itemId]) {
        const piece = PIECE_MAP[itemId]
        const palName = trimPaletteName(itemId, trim.material)
        const [trimImg, palette] = await Promise.all([
          loadImage(`${TRIMS}items/${piece}_trim.png`).catch(() => null),
          loadPalette(palName),
        ])
        if (cancelled || !trimImg || !palette) return
        const trimCv = document.createElement('canvas')
        trimCv.width = 16; trimCv.height = 16
        const trimCtx = trimCv.getContext('2d')!
        trimCtx.imageSmoothingEnabled = false
        trimCtx.drawImage(trimImg, 0, 0, 16, 16)
        const trimData = trimCtx.getImageData(0, 0, 16, 16)
        applyPaletteToTrim(trimData, palette)
        trimCtx.putImageData(trimData, 0, 0)
        ctx.drawImage(trimCv, 0, 0, 16, 16)
      }
    }

    render().catch(() => {})
    return () => { cancelled = true }
  }, [itemId, color, trim?.material, trim?.pattern])

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
