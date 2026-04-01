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

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function encode(data: ShareData): string {
  const json = JSON.stringify(data)
  const compressed = pako.deflate(json)
  return uint8ToBase64(compressed).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
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

function extractSharePayload(input: string): string | null {
  const hashIdx = input.indexOf('#share=')
  if (hashIdx === -1) return null
  return input.slice(hashIdx)
}

export function decodeShareUrl(input: string): ShareData | null {
  const hash = input.startsWith('#') ? input : (extractSharePayload(input) ?? '')
  if (!hash.startsWith(HASH_PREFIX)) return null
  try {
    const raw = hash.slice(HASH_PREFIX.length)
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/')
    const bytes = base64ToUint8(b64)
    const json = pako.inflate(bytes, { to: 'string' })
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function detectShareInUrl(): ShareData | null {
  return decodeShareUrl(window.location.hash)
}
