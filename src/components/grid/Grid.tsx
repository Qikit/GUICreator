import type { Project, SlotData } from '@/types'
import { parseMM } from '@/utils/minimessage'
import { McText } from '@/components/shared'
import { Slot } from './Slot'
import s from '@/styles/grid.module.css'

interface Props {
  project: Project
  selSlot: string | null
  multiSel: Set<string>
  showNums: boolean
  onSlotMD: (e: React.MouseEvent, key: string) => void
  onSlotCtx: (e: React.MouseEvent, key: string) => void
  onPaint: (key: string) => void
  setHTT: (data: { data: SlotData; x: number; y: number } | null) => void
  dispatch: (action: { type: string; [k: string]: unknown }) => void
  onBgClick: () => void
}

export function Grid({
  project, selSlot, multiSel, showNums,
  onSlotMD, onSlotCtx, onPaint, setHTT, dispatch, onBgClick,
}: Props) {
  const handleDrop = (r: number, c: number, e: React.DragEvent) => {
    const from = e.dataTransfer.getData('text/plain')
    const to = `${r}-${c}`
    if (from && from !== to) dispatch({ type: 'MV', from, to })
  }

  return (
    <div
      className={s.gridArea}
      onMouseDown={e => { if ((e.target as HTMLElement).classList.contains(s.gridArea)) onBgClick() }}
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
                    onMouseDown={e => onSlotMD(e, k)}
                    onContextMenu={e => onSlotCtx(e, k)}
                    onDrop={e => handleDrop(r, c, e)}
                    onMouseEnter={e => {
                      onPaint(k)
                      if (project.slots[k]) setHTT({ data: project.slots[k], x: e.clientX, y: e.clientY })
                    }}
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
