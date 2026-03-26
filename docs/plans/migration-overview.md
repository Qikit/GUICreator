# MC Menu Designer — Migration Plan

## Current State
- 2207 строк в одном `index.html`
- Babel standalone транспиляция в браузере
- 70 глобальных функций, 0 типов, 0 тестов, 0 модулей
- CSS inline, abbreviated классы (`.b`, `.sl`, `.ed`)

## Target State
- Vite + React 18 + TypeScript
- CSS Modules (`.module.css`)
- Zustand для state management
- Vitest + React Testing Library
- Модульная структура: ~40 файлов вместо 1

## Tech Stack
| Tool | Why |
|------|-----|
| **Vite** | Мгновенный HMR, нативный ESM, zero-config для React+TS |
| **TypeScript** | Типизация SlotData, Project, Segment — ломающие изменения ловятся на компиляции |
| **Zustand** | Легче Redux, совместим с useReducer-паттерном, persist middleware для localStorage |
| **CSS Modules** | Scoped классы, можно использовать читаемые имена без коллизий |
| **Vitest** | Совместим с Vite, быстрый, поддержка jsdom для React |

## File Structure (target)

```
src/
  types/
    index.ts              — SlotData, Project, Workspace, Segment, TextStyle
  store/
    projectStore.ts       — Zustand store: project state + undo/redo
    workspaceStore.ts     — Zustand store: workspace/canvas state
    prefsStore.ts         — preferences, showNums, showRP
  data/
    items.ts              — ITEM_DB (статические категории)
    colors.ts             — MC_COLORS, COLORS
    templates.ts          — BUILT_TPLS (встроенные шаблоны)
    gradientPresets.ts    — GRAD_PRESETS
    potionPresets.ts      — potion/arrow color presets
    texMap.ts             — TEX_MAP, CSS_FB
  utils/
    minimessage.ts        — parseMM, seg2mm, seg2leg
    color.ts              — hexToRgb, rgbToHex, lerpColor, closestMC, hsv2hex
    clone.ts              — deepClone helper
    id.ts                 — gid()
    slot.ts               — defSlot, makeSlot, itemName, ruName
  loaders/
    locale.ts             — fetch + parse ru_ru.json
    funitems.ts           — fetch + parse FunItems
    resourcepack.ts       — fetch + parse RP index
  storage/
    projects.ts           — saveProj, loadProj, loadProjList, delProj
    templates.ts          — saveUTpls, loadUTpls
    workspaces.ts         — saveWS, loadWS, loadWSList, delWS
    prefs.ts              — savePrefs, loadPrefs
  components/
    layout/
      App.tsx             — root: mode switch, toolbar, modals
      Toolbar.tsx         — toolbar buttons, rows select, menu
      StatusBar.tsx       — bottom status bar
    palette/
      Palette.tsx         — search, categories, eraser
      PalItem.tsx         — single palette item with tooltip
    grid/
      Grid.tsx            — inventory grid container
      Slot.tsx            — single slot with drag/drop
    editor/
      ItemEditor.tsx      — right panel: properties, lore, name
      TextEditor.tsx      — segment-based text editor
      LoreEditor.tsx      — lore lines editor
    canvas/
      CanvasView.tsx      — pan/zoom surface, SVG arrows
      MiniMenu.tsx        — compact menu card
    modals/
      ExportModal.tsx     — export tabs (JSON, YAML, AM, FunMenu...)
      GradientModal.tsx   — gradient generator with presets
      ColorPickerModal.tsx— HSV picker + MC colors
      TemplateModal.tsx   — template browser
      ProjectModal.tsx    — project browser
    shared/
      ItemTexture.tsx     — texture resolver: renders → texmap → flat → tinted → skull → RP
      TintedTexture.tsx   — canvas-based potion tinting
      SkullFace.tsx       — canvas-based skull face render
      McText.tsx          — MiniMessage text renderer
      Preview.tsx         — Minecraft-style item tooltip
      CtxMenu.tsx         — right-click context menu
      HoverTooltip.tsx    — floating hover tooltip
  styles/
    global.css            — CSS variables (:root), resets, scrollbar
    toolbar.module.css
    palette.module.css
    grid.module.css
    editor.module.css
    canvas.module.css
    modals.module.css
    shared.module.css
  index.html              — minimal HTML shell
  main.tsx                — ReactDOM.createRoot + App mount
  vite-env.d.ts           — Vite type declarations
vite.config.ts
tsconfig.json
package.json
```

## Migration Phases

### Phase 1: Scaffold (этот план)
Инициализация проекта, конфигурация, перенос assets, минимальный App.tsx с "Hello World".
**Результат:** `npm run dev` запускается, TypeScript компилируется, assets доступны.

### Phase 2: Core
Типы, Zustand store (с undo/redo), утилиты (MiniMessage parser, color math), storage, data constants, loaders.
**Результат:** Вся бизнес-логика работает и покрыта тестами. Можно создать проект, добавить слот, сериализовать.

### Phase 3: Components
Все React-компоненты: Grid, Slot, Palette, ItemEditor, TextEditor, LoreEditor, ItemTexture + tinted/skull, McText, modals, toolbar, status bar.
**Результат:** Полностью рабочий редактор — функциональный паритет с текущим index.html (кроме Canvas).

### Phase 4: Features
Canvas mode (CanvasView, MiniMenu, connections), экспорт (FunMenu, AbstractMenus), ColorPicker, resourcepack integration.
**Результат:** Полный паритет + улучшения.

## Порядок

Phase 1 → Phase 2 → Phase 3 → Phase 4. Каждая фаза — отдельный план, отдельный PR. Текущий index.html остаётся рабочим до завершения Phase 3, после чего удаляется.

## Критерии готовности каждой фазы

- TypeScript компилируется без ошибок
- `npm run dev` работает
- Все тесты зелёные
- Визуально проверено в браузере
