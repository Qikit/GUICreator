import { useState } from 'react'
import { GlassModal, GlassTabs } from '@/components/ui'
import { ShortcutsSettings } from './ShortcutsSettings'

interface Props { onClose: () => void }

const TABS = [{ key: 'hotkeys', label: 'Горячие клавиши' }]

export function SettingsModal({ onClose }: Props) {
  const [tab, setTab] = useState('hotkeys')
  return (
    <GlassModal onClose={onClose} title="Настройки">
      <GlassTabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'hotkeys' && <ShortcutsSettings />}
    </GlassModal>
  )
}
