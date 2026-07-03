import { defaultSegment as ds } from '@/utils/slot'

const g = (id: string) => ({ itemId: id, displayName: [ds(' ')], lore: [] as never[], amount: 1, enchanted: false, customModelData: null, hideFlags: 0, potionColor: null, skullTexture: null })

const border = (rows: number, id = 'black_stained_glass_pane') => {
  const s: Record<string, ReturnType<typeof g>> = {}
  for (let c = 0; c < 9; c++) { s[`0-${c}`] = g(id); s[`${rows - 1}-${c}`] = g(id) }
  for (let r = 1; r < rows - 1; r++) { s[`${r}-0`] = g(id); s[`${r}-8`] = g(id) }
  return s
}

export const BUILT_TPLS = [
  {
    name: 'Shop 6x9', desc: 'Бордеры + навигация', rows: 6,
    slots: (() => {
      const s: Record<string, ReturnType<typeof g>> = {}
      for (let c = 0; c < 9; c++) s['0-' + c] = g('black_stained_glass_pane')
      for (let r = 1; r < 5; r++) { s[r + '-0'] = g('black_stained_glass_pane'); s[r + '-8'] = g('black_stained_glass_pane') }
      for (let c = 0; c < 9; c++) s['5-' + c] = g('black_stained_glass_pane')
      s['5-0'] = { ...g('arrow'), displayName: [ds('◀ Назад', '#55FF55')], lore: [[ds('Предыдущая страница', '#AAAAAA')]] as never }
      s['5-4'] = { ...g('barrier'), displayName: [ds('✕ Закрыть', '#FF5555')], lore: [[ds('Закрыть меню', '#AAAAAA')]] as never }
      s['5-8'] = { ...g('arrow'), displayName: [ds('Вперёд ▶', '#55FF55')], lore: [[ds('Следующая страница', '#AAAAAA')]] as never }
      return s
    })(),
  },
  {
    name: 'Confirm 3x9', desc: 'Да / Нет', rows: 3,
    slots: {
      '0-4': { ...g('paper'), displayName: [ds('Вы уверены?', '#FFFF55', true)] },
      '1-2': { ...g('green_wool'), displayName: [ds('✔ Да', '#55FF55', true)] },
      '1-6': { ...g('red_wool'), displayName: [ds('✕ Нет', '#FF5555', true)] },
    },
  },
  { name: 'Blank', desc: 'Чистый холст', rows: 3, slots: {} },
  { name: 'Рамка из стекла', desc: 'Пустой периметр', rows: 6, slots: border(6) },
  { name: 'Список с пагинацией', desc: 'Рамка + навигация', rows: 6, slots: (() => {
    const s = border(6)
    s['5-3'] = { ...g('arrow'), displayName: [ds('◀ Назад', '#55FF55')] }
    s['5-4'] = { ...g('paper'), displayName: [ds('Страница 1', '#FFFF55')] }
    s['5-5'] = { ...g('spectral_arrow'), displayName: [ds('Вперёд ▶', '#55FF55')] }
    return s
  })() },
  { name: 'Меню-категории', desc: 'Рамка + разделы', rows: 6, slots: (() => {
    const s = border(6)
    for (const c of [1, 3, 5, 7]) s[`2-${c}`] = { ...g('chest'), displayName: [ds('Раздел', '#FFAA00')] }
    return s
  })() },
  { name: 'Панель профиля', desc: 'Голова + статистика', rows: 6, slots: (() => {
    const s = border(6)
    s['2-4'] = { ...g('player_head'), displayName: [ds('Профиль', '#55FFFF')] }
    s['2-2'] = { ...g('paper'), displayName: [ds('Статистика', '#AAAAAA')] }
    s['2-6'] = { ...g('paper'), displayName: [ds('Достижения', '#AAAAAA')] }
    return s
  })() },
]
