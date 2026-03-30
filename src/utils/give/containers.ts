import type { ContainerDef } from './types'

export const CONTAINERS: ContainerDef[] = [
  { id: 'chest',         label: 'Сундук',         maxSlots: 27, doubleAllowed: true },
  { id: 'trapped_chest', label: 'Сундук-ловушка', maxSlots: 27, doubleAllowed: true },
  { id: 'barrel',        label: 'Бочка',          maxSlots: 27, doubleAllowed: false },
  { id: 'shulker_box',   label: 'Шалкер-бокс',    maxSlots: 27, doubleAllowed: false },
  { id: 'dispenser',     label: 'Раздатчик',      maxSlots: 9,  doubleAllowed: false },
  { id: 'dropper',       label: 'Выбрасыватель',  maxSlots: 9,  doubleAllowed: false },
  { id: 'hopper',        label: 'Воронка',         maxSlots: 5,  doubleAllowed: false },
]

export const SHULKER_COLORS = [
  '', 'white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink',
  'gray', 'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black',
] as const

export function getContainerId(baseId: string, color: string): string {
  if (baseId === 'shulker_box' && color) return `${color}_shulker_box`
  return baseId
}

export type ContainerStatus = 'fits' | 'double' | 'truncated'

export interface FilteredContainer {
  container: ContainerDef
  status: ContainerStatus
}

export function filterContainers(totalSlots: number): FilteredContainer[] {
  return CONTAINERS.map(c => {
    let status: ContainerStatus
    if (c.maxSlots >= totalSlots) {
      status = 'fits'
    } else if (c.doubleAllowed && c.maxSlots * 2 >= totalSlots) {
      status = 'double'
    } else {
      status = 'truncated'
    }
    return { container: c, status }
  })
}
