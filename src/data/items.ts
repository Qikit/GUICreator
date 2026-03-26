import type { ItemDatabase } from '@/types'

const _c = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black']
const _w = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'cherry', 'mangrove', 'bamboo', 'crimson', 'warped', 'pale_oak']

const m = (ids: string[]) => ids.map(id => ({ id, name: id.replace(/_/g, ' ') }))

export const ITEM_DB: ItemDatabase = {
  glass_panes: { label: 'Стеклянные панели', items: _c.map(c => ({ id: c + '_stained_glass_pane', name: c.replace(/_/g, ' ') + ' Glass Pane' })).concat([{ id: 'glass_pane', name: 'Glass Pane' }]) },
  stained_glass: { label: 'Окрашенное стекло', items: _c.map(c => ({ id: c + '_stained_glass', name: c.replace(/_/g, ' ') + ' Glass' })).concat([{ id: 'glass', name: 'Glass' }, { id: 'tinted_glass', name: 'Tinted Glass' }]) },
  wool: { label: 'Шерсть', items: _c.map(c => ({ id: c + '_wool', name: c.replace(/_/g, ' ') + ' Wool' })) },
  concrete: { label: 'Бетон', items: _c.map(c => ({ id: c + '_concrete', name: c.replace(/_/g, ' ') + ' Concrete' })) },
  terracotta: { label: 'Терракота', items: [{ id: 'terracotta', name: 'Terracotta' }, ..._c.map(c => ({ id: c + '_terracotta', name: c.replace(/_/g, ' ') + ' Terracotta' }))] },
  planks: { label: 'Доски', items: _w.map(w => ({ id: w + '_planks', name: w.replace(/_/g, ' ') + ' Planks' })) },
  building: { label: 'Строительные', items: m(['stone', 'cobblestone', 'deepslate', 'bricks', 'stone_bricks', 'nether_bricks', 'sandstone', 'red_sandstone', 'granite', 'diorite', 'andesite', 'obsidian', 'bedrock', 'netherrack', 'end_stone', 'blackstone', 'basalt', 'tuff', 'calcite', 'mud_bricks']) },
  mineral_blocks: { label: 'Минеральные блоки', items: m(['coal_block', 'iron_block', 'gold_block', 'diamond_block', 'emerald_block', 'lapis_block', 'redstone_block', 'netherite_block', 'copper_block', 'amethyst_block', 'glowstone', 'sea_lantern']) },
  swords: { label: 'Мечи', items: ['wooden', 'stone', 'iron', 'golden', 'diamond', 'netherite'].map(t => ({ id: t + '_sword', name: t + ' Sword' })).concat([{ id: 'mace', name: 'Mace' }]) },
  tools: { label: 'Инструменты', items: ['wooden', 'stone', 'iron', 'golden', 'diamond', 'netherite'].flatMap(t => ['pickaxe', 'axe', 'shovel', 'hoe'].map(tool => ({ id: t + '_' + tool, name: t + ' ' + tool }))) },
  armor: { label: 'Броня', items: ['leather', 'chainmail', 'iron', 'golden', 'diamond', 'netherite'].flatMap(mat => ['helmet', 'chestplate', 'leggings', 'boots'].map(p => ({ id: mat + '_' + p, name: mat + ' ' + p }))).concat([{ id: 'turtle_helmet', name: 'Turtle Helmet' }, { id: 'elytra', name: 'Elytra' }]) },
  food: { label: 'Еда', items: m(['apple', 'golden_apple', 'enchanted_golden_apple', 'bread', 'cooked_beef', 'cooked_porkchop', 'cookie', 'cake', 'golden_carrot', 'melon_slice']) },
  materials: { label: 'Материалы', items: m(['diamond', 'emerald', 'gold_ingot', 'iron_ingot', 'netherite_ingot', 'copper_ingot', 'redstone', 'lapis_lazuli', 'coal', 'quartz', 'nether_star', 'ender_pearl', 'blaze_rod', 'experience_bottle']) },
  functional: { label: 'Функциональные', items: m(['barrier', 'paper', 'book', 'enchanted_book', 'name_tag', 'lead', 'arrow', 'spectral_arrow', 'firework_rocket', 'compass', 'clock', 'map', 'totem_of_undying', 'trial_key', 'bucket', 'water_bucket', 'lava_bucket', 'egg', 'snowball', 'shears', 'flint_and_steel']) },
  decoration: { label: 'Декор', items: m(['painting', 'item_frame', 'armor_stand', 'flower_pot', 'lantern', 'soul_lantern', 'chain', 'end_rod', 'lightning_rod', 'bell', 'campfire', 'soul_campfire']) },
  redstone: { label: 'Редстоун', items: m(['redstone', 'repeater', 'comparator', 'hopper', 'dispenser', 'dropper', 'observer', 'piston', 'sticky_piston', 'tnt']) },
  heads: { label: 'Головы', items: m(['player_head', 'skeleton_skull', 'zombie_head', 'creeper_head', 'piglin_head', 'dragon_head', 'wither_skeleton_skull']) },
  chests: { label: 'Сундуки', items: m(['chest', 'trapped_chest', 'ender_chest', 'barrel', 'decorated_pot', 'conduit']) },
  potions: { label: 'Зелья', items: m(['potion', 'splash_potion', 'lingering_potion', 'glass_bottle', 'dragon_breath', 'brewing_stand']) },
  spawn_eggs: { label: 'Яйца призыва', items: ['zombie', 'skeleton', 'creeper', 'spider', 'enderman', 'blaze', 'ghast', 'slime', 'witch', 'villager', 'pig', 'cow', 'sheep', 'chicken', 'wolf', 'cat', 'horse', 'bee'].map(m => ({ id: m + '_spawn_egg', name: m.replace(/_/g, ' ') + ' Spawn Egg' })) },
  dyes: { label: 'Красители', items: _c.map(c => ({ id: c + '_dye', name: c.replace(/_/g, ' ') + ' Dye' })) },
  banners: { label: 'Знамёна', items: _c.map(c => ({ id: c + '_banner', name: c.replace(/_/g, ' ') + ' Banner' })) },
  beds: { label: 'Кровати', items: _c.map(c => ({ id: c + '_bed', name: c.replace(/_/g, ' ') + ' Bed' })) },
  candles: { label: 'Свечи', items: [{ id: 'candle', name: 'Candle' }, ..._c.map(c => ({ id: c + '_candle', name: c.replace(/_/g, ' ') + ' Candle' }))] },
}
