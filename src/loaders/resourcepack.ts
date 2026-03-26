import { setRPIndex } from './funitems'

export async function loadResourcepackIndex(): Promise<number> {
  try {
    const r = await fetch('/assets/resourcepack/index.json')
    if (!r.ok) return 0
    const data: Record<string, string> = await r.json()
    setRPIndex(data)
    return Object.keys(data).length
  } catch {
    return 0
  }
}
