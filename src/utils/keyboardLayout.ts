// Позиционный маппинг физических клавиш QWERTY → ЙЦУКЕН (нижний регистр).
const EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,."
const RU = 'йцукенгшщзхъфывапролджэячсмитьбю'

const enToRuMap: Record<string, string> = {}
const ruToEnMap: Record<string, string> = {}
for (let i = 0; i < EN.length; i++) {
  enToRuMap[EN[i]] = RU[i]
  ruToEnMap[RU[i]] = EN[i]
}

function convert(s: string, map: Record<string, string>): string {
  let r = ''
  for (const ch of s) {
    const lower = ch.toLowerCase()
    r += map[lower] ?? ch
  }
  return r
}

export function enToRu(s: string): string { return convert(s, enToRuMap) }
export function ruToEn(s: string): string { return convert(s, ruToEnMap) }
