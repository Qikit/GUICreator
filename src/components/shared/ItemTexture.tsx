import { useState, useEffect } from 'react'
import { TintedTexture, POTION_LAYERS } from './TintedTexture'
import { SkullFace } from './SkullFace'
import { TEX_MAP } from '@/data/texMap'
import { TRIMMABLE } from '@/utils/slot'
import { assetUrl } from '@/utils/paths'
import type { ArmorTrim } from '@/types'
import s from '@/styles/shared.module.css'

const RENDERS = assetUrl('assets/minecraft/renders/')
const TEX = assetUrl('assets/minecraft/textures/')
const LEATHER_ITEMS = new Set([
  'leather_helmet', 'leather_chestplate', 'leather_leggings', 'leather_boots', 'leather_horse_armor',
])

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
  armorTrim?: ArmorTrim | null
}

export function ItemTexture({ itemId, size, className, potionColor, skullTexture, armorTrim }: Props) {
  const [stage, setStage] = useState(0)
  const sz = size || '100%'
  const cls = `${s.itemTex} ${className || ''}`

  useEffect(() => { setStage(0) }, [itemId])

  if (skullTexture && itemId === 'player_head') {
    return <SkullFace url={skullTexture} size={sz} className={className} />
  }

  const needsTint = potionColor && (POTION_LAYERS[itemId] || LEATHER_ITEMS.has(itemId))
  const needsTrim = armorTrim && TRIMMABLE.has(itemId)

  if (needsTint || needsTrim) {
    return <TintedTexture itemId={itemId} color={potionColor} trim={armorTrim} size={sz} className={className} />
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
