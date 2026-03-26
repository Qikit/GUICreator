import type { TextSegment } from '@/types'
import { defaultSegment as ds } from '@/utils/slot'

export interface LoreTemplate {
  label: string
  segments: TextSegment[]
}

export const LORE_TPLS: LoreTemplate[] = [
  { label: 'Separator', segments: [ds('────────────────', '#555555')] },
  { label: 'Нажмите, чтобы купить', segments: [ds('Нажмите, чтобы купить', '#FFFF55')] },
  { label: 'Цена: 100 монет', segments: [ds('Цена: ', '#FFAA00'), ds('100 монет', '#FFFFFF')] },
  { label: '(пустая строка)', segments: [ds(' ', '#FFFFFF')] },
  { label: '◀ Назад', segments: [ds('◀ Назад', '#AAAAAA')] },
  { label: 'Вперёд ▶', segments: [ds('Вперёд ▶', '#55FF55')] },
]

export interface SymbolGroup {
  group: string
  symbols: string[]
}

export const MC_SYMBOLS: SymbolGroup[] = [
  { group: 'Основные', symbols: ['⏹', '●', '＄', '✘', '✔', '⛁', '◎', '⚕', '✦', '❖', 'ℹ', '⚠', '★', '⭐', '⚝', '❤', '☠', '⌛', '❄', '⚡', '☃', '☘', '⚙', '☢', '☄', '✝', '⚑', '⚘', '✥', '⏵'] },
  { group: 'Стрелки', symbols: ['→', '←', '➥', '⟲', '⇨', '❱❱', '❱❱❱'] },
  { group: 'Оружие', symbols: ['⚒', '⚔', '🗡', '⛏', '⚚', '🪓', '✶', '🏹', '🔱', '⚓', '🧪', '⚗', '🎣', '🔥'] },
  { group: 'Прочие', symbols: ['৩', '₪'] },
]
