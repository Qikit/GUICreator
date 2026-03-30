import type { McVersion, CommandGenerator } from './types'
import { NbtGenerator } from './NbtGenerator'
import { ComponentGenerator } from './ComponentGenerator'

const generators: Record<McVersion, CommandGenerator> = {
  '1.16.5': new NbtGenerator(),
  '1.20.5+': new ComponentGenerator(),
}

export function getGenerator(version: McVersion): CommandGenerator {
  return generators[version]
}
