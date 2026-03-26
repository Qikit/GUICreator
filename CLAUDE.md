# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MC Menu Designer — browser-based GUI editor for Minecraft inventory menus. Single-page application, entire codebase lives in `index.html` (~1589 lines). No build system, no bundler, no package manager.

## Running

```bash
# Windows
start.bat

# Unix
bash start.sh

# Manual (any of these)
python3 -m http.server 8765
php -S localhost:8765
```

Opens at `http://localhost:8765`. Requires Node.js, Python 3, or PHP.

**Known bug:** `start.bat` and `start.sh` reference `menu-designer.html` in the Node.js server code, but the actual file is `index.html`. Python/PHP servers work fine since they serve the directory root.

## No Build/Test/Lint

No build steps, test suites, or linters. Runs directly in the browser via Babel standalone transpilation.

## CDN Dependencies

- React 18.2.0 + ReactDOM (production UMD)
- Babel standalone 7.23.9
- Google Fonts: Inter, JetBrains Mono

Local: `assets/fonts/Mojangles.ttf` (Minecraft font for tooltip/export preview).

Three.js was removed in commit `7f115e8`. The 3D render engine code (~lines 605–970) still exists but is dormant — guarded by `typeof THREE === "undefined"`.

## Architecture (index.html)

Everything in one file, organized sequentially:

1. **CSS** (~lines 1–171) — dark theme, CSS variables in `:root`, short class names
2. **CDN imports** (lines 175–177)
3. **Data constants** (~lines 179–452) — `COLORS`, `MC_COLORS`, `ITEM_DB` (item database by category), `TEX_MAP` (texture path overrides), `CSS_FB` (fallback colors), `LORE_TPLS`, `MC_SYMBOLS`, `BUILT_TPLS`
4. **Helpers** (~lines 454–572) — `findItem`, `closestMC`, `seg2leg` (§-code serializer), `seg2mm` (MiniMessage serializer), `parseMM` (MiniMessage parser with gradient expansion)
5. **Storage** (~lines 574–583) — localStorage (`mc-menu-designer:` prefix) + IndexedDB (`mc-render-cache`)
6. **Reducer** (~lines 585–603) — undo/redo state machine
7. **3D Render Engine** (~lines 605–970) — dormant, requires Three.js. Model resolver, texture loader, render pipeline with IndexedDB cache
8. **React Components** (~lines 1027–1420):
   - `ItemTexture` — item icon with fallback chain
   - `Palette` — left panel, item browser with categories/search
   - `Grid` — center, 9×N slot grid
   - `ItemEditor` — right panel, slot property editor
   - `ExportModal`, `GradientModal`, `TemplateModal`, `ProjModal` — modals
   - `HoverTT` — Minecraft-style hover tooltip
   - `CtxMenu` — right-click context menu
9. **App** (~line 1423) — root component, `useReducer` for state, all event handlers

## State Management

`useReducer` with undo/redo:
```
{ past: [...], present: <project>, future: [...] }
```

Action types: `SS` (set slot), `SM` (set multiple), `RS` (remove slot), `RM` (remove multiple), `MV` (move/swap), `SR` (set rows), `SN` (set name), `CA` (clear all), `FE` (fill empty), `UNDO`, `REDO`, `LP` (load project).

## Project Data Model

```javascript
{ id, name, rows: 1-6, cols: 9, slots: { "row-col": SlotData }, createdAt, updatedAt }
```

Slot key: `"row-col"` (e.g., `"0-4"` = first row, fifth column). Slot index = `row * 9 + col`.

SlotData: `{ itemId, displayName: [Segment], lore: [[Segment]], amount, enchanted, customModelData, hideFlags }`

## Text Segments

```javascript
{ text, color, bold, italic, underlined, strikethrough, obfuscated }
```

Serialization: `seg2leg` → legacy `§`-codes, `seg2mm` → MiniMessage format. Parsing: `parseMM` (with gradient expansion to per-char color tags). Gradient detection on export: `detectGradientStops` collapses per-char segments back to `<gradient:...>` tags.

## Texture Resolution (ItemTexture)

Fallback chain, first successful load wins:
1. `assets/minecraft/renders/{itemId}.png` — pre-rendered 64×64 icons
2. `TEX_MAP[itemId]` — explicit texture path override
3. `assets/minecraft/textures/item/{itemId}.png`
4. `assets/minecraft/textures/block/{itemId}.png`
5. Emoji fallback (`❓`)

## Storage

- **localStorage** prefix `mc-menu-designer:` — keys: `p:{id}` (project), `idx` (project ID list), `tpl` (user templates), `prf` (preferences with `lastOpenProject`)
- **IndexedDB** `mc-render-cache` — 3D render cache (currently unused without Three.js)

## Keyboard Shortcuts

- `Ctrl+Z` / `Ctrl+Y` — undo / redo
- `Ctrl+S` — force save
- `Ctrl+E` — open export modal
- `Ctrl+C` / `Ctrl+V` — copy / paste slot(s)
- `Ctrl+A` — select all slots
- `Delete` / `Backspace` — remove selected slot(s)
- `Arrow keys` — navigate slots (`+Shift` extends selection)
- `Escape` — deselect / close modals
- `Alt+Click` on slot — brush mode (paint with palette item)
- `Middle Click` on slot — eyedropper (pick item from slot)
- `Right Click` — context menu, or drag for multi-select/brush

## Import/Export

Export generates four formats: JSON (structured, both legacy + MiniMessage text), YAML (legacy text only), §-Codes (plain text), MiniMessage (plain text).

Import supports two JSON shapes:
- Bulk: `{ projects: [...], templates: [...] }` — restores full workspace
- Single menu: `{ menu: { title, rows }, slots: [{ slot, material, displayName, lore, ... }] }` — slot index = `row * 9 + col`

## External Communication Pattern

`window._forceUpdate` — React re-render trigger used by async code outside React (ru_ru.json load, render pipeline progress). Set by App's useEffect, called by external consumers.

## Assets

`assets/minecraft/` — extracted Minecraft resources:
- `renders/` — pre-rendered 64×64 PNG item icons
- `models/` + `items/` — JSON block/item models and definitions (for 3D engine)
- `textures/` — source textures (block, item, entity)
- `lang/ru_ru.json` — Russian localization for item names
- `font/` — font definitions

## Conventions

- Commit messages: lowercase, short, single line, no prefix conventions
- All UI text is in Russian
- CSS classes use short abbreviated names (`.tb` = toolbar, `.pal` = palette, `.ed` = editor, `.sl` = slot, `.mo` = modal overlay, `.md` = modal dialog)
- No semicolons in JSX, arrow functions preferred, minimal whitespace in data constants
- Helper function names are terse: `gid` (generate ID), `ds` (default segment), `ruName` (Russian name lookup)
