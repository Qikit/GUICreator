import pako from 'pako'
import type { Workspace, Project, SlotData } from '@/types'

const MAX_URL_LEN = 8000
const HASH_PREFIX = '#share='

export interface ShareData {
  workspace: Workspace
  projects: Project[]
}

export interface ShareResult {
  url: string
  stripped: number
}

function encode(data: ShareData): string {
  const json = JSON.stringify(data)
  const compressed = pako.deflate(json)
  const binary = String.fromCharCode(...compressed)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function slotWeight(slot: SlotData): number {
  return JSON.stringify(slot).length
}

function stripHeaviestSlots(data: ShareData, count: number): ShareData {
  const projects = data.projects.map(p => ({ ...p, slots: { ...p.slots } }))

  const allSlots: { projectIdx: number; key: string; weight: number }[] = []
  for (let i = 0; i < projects.length; i++) {
    for (const [key, slot] of Object.entries(projects[i].slots)) {
      allSlots.push({ projectIdx: i, key, weight: slotWeight(slot) })
    }
  }
  allSlots.sort((a, b) => b.weight - a.weight)

  const toRemove = allSlots.slice(0, count)
  for (const { projectIdx, key } of toRemove) {
    delete projects[projectIdx].slots[key]
  }

  return { workspace: data.workspace, projects }
}

export function generateShareUrl(data: ShareData, baseUrl: string): ShareResult {
  const base = baseUrl.split('#')[0]
  let encoded = encode(data)
  let url = `${base}${HASH_PREFIX}${encoded}`

  if (url.length <= MAX_URL_LEN) {
    return { url, stripped: 0 }
  }

  const totalSlots = data.projects.reduce((sum, p) => sum + Object.keys(p.slots).length, 0)
  let stripped = 0

  for (let remove = 1; remove <= totalSlots; remove++) {
    const trimmed = stripHeaviestSlots(data, remove)
    encoded = encode(trimmed)
    url = `${base}${HASH_PREFIX}${encoded}`
    stripped = remove
    if (url.length <= MAX_URL_LEN) break
  }

  return { url, stripped }
}

export function decodeShareUrl(hash: string): ShareData | null {
  if (!hash.startsWith(HASH_PREFIX)) return null
  try {
    const b64 = hash.slice(HASH_PREFIX.length).replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const json = pako.inflate(bytes, { to: 'string' })
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function detectShareInUrl(): ShareData | null {
  return decodeShareUrl(window.location.hash)
}
