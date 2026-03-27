import { defaultSegment as ds } from '@/utils/slot'

const g = (id: string) => ({ itemId: id, displayName: [ds(' ')], lore: [] as never[], amount: 1, enchanted: false, customModelData: null, hideFlags: 0, potionColor: null, skullTexture: null })

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
  // FunTime templates
  { name: 'FT: Главное меню', desc: 'Навигация — 9 разделов', rows: 5, slots: (() => {
    const s: Record<string, ReturnType<typeof g>> = {}
    for (const p of ['0-0','0-1','0-7','0-8','4-0','4-1','4-7','4-8','1-0','2-0','3-0','1-8','2-8','3-8']) s[p] = g('red_stained_glass_pane')
    for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) { const k = r+'-'+c; if (!s[k]) s[k] = g('orange_stained_glass_pane') }
    s['1-3'] = { ...g('chest'), displayName: [ds('[⚝] ', '#FF0000'), ds('Магазин', '#FF6600')], lore: [[ds('➥ Нажмите', '#FF6600'), ds(', чтобы перейти', '#FFE6C0')]] as never }
    s['1-4'] = { ...g('totem_of_undying'), displayName: [ds('[⚝] ', '#FF0000'), ds('Аукцион', '#FF6600')], lore: [[ds('➥ Нажмите', '#FF6600'), ds(', чтобы перейти', '#FFE6C0')]] as never }
    s['1-5'] = { ...g('crafting_table'), displayName: [ds('[⚝] ', '#FF0000'), ds('Крафты', '#FF6600')], lore: [[ds('➥ Нажмите', '#FF6600'), ds(', чтобы перейти', '#FFE6C0')]] as never }
    s['2-3'] = { ...g('skull_banner_pattern'), displayName: [ds('[⚝] ', '#FF0000'), ds('Сообщества', '#FF6600')], lore: [[ds('➥ Нажмите', '#FF6600')]] as never }
    s['2-4'] = { ...g('emerald'), displayName: [ds('[⚝] ', '#FFFF55'), ds('Донат', '#FFFF55')], lore: [[ds('➥ Нажмите', '#FF6600')]] as never }
    s['2-5'] = { ...g('firework_rocket'), displayName: [ds('[⚝] ', '#FF0000'), ds('Дизайн', '#FF6600')], lore: [[ds('➥ Нажмите', '#FF6600')]] as never }
    s['3-3'] = { ...g('netherite_sword'), displayName: [ds('[⚝] ', '#FF0000'), ds('Скиллы', '#FF6600')], lore: [[ds('➥ Нажмите', '#FF6600')]] as never }
    s['3-4'] = { ...g('compass'), displayName: [ds('[⚝] ', '#FF0000'), ds('Варпы', '#FF6600')], lore: [[ds('➥ Нажмите', '#FF6600')]] as never }
    s['3-5'] = { ...g('enchanted_book'), displayName: [ds('[⚝] ', '#FF0000'), ds('Зачарования', '#FF6600')], lore: [[ds('➥ Нажмите', '#FF6600')]] as never }
    return s
  })() },
  { name: 'FT: Варпы', desc: '13 точек ромбом', rows: 5, slots: (() => {
    const s: Record<string, ReturnType<typeof g>> = {}
    for (const p of ['0-0','0-1','0-7','0-8','4-0','4-1','4-7','4-8','1-0','2-0','3-0','1-8','2-8','3-8']) s[p] = g('red_stained_glass_pane')
    for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) { const k = r+'-'+c; if (!s[k]) s[k] = g('orange_stained_glass_pane') }
    const w = (pos: string, nm: string, mat: string) => { s[pos] = { ...g(mat), displayName: [ds('[❖] ', '#FF0000'), ds(nm, '#FF6600')], lore: [[ds('➥ Нажмите', '#FF6600'), ds(', для телепортации', '#FFE6C0')]] as never } }
    s['0-4'] = { ...g('arrow'), displayName: [ds('[⟲] ', '#FF0000'), ds('Вернуться', '#FF6600')] }
    w('1-3', 'Кейсы', 'ender_chest'); w('1-4', 'Рынок', 'experience_bottle'); w('1-5', 'Скупщик', 'emerald')
    w('2-2', 'Рыбалка', 'fishing_rod'); w('2-3', 'PVP Арена', 'diamond_sword'); w('2-4', 'Портал', 'obsidian'); w('2-5', 'Авто-шахта', 'diamond_pickaxe'); w('2-6', 'Собир. душ', 'soul_lantern')
    w('3-3', 'Зачарка', 'enchanting_table'); w('3-4', 'Палач', 'skeleton_skull'); w('3-5', 'Казино', 'gold_ingot'); w('4-4', 'Тайники', 'lodestone')
    return s
  })() },
  { name: 'FT: Донат Магазин', desc: '7 разделов за токены', rows: 5, slots: (() => {
    const s: Record<string, ReturnType<typeof g>> = {}
    for (const p of ['0-0','0-1','0-7','0-8','4-0','4-1','4-7','4-8','1-0','2-0','3-0','1-8','2-8','3-8']) s[p] = g('red_stained_glass_pane')
    for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) { const k = r+'-'+c; if (!s[k]) s[k] = g('orange_stained_glass_pane') }
    const mk = (pos: string, mat: string, nm: string) => { s[pos] = { ...g(mat), displayName: [ds('[★] ', '#FF0000'), ds(nm, '#FF6600')], lore: [[ds('➥ Нажмите', '#FF0000'), ds(', чтобы перейти', '#FFE6C0')]] as never, enchanted: true } }
    mk('1-3', 'netherite_sword', 'Всё для PvP'); mk('1-5', 'netherite_pickaxe', 'Инструменты')
    mk('2-2', 'netherite_ingot', 'Ингредиенты'); mk('2-4', 'nether_star', 'Талисманы и Сферы'); mk('2-6', 'gold_ingot', 'Монеты')
    mk('3-3', 'spawner', 'Яйца и Спавнеры'); mk('3-5', 'chest', 'Особые товары')
    return s
  })() },
  { name: 'FT: Арена смерти', desc: '4 кнопки', rows: 5, slots: (() => {
    const s: Record<string, ReturnType<typeof g>> = {}
    for (const p of ['0-0','0-1','0-7','0-8','4-0','4-1','4-7','4-8','1-0','2-0','3-0','1-8','2-8','3-8']) s[p] = g('red_stained_glass_pane')
    for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) { const k = r+'-'+c; if (!s[k]) s[k] = g('orange_stained_glass_pane') }
    s['2-2'] = { ...g('netherite_sword'), displayName: [ds('[⚔] ', '#AA0000'), ds('На Арену', '#FF5555')], lore: [[ds('Телепортация на арену', '#FFE6C0')]] as never, enchanted: true }
    s['2-6'] = { ...g('pufferfish'), displayName: [ds('[◕_◕] ', '#AA0000'), ds('На Смотровую', '#FF5555')], enchanted: true }
    s['1-4'] = { ...g('writable_book'), displayName: [ds('[✝] ', '#AA0000'), ds('Информация', '#FF5555')], enchanted: true }
    s['3-4'] = { ...g('netherite_chestplate'), displayName: [ds('[$] ', '#AA0000'), ds('Купить снаряжение', '#FF5555')], enchanted: true }
    return s
  })() },
  { name: 'FT: Настройки', desc: '6 разделов', rows: 6, slots: (() => {
    const s: Record<string, ReturnType<typeof g>> = {}
    for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) s[r+'-'+c] = g('red_stained_glass_pane')
    for (let c = 2; c <= 7; c++) { s['1-'+c] = g('orange_stained_glass_pane'); s['4-'+c] = g('orange_stained_glass_pane') }
    s['0-0'] = { ...g('writable_book'), displayName: [ds('[❖] ', '#FF0000'), ds('Чат', '#FF6600')] }
    s['1-0'] = { ...g('bell'), displayName: [ds('[❖] ', '#FF0000'), ds('Соц. взаимодействия', '#FF6600')] }
    s['2-0'] = { ...g('music_disc_ward'), displayName: [ds('[❖] ', '#FF0000'), ds('Звуки', '#FF6600')] }
    s['3-0'] = { ...g('hopper'), displayName: [ds('[❖] ', '#FF0000'), ds('Автолут', '#FF6600')] }
    s['4-0'] = { ...g('dragon_breath'), displayName: [ds('[❖] ', '#FF0000'), ds('Визуал', '#FF6600')] }
    s['5-0'] = { ...g('clock'), displayName: [ds('[❖] ', '#FF0000'), ds('Погода и время', '#FF6600')] }
    for (let c = 2; c <= 7; c++) s['2-'+c] = { ...g('lime_dye'), displayName: [ds('● ', '#FF0000'), ds('Настройка '+(c-1), '#FF6600')], lore: [[ds(' ★ ', '#FF6600'), ds('Статус: ', '#FFE6C0'), ds('[Включено]', '#55FF55')]] as never }
    return s
  })() },
  { name: 'FT: Киты', desc: 'Обычные и платные', rows: 5, slots: (() => {
    const s: Record<string, ReturnType<typeof g>> = {}
    for (const p of ['0-0','0-1','0-7','0-8','4-0','4-1','4-7','4-8','1-0','2-0','3-0','1-8','2-8','3-8']) s[p] = g('red_stained_glass_pane')
    for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) { const k = r+'-'+c; if (!s[k]) s[k] = g('orange_stained_glass_pane') }
    s['2-2'] = { ...g('totem_of_undying'), displayName: [ds('Обычные наборы', '#FF0000')], lore: [[ds('➥ Нажмите', '#FF6600')]] as never }
    s['2-5'] = { ...g('emerald'), displayName: [ds('Платные наборы', '#FF0000')], lore: [[ds('➥ Нажмите', '#FF6600')]] as never }
    return s
  })() },
  { name: 'FT: Палач', desc: 'Обмен голов', rows: 5, slots: (() => {
    const s: Record<string, ReturnType<typeof g>> = {}
    for (const p of ['0-0','0-1','0-7','0-8','4-0','4-1','4-7','4-8','1-0','2-0','3-0','1-8','2-8','3-8']) s[p] = g('red_stained_glass_pane')
    for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) { const k = r+'-'+c; if (!s[k]) s[k] = g('orange_stained_glass_pane') }
    const lr = [[ds('➥ Нажмите', '#FF6600'), ds(', чтобы перейти', '#FFE6C0')]] as never
    s['2-2'] = { ...g('skeleton_skull'), displayName: [ds('[$] Скелет', '#FF0000')], lore: lr }
    s['2-3'] = { ...g('zombie_head'), displayName: [ds('[$] Зомби', '#FF0000')], lore: lr }
    s['2-4'] = { ...g('creeper_head'), displayName: [ds('[$] Крипер', '#FF0000')], lore: lr }
    s['2-5'] = { ...g('wither_skeleton_skull'), displayName: [ds('[$] Визер-скелет', '#FF0000')], lore: lr }
    s['2-6'] = { ...g('dragon_head'), displayName: [ds('[$] Дракон', '#FF0000')], lore: lr }
    return s
  })() },
]
