const BASE = import.meta.env.BASE_URL || '/'

export function assetUrl(path: string): string {
  return BASE + path.replace(/^\//, '')
}
