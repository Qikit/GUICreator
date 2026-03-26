import { useRef, useEffect, useState } from 'react'
import s from '@/styles/shared.module.css'

interface Props {
  url: string
  size?: number | string
  className?: string
}

export function SkullFace({ url, size, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sz = size || '100%'
  const [ok, setOk] = useState(false)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      cv.width = 8
      cv.height = 8
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 8, 8, 8, 8, 0, 0, 8, 8)
      ctx.drawImage(img, 40, 8, 8, 8, 0, 0, 8, 8)
      setOk(true)
    }
    img.onerror = () => setOk(false)
    img.src = url
  }, [url])

  return (
    <canvas
      ref={canvasRef}
      className={`${s.itemTex} ${className || ''}`}
      style={{ width: sz, height: sz, imageRendering: 'pixelated', display: ok ? 'block' : 'none' }}
      width={8}
      height={8}
    />
  )
}
