import { useState } from 'react'
import type { Project } from '@/types'
import { seg2leg, seg2mm, seg2amText } from '@/utils/minimessage'
import { defaultSegment } from '@/utils/slot'
import { getGuiType } from '@/data/guiTypes'
import { GlassModal, GlassTabs, GlowButton, glassModalStyles } from '@/components/ui'

const TABS = [
  { key: 'json', label: 'JSON' },
  { key: 'yaml', label: 'YAML' },
  { key: 'legacy', label: '§-Codes' },
  { key: 'minimessage', label: 'MiniMessage' },
  { key: 'abstractmenus', label: 'AbstractMenus' },
]

type TabId = 'json' | 'yaml' | 'legacy' | 'minimessage' | 'abstractmenus'

interface Props {
  project: Project
  onClose: () => void
}

export function ExportModal({ project, onClose }: Props) {
  const [tab, setTab] = useState<TabId>('json')
  const [copied, setCopied] = useState(false)
  const [amCmd, setAmCmd] = useState(project.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'menu')
  const gt = getGuiType(project.guiType)

  const filled = (() => {
    const r: Array<{ slot: number; key: string; [k: string]: unknown }> = []
    if (gt) {
      for (const s of gt.slots) {
        const sl = project.slots[s.key]
        if (sl) r.push({ slot: Number(s.key), key: s.key, ...sl })
      }
    } else {
      for (let row = 0; row < project.rows; row++)
        for (let c = 0; c < 9; c++) {
          const k = `${row}-${c}`
          const sl = project.slots[k]
          if (sl) r.push({ slot: row * 9 + c, key: k, ...sl })
        }
    }
    return r
  })()

  const gen = (): string => {
    if (tab === 'json') {
      const slotCount = gt ? gt.slots.length : project.rows * 9
      return JSON.stringify({
        menu: { title: project.name, size: slotCount, rows: project.rows, ...(gt ? { guiType: gt.id } : {}) },
        slots: filled.map((sl: any) => ({
          slot: sl.slot, material: sl.itemId.toUpperCase(),
          displayName: { legacy: seg2leg(sl.displayName), minimessage: seg2mm(sl.displayName), segments: sl.displayName },
          lore: { legacy: sl.lore.map((l: any) => seg2leg(l)), minimessage: sl.lore.map((l: any) => seg2mm(l)), segments: sl.lore },
          amount: sl.amount, enchanted: sl.enchanted, customModelData: sl.customModelData,
        })),
        metadata: { exportedAt: new Date().toISOString(), tool: 'MC Menu Designer v4', totalSlots: gt ? gt.slots.length : project.rows * 9, filledSlots: filled.length },
      }, null, 2)
    }
    if (tab === 'yaml') {
      const ySize = gt ? gt.slots.length : project.rows * 9
      let y = `title: "${seg2leg([defaultSegment(project.name, '#FFFFFF')])}"\nsize: ${ySize}\n${gt ? `type: ${gt.id}\n` : ''}items:\n`
      for (const sl of filled as any[]) {
        y += `  '${sl.slot}':\n    material: ${sl.itemId.toUpperCase()}\n    name: "${seg2leg(sl.displayName)}"\n`
        if (sl.lore.length) { y += `    lore:\n`; for (const l of sl.lore) y += `      - "${seg2leg(l)}"\n` }
        y += `    amount: ${sl.amount}\n`; if (sl.enchanted) y += `    enchanted: true\n`
      }
      return y
    }
    if (tab === 'legacy') {
      let t = `Menu: ${project.name} (${project.rows}x9)\n\n`
      for (const sl of filled as any[]) { t += `Slot ${sl.slot}: ${seg2leg(sl.displayName)}\n`; for (let i = 0; i < sl.lore.length; i++) t += `  Lore ${i + 1}: ${seg2leg(sl.lore[i])}\n` }
      return t
    }
    if (tab === 'minimessage') {
      let t = `Menu: ${project.name} (${project.rows}x9)\n\n`
      for (const sl of filled as any[]) { t += `Slot ${sl.slot}: ${seg2mm(sl.displayName)}\n`; for (let i = 0; i < sl.lore.length; i++) t += `  Lore ${i + 1}: ${seg2mm(sl.lore[i])}\n` }
      return t
    }
    if (tab === 'abstractmenus') {
      let c = `title: "&8${project.name}"\nsize: ${project.rows}\nactivators {\n  command: "${amCmd}"\n}\nitems: [\n`
      for (const sl of filled as any[]) {
        c += `  {\n    slot: ${sl.slot}\n    material: ${sl.itemId.toUpperCase()}\n`
        const nm = seg2amText(sl.displayName); if (nm) c += `    name: "${nm}"\n`
        if (sl.lore?.length) { c += `    lore: [\n`; for (const l of sl.lore) c += `      "${seg2amText(l)}"\n`; c += `    ]\n` }
        if (sl.enchanted) c += `    glow: true\n`; if (sl.amount > 1) c += `    count: ${sl.amount}\n`
        c += `    flags: ["HIDE_ATTRIBUTES","HIDE_ENCHANTS"]\n  }\n`
      }
      return c + `]\n`
    }
    return ''
  }

  const txt = gen()
  const copy = () => navigator.clipboard.writeText(txt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  const dl = () => {
    const ext = tab === 'yaml' ? 'yml' : tab === 'json' ? 'json' : tab === 'abstractmenus' ? 'conf' : 'txt'
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${project.name.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, '_')}.${ext}`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <GlassModal onClose={onClose} title="Экспорт">
      <GlassTabs
        tabs={TABS}
        active={tab}
        onChange={key => { setTab(key as TabId); setCopied(false) }}
      />
      {tab === 'abstractmenus' && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--tx2)' }}>Команда:</span>
          <input value={amCmd} onChange={e => setAmCmd(e.target.value)} style={{ width: 120, fontSize: 12 }} />
        </div>
      )}
      <div className={glassModalStyles.code}>{txt}</div>
      <div className={glassModalStyles.actions}>
        <GlowButton variant="primary" onClick={copy}>{copied ? 'Скопировано!' : 'Копировать'}</GlowButton>
        <GlowButton onClick={dl}>Скачать</GlowButton>
        <GlowButton onClick={onClose}>Закрыть</GlowButton>
      </div>
    </GlassModal>
  )
}
