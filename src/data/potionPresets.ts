import type { ItemEntry } from '@/types'
import { defaultSegment as ds } from '@/utils/slot'

interface PotionDef { name: string; color: string }

const POTS: PotionDef[] = [
  { name: 'Исцеление', color: '#F82423' }, { name: 'Отравление', color: '#4E9331' }, { name: 'Регенерация', color: '#CD5CAB' },
  { name: 'Сила', color: '#932423' }, { name: 'Скорость', color: '#7CAFC6' }, { name: 'Замедление', color: '#5A6C81' },
  { name: 'Урон', color: '#430A09' }, { name: 'Слабость', color: '#484D48' }, { name: 'Огнестойкость', color: '#E49A3A' },
  { name: 'Ночное зрение', color: '#1F1FA1' }, { name: 'Невидимость', color: '#7F8392' }, { name: 'Подв. дыхание', color: '#2E5299' },
  { name: 'Прыгучесть', color: '#22FF4C' }, { name: 'Медл. падение', color: '#F7F8E0' }, { name: 'Удача', color: '#339900' },
  { name: 'Черепаший мастер', color: '#735E91' },
]

const ARROWS: PotionDef[] = [
  { name: 'Исцеление', color: '#F82423' }, { name: 'Отравление', color: '#4E9331' }, { name: 'Регенерация', color: '#CD5CAB' },
  { name: 'Сила', color: '#932423' }, { name: 'Скорость', color: '#7CAFC6' }, { name: 'Замедление', color: '#5A6C81' },
  { name: 'Урон', color: '#430A09' }, { name: 'Слабость', color: '#484D48' }, { name: 'Огнестойкость', color: '#E49A3A' },
  { name: 'Ночное зрение', color: '#1F1FA1' }, { name: 'Невидимость', color: '#7F8392' }, { name: 'Подв. дыхание', color: '#2E5299' },
  { name: 'Прыгучесть', color: '#22FF4C' }, { name: 'Медл. падение', color: '#F7F8E0' },
]

export function getPotionPresets(): { potions: ItemEntry[]; arrows: ItemEntry[] } {
  const potions: ItemEntry[] = []
  for (const p of POTS) {
    potions.push({ id: 'potion', name: 'Зелье: ' + p.name, preset: { displayName: [ds('Зелье ' + p.name, p.color)], lore: [], enchanted: false, potionColor: p.color } })
    potions.push({ id: 'splash_potion', name: 'Взрывное: ' + p.name, preset: { displayName: [ds('Взрывное зелье ' + p.name, p.color)], lore: [], enchanted: false, potionColor: p.color } })
    potions.push({ id: 'lingering_potion', name: 'Туманное: ' + p.name, preset: { displayName: [ds('Туманное зелье ' + p.name, p.color)], lore: [], enchanted: false, potionColor: p.color } })
  }
  const arrows: ItemEntry[] = ARROWS.map(a => ({
    id: 'tipped_arrow', name: 'Стрела: ' + a.name,
    preset: { displayName: [ds('Стрела ' + a.name, a.color)], lore: [], enchanted: false, potionColor: a.color },
  }))
  return { potions, arrows }
}
