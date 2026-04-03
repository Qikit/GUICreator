import { useState } from 'react'
import type { Project, SlotData } from '@/types'
import { parseMM } from '@/utils/minimessage'
import { McText } from '@/components/shared'
import { useSelectionStore } from '@/store/selectionStore'
import { Slot } from './Slot'
import s from '@/styles/grid.module.css'

interface Props {
  project: Project
  showNums: boolean
  onSlotMD: (e: React.MouseEvent, key: string) => void
  onSlotCtx: (e: React.MouseEvent, key: string) => void
  onPaint: (key: string) => void
  setHTT: (data: { data: SlotData; x: number; y: number } | null) => void
  dispatch: (action: { type: string; [k: string]: unknown }) => void
}

export function Grid({
  project, showNums,
  onSlotMD, onSlotCtx, onPaint, setHTT, dispatch,
}: Props) {
  const { selSlot, multiSel, toggleMulti, clearSlotSelection } = useSelectionStore()
  const [selectPainting, setSelectPainting] = useState(false)

  const handleDrop = (r: number, c: number, e: React.DragEvent) => {
    const from = e.dataTransfer.getData('text/plain')
    const to = `${r}-${c}`
    if (from && from !== to) dispatch({ type: 'MV', from, to })
  }

  const handleSlotMD = (e: React.MouseEvent, key: string) => {
    if (e.button === 2) {
      e.preventDefault()
      setSelectPainting(true)
      toggleMulti(key)
      return
    }
    if (e.button === 0 && e.shiftKey) {
      e.preventDefault()
      setSelectPainting(true)
      toggleMulti(key)
      return
    }
    onSlotMD(e, key)
  }

  const handleSlotEnter = (e: React.MouseEvent, key: string) => {
    onPaint(key)
    if (project.slots[key]) setHTT({ data: project.slots[key], x: e.clientX, y: e.clientY })
    if (selectPainting) toggleMulti(key)
  }

  return (
    <div
      className={s.gridArea}
      onMouseDown={e => { if ((e.target as HTMLElement).classList.contains(s.gridArea)) clearSlotSelection() }}
      onMouseUp={() => setSelectPainting(false)}
      onMouseLeave={() => setSelectPainting(false)}
      onContextMenu={e => e.preventDefault()}
    >
      <div className={s.gridWrap}>
        <div className={s.invFrame}>
          <div className={s.invTitle}>
            <McText segs={parseMM(project.name)} />
          </div>
          <div className={s.invGrid}>
            {Array.from({ length: project.rows }, (_, r) =>
              Array.from({ length: 9 }, (_, c) => {
                const k = `${r}-${c}`
                return (
                  <Slot
                    key={k}
                    row={r}
                    col={c}
                    data={project.slots[k]}
                    selected={selSlot === k}
                    multiSel={multiSel.has(k)}
                    showNums={showNums}
                    onMouseDown={e => handleSlotMD(e, k)}
                    onContextMenu={e => e.preventDefault()}
                    onDrop={e => handleDrop(r, c, e)}
                    onMouseEnter={e => handleSlotEnter(e, k)}
                    onMouseLeave={() => setHTT(null)}
                    onDragEnd={key => {
                      if (project.slots[key]) dispatch({ type: 'RS', key })
                    }}
                  />
                )
              }),
            )}
          </div>
        </div>
      </div>
      {multiSel.size > 1 && (
        <div className={s.selBanner}>{multiSel.size} selected</div>
      )}
    </div>
  )
}
