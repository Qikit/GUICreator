import { useState } from 'react'

export function App() {
  const [mode, setMode] = useState<'editor' | 'canvas'>('editor')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--bd)',
        minHeight: 44,
      }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--tx1)' }}>
          MC Menu Designer
        </span>
        <span style={{ color: 'var(--tx3)', fontSize: 11 }}>
          v4.0
        </span>
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--tx3)',
        fontSize: 13,
      }}>
        Phase 2: Core — in progress
      </div>
    </div>
  )
}
