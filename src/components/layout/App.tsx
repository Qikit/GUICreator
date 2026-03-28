import { useState, useEffect, useRef, useCallback } from 'react'
import type { SlotData, SlotPreset, Workspace, Project } from '@/types'
import { useProjectStore } from '@/store/projectStore'
import { usePrefsStore } from '@/store/prefsStore'
import { ITEM_DB } from '@/data/items'
import { BUILT_TPLS } from '@/data/templates'
import { saveProject, loadProject, loadProjectList, deleteProject, loadPrefs, savePrefs, saveWorkspace, loadWorkspace, loadWorkspaceList, newWorkspace, saveUserTemplates, deleteWorkspace } from '@/storage'
import { loadLocale } from '@/loaders'
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
import { parseAbstractMenus } from '@/utils/importMenu'
import { AmbientBackground } from './AmbientBackground'
import tb from '@/styles/toolbar.module.css'

export function App() {
  const { present: proj, past, future, dispatch, undo, redo, setName, loadProject: loadProj } = useProjectStore()
  const { showNums, showRP, toggleNums, animations, toggleAnimations } = usePrefsStore()

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

    const wl = loadWorkspaceList()
    let ws: Workspace | null = null
    if (wl.length) ws = loadWorkspace(wl[wl.length - 1])
    if (!ws) { ws = newWorkspace(); saveWorkspace(ws) }
    setActiveWS(ws)
    refreshCache(ws)
  }, [])

  // Sync current project into cache
  useEffect(() => {
    if (!activeWS) return
    setProjectCache(prev => ({ ...prev, [proj.id]: proj }))
  }, [proj.id, proj, activeWS])

  const addToWorkspace = useCallback((projectId: string) => {
    if (!activeWS) return
    if (activeWS.menus.find(m => m.projectId === projectId)) return
    const updated = { ...activeWS, menus: [...activeWS.menus, { projectId, x: 100 + activeWS.menus.length * 250, y: 100 }] }
    updateWS(updated)
  }, [activeWS, updateWS])

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
    setShowExport, setShowTpls, setShowProjs, palItem, setPalItem, setPalPreset: setPalPreset as (v: unknown) => void, setCtxMenu: () => setCtxMenu(null),
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
          <GlowButton onClick={undo} disabled={!past.length} data-tip="Отменить (Ctrl+Z)">↩</GlowButton>
          <GlowButton onClick={redo} disabled={!future.length} data-tip="Повторить (Ctrl+Y)">↪</GlowButton>
        </div>
        <div className={tb.sep} />
        <div className={tb.group}>
          <GlowButton onClick={toggleNums} variant={showNums ? 'primary' : 'ghost'} data-tip="Номера слотов">#</GlowButton>
          <GlowButton onClick={toggleAnimations} variant={animations ? 'primary' : 'ghost'} data-tip="Анимации">✦</GlowButton>
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
                <button onClick={() => { setShowMenu(false); const np = newProject(); saveProject(proj); saveProject(np); addToWorkspace(np.id); loadProj(np); setSelSlot(null); setMultiSel(new Set()) }}>Новый проект</button>
                <button onClick={() => { setShowMenu(false); setShowProjs(true) }}>Открыть проект</button>
                <div style={{ height: 1, background: 'var(--glass-border)', margin: '2px 0' }} />
                <button onClick={() => { setShowMenu(false); if (!activeWS) return; const projIds = activeWS.menus.map(m => m.projectId); const projs = projIds.map(id => loadProject(id)).filter(Boolean); const d = { workspace: activeWS, projects: projs, templates: uTpls }; const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${activeWS.name.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, '_')}-backup.json`; a.click(); URL.revokeObjectURL(url) }}>Бэкап</button>
                <button onClick={() => { setShowMenu(false); const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json'; inp.onchange = (ev: Event) => { const f = (ev.target as HTMLInputElement).files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = (re) => { try { const d = JSON.parse(re.target?.result as string); if (d.projects) { for (const p of d.projects) saveProject(p) } if (d.workspace && activeWS) { const imported = d.workspace as Workspace; const newMenus = [...activeWS.menus]; const maxX = newMenus.reduce((mx, m) => Math.max(mx, m.x), 0); for (const m of imported.menus) { if (!newMenus.find(e => e.projectId === m.projectId)) newMenus.push({ ...m, x: m.x + maxX + 300 }) } const newConns = [...activeWS.connections, ...imported.connections.filter(c => !activeWS.connections.find(e => e.id === c.id))]; const updated = { ...activeWS, menus: newMenus, connections: newConns }; updateWS(updated) } else if (d.projects?.length && activeWS) { const newMenus = [...activeWS.menus]; let ox = newMenus.reduce((mx, m) => Math.max(mx, m.x), 0) + 300; for (const p of d.projects) { if (!newMenus.find(e => e.projectId === p.id)) { newMenus.push({ projectId: p.id, x: ox, y: 100 }); ox += 250 } }; updateWS({ ...activeWS, menus: newMenus, connections: activeWS.connections }) } const last = d.projects?.[d.projects.length - 1]; if (last) { loadProj(last); setSelSlot(null); setMultiSel(new Set()) } } catch (err) { alert('Ошибка: ' + (err as Error).message) } }; reader.readAsText(f) }; inp.click() }}>Импорт</button>
                <button onClick={() => { setShowMenu(false); const text = prompt('Вставьте конфиг AbstractMenus (YAML):'); if (!text) return; const am = parseAbstractMenus(text); if (!am) { alert('Не удалось распарсить конфиг AbstractMenus.'); return }; const np = newProject(am.name, am.rows); np.slots = am.slots; saveProject(np); addToWorkspace(np.id); loadProj(np); setSelSlot(null); setMultiSel(new Set()) }}>Импорт AbstractMenus</button>
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
        { id: 'grid', title: 'Workspace', headerExtra: (() => {
          const wsList = loadWorkspaceList()
          const MAX_TABS = 5
          const visible = wsList.slice(0, MAX_TABS)
          const overflow = wsList.length > MAX_TABS
          const switchWS = (id: string) => { const ws = loadWorkspace(id); if (ws) { setActiveWS(ws); refreshCache(ws) } }
          const createWS = () => { const ws = newWorkspace(); saveWorkspace(ws); setActiveWS(ws); refreshCache(ws) }
          const deleteWS = (id: string, name: string) => { if (!confirm(`Удалить "${name}"?`)) return; deleteWorkspace(id); if (id === activeWS?.id) { const remaining = loadWorkspaceList(); if (remaining.length) switchWS(remaining[0]); else createWS() } forceRender(x => x + 1) }
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto', flexShrink: 1, minWidth: 0, overflow: 'hidden' }}
              onDoubleClick={e => { e.stopPropagation(); createWS() }}>
              {visible.map(id => {
                const ws = loadWorkspace(id)
                if (!ws) return null
                return <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid ' + (id === activeWS?.id ? 'var(--accent)' : 'var(--glass-border)'), borderRadius: 3, background: id === activeWS?.id ? 'var(--accent-subtle)' : 'none', overflow: 'hidden' }}>
                  <button onClick={e => { e.stopPropagation(); switchWS(id) }}
                    style={{ padding: '1px 4px', fontSize: 9, border: 'none', background: 'none', color: id === activeWS?.id ? 'var(--accent)' : 'var(--tx3)', cursor: 'pointer', whiteSpace: 'nowrap', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis' }}>{ws.name}</button>
                  {wsList.length > 1 && <button onClick={e => { e.stopPropagation(); deleteWS(id, ws.name) }}
                    style={{ padding: '0 2px', fontSize: 8, border: 'none', background: 'none', color: 'var(--tx3)', cursor: 'pointer', lineHeight: 1, opacity: 0.5 }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1', e.currentTarget.style.color = 'var(--er)')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.5', e.currentTarget.style.color = 'var(--tx3)')}>✕</button>}
                </div>
              })}
              {overflow && <button onClick={e => { e.stopPropagation(); setShowWorkspaces(true) }}
                style={{ padding: '1px 4px', fontSize: 9, border: '1px solid var(--glass-border)', borderRadius: 3, background: 'none', color: 'var(--tx3)', cursor: 'pointer' }}>...</button>}
              <button onClick={e => { e.stopPropagation(); setShowWorkspaces(true) }}
                style={{ padding: '1px 3px', fontSize: 9, border: '1px solid var(--glass-border)', borderRadius: 3, background: 'none', color: 'var(--tx3)', cursor: 'pointer' }} title="Все workspaces">☰</button>
              <button onClick={e => { e.stopPropagation(); createWS() }}
                style={{ padding: '1px 3px', fontSize: 9, border: '1px solid var(--glass-border)', borderRadius: 3, background: 'none', color: 'var(--tx3)', cursor: 'pointer' }} title="Новый workspace">+</button>
            </div>
          )
        })(), content: activeWS ? (
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
            showRP={showRP}
            onActivateMenu={switchToProject}
            onBrushPick={id => { setPalItem(id); setPalPreset(null) }}
            onResizeMenu={(pid, rows) => {
              if (pid !== proj.id) switchToProject(pid)
              dispatch({ type: 'SR', rows })
            }}
            onSetGuiType={(pid, guiType) => {
              if (pid !== proj.id) switchToProject(pid)
              dispatch({ type: 'SGT', guiType })
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
      {showTpls && <TemplateModal builtIn={BUILT_TPLS as never} userTemplates={[]} onApply={(t: any) => { const np = newProject(t.name || proj.name, t.rows); np.slots = JSON.parse(JSON.stringify(t.slots || {})); saveProject(np); addToWorkspace(np.id); loadProj(np); setSelSlot(null); setMultiSel(new Set()); setShowTpls(false) }} onDeleteUser={() => {}} onClose={() => setShowTpls(false)} />}
      {showProjs && <ProjectModal list={loadProjectList()} onOpen={p => { loadProj(p); setSelSlot(null); setMultiSel(new Set()); setShowProjs(false) }} onDelete={id => { deleteProject(id); forceRender(x => x + 1) }} onClose={() => setShowProjs(false)} />}
      {ctxMenu && <CtxMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={() => setCtxMenu(null)} />}
      {showWorkspaces && (
        <GlassModal onClose={() => setShowWorkspaces(false)} title="Workspaces">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {loadWorkspaceList().map(id => {
              const ws = loadWorkspace(id); if (!ws) return null
              return (
                <div key={id} onClick={() => { setActiveWS(ws); refreshCache(ws); setShowWorkspaces(false) }}
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
