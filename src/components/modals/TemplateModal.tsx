import { GlassModal, GlowButton, glassModalStyles } from '@/components/ui'

interface Template {
  name: string
  desc?: string
  rows: number
  slots: Record<string, unknown>
}

interface Props {
  builtIn: Template[]
  userTemplates: Template[]
  onApply: (t: Template) => void
  onDeleteUser: (i: number) => void
  onClose: () => void
}

export function TemplateModal({ builtIn, userTemplates, onApply, onDeleteUser, onClose }: Props) {
  return (
    <GlassModal onClose={onClose} title="Шаблоны">
      <div style={{ fontSize: 10, color: 'var(--tx3)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase' }}>Встроенные</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
        {builtIn.map((t, i) => (
          <div key={i} style={{ background: 'var(--srf)', border: '1px solid var(--bd)', borderRadius: 5, padding: 12, cursor: 'pointer', transition: 'border-color .15s' }}
            onClick={() => onApply(t)}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--ac)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bd)')}>
            <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 12 }}>{t.name}</div>
            {t.desc && <div style={{ fontSize: 10, color: 'var(--tx2)', marginBottom: 4 }}>{t.desc}</div>}
            <div style={{ fontSize: 9, color: 'var(--tx3)' }}>{t.rows}x9</div>
          </div>
        ))}
      </div>
      {userTemplates.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 12, marginBottom: 5, fontWeight: 600, textTransform: 'uppercase' }}>Мои шаблоны</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
            {userTemplates.map((t, i) => (
              <div key={i} style={{ background: 'var(--srf)', border: '1px solid var(--bd)', borderRadius: 5, padding: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 12 }}>{t.name}</div>
                <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                  <GlowButton variant="primary" style={{ padding: '2px 6px' }} onClick={() => onApply(t)}>Use</GlowButton>
                  <GlowButton variant="danger" style={{ padding: '2px 6px' }} onClick={e => { e.stopPropagation(); onDeleteUser(i) }}>Del</GlowButton>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className={glassModalStyles.actions}>
        <GlowButton onClick={onClose}>Отмена</GlowButton>
      </div>
    </GlassModal>
  )
}
