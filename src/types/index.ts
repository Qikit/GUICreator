export interface TextSegment {
  text: string
  color: string
  bold: boolean
  italic: boolean
  underlined: boolean
  strikethrough: boolean
  obfuscated: boolean
  gradientId?: string
  gradientStops?: string[]
}

export interface ArmorTrim {
  material: string
  pattern: string
}

export interface SlotData {
  itemId: string
  displayName: TextSegment[]
  lore: TextSegment[][]
  amount: number
  enchanted: boolean
  customModelData: number | null
  hideFlags: number
  potionColor: string | null
  skullTexture: string | null
  armorTrim: ArmorTrim | null
  funItemId?: string
  funItemNbt?: string
  funItemComponents?: string
  funItemTags?: Record<string, Record<string, unknown>>
  funItemEnchantments?: Record<string, number>
  funItemEffects?: Array<{ potion: string; level: number; time: number }>
  funItemAttributes?: Array<{ type: string; amount: number; operation: string; slot: string; id?: string }>
  funItemFlags?: string[]
}

export interface Project {
  id: string
  name: string
  rows: number
  cols: 9
  guiType?: string
  slots: Record<string, SlotData>
  createdAt: number
  updatedAt: number
}

export interface WorkspaceMenu {
  projectId: string
  x: number
  y: number
}

export interface Connection {
  id: string
  fromMenu: string
  fromSlot: string
  toMenu: string
}

export interface Workspace {
  id: string
  name: string
  menus: WorkspaceMenu[]
  connections: Connection[]
}

export interface ItemEntry {
  id: string
  name: string
  preset?: SlotPreset
}

export interface SlotPreset {
  displayName: TextSegment[]
  lore: TextSegment[][]
  enchanted: boolean
  amount?: number
  customModelData?: number | null
  potionColor?: string | null
  skullTexture?: string | null
  armorTrim?: ArmorTrim | null
  funItemId?: string
}

export interface ItemCategory {
  label: string
  preset?: boolean
  items: ItemEntry[]
}

export type ItemDatabase = Record<string, ItemCategory>

export type ProjectAction =
  | { type: 'SS'; key: string; data: SlotData }
  | { type: 'SM'; slots: Record<string, SlotData> }
  | { type: 'RS'; key: string }
  | { type: 'RM'; keys: string[] }
  | { type: 'MV'; from: string; to: string }
  | { type: 'SR'; rows: number }
  | { type: 'SN'; name: string }
  | { type: 'SGT'; guiType: string }
  | { type: 'CA' }
  | { type: 'REPL'; remove: string[]; set: Record<string, SlotData> }
  | { type: 'FE'; data: SlotData }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LP'; project: Project }

export interface UndoableState {
  past: Project[]
  present: Project
  future: Project[]
}
