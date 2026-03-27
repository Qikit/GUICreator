import { useState, useEffect, useRef, useCallback } from 'react'
import type { SlotData, SlotPreset, Workspace, Project } from '@/types'
import { useProjectStore } from '@/store/projectStore'
import { usePrefsStore } from '@/store/prefsStore'
import { ITEM_DB } from '@/data/items'
import { BUILT_TPLS } from '@/data/templates'
import { saveProject, loadProject, loadProjectList, deleteProject, loadPrefs, savePrefs, saveWorkspace, loadWorkspace, loadWorkspaceList, newWorkspace, saveUserTemplates, deleteWorkspace } from '@/storage'
import { loadLocale, loadFunItems, loadResourcepackIndex } from '@/loaders'
import { makeSlot, newProject, ERASER_ID } from '@/utils/slot'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Palette } from '@/components/palette'
import { ItemEditor } from '@/components/editor'
import { HoverTooltip, CtxMenu } from '@/components/shared'
import type { CtxMenuItem } from '@/components/shared'
import { ExportModal, GradientModal, ColorPickerModal, TemplateModal, ProjectModal } from '@/components/modals'
import { CanvasView } from '@/components/canvas'
import { DockLayout } from './DockLayout'
import { StatusBar } from './StatusBar'
import { GlowButton, GlassModal, glassModalStyles } from '@/components/ui'
import { parseFunMenu, parseAbstractMenus } from '@/utils/importMenu'
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
  const [showWorkspaces, setShowWorkspaces] = useState(false)
  const [uTpls, setUTpls] = useState<unknown[]>([])
  const saveTpl = (t: unknown) => { const upd = [...uTpls, t]; setUTpls(upd); saveUserTemplates(upd) }
  const [activeWS, setActiveWS] = useState<Workspace | null>(null)
  const [projectCache, setProjectCache] = useState<Record<string, Project>>({})
  const removedFromCanvas = useRef<Set<string>>(new Set())

  const refreshCache = useCallback((ws: Workspace) => {
    const c: Record<string, Project> = {}
    for (const m of ws.menus) { const p = loadProject(m.projectId); if (p) c[m.projectId] = p }
    setProjectCache(c)
  }, [])

  const updateWS = useCallback((ws: Workspace) => { setActiveWS(ws); saveWorkspace(ws); refreshCache(ws) }, [refreshCache])

  const [, forceRender] = useState(0)

  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  const menuRef = useRef<HTMLDivElement>(null)

  // Init loaders + auto-init workspace
  useEffect(() => {
    loadLocale().then(n => { if (n) forceRender(x => x + 1) })
    loadResourcepackIndex().then(() => {
      loadFunItems(ITEM_DB).then(() => forceRender(x => x + 1))
    })

    const wl = loadWorkspaceList()
    let ws: Workspace | null = null
    if (wl.length) ws = loadWorkspace(wl[wl.length - 1])
    if (!ws) { ws = newWorkspace(); saveWorkspace(ws) }
    setActiveWS(ws)
    refreshCache(ws)
  }, [])

  // Auto-add current project to workspace
  useEffect(() => {
    if (!activeWS) return
    const alreadyInWS = activeWS.menus.find(m => m.projectId === proj.id)
    if (!alreadyInWS && !removedFromCanvas.current.has(proj.id)) {
      const updated = { ...activeWS, menus: [...activeWS.menus, { projectId: proj.id, x: 100 + activeWS.menus.length * 250, y: 100 }] }
      updateWS(updated)
    } else {
      setProjectCache(prev => ({ ...prev, [proj.id]: proj }))
    }
  }, [proj.id, proj, activeWS])

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

  const handlePalSelect = (id: string, preset?: SlotPreset) => {
    if (id === palItem && !preset) { setPalItem(null); setPalPreset(null) }
    else { setPalItem(id); setPalPreset(preset || null) }
  }

  const switchToProject = (pid: string) => {
    if (pid === proj.id) return
    saveProject(proj)
    const p = loadProject(pid)
    if (p) { loadProj(p); setSelSlot(null); setMultiSel(new Set()) }
  }

  const handleSlotSelect = (pid: string, key: string) => {
    if (pid !== proj.id) {
      saveProject(proj)
      const p = loadProject(pid)
      if (p) { loadProj(p) }
    }
    setSelSlot(key); setMultiSel(new Set())
  }

  const handlePlaceItem = (pid: string, key: string) => {
    if (pid !== proj.id) {
      saveProject(proj)
      const p = loadProject(pid)
      if (p) { loadProj(p) }
    }
    if (palItem === ERASER_ID) {
      dispatch({ type: 'RS', key })
    } else if (palItem) {
      dispatch({ type: 'SS', key, data: makeSlot(palItem, palPreset) })
      setRecent(prev => [palItem!, ...prev.filter(x => x !== palItem)].slice(0, 8))
    }
    setSelSlot(key); setMultiSel(new Set())
  }

  const handleRemoveItem = (pid: string, key: string) => {
    if (pid !== proj.id) {
      saveProject(proj)
      const p = loadProject(pid)
      if (p) { loadProj(p) }
    }
    dispatch({ type: 'RS', key })
    if (selSlot === key) setSelSlot(null)
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
          <GlowButton onClick={undo} disabled={!past.length} title="Ctrl+Z">↩</GlowButton>
          <GlowButton onClick={redo} disabled={!future.length} title="Ctrl+Y">↪</GlowButton>
        </div>
        <div className={tb.sep} />
        <div className={tb.group}>
          <GlowButton onClick={toggleNums} variant={showNums ? 'primary' : 'ghost'} title="Номера слотов">#</GlowButton>
          <GlowButton onClick={toggleRP} variant={showRP ? 'primary' : 'ghost'} title="Ресурспак">RP</GlowButton>
          <GlowButton onClick={toggleAnimations} variant={animations ? 'primary' : 'ghost'} title="Анимации">✦</GlowButton>
        </div>
        <div className={tb.spacer} />
        <div className={tb.group}>
          <GlowButton onClick={() => setShowGrad(true)}>Градиент</GlowButton>
          <GlowButton onClick={() => setShowColorPicker(true)}>Цвета</GlowButton>
          <GlowButton variant="primary" onClick={() => setShowExport(true)}>Экспорт</GlowButton>
          <div className={tb.burger} ref={menuRef}>
            <GlowButton onClick={() => setShowMenu(!showMenu)}>☰</GlowButton>
            {showMenu && (
              <div className={tb.burgerDd}>
                <button onClick={() => { setShowMenu(false); setShowTpls(true) }}>Шаблоны</button>
                <button onClick={() => { setShowMenu(false); const name = prompt('Название шаблона:', proj.name); if (!name) return; const desc = prompt('Описание:', ''); saveTpl({ name, desc: desc || '', rows: proj.rows, slots: JSON.parse(JSON.stringify(proj.slots)) }) }}>Сохранить шаблон</button>
                <div style={{ height: 1, background: 'var(--glass-border)', margin: '2px 0' }} />
                <button onClick={() => { setShowMenu(false); const np = newProject(); saveProject(proj); loadProj(np); setSelSlot(null); setMultiSel(new Set()) }}>Новый проект</button>
                <button onClick={() => { setShowMenu(false); setShowProjs(true) }}>Открыть проект</button>
                <div style={{ height: 1, background: 'var(--glass-border)', margin: '2px 0' }} />
                <button onClick={() => { setShowMenu(false); const all = loadProjectList().map(id => loadProject(id)).filter(Boolean); const d = { projects: all, templates: uTpls }; const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'mc-menu-backup.json'; a.click(); URL.revokeObjectURL(url) }}>Бэкап</button>
                <button onClick={() => { setShowMenu(false); const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json'; inp.onchange = (ev: Event) => { const f = (ev.target as HTMLInputElement).files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = (re) => { try { const d = JSON.parse(re.target?.result as string); if (d.projects) { for (const p of d.projects) saveProject(p); const last = d.projects[d.projects.length - 1]; if (last) { loadProj(last); setSelSlot(null); setMultiSel(new Set()) } } } catch (err) { alert('Ошибка: ' + (err as Error).message) } }; reader.readAsText(f) }; inp.click() }}>Импорт</button>
                <button onClick={() => { setShowMenu(false); const text = prompt('Вставьте код FunMenu (Kotlin) или конфиг AbstractMenus (YAML):'); if (!text) return; const fm = parseFunMenu(text); const am = fm || parseAbstractMenus(text); if (!am) { alert('Не удалось распарсить. Поддерживается FunMenu (Kotlin) и AbstractMenus (YAML).'); return }; const np = newProject(am.name, am.rows); np.slots = am.slots; saveProject(np); loadProj(np); setSelSlot(null); setMultiSel(new Set()) }}>Импорт FunMenu / AM</button>
                <div style={{ height: 1, background: 'var(--glass-border)', margin: '2px 0' }} />
                <button onClick={() => { setShowMenu(false); const ws = newWorkspace(); saveWorkspace(ws); setActiveWS(ws); refreshCache(ws) }}>Новый workspace</button>
                {loadWorkspaceList().length > 1 && <button onClick={() => { setShowMenu(false); setShowWorkspaces(true) }}>Workspaces</button>}
              </div>
            )}
          </div>
        </div>
      </div>

      <DockLayout panels={[
        { id: 'palette', title: 'Предметы', content: (
          <Palette itemDB={ITEM_DB} selItem={palItem} onSelect={handlePalSelect} recent={recent} />
        )},
        { id: 'grid', title: 'Workspace', content: activeWS ? (
          <CanvasView
            workspace={activeWS}
            onUpdateWS={updateWS}
            projects={projectCache}
            activeProjectId={proj.id}
            selSlot={selSlot}
            onSlotSelect={handleSlotSelect}
            palItem={palItem}
            onPlaceItem={handlePlaceItem}
            onRemoveItem={handleRemoveItem}
            showNums={showNums}
            onActivateMenu={switchToProject}
            onBrushPick={id => { setPalItem(id); setPalPreset(null) }}
            onResizeMenu={(pid, rows) => {
              if (pid !== proj.id) switchToProject(pid)
              dispatch({ type: 'SR', rows })
            }}
            onSetEraser={() => {
              if (palItem === ERASER_ID) { setPalItem(null); setPalPreset(null) }
              else { setPalItem(ERASER_ID); setPalPreset(null) }
            }}
            onDeselect={() => { setSelSlot(null); setMultiSel(new Set()) }}
            onDeselectPalette={() => { setPalItem(null); setPalPreset(null) }}
            onMenuRemoved={(pid) => {
              removedFromCanvas.current.add(pid)
              if (pid === proj.id) {
                const remaining = activeWS?.menus.filter(m => m.projectId !== pid) || []
                if (remaining.length > 0) {
                  const p = loadProject(remaining[0].projectId)
                  if (p) { loadProj(p); setSelSlot(null); setMultiSel(new Set()) }
                }
              }
            }}
            onClearAll={(pid) => {
              if (pid !== proj.id) switchToProject(pid)
              dispatch({ type: 'CA' }); setSelSlot(null); setMultiSel(new Set())
            }}
            onRenameMenu={(pid, name) => {
              if (pid !== proj.id) switchToProject(pid)
              setName(name)
            }}
          />
        ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--tx3)' }}>Загрузка...</div>},
        { id: 'editor', title: 'Редактор', content: (
          <ItemEditor data={selSlot ? proj.slots[selSlot] : null} slotKey={selSlot} dispatch={dispatch as never} />
        )},
      ]} />

      <StatusBar selSlot={selSlot} multiSel={multiSel} palItem={palItem} rows={proj.rows} slotCount={Object.keys(proj.slots).length} saveStatus={saveStatus} />

      {htt && <HoverTooltip data={htt.data} x={htt.x} y={htt.y} />}
      {showExport && <ExportModal project={proj} onClose={() => setShowExport(false)} />}
      {showGrad && <GradientModal onClose={() => setShowGrad(false)} />}
      {showColorPicker && <ColorPickerModal onClose={() => setShowColorPicker(false)} />}
      {showTpls && <TemplateModal builtIn={BUILT_TPLS as never} userTemplates={[]} onApply={(t: any) => { const np = newProject(t.name || proj.name, t.rows); np.slots = JSON.parse(JSON.stringify(t.slots || {})); loadProj(np); setSelSlot(null); setMultiSel(new Set()); setShowTpls(false) }} onDeleteUser={() => {}} onClose={() => setShowTpls(false)} />}
      {showProjs && <ProjectModal list={loadProjectList()} onOpen={p => { loadProj(p); setSelSlot(null); setMultiSel(new Set()); setShowProjs(false) }} onDelete={id => { deleteProject(id); forceRender(x => x + 1) }} onClose={() => setShowProjs(false)} />}
      {ctxMenu && <CtxMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={() => setCtxMenu(null)} />}
      {showWorkspaces && (
        <GlassModal onClose={() => setShowWorkspaces(false)} title="Workspaces">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {loadWorkspaceList().map(id => {
              const ws = loadWorkspace(id); if (!ws) return null
              return (
                <div key={id} onClick={() => { removedFromCanvas.current.clear(); setActiveWS(ws); refreshCache(ws); setShowWorkspaces(false) }}
                  style={{ position: 'relative', padding: 12, background: id === activeWS?.id ? 'var(--accent-subtle)' : 'var(--glass-surface)', border: `1px solid ${id === activeWS?.id ? 'var(--accent)' : 'var(--glass-border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.background = id === activeWS?.id ? 'var(--accent-subtle)' : 'var(--glass-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = id === activeWS?.id ? 'var(--accent-subtle)' : 'var(--glass-surface)')}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{ws.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{ws.menus.length} меню · {ws.connections.length} связей</div>
                  {id !== activeWS?.id && (
                    <button onClick={e => { e.stopPropagation(); if (confirm(`Удалить "${ws.name}"?`)) { deleteWorkspace(id); forceRender(x => x + 1) } }}
                      style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', color: 'var(--er)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                  )}
                </div>
              )
            })}
          </div>
          <div className={glassModalStyles.actions} style={{ marginTop: 16 }}>
            <GlowButton onClick={() => { const ws = newWorkspace(); saveWorkspace(ws); setActiveWS(ws); refreshCache(ws); setShowWorkspaces(false) }}>+ Новый</GlowButton>
            <GlowButton onClick={() => setShowWorkspaces(false)}>Закрыть</GlowButton>
          </div>
        </GlassModal>
      )}
    </div>
  )
}
