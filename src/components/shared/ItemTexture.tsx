import { useState, useEffect } from 'react'
import { TintedTexture, POTION_LAYERS } from './TintedTexture'
import { SkullFace } from './SkullFace'
import { TEX_MAP } from '@/data/texMap'
import s from '@/styles/shared.module.css'

const RENDERS = '/assets/minecraft/renders/'
const TEX = '/assets/minecraft/textures/'

function getTexPath(id: string): string | null {
  if (TEX_MAP[id]) return TEX + TEX_MAP[id]
  return null
}

interface Props {
  itemId: string
  size?: number | string
  className?: string
  potionColor?: string | null
  skullTexture?: string | null
  rpTexture?: string | null
  showRP?: boolean
}

export function ItemTexture({ itemId, size, className, potionColor, skullTexture, rpTexture, showRP }: Props) {
  const [stage, setStage] = useState(0)
  const sz = size || '100%'
  const cls = `${s.itemTex} ${className || ''}`

  useEffect(() => { setStage(0) }, [itemId])

  if (showRP !== false && rpTexture) {
    return <img className={cls} src={rpTexture} style={{ width: sz, height: sz, imageRendering: 'pixelated' }} alt="" draggable={false} />
  }

  if (skullTexture && itemId === 'player_head') {
    return <SkullFace url={skullTexture} size={sz} className={className} />
  }

  if (potionColor && POTION_LAYERS[itemId]) {
    return <TintedTexture itemId={itemId} color={potionColor} size={sz} className={className} />
  }

  const explicit = getTexPath(itemId)
  const srcs = [
    `${RENDERS}${itemId}.png`,
    explicit,
    `${TEX}item/${itemId}.png`,
    `${TEX}block/${itemId}.png`,
  ].filter(Boolean) as string[]

  if (stage < srcs.length) {
    return <img className={cls} src={srcs[stage]} style={{ width: sz, height: sz }} alt="" draggable={false} onError={() => setStage(stage + 1)} />
  }

  return <span className={`${s.itemTexEmoji} ${className || ''}`} style={{ fontSize: typeof sz === 'number' ? sz * 0.55 : 16 }}>{'❓'}</span>
}
