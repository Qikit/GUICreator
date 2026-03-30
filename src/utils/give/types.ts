import type { SlotData } from '@/types'

export type McVersion = '1.16.5' | '1.20.5+'

export interface ContainerDef {
  id: string
  label: string
  maxSlots: number
  doubleAllowed: boolean
}

export interface GiveOptions {
  version: McVersion
  target: string
  prefix: string
  container: ContainerDef
}

export interface GiveResult {
  commands: string[]
  isDoubleChest: boolean
}

export interface CommandGenerator {
  formatItem(slot: SlotData, options: Omit<GiveOptions, 'container'>): string
  formatContainer(slots: Record<string, SlotData>, rows: number, options: GiveOptions): GiveResult
}
