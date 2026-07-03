import tb from '@/styles/toolbar.module.css'

interface Props {
  isMobile: boolean
  onClose: () => void
  onExport: () => void
  onGradient: () => void
  onColors: () => void
  onTemplates: () => void
  onSaveTemplate: () => void
  onNewProject: () => void
  onOpenProject: () => void
  onImport: () => void
  onExportBackup: () => void
  onShare: () => void
  onNewWorkspace: () => void
  onAllWorkspaces: () => void
  onSettings: () => void
}

export function BurgerMenu(p: Props) {
  const run = (fn: () => void) => () => { p.onClose(); fn() }
  return (
    <div className={tb.burgerDd}>
      {p.isMobile && <>
        <div className={tb.burgerSection}>Инструменты</div>
        <button onClick={run(p.onExport)}>Экспорт</button>
        <button onClick={run(p.onGradient)}>Градиент</button>
        <button onClick={run(p.onColors)}>Цвета</button>
      </>}

      <div className={tb.burgerSection}>Проект</div>
      <button onClick={run(p.onNewProject)}>Новый проект</button>
      <button onClick={run(p.onOpenProject)}>Открыть проект</button>
      <button onClick={run(p.onTemplates)}>Шаблоны</button>
      <button onClick={run(p.onSaveTemplate)}>Сохранить шаблон</button>

      <div className={tb.burgerSection}>Импорт / Экспорт</div>
      {!p.isMobile && <button onClick={run(p.onExport)}>Экспорт</button>}
      <button onClick={run(p.onImport)}>Импорт</button>
      <button onClick={run(p.onExportBackup)}>Бэкап (файл)</button>
      <button onClick={run(p.onShare)}>Поделиться ссылкой</button>

      <div className={tb.burgerSection}>Workspace</div>
      <button onClick={run(p.onNewWorkspace)}>Новый workspace</button>
      <button onClick={run(p.onAllWorkspaces)}>Все workspaces</button>

      <div className={tb.burgerSection}>Прочее</div>
      <button onClick={run(p.onSettings)}>Настройки</button>
    </div>
  )
}
