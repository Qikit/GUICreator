import s from './GlassTabs.module.css'

interface Tab {
  key: string
  label: string
}

interface Props {
  tabs: Tab[]
  active: string
  onChange: (key: string) => void
}

export function GlassTabs({ tabs, active, onChange }: Props) {
  return (
    <div className={s.tabs}>
      {tabs.map(t => (
        <button
          key={t.key}
          className={`${s.tab} ${active === t.key ? s.active : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
