import { useState, useEffect, useRef, useCallback } from 'react'
import type { SlotData, SlotPreset, Workspace, Project } from '@/types'
import { useProjectStore } from '@/store/projectStore'
import { usePrefsStore } from '@/store/prefsStore'
import { ITEM_DB } from '@/data/items'
import { BUILT_TPLS } from '@/data/templates'
import { saveProject, loadProject, loadProjectList, deleteProject, loadPrefs, savePrefs, saveWorkspace, loadWorkspace, loadWorkspaceList, newWorkspace } from '@/storage'
import { loadLocale, loadFunItems, loadResourcepackIndex } from '@/loaders'
import { defSlot, makeSlot, newProject, ERASER_ID, itemName } from '@/utils/slot'
import { parseMM } from '@/utils/minimessage'
import { Grid } from '@/components/grid'
import { Palette } from '@/components/palette'
import { ItemEditor } from '@/components/editor'
import { HoverTooltip, CtxMenu } from '@/components/shared'
import type { CtxMenuItem } from '@/components/shared'
import { ExportModal, GradientModal, ColorPickerModal, TemplateModal, ProjectModal } from '@/components/modals'
import { CanvasView } from '@/components/canvas'
import tb from '@/styles/toolbar.module.css'
import ss from '@/styles/shared.module.css'

export function App() {
  const { present: proj, past, future, dispatch, undo, redo, setName, loadProject: loadProj } = useProjectStore()
  const { showNums, showRP, toggleNums, toggleRP } = usePrefsStore()

  const [selSlot, setSelSlot] = useState<string | null>(null)
  const [multiSel, setMultiSel] = useState<Set<string>>(new Set())
  const [palItem, setPalItem] = useState<string | null>(null)
  const [palPreset, setPalPreset] = useState<SlotPreset | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [showGrad, setShowGrad] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showTpls, setShowTpls] = useState(false)
  const [showProjs, setShowProjs] = useState(false)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; items: CtxMenuItem[] } | null>(null)
  const [htt, setHTT] = useState<{ data: SlotData; x: number; y: number } | null>(null)
  const [saveStatus, setSaveStatus] = useState('Saved')
  const [recent, setRecent] = useState<string[]>([])
  const [clipboard, setClipboard] = useState<{ multi: boolean; data: Record<string, SlotData> | SlotData; keys?: string[] } | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [mode, setMode] = useState<'editor' | 'canvas'>('editor')
  const [activeWS, setActiveWS] = useState<Workspace | null>(null)
  const [projectCache, setProjectCache] = useState<Record<string, Project>>({})
  const refreshCache = (ws: Workspace) => { const c: Record<string, Project> = {}; for (const m of ws.menus) { const p = loadProject(m.projectId); if (p) c[m.projectId] = p }; setProjectCache(c) }
  const openCanvas = (ws: Workspace) => { setActiveWS(ws); refreshCache(ws); setMode('canvas') }
  const updateWS = (ws: Workspace) => { setActiveWS(ws); saveWorkspace(ws); refreshCache(ws) }
  const editMenuFromCanvas = (pid: string) => { const p = loadProject(pid); if (p) { saveProject(proj); loadProj(p); setSelSlot(null); setMultiSel(new Set()); setMode('editor') } }
  const [, forceRender] = useState(0)

  const lastClick = useRef<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  const painting = useRef(false)
  const rmbDown = useRef(false)
  const rmbDragged = useRef(false)
  const rmbWasDragged = useRef(false)
  const rmbStart = useRef<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Init loaders
  useEffect(() => {
    loadLocale().then(n => { if (n) forceRender(x => x + 1) })
    loadResourcepackIndex().then(() => {
      loadFunItems(ITEM_DB).then(() => forceRender(x => x + 1))
    })
  }, [])

  // Auto-save
  useEffect(() => {
    setSaveStatus('...')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveProject(proj)
      savePrefs({ ...loadPrefs(), lastOpenProject: proj.id })
      setSaveStatus('Saved')
    }, 1000)
    return () => clearTimeout(saveTimer.current)
  }, [proj])

  // Hover tooltip follow
  useEffect(() => {
    const h = (e: MouseEvent) => { if (htt) setHTT(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null) }
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [htt])

  // Mouse up
  useEffect(() => {
    const h = () => { painting.current = false; rmbWasDragged.current = rmbDragged.current; rmbDown.current = false; rmbDragged.current = false; rmbStart.current = null }
    window.addEventListener('mouseup', h)
    return () => window.removeEventListener('mouseup', h)
  }, [])

  useEffect(() => { if (mode === 'canvas' && activeWS) { saveProject(proj); refreshCache(activeWS) } }, [mode])

  // Burger close
  useEffect(() => {
    if (!showMenu) return
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showMenu])

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo() }
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo() }
      if (e.ctrlKey && e.key === 'e') { e.preventDefault(); setShowExport(true) }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveProject(proj); setSaveStatus('Saved') }
      if (e.key === 'Escape') { setSelSlot(null); setMultiSel(new Set()); setCtxMenu(null); setShowExport(false); setShowTpls(false); setShowProjs(false); setPalItem(null); setPalPreset(null) }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (multiSel.size > 0) { e.preventDefault(); dispatch({ type: 'RM', keys: [...multiSel] }); setMultiSel(new Set()); setSelSlot(null) }
        else if (selSlot && proj.slots[selSlot]) { e.preventDefault(); dispatch({ type: 'RS', key: selSlot }) }
      }
      if (e.ctrlKey && e.key === 'a') { e.preventDefault(); const all = new Set<string>(); for (let r = 0; r < proj.rows; r++) for (let c = 0; c < 9; c++) all.add(`${r}-${c}`); setMultiSel(all) }
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault()
        if (selSlot && proj.slots[selSlot]) {
          const [r, c] = selSlot.split('-').map(Number)
          for (let nc = c + 1; nc < 9; nc++) {
            const nk = `${r}-${nc}`
            if (!proj.slots[nk]) { dispatch({ type: 'SS', key: nk, data: JSON.parse(JSON.stringify(proj.slots[selSlot])) }); setSelSlot(nk); break }
          }
        }
      }
      // Copy
      if (e.ctrlKey && e.key === 'c') {
        if (multiSel.size > 0) {
          e.preventDefault(); const d: Record<string, SlotData> = {}
          for (const k of multiSel) if (proj.slots[k]) d[k] = JSON.parse(JSON.stringify(proj.slots[k]))
          setClipboard({ multi: true, data: d, keys: [...multiSel] })
        } else if (selSlot && proj.slots[selSlot]) {
          e.preventDefault(); setClipboard({ multi: false, data: JSON.parse(JSON.stringify(proj.slots[selSlot])) })
        }
      }
      // Paste
      if (e.ctrlKey && e.key === 'v' && clipboard && selSlot) {
        e.preventDefault()
        if (clipboard.multi && clipboard.keys) {
          const keys = clipboard.keys; if (!keys.length) return
          const [br, bc] = keys[0].split('-').map(Number); const [sr, sc] = selSlot.split('-').map(Number)
          const dr = sr - br, dc = sc - bc; const slots: Record<string, SlotData> = {}
          for (const k of keys) {
            const d = (clipboard.data as Record<string, SlotData>)[k]; if (!d) continue
            const [r, c] = k.split('-').map(Number); const nk = `${r + dr}-${c + dc}`
            if (r + dr >= 0 && r + dr < proj.rows && c + dc >= 0 && c + dc < 9) slots[nk] = JSON.parse(JSON.stringify(d))
          }
          dispatch({ type: 'SM', slots })
        } else { dispatch({ type: 'SS', key: selSlot, data: JSON.parse(JSON.stringify(clipboard.data)) }) }
      }
      // Arrow keys
      if (selSlot && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); const [r, c] = selSlot.split('-').map(Number)
        let nr = r, nc = c
        if (e.key === 'ArrowUp') nr = Math.max(0, r - 1)
        if (e.key === 'ArrowDown') nr = Math.min(proj.rows - 1, r + 1)
        if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1)
        if (e.key === 'ArrowRight') nc = Math.min(8, c + 1)
        const nk = `${nr}-${nc}`
        if (e.shiftKey) setMultiSel(prev => { const n = new Set(prev); n.add(nk); return n })
        else setMultiSel(new Set())
        setSelSlot(nk)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [selSlot, proj, clipboard, multiSel, undo, redo, dispatch])

  const onSlotMD = (e: React.MouseEvent, key: string) => {
    if (e.button === 1) {
      e.preventDefault()
      const d = proj.slots[key]
      if (d) {
        setPalItem(d.itemId)
        setPalPreset({ displayName: JSON.parse(JSON.stringify(d.displayName)), lore: JSON.parse(JSON.stringify(d.lore)), enchanted: d.enchanted, amount: d.amount, customModelData: d.customModelData, potionColor: d.potionColor, skullTexture: d.skullTexture, rpTexture: d.rpTexture })
        setRecent(prev => [d.itemId, ...prev.filter(x => x !== d.itemId)].slice(0, 8))
      } else { setPalItem(null); setPalPreset(null) }
      return
    }
    if (e.button === 2) {
      rmbDown.current = true; rmbDragged.current = false; rmbStart.current = key; lastClick.current = key
      if (!palItem) { setMultiSel(prev => { const n = new Set(prev); n.add(key); return n }); setSelSlot(key) }
      return
    }
    if (e.button !== 0) return
    setHTT(null)
    // Eraser
    if (palItem === ERASER_ID) {
      if (multiSel.size > 0) { const ks = [...multiSel]; if (!ks.includes(key)) ks.push(key); dispatch({ type: 'RM', keys: ks.filter(k => proj.slots[k]) }); setMultiSel(new Set()); setSelSlot(null) }
      else if (proj.slots[key]) dispatch({ type: 'RS', key })
      lastClick.current = key; return
    }
    // Alt+Click = brush
    if (e.altKey && palItem && palItem !== ERASER_ID) {
      e.preventDefault(); painting.current = true
      dispatch({ type: 'SS', key, data: makeSlot(palItem, palPreset) })
      setRecent(prev => [palItem, ...prev.filter(x => x !== palItem)].slice(0, 8)); return
    }
    if (e.altKey && palItem === ERASER_ID) {
      e.preventDefault(); painting.current = true
      if (proj.slots[key]) dispatch({ type: 'RS', key }); return
    }
    // Ctrl+Click = toggle multisel
    if (e.ctrlKey) {
      setMultiSel(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n })
      setSelSlot(key); lastClick.current = key
      if (palItem && !multiSel.has(key)) { dispatch({ type: 'SS', key, data: makeSlot(palItem, palPreset) }); setRecent(prev => [palItem, ...prev.filter(x => x !== palItem)].slice(0, 8)) }
      return
    }
    // Shift+Click = range select
    if (e.shiftKey && lastClick.current) {
      const [r1, c1] = lastClick.current.split('-').map(Number); const [r2, c2] = key.split('-').map(Number)
      const n = new Set(multiSel)
      for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) n.add(`${r}-${c}`)
      setMultiSel(n); setSelSlot(key); return
    }
    // Normal click
    if (palItem) {
      if (multiSel.size > 1) {
        const slots: Record<string, SlotData> = {}; for (const k of multiSel) slots[k] = makeSlot(palItem, palPreset); slots[key] = makeSlot(palItem, palPreset)
        dispatch({ type: 'SM', slots }); setRecent(prev => [palItem, ...prev.filter(x => x !== palItem)].slice(0, 8))
        setMultiSel(new Set()); setSelSlot(key)
      } else {
        dispatch({ type: 'SS', key, data: makeSlot(palItem, palPreset) })
        setRecent(prev => [palItem, ...prev.filter(x => x !== palItem)].slice(0, 8))
        setSelSlot(key); setMultiSel(new Set())
      }
    } else { setSelSlot(key === selSlot ? null : key); setMultiSel(new Set()) }
    lastClick.current = key
  }

  const onSlotCtx = (e: React.MouseEvent, key: string) => {
    e.preventDefault()
    if (rmbDragged.current || rmbWasDragged.current) { rmbDown.current = false; rmbDragged.current = false; rmbStart.current = null; rmbWasDragged.current = false; return }
    rmbWasDragged.current = false; rmbDown.current = false; rmbStart.current = null
    setHTT(null)
    const items: CtxMenuItem[] = []
    if (proj.slots[key]) {
      items.push({ label: 'Редактировать', fn: () => { setSelSlot(key); setMultiSel(new Set()) } })
      items.push({ label: 'Копировать', fn: () => setClipboard({ multi: false, data: JSON.parse(JSON.stringify(proj.slots[key])) }) })
    }
    if (proj.slots[key]) { items.push({ sep: true }); items.push({ label: 'Удалить', danger: true, fn: () => { dispatch({ type: 'RS', key }); if (selSlot === key) setSelSlot(null) } }) }
    if (items.length) setCtxMenu({ x: e.clientX, y: e.clientY, items })
  }

  const onPaint = (key: string) => {
    if (painting.current && palItem) {
      if (palItem === ERASER_ID) { if (proj.slots[key]) dispatch({ type: 'RS', key }) }
      else dispatch({ type: 'SS', key, data: makeSlot(palItem, palPreset) })
      return
    }
    if (rmbDown.current && key !== rmbStart.current) {
      rmbDragged.current = true
      if (palItem === ERASER_ID) { if (proj.slots[key]) dispatch({ type: 'RS', key }) }
      else if (palItem) { dispatch({ type: 'SS', key, data: makeSlot(palItem, palPreset) }) }
      else { setMultiSel(prev => { const n = new Set(prev); n.add(key); return n }); setSelSlot(key) }
    }
  }

  const handlePalSelect = (id: string, preset?: SlotPreset) => {
    if (id === palItem && !preset) { setPalItem(null); setPalPreset(null) }
    else { setPalItem(id); setPalPreset(preset || null) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className={tb.toolbar}>
        <div className={tb.group}>
          <input className={tb.projName} value={proj.name} onChange={e => setName(e.target.value)} />
        </div>
        <div className={tb.sep} />
        <div className={tb.group}>
          <label className={tb.label}>Ряды</label>
          <select value={proj.rows} onChange={e => { const nr = parseInt(e.target.value); dispatch({ type: 'SR', rows: nr }) }} style={{ fontSize: 12 }}>
            {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className={tb.sep} />
        <div className={tb.group}>
          <button className={ss.btn} onClick={undo} disabled={!past.length} title="Ctrl+Z">↩</button>
          <button className={ss.btn} onClick={redo} disabled={!future.length} title="Ctrl+Y">↪</button>
        </div>
        <div className={tb.sep} />
        <div className={tb.group}>
          <button className={ss.btn} onClick={toggleNums} style={showNums ? { background: 'var(--ac)', color: '#0f0f11', borderColor: 'var(--ac)' } : {}} title="Номера слотов">#</button>
          <button className={ss.btn} onClick={toggleRP} style={showRP ? { background: 'var(--ok)', color: '#0f0f11', borderColor: 'var(--ok)' } : { opacity: .5 }} title="Ресурспак">RP</button>
          <button className={`${ss.btn} ${ss.btnDanger}`} onClick={() => { if (confirm('Очистить всё?')) { dispatch({ type: 'CA' }); setSelSlot(null); setMultiSel(new Set()) } }}>Очистить</button>
        </div>
        <div className={tb.spacer} />
        <div className={tb.group}>
          <button className={ss.btn} onClick={() => setShowGrad(true)} style={{ borderImage: 'linear-gradient(90deg,var(--ac),#22d3ee) 1', borderWidth: 1, borderStyle: 'solid' }}>Градиент</button>
          <button className={ss.btn} onClick={() => setShowColorPicker(true)}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'linear-gradient(135deg,#ff0000,#00ff00,#0000ff)', marginRight: 3 }} />Цвета
          </button>
          <button className={`${ss.btn} ${ss.btnPrimary}`} onClick={() => setShowExport(true)}>Экспорт</button>
          <div className={tb.sep} />
          {mode === 'editor' ? (
            <button className={ss.btn} onClick={() => { const wl = loadWorkspaceList(); if (wl.length) { const ws = loadWorkspace(wl[wl.length - 1]); if (ws) { openCanvas(ws); return } }; const ws = newWorkspace(); saveWorkspace(ws); openCanvas(ws) }} style={{ borderColor: 'var(--ac)' }}>Canvas</button>
          ) : (
            <button className={ss.btn} onClick={() => setMode('editor')} style={{ borderColor: 'var(--ac)' }}>← Редактор</button>
          )}
          <div className={tb.burger} ref={menuRef}>
            <button className={ss.btn} onClick={() => setShowMenu(!showMenu)}>☰</button>
            {showMenu && (
              <div className={tb.burgerDd}>
                <button className={ss.btn} onClick={() => { setShowMenu(false); setShowTpls(true) }}>Шаблоны</button>
                <button className={ss.btn} onClick={() => { setShowMenu(false); const np = newProject(); saveProject(proj); loadProj(np); setSelSlot(null); setMultiSel(new Set()) }}>Новый проект</button>
                <button className={ss.btn} onClick={() => { setShowMenu(false); setShowProjs(true) }}>Открыть проект</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mode === 'editor' ? (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Palette itemDB={ITEM_DB} selItem={palItem} onSelect={handlePalSelect} recent={recent} />
          <Grid
            project={proj} selSlot={selSlot} multiSel={multiSel} showNums={showNums} showRP={showRP}
            onSlotMD={onSlotMD} onSlotCtx={onSlotCtx} onPaint={onPaint} setHTT={setHTT}
            dispatch={dispatch as never} onBgClick={() => { setPalItem(null); setPalPreset(null); setSelSlot(null); setMultiSel(new Set()) }}
          />
          <ItemEditor data={selSlot ? proj.slots[selSlot] : null} slotKey={selSlot} dispatch={dispatch as never} />
        </div>
      ) : activeWS && (
        <CanvasView workspace={activeWS} onUpdateWS={updateWS} onEditMenu={editMenuFromCanvas} projects={projectCache} />
      )}

      {mode === 'editor' && <div className={tb.statusBar}>
        <span>{selSlot ? `Slot ${selSlot} (#${parseInt(selSlot.split('-')[0]) * 9 + parseInt(selSlot.split('-')[1])})` : multiSel.size > 1 ? `${multiSel.size} selected` : ''}</span>
        <span>{palItem && palItem !== ERASER_ID ? `Размещение: ${itemName(palItem)}` : ''}</span>
        <span>{proj.rows}x9 · {Object.keys(proj.slots).length} предм. · {saveStatus}</span>
      </div>}

      {htt && <HoverTooltip data={htt.data} x={htt.x} y={htt.y} />}
      {showExport && <ExportModal project={proj} onClose={() => setShowExport(false)} />}
      {showGrad && <GradientModal onClose={() => setShowGrad(false)} onApply={selSlot && proj.slots[selSlot] ? (segs) => dispatch({ type: 'SS', key: selSlot, data: { ...proj.slots[selSlot], displayName: segs } }) : null} />}
      {showColorPicker && <ColorPickerModal onClose={() => setShowColorPicker(false)} />}
      {showTpls && <TemplateModal builtIn={BUILT_TPLS as never} userTemplates={[]} onApply={(t: any) => { const np = newProject(t.name || proj.name, t.rows); np.slots = JSON.parse(JSON.stringify(t.slots || {})); loadProj(np); setSelSlot(null); setMultiSel(new Set()); setShowTpls(false) }} onDeleteUser={() => {}} onClose={() => setShowTpls(false)} />}
      {showProjs && <ProjectModal list={loadProjectList()} onOpen={p => { loadProj(p); setSelSlot(null); setMultiSel(new Set()); setShowProjs(false) }} onDelete={id => { deleteProject(id); setShowProjs(false) }} onClose={() => setShowProjs(false)} />}
      {ctxMenu && <CtxMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={() => setCtxMenu(null)} />}
    </div>
  )
}
