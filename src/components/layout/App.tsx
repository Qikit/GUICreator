import { useState, useEffect, useRef, useCallback } from 'react'
import type { SlotData, SlotPreset, Workspace, Project } from '@/types'
import { useProjectStore } from '@/store/projectStore'
import { usePrefsStore } from '@/store/prefsStore'
import { useSelectionStore } from '@/store/selectionStore'
import { ITEM_DB } from '@/data/items'
import { BUILT_TPLS } from '@/data/templates'
import { saveProject, loadProject, loadProjectList, deleteProject, loadPrefs, savePrefs, saveWorkspace, loadWorkspace, loadWorkspaceList, newWorkspace, saveUserTemplates, loadUserTemplates, deleteWorkspace } from '@/storage'
import { loadLocale } from '@/loaders'
import { makeSlot, newProject, ERASER_ID } from '@/utils/slot'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Palette } from '@/components/palette'
import { ItemEditor } from '@/components/editor'
import { HoverTooltip, CtxMenu } from '@/components/shared'
import type { CtxMenuItem } from '@/components/shared'
import { ExportModal, GradientModal, ColorPickerModal, TemplateModal, ProjectModal, ImportModal, SaveTemplateModal, SettingsModal } from '@/components/modals'
import { CanvasView } from '@/components/canvas'
import { DockLayout } from './DockLayout'
import { BurgerMenu } from './BurgerMenu'
import { StatusBar } from './StatusBar'
import { GlowButton, GlassModal, glassModalStyles } from '@/components/ui'
import { AmbientBackground } from './AmbientBackground'
import { Grid } from '@/components/grid'
import { generateShareUrl, detectShareInUrl } from '@/utils/shareUrl'
import { parseAnyImport } from '@/utils/import'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useFileDrop } from '@/hooks/useFileDrop'
import type { ShareResult } from '@/utils/shareUrl'
import tb from '@/styles/toolbar.module.css'

export function App() {
  const { present: proj, past, future, dispatch, undo, redo, setName, loadProject: loadProj } = useProjectStore()
  const { showNums, showConns, toggleNums, toggleConns, animations, toggleAnimations } = usePrefsStore()

  const { selSlot, selectSlot, toggleMulti, clearSlotSelection } = useSelectionStore()
  const [palItem, setPalItem] = useState<string | null>(null)
  const [palPreset, setPalPreset] = useState<SlotPreset | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [showGrad, setShowGrad] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showTpls, setShowTpls] = useState(false)
  const [showProjs, setShowProjs] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showSaveTpl, setShowSaveTpl] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; items: CtxMenuItem[] } | null>(null)
  const [htt, setHTT] = useState<{ data: SlotData; x: number; y: number } | null>(null)
  const [saveStatus, setSaveStatus] = useState('Saved')
  const [recent, setRecent] = useState<string[]>([])
  const [clipboard, setClipboard] = useState<{ multi: boolean; data: Record<string, SlotData> | SlotData; keys?: string[]; rows?: number } | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showWorkspaces, setShowWorkspaces] = useState(false)
  const [uTpls, setUTpls] = useState<unknown[]>(() => loadUserTemplates())
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

  const [shareResult, setShareResult] = useState<ShareResult | null>(null)
  const [fitNonce, setFitNonce] = useState(0)
  const isMobile = useIsMobile()
  const [, forceRender] = useState(0)

  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  const menuRef = useRef<HTMLDivElement>(null)

  // Init loaders + auto-init workspace
  useEffect(() => {
    loadLocale().then(n => { if (n) forceRender(x => x + 1) })

    const shared = detectShareInUrl()
    if (shared) {
      for (const p of shared.projects) saveProject(p)
      const ws = shared.workspace
      saveWorkspace(ws)
      setActiveWS(ws)
      refreshCache(ws)
      if (shared.projects.length) { loadProj(shared.projects[0]); clearSlotSelection() }
      history.replaceState(null, '', window.location.pathname + window.location.search)
      return
    }

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
    proj, clipboard, setClipboard,
    dispatch: dispatch as never, undo, redo, saveProject, setSaveStatus,
    setShowExport, setShowTpls, setShowProjs, palItem, setPalItem, setPalPreset: setPalPreset as (v: unknown) => void, setCtxMenu: () => setCtxMenu(null),
    onDuplicateProject: activeWS ? (project: Project) => {
      const np = newProject(project.name, project.rows)
      np.slots = project.slots
      saveProject(np)
      const origMenu = activeWS.menus.find(m => m.projectId === proj.id)
      const ox = origMenu ? origMenu.x + 30 : 100
      const oy = origMenu ? origMenu.y + 30 : 100
      updateWS({ ...activeWS, menus: [...activeWS.menus, { projectId: np.id, x: ox, y: oy }] })
      loadProj(np)
      clearSlotSelection()
    } : undefined,
  })

  const handleImport = useCallback((raw: string) => {
    const res = parseAnyImport(raw)
    if (res.kind === 'error') { alert(res.message); return }
    if (res.kind === 'menu') {
      saveProject(res.project); addToWorkspace(res.project.id); loadProj(res.project); clearSlotSelection()
      setFitNonce(n => n + 1); return
    }
    if (!activeWS) return
    for (const p of res.projects) saveProject(p)
    const imported = res.workspace
    const newMenus = [...activeWS.menus]
    const maxX = newMenus.reduce((mx, m) => Math.max(mx, m.x), 0)
    for (const m of imported.menus) if (!newMenus.find(e => e.projectId === m.projectId)) newMenus.push({ ...m, x: m.x + maxX + 300 })
    const newConns = [...activeWS.connections, ...imported.connections.filter(c => !activeWS.connections.find(e => e.id === c.id))]
    updateWS({ ...activeWS, menus: newMenus, connections: newConns })
    if (res.templates) { setUTpls(res.templates); saveUserTemplates(res.templates) }
    const last = res.projects[res.projects.length - 1]
    if (last) { loadProj(last); clearSlotSelection() }
    setFitNonce(n => n + 1)
  }, [activeWS, addToWorkspace, updateWS, loadProj, clearSlotSelection])

  const { isDragging } = useFileDrop(handleImport)

  const exportBackup = () => {
    if (!activeWS) return
    const projs = activeWS.menus.map(m => loadProject(m.projectId)).filter(Boolean)
    const d = { workspace: activeWS, projects: projs, templates: uTpls }
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${activeWS.name.replace(/[^a-zA-Z0-9Ѐ-ӿ]/g, '_')}-backup.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const shareLink = () => {
    if (!activeWS) return
    const projs = activeWS.menus.map(m => loadProject(m.projectId)).filter(Boolean) as Project[]
    setShareResult(generateShareUrl({ workspace: activeWS, projects: projs }, window.location.href))
  }

  const handlePalSelect = (id: string, preset?: SlotPreset) => {
    if (id === palItem && !preset) { setPalItem(null); setPalPreset(null) }
    else { setPalItem(id); setPalPreset(preset || null) }
  }

  const switchToProject = (pid: string) => {
    if (pid === proj.id) return
    saveProject(proj)
    const p = loadProject(pid)
    if (p) { loadProj(p); clearSlotSelection() }
  }

  const handleMultiToggle = (pid: string, key: string) => {
    if (pid !== proj.id) { switchToProject(pid) }
    toggleMulti(key)
  }

  const handleSlotSelect = (pid: string, key: string) => {
    if (pid !== proj.id) {
      saveProject(proj)
      const p = loadProject(pid)
      if (p) { loadProj(p) }
    }
    selectSlot(key)
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
    selectSlot(key)
  }

  const handleSlotPickup = (pid: string, key: string) => {
    const p = pid === proj.id ? proj : loadProject(pid)
    if (!p?.slots[key]) return
    const d = p.slots[key]
    setPalItem(d.itemId)
    setPalPreset({
      displayName: JSON.parse(JSON.stringify(d.displayName)),
      lore: JSON.parse(JSON.stringify(d.lore)),
      enchanted: d.enchanted,
      amount: d.amount,
      customModelData: d.customModelData,
      potionColor: d.potionColor,
      skullTexture: d.skullTexture,
      armorTrim: d.armorTrim ? { ...d.armorTrim } : null,
    })
  }

  const handleMoveSlot = (pid: string, from: string, to: string) => {
    if (pid !== proj.id) {
      saveProject(proj)
      const p = loadProject(pid)
      if (p) { loadProj(p) }
    }
    dispatch({ type: 'MV', from, to })
    selectSlot(to)
  }

  const handleRemoveItem = (pid: string, key: string) => {
    if (pid !== proj.id) {
      saveProject(proj)
      const p = loadProject(pid)
      if (p) { loadProj(p) }
    }
    dispatch({ type: 'RS', key })
    if (selSlot === key) selectSlot(null)
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
        {!isMobile && <>
          <div className={tb.sep} />
          <div className={tb.group}>
            <GlowButton onClick={toggleNums} variant={showNums ? 'primary' : 'ghost'} data-tip="Номера слотов">#</GlowButton>
            <GlowButton onClick={toggleConns} variant={showConns ? 'primary' : 'ghost'} data-tip="Стрелки связей">→</GlowButton>
            <GlowButton onClick={toggleAnimations} variant={animations ? 'primary' : 'ghost'} data-tip="Анимации">✦</GlowButton>
          </div>
        </>}
        <div className={tb.spacer} />
        <div className={tb.group}>
          {!isMobile && <>
            <GlowButton onClick={() => setShowGrad(true)}>Градиент</GlowButton>
            <GlowButton onClick={() => setShowColorPicker(true)}>Цвета</GlowButton>
            <GlowButton variant="primary" onClick={() => setShowExport(true)}>Экспорт</GlowButton>
          </>}
          <div className={tb.burger} ref={menuRef}>
            <GlowButton onClick={() => setShowMenu(!showMenu)}>☰</GlowButton>
            {showMenu && (<>
              {isMobile && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199 }} onClick={() => setShowMenu(false)} />}
              <BurgerMenu
                isMobile={isMobile}
                onClose={() => setShowMenu(false)}
                onExport={() => setShowExport(true)}
                onGradient={() => setShowGrad(true)}
                onColors={() => setShowColorPicker(true)}
                onTemplates={() => setShowTpls(true)}
                onSaveTemplate={() => setShowSaveTpl(true)}
                onNewProject={() => { const np = newProject(); saveProject(np); addToWorkspace(np.id); loadProj(np); clearSlotSelection() }}
                onOpenProject={() => setShowProjs(true)}
                onImport={() => setShowImport(true)}
                onExportBackup={exportBackup}
                onShare={shareLink}
                onNewWorkspace={() => { const ws = newWorkspace(); saveWorkspace(ws); setActiveWS(ws); refreshCache(ws) }}
                onAllWorkspaces={() => setShowWorkspaces(true)}
                onSettings={() => setShowSettings(true)}
              />
            </>)}
          </div>
        </div>
      </div>

      <DockLayout panels={[
        { id: 'palette', title: 'Предметы', content: (
          <Palette itemDB={ITEM_DB} selItem={palItem} onSelect={handlePalSelect} recent={recent} />
        )},
        { id: 'grid', title: isMobile ? proj.name : 'Workspace', headerExtra: (() => {
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
        })(), content: isMobile ? (
          <Grid
            project={proj}
            showNums={showNums}
            onSlotMD={(_e, key) => {
              if (palItem) { handlePlaceItem(proj.id, key) }
              else { selectSlot(key) }
            }}
            onSlotCtx={(e, key) => { e.preventDefault(); if (proj.slots[key]) { dispatch({ type: 'RS', key }); if (selSlot === key) selectSlot(null) } }}
            onPaint={() => {}}
            setHTT={() => {}}
            dispatch={dispatch as never}
          />
        ) : activeWS ? (
          <CanvasView
            workspace={activeWS}
            onUpdateWS={updateWS}
            projects={projectCache}
            activeProjectId={proj.id}
            onSlotSelect={handleSlotSelect}
            onMultiToggle={handleMultiToggle}
            palItem={palItem}
            onPlaceItem={handlePlaceItem}
            onRemoveItem={handleRemoveItem}
            onMoveSlot={handleMoveSlot}
            showNums={showNums}
            showConns={showConns}
            onActivateMenu={switchToProject}
            onBrushPick={id => { setPalItem(id); setPalPreset(null) }}
            onSlotPickup={handleSlotPickup}
            clipboard={clipboard}
            setClipboard={setClipboard}
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
            onDeselectPalette={() => { setPalItem(null); setPalPreset(null) }}
            onMenuRemoved={(pid) => {
              removedFromCanvas.current.add(pid)
              if (pid === proj.id) {
                const remaining = activeWS?.menus.filter(m => m.projectId !== pid) || []
                if (remaining.length > 0) {
                  const p = loadProject(remaining[0].projectId)
                  if (p) { loadProj(p); clearSlotSelection() }
                }
              }
            }}
            onClearAll={(pid) => {
              if (pid !== proj.id) switchToProject(pid)
              dispatch({ type: 'CA' }); clearSlotSelection()
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

      <StatusBar palItem={palItem} rows={proj.rows} slotCount={Object.keys(proj.slots).length} saveStatus={saveStatus} />

      {htt && <HoverTooltip data={htt.data} x={htt.x} y={htt.y} />}
      {showExport && <ExportModal project={proj} onClose={() => setShowExport(false)} />}
      {showGrad && <GradientModal onClose={() => setShowGrad(false)} />}
      {showColorPicker && <ColorPickerModal onClose={() => setShowColorPicker(false)} />}
      {showTpls && <TemplateModal builtIn={BUILT_TPLS as never} userTemplates={uTpls as never} onApply={(t: any) => { const np = newProject(t.name || proj.name, t.rows); np.slots = JSON.parse(JSON.stringify(t.slots || {})); saveProject(np); addToWorkspace(np.id); loadProj(np); clearSlotSelection(); setShowTpls(false) }} onDeleteUser={(idx: number) => { const upd = uTpls.filter((_, i) => i !== idx); setUTpls(upd); saveUserTemplates(upd) }} onClose={() => setShowTpls(false)} />}
      {showImport && <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} />}
      {showSaveTpl && <SaveTemplateModal initialName={proj.name} onSave={(t) => saveTpl({ ...t, rows: proj.rows, slots: JSON.parse(JSON.stringify(proj.slots)) })} onClose={() => setShowSaveTpl(false)} />}
      {showProjs && <ProjectModal list={loadProjectList()} onOpen={p => { loadProj(p); clearSlotSelection(); setShowProjs(false) }} onDelete={id => { deleteProject(id); forceRender(x => x + 1) }} onClose={() => setShowProjs(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {ctxMenu && <CtxMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={() => setCtxMenu(null)} />}
      {shareResult && (
        <GlassModal onClose={() => setShareResult(null)} title="Поделиться ссылкой">
          {shareResult.stripped > 0 && (
            <div style={{ fontSize: 12, color: '#ff5555', marginBottom: 8, padding: '6px 10px', background: 'rgba(255,85,85,0.1)', borderRadius: 6 }}>
              Workspace слишком большой для ссылки. Удалено {shareResult.stripped} самых тяжёлых предметов из копии. Используйте бэкап для полной передачи.
            </div>
          )}
          <textarea readOnly value={shareResult.url} style={{ width: '100%', minHeight: 60, fontSize: 11, background: 'var(--glass-surface)', border: '1px solid var(--glass-border)', borderRadius: 6, color: 'var(--tx1)', padding: 8, resize: 'vertical', fontFamily: 'monospace' }} onClick={e => (e.target as HTMLTextAreaElement).select()} />
          <div className={glassModalStyles.actions} style={{ marginTop: 12 }}>
            <GlowButton variant="primary" onClick={() => { navigator.clipboard.writeText(shareResult.url); setShareResult(null) }}>Скопировать</GlowButton>
            <GlowButton onClick={() => setShareResult(null)}>Закрыть</GlowButton>
          </div>
        </GlassModal>
      )}
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
      {isDragging && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(139,92,246,0.12)', border: '3px dashed var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', fontSize: 18, color: 'var(--tx1)' }}>
          Отпустите файл для импорта
        </div>
      )}
    </div>
  )
}
