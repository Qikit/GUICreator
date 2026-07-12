import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, fireEvent, cleanup, act } from '@testing-library/react'
import type { Project, Workspace } from '@/types'
import { CanvasView } from '../CanvasView'
import { useSelectionStore } from '@/store/selectionStore'

const project: Project = {
  id: 'p1', name: 'M', rows: 3, cols: 9, guiType: undefined,
  slots: {}, createdAt: 0, updatedAt: 0,
}
const workspace: Workspace = {
  id: 'w1', name: 'W', menus: [{ projectId: 'p1', x: 0, y: 0 }], connections: [],
}

const noop = () => {}

function renderCanvas() {
  return render(
    <CanvasView
      workspace={workspace}
      onUpdateWS={noop}
      projects={{ p1: project }}
      activeProjectId="p1"
      onSlotSelect={noop}
      palItem={null}
      onPlaceItem={noop}
      onRemoveItem={noop}
      onMoveSlot={noop}
      showNums={false}
      showConns={false}
      onActivateMenu={noop}
      onBrushPick={noop}
      onSlotPickup={noop}
      onResizeMenu={noop}
      onSetGuiType={noop}
      onSetEraser={noop}
      // зеркалит App.handleMultiToggle
      onMultiToggle={(_pid, key) => useSelectionStore.getState().toggleMulti(key)}
      onDeselectPalette={noop}
      onClearAll={noop}
    />,
  )
}

describe('CanvasView RMB drag-select', () => {
  beforeEach(() => { useSelectionStore.getState().clearSlotSelection() })
  afterEach(() => { cleanup(); useSelectionStore.getState().clearSlotSelection() })

  it('трейлинг contextmenu после drag-выделения не снимает последний слот', () => {
    renderCanvas()
    // Выделение как после протяжки ПКМ по трём слотам 0-0,0-1,0-2
    act(() => { useSelectionStore.getState().setMultiSel(new Set(['0-0', '0-1', '0-2'])) })

    // Браузер шлёт contextmenu на слот под курсором (точка отпускания = последний слот)
    const last = document.querySelector('[data-slot-key="0-2"][data-menu-id="p1"]')!
    fireEvent.contextMenu(last)

    expect([...useSelectionStore.getState().multiSel].sort()).toEqual(['0-0', '0-1', '0-2'])
  })
})
