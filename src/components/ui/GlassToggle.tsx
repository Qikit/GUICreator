import s from './GlassToggle.module.css'

interface Props {
  checked: boolean
  onChange: (value: boolean) => void
}

export function GlassToggle({ checked, onChange }: Props) {
  return (
    <div
      className={`${s.toggle} ${checked ? s.on : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <div className={s.thumb} />
    </div>
  )
}
