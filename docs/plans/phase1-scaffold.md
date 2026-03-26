# Phase 1: Scaffold — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Инициализировать Vite + React + TypeScript проект, перенести assets, настроить конфиг. Результат: `npm run dev` показывает "MC Menu Designer" с подключёнными стилями и шрифтами.

**Architecture:** Vite SPA с React 18, TypeScript strict mode, CSS Modules для стилей, абсолютные импорты через `@/`.

**Tech Stack:** Vite 6, React 18, TypeScript 5.5, CSS Modules

---

### Task 1: Init Vite project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `src/vite-env.d.ts`

- [ ] **Step 1: Создать Vite проект**

```bash
cd C:\Users\Дима\Downloads\GUICreator
npm create vite@latest . -- --template react-ts
```

Если спрашивает про existing files — выбрать "Ignore files and continue". Vite не затрагивает существующие файлы.

- [ ] **Step 2: Настроить vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 8765,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
})
```

- [ ] **Step 3: Настроить tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Проверить npm install и dev сервер**

```bash
npm install
npm run dev
```

Expected: Vite dev server запускается на localhost:8765, показывает дефолтную Vite страницу.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.node.json src/vite-env.d.ts
git commit -m "init vite + react + typescript project"
```

---

### Task 2: Структура директорий

**Files:**
- Create: все директории из target structure

- [ ] **Step 1: Создать структуру**

```bash
mkdir -p src/{types,store,data,utils,loaders,storage}
mkdir -p src/components/{layout,palette,grid,editor,canvas,modals,shared}
mkdir -p src/styles
```

- [ ] **Step 2: Создать src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from '@/components/layout/App'
import '@/styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 3: Создать src/index.html**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MC Menu Designer</title>
  <link rel="icon" type="image/png" href="/assets/minecraft/textures/item/axolotl_spawn_egg.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

Переместить в корень проекта (Vite ищет index.html в root).

- [ ] **Step 4: Commit**

```bash
git add src/ index.html
git commit -m "project structure and entry points"
```

---

### Task 3: CSS — глобальные стили

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Перенести CSS variables и resets**

Извлечь из текущего index.html строки 13-24 (reset, :root, scrollbar) в `src/styles/global.css`:

```css
@font-face {
  font-family: 'Minecraft';
  src: url('/assets/fonts/Mojangles.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; }

body {
  font-family: 'Inter', system-ui, sans-serif;
  background: var(--bg);
  color: var(--tx1);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

:root {
  --bg: #0f0f11;
  --bg2: #141416;
  --pan: #18181b;
  --srf: #1e1e22;
  --hov: #27272b;
  --tx1: #e4e4e7;
  --tx2: #8b8b96;
  --tx3: #5a5a64;
  --ac: #a78bfa;
  --ac2: #7c5cbf;
  --ac-g: rgba(167, 139, 250, .12);
  --ok: #4ade80;
  --er: #f87171;
  --inf: #60a5fa;
  --bd: #2a2a2e;
  --bd2: #3a3a40;
  --r8: 8px;
}

input, select, button, textarea { font-family: inherit; font-size: inherit; color: inherit; }
button { cursor: pointer; border: none; background: none; }

input, textarea, select {
  background: var(--srf);
  border: 1px solid var(--bd);
  border-radius: 4px;
  padding: 4px 8px;
  color: var(--tx1);
  outline: none;
}
input:focus, textarea:focus, select:focus { border-color: var(--ac); }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bd2); border-radius: 3px; }

#root { height: 100vh; display: flex; flex-direction: column; }
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "global CSS: variables, resets, fonts"
```

---

### Task 4: Placeholder App component

**Files:**
- Create: `src/components/layout/App.tsx`

- [ ] **Step 1: Создать минимальный App**

```tsx
import { useState } from 'react'

export function App() {
  const [mode, setMode] = useState<'editor' | 'canvas'>('editor')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--bd)',
        minHeight: 44,
      }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--tx1)' }}>
          MC Menu Designer
        </span>
        <span style={{ color: 'var(--tx3)', fontSize: 11 }}>
          v4.0 — Vite + TypeScript
        </span>
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--tx3)',
        fontSize: 13,
      }}>
        Migration in progress. Phase 2: Core.
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Проверить в браузере**

```bash
npm run dev
```

Expected: Тёмная страница с заголовком "MC Menu Designer" и текстом "Migration in progress".

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/App.tsx
git commit -m "placeholder App component"
```

---

### Task 5: Assets — переместить в public/

**Files:**
- Move: `assets/` → `public/assets/`

Vite обслуживает статические файлы из `public/`. Текущие `assets/minecraft/`, `assets/funitems/`, `assets/resourcepack/`, `assets/fonts/` должны быть доступны по тем же путям.

- [ ] **Step 1: Переместить assets**

```bash
mkdir -p public
mv assets public/assets
```

- [ ] **Step 2: Обновить .gitignore**

```
node_modules
dist
*.local
```

- [ ] **Step 3: Проверить что assets доступны**

Открыть http://localhost:8765/assets/minecraft/textures/item/diamond_sword.png — должна отобразиться текстура.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "move assets to public/ for Vite static serving"
```

---

### Task 6: Типы — базовые интерфейсы

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Определить core типы**

```typescript
export interface TextSegment {
  text: string
  color: string
  bold: boolean
  italic: boolean
  underlined: boolean
  strikethrough: boolean
  obfuscated: boolean
}

export interface SlotData {
  itemId: string
  displayName: TextSegment[]
  lore: TextSegment[][]
  amount: number
  enchanted: boolean
  customModelData: number | null
  hideFlags: number
  potionColor: string | null
  skullTexture: string | null
  rpTexture: string | null
}

export interface Project {
  id: string
  name: string
  rows: number
  cols: 9
  slots: Record<string, SlotData>
  createdAt: number
  updatedAt: number
}

export interface WorkspaceMenu {
  projectId: string
  x: number
  y: number
}

export interface Connection {
  id: string
  fromMenu: string
  fromSlot: string
  toMenu: string
}

export interface Workspace {
  id: string
  name: string
  menus: WorkspaceMenu[]
  connections: Connection[]
}

export interface ItemEntry {
  id: string
  name: string
  preset?: SlotPreset
}

export interface SlotPreset {
  displayName: TextSegment[]
  lore: TextSegment[][]
  enchanted: boolean
  amount?: number
  customModelData?: number | null
  potionColor?: string | null
  skullTexture?: string | null
  rpTexture?: string | null
}

export interface ItemCategory {
  label: string
  preset?: boolean
  items: ItemEntry[]
}

export type ItemDatabase = Record<string, ItemCategory>

export type ActionType =
  | { type: 'SS'; key: string; data: SlotData }
  | { type: 'SM'; slots: Record<string, SlotData> }
  | { type: 'RS'; key: string }
  | { type: 'RM'; keys: string[] }
  | { type: 'MV'; from: string; to: string }
  | { type: 'SR'; rows: number }
  | { type: 'SN'; name: string }
  | { type: 'CA' }
  | { type: 'FE'; data: SlotData }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LP'; project: Project }
```

- [ ] **Step 2: Проверить компиляцию**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "core TypeScript types: SlotData, Project, Workspace, Segment"
```

---

### Task 7: Smoke test

**Files:**
- Create: `src/utils/__tests__/smoke.test.ts`
- Modify: `package.json` (add vitest)

- [ ] **Step 1: Установить Vitest**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Добавить vitest в vite.config.ts**

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 8765,
    open: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
})
```

Добавить в package.json scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Написать smoke test**

```typescript
// src/utils/__tests__/smoke.test.ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('TypeScript works', () => {
    const x: number = 1 + 1
    expect(x).toBe(2)
  })

  it('imports resolve with @/ alias', async () => {
    const types = await import('@/types')
    expect(types).toBeDefined()
  })
})
```

- [ ] **Step 4: Запустить тесты**

```bash
npm test
```

Expected: 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "vitest setup and smoke tests"
```

---

## Checklist

После Phase 1:
- [x] `npm run dev` — сервер на 8765, тёмная страница с заголовком
- [x] `npm test` — smoke tests зелёные
- [x] `npx tsc --noEmit` — 0 TS errors
- [x] Assets доступны по `/assets/minecraft/...`
- [x] Типы определены: SlotData, Project, Workspace, Segment, ActionType
- [x] Старый `index.html` не тронут — остаётся рабочим

## Next: Phase 2 — Core

Zustand store с undo/redo, утилиты (parseMM, color math, slot helpers), storage, data constants, loaders (FunItems, locale, RP index). Каждая утилита покрыта тестами.
