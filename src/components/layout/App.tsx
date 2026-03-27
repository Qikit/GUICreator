import { useState, useEffect, useRef, useCallback } from 'react'
import type { SlotData, SlotPreset, Workspace, Project } from '@/types'
import { useProjectStore } from '@/store/projectStore'
import { usePrefsStore } from '@/store/prefsStore'
import { ITEM_DB } from '@/data/items'
import { BUILT_TPLS } from '@/data/templates'
import { saveProject, loadProject, loadProjectList, deleteProject, loadPrefs, savePrefs, saveWorkspace, loadWorkspace, loadWorkspaceList, newWorkspace, saveUserTemplates } from '@/storage'
import { loadLocale, loadFunItems, loadResourcepackIndex } from '@/loaders'
import { makeSlot, newProject, ERASER_ID } from '@/utils/slot'
import { parseMM } from '@/utils/minimessage'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Grid } from '@/components/grid'
import { Palette } from '@/components/palette'
import { ItemEditor } from '@/components/editor'
import { HoverTooltip, CtxMenu } from '@/components/shared'
import type { CtxMenuItem } from '@/components/shared'
import { ExportModal, GradientModal, ColorPickerModal, TemplateModal, ProjectModal } from '@/components/modals'
import { CanvasView } from '@/components/canvas'
import { DockLayout } from './DockLayout'
import { StatusBar } from './StatusBar'
import { GlowButton } from '@/components/ui'
import { AmbientBackground } from './AmbientBackground'
import tb from '@/styles/toolbar.module.css'

export function App() {
  const { present: proj, past, future, dispatch, undo, redo, setName, loadProject: loadProj } = useProjectStore()
  const { showNums, showRP, toggleNums, toggleRP, animations, toggleAnimations } = usePrefsStore()

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
  const [uTpls, setUTpls] = useState<unknown[]>([])
  const saveTpl = (t: unknown) => { const upd = [...uTpls, t]; setUTpls(upd); saveUserTemplates(upd) }
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

  // Save on close
  useEffect(() => { const h = () => saveProject(proj); window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h) }, [proj])

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

  useKeyboardShortcuts({
    selSlot, setSelSlot, multiSel, setMultiSel, proj, clipboard, setClipboard,
    dispatch: dispatch as never, undo, redo, saveProject, setSaveStatus,
    setShowExport, setShowTpls, setShowProjs, setPalItem, setPalPreset: setPalPreset as (v: unknown) => void, setCtxMenu: () => setCtxMenu(null),
  })

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 1 }}>
      <AmbientBackground />
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
          <GlowButton onClick={undo} disabled={!past.length} title="Ctrl+Z">↩</GlowButton>
          <GlowButton onClick={redo} disabled={!future.length} title="Ctrl+Y">↪</GlowButton>
        </div>
        <div className={tb.sep} />
        <div className={tb.group}>
          <GlowButton onClick={toggleNums} variant={showNums ? 'primary' : 'ghost'} title="Номера слотов">#</GlowButton>
          <GlowButton onClick={toggleRP} variant={showRP ? 'primary' : 'ghost'} title="Ресурспак">RP</GlowButton>
          <GlowButton onClick={toggleAnimations} variant={animations ? 'primary' : 'ghost'} title="Анимации">✦</GlowButton>
          <GlowButton variant="danger" onClick={() => { if (confirm('Очистить всё?')) { dispatch({ type: 'CA' }); setSelSlot(null); setMultiSel(new Set()) } }}>Очистить</GlowButton>
        </div>
        <div className={tb.spacer} />
        <div className={tb.group}>
          <GlowButton onClick={() => setShowGrad(true)}>Градиент</GlowButton>
          <GlowButton onClick={() => setShowColorPicker(true)}>Цвета</GlowButton>
          <GlowButton variant="primary" onClick={() => setShowExport(true)}>Экспорт</GlowButton>
          <div className={tb.sep} />
          {mode === 'editor' ? (
            <GlowButton onClick={() => { const wl = loadWorkspaceList(); if (wl.length) { const ws = loadWorkspace(wl[wl.length - 1]); if (ws) { openCanvas(ws); return } }; const ws = newWorkspace(); saveWorkspace(ws); openCanvas(ws) }}>Canvas</GlowButton>
          ) : (
            <GlowButton onClick={() => setMode('editor')}>← Редактор</GlowButton>
          )}
          <div className={tb.burger} ref={menuRef}>
            <GlowButton onClick={() => setShowMenu(!showMenu)}>☰</GlowButton>
            {showMenu && (
              <div className={tb.burgerDd}>
                <button onClick={() => { setShowMenu(false); setShowTpls(true) }}>Шаблоны</button>
                <button onClick={() => { setShowMenu(false); if (!palItem || palItem === ERASER_ID) { alert('Сначала выберите предмет'); return }; dispatch({ type: 'FE', data: makeSlot(palItem, palPreset) }) }}>Залить пустые</button>
                <button onClick={() => { setShowMenu(false); const name = prompt('Название шаблона:', proj.name); if (!name) return; const desc = prompt('Описание:', ''); saveTpl({ name, desc: desc || '', rows: proj.rows, slots: JSON.parse(JSON.stringify(proj.slots)) }) }}>Сохранить шаблон</button>
                <div style={{ height: 1, background: 'var(--glass-border)', margin: '2px 0' }} />
                <button onClick={() => { setShowMenu(false); const np = newProject(); saveProject(proj); loadProj(np); setSelSlot(null); setMultiSel(new Set()) }}>Новый проект</button>
                <button onClick={() => { setShowMenu(false); setShowProjs(true) }}>Открыть проект</button>
                <div style={{ height: 1, background: 'var(--glass-border)', margin: '2px 0' }} />
                <button onClick={() => { setShowMenu(false); const all = loadProjectList().map(id => loadProject(id)).filter(Boolean); const d = { projects: all, templates: uTpls }; const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'mc-menu-backup.json'; a.click(); URL.revokeObjectURL(url) }}>Бэкап</button>
                <button onClick={() => { setShowMenu(false); const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json'; inp.onchange = (ev: Event) => { const f = (ev.target as HTMLInputElement).files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = (re) => { try { const d = JSON.parse(re.target?.result as string); if (d.projects) { for (const p of d.projects) saveProject(p); const last = d.projects[d.projects.length - 1]; if (last) { loadProj(last); setSelSlot(null); setMultiSel(new Set()) } } } catch (err) { alert('Ошибка: ' + (err as Error).message) } }; reader.readAsText(f) }; inp.click() }}>Импорт</button>
                <div style={{ height: 1, background: 'var(--glass-border)', margin: '2px 0' }} />
                <button onClick={() => { setShowMenu(false); const ws = newWorkspace(); saveWorkspace(ws); openCanvas(ws) }}>Новый workspace</button>
                {loadWorkspaceList().map(id => { const ws = loadWorkspace(id); return ws ? <button key={id} onClick={() => { setShowMenu(false); openCanvas(ws) }}>{'\uD83D\uDDFA ' + ws.name}</button> : null })}
              </div>
            )}
          </div>
        </div>
      </div>

      {mode === 'editor' ? (
        <DockLayout panels={[
          { id: 'palette', title: 'Предметы', content: (
            <Palette itemDB={ITEM_DB} selItem={palItem} onSelect={handlePalSelect} recent={recent} />
          )},
          { id: 'grid', title: proj.name, content: (
            <Grid
              project={proj} selSlot={selSlot} multiSel={multiSel} showNums={showNums} showRP={showRP}
              onSlotMD={onSlotMD} onSlotCtx={onSlotCtx} onPaint={onPaint} setHTT={setHTT}
              dispatch={dispatch as never} onBgClick={() => { setPalItem(null); setPalPreset(null); setSelSlot(null); setMultiSel(new Set()) }}
            />
          )},
          { id: 'editor', title: 'Редактор', content: (
            <ItemEditor data={selSlot ? proj.slots[selSlot] : null} slotKey={selSlot} dispatch={dispatch as never} />
          )},
        ]} />
      ) : activeWS && (
        <CanvasView workspace={activeWS} onUpdateWS={updateWS} onEditMenu={editMenuFromCanvas} projects={projectCache} />
      )}

      {mode === 'editor' && (
        <StatusBar selSlot={selSlot} multiSel={multiSel} palItem={palItem} rows={proj.rows} slotCount={Object.keys(proj.slots).length} saveStatus={saveStatus} />
      )}

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
