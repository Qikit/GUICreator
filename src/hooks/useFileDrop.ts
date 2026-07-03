import { useState, useEffect } from 'react'

export function useFileDrop(onFile: (text: string) => void): { isDragging: boolean } {
  const [isDragging, setIsDragging] = useState(false)
  useEffect(() => {
    let depth = 0
    const over = (e: DragEvent) => {
      if (!e.dataTransfer?.types?.includes('Files')) return
      e.preventDefault(); depth++; setIsDragging(true)
    }
    const leave = () => { depth = Math.max(0, depth - 1); if (depth === 0) setIsDragging(false) }
    const drop = (e: DragEvent) => {
      e.preventDefault(); depth = 0; setIsDragging(false)
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      const f = e.dataTransfer?.files?.[0]; if (!f) return
      const r = new FileReader(); r.onload = () => onFile(String(r.result)); r.readAsText(f)
    }
    window.addEventListener('dragover', over)
    window.addEventListener('dragleave', leave)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragover', over)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('drop', drop)
    }
  }, [onFile])
  return { isDragging }
}
