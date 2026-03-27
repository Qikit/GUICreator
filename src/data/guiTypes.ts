export type GuiTypeId =
  | 'chest' | 'chest_large' | 'hopper' | 'dispenser' | 'crafting' | 'furnace'
  | 'anvil' | 'brewing' | 'enchanting' | 'stonecutter' | 'cartography'
  | 'smithing' | 'loom' | 'grindstone' | 'generic'

export interface SlotPosition {
  key: string
  x: number
  y: number
}

export interface GuiType {
  id: GuiTypeId
  name: string
  texture: string | null
  containerWidth: number
  containerHeight: number
  slots: SlotPosition[]
}

function grid(startX: number, startY: number, cols: number, rows: number, spacing = 18, offset = 0): SlotPosition[] {
  const out: SlotPosition[] = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      out.push({ key: String(offset + r * cols + c), x: startX + c * spacing, y: startY + r * spacing })
  return out
}

const TEX = 'assets/minecraft/textures/gui/container/'

export const GUI_TYPES: GuiType[] = [
  {
    id: 'generic',
    name: 'Стандартное (сетка)',
    texture: null,
    containerWidth: 0,
    containerHeight: 0,
    slots: [],
  },
  {
    id: 'chest',
    name: 'Сундук (3x9)',
    texture: TEX + 'generic_54.png',
    containerWidth: 176,
    containerHeight: 68,
    slots: grid(7, 17, 9, 3),
  },
  {
    id: 'chest_large',
    name: 'Большой сундук (6x9)',
    texture: TEX + 'generic_54.png',
    containerWidth: 176,
    containerHeight: 122,
    slots: grid(7, 17, 9, 6),
  },
  {
    id: 'hopper',
    name: 'Воронка',
    texture: TEX + 'hopper.png',
    containerWidth: 176,
    containerHeight: 35,
    slots: [
      { key: '0', x: 43, y: 19 },
      { key: '1', x: 61, y: 19 },
      { key: '2', x: 79, y: 19 },
      { key: '3', x: 97, y: 19 },
      { key: '4', x: 115, y: 19 },
    ],
  },
  {
    id: 'dispenser',
    name: 'Раздатчик',
    texture: TEX + 'dispenser.png',
    containerWidth: 176,
    containerHeight: 68,
    slots: grid(61, 16, 3, 3),
  },
  {
    id: 'crafting',
    name: 'Верстак',
    texture: TEX + 'crafting_table.png',
    containerWidth: 176,
    containerHeight: 68,
    slots: [
      ...grid(29, 16, 3, 3),
      { key: '9', x: 123, y: 34 },
    ],
  },
  {
    id: 'furnace',
    name: 'Печь',
    texture: TEX + 'furnace.png',
    containerWidth: 176,
    containerHeight: 68,
    slots: [
      { key: '0', x: 55, y: 16 },
      { key: '1', x: 55, y: 52 },
      { key: '2', x: 115, y: 34 },
    ],
  },
  {
    id: 'anvil',
    name: 'Наковальня',
    texture: TEX + 'anvil.png',
    containerWidth: 176,
    containerHeight: 68,
    slots: [
      { key: '0', x: 26, y: 46 },
      { key: '1', x: 75, y: 46 },
      { key: '2', x: 133, y: 46 },
    ],
  },
  {
    id: 'brewing',
    name: 'Зельеварка',
    texture: TEX + 'brewing_stand.png',
    containerWidth: 176,
    containerHeight: 68,
    slots: [
      { key: '0', x: 55, y: 50 },
      { key: '1', x: 78, y: 58 },
      { key: '2', x: 101, y: 50 },
      { key: '3', x: 78, y: 16 },
      { key: '4', x: 16, y: 16 },
    ],
  },
  {
    id: 'enchanting',
    name: 'Стол зачарований',
    texture: TEX + 'enchanting_table.png',
    containerWidth: 176,
    containerHeight: 68,
    slots: [
      { key: '0', x: 14, y: 46 },
      { key: '1', x: 14, y: 16 },
    ],
  },
  {
    id: 'stonecutter',
    name: 'Камнерез',
    texture: TEX + 'stonecutter.png',
    containerWidth: 176,
    containerHeight: 68,
    slots: [
      { key: '0', x: 19, y: 32 },
      { key: '1', x: 143, y: 32 },
    ],
  },
  {
    id: 'cartography',
    name: 'Картограф',
    texture: TEX + 'cartography_table.png',
    containerWidth: 176,
    containerHeight: 68,
    slots: [
      { key: '0', x: 14, y: 16 },
      { key: '1', x: 14, y: 52 },
      { key: '2', x: 143, y: 34 },
    ],
  },
  {
    id: 'smithing',
    name: 'Стол кузнеца',
    texture: TEX + 'smithing.png',
    containerWidth: 176,
    containerHeight: 68,
    slots: [
      { key: '0', x: 7, y: 46 },
      { key: '1', x: 25, y: 46 },
      { key: '2', x: 75, y: 46 },
      { key: '3', x: 133, y: 46 },
    ],
  },
  {
    id: 'loom',
    name: 'Ткацкий станок',
    texture: TEX + 'loom.png',
    containerWidth: 176,
    containerHeight: 68,
    slots: [
      { key: '0', x: 12, y: 25 },
      { key: '1', x: 12, y: 43 },
      { key: '2', x: 32, y: 43 },
      { key: '3', x: 143, y: 34 },
    ],
  },
  {
    id: 'grindstone',
    name: 'Точило',
    texture: TEX + 'grindstone.png',
    containerWidth: 176,
    containerHeight: 68,
    slots: [
      { key: '0', x: 48, y: 18 },
      { key: '1', x: 48, y: 52 },
      { key: '2', x: 129, y: 34 },
    ],
  },
]

const typeMap = new Map<string, GuiType>()
for (const t of GUI_TYPES) typeMap.set(t.id, t)

export function getGuiType(id?: string): GuiType | null {
  if (!id || id === 'generic') return null
  return typeMap.get(id) ?? null
}
