# Canvas Mode — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить canvas-режим для визуального проектирования систем меню: несколько GUI на одной поверхности, перемещение, стрелки переходов.

**Architecture:** Два режима App: `editor` (текущий) и `canvas`. Canvas — pannable/zoomable div с MiniMenu карточками и SVG-стрелками. Workspace хранится в localStorage. Двойной клик по меню → переход в editor.

**Tech Stack:** React 18 (существующий), SVG для стрелок, CSS transforms для pan/zoom.

**File:** `index.html` — единственный файл проекта.

---

## Task 1: Workspace Storage

**Files:**
- Modify: `index.html` — секция Storage (~строка 720)

- [ ] **Step 1: Добавить функции хранения workspace**

После существующих storage-функций (`savePrefs`, `loadPrefs`) добавить:

```javascript
function saveWS(ws){try{localStorage.setItem(`${PFX}:ws:${ws.id}`,JSON.stringify(ws));const idx=JSON.parse(localStorage.getItem(`${PFX}:wsi`)||"[]");if(!idx.includes(ws.id)){idx.push(ws.id);localStorage.setItem(`${PFX}:wsi`,JSON.stringify(idx));};}catch(e){}}
function loadWS(id){try{return JSON.parse(localStorage.getItem(`${PFX}:ws:${id}`));}catch(e){return null;}}
function loadWSList(){try{return JSON.parse(localStorage.getItem(`${PFX}:wsi`)||"[]");}catch(e){return[];}}
function delWS(id){try{localStorage.removeItem(`${PFX}:ws:${id}`);const idx=loadWSList().filter(x=>x!==id);localStorage.setItem(`${PFX}:wsi`,JSON.stringify(idx));}catch(e){}}
function newWS(name="Новый workspace"){return{id:gid(),name,menus:[],connections:[]};}
```

- [ ] **Step 2: Commit**

```bash
git add index.html && git commit -m "add workspace storage functions"
```

---

## Task 2: CSS для Canvas

**Files:**
- Modify: `index.html` — секция CSS

- [ ] **Step 1: Добавить CSS**

Перед `</style>` добавить:

```css
.canvas-wrap{flex:1;overflow:hidden;position:relative;background:#0a0a0c;cursor:grab}
.canvas-wrap.grabbing{cursor:grabbing}
.canvas-surf{position:absolute;top:0;left:0;transform-origin:0 0}
.canvas-grid-bg{position:absolute;inset:0;background-image:radial-gradient(circle,#1a1a1e 1px,transparent 1px);background-size:40px 40px;pointer-events:none}
.mm{position:absolute;background:var(--pan);border:1px solid var(--bd);border-radius:var(--r8);box-shadow:0 4px 16px rgba(0,0,0,.4);user-select:none;min-width:120px}
.mm.active{border-color:var(--ac)}
.mm-hdr{padding:4px 8px;font-size:11px;font-weight:600;color:var(--tx1);cursor:grab;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;gap:4px}
.mm-hdr:active{cursor:grabbing}
.mm-grid{display:grid;grid-template-columns:repeat(9,20px);gap:1px;padding:3px}
.mm-sl{width:20px;height:20px;background:#8B8B8B;border:1px solid;border-color:#555 #aaa #aaa #555;display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer}
.mm-sl:hover{outline:1px solid var(--ac);z-index:1}
.mm-sl.conn-src{outline:2px solid #4ade80;z-index:2}
.mm-sl .itx{width:16px;height:16px;image-rendering:pixelated}
.canvas-tb{position:absolute;top:8px;left:50%;transform:translateX(-50%);display:flex;gap:4px;z-index:10}
.conn-line{stroke:var(--ac);stroke-width:2;fill:none;marker-end:url(#arrowhead)}
.conn-line:hover{stroke:#f87171;stroke-width:3;cursor:pointer}
.conn-del{fill:#f87171;cursor:pointer;opacity:0}.conn-line:hover+.conn-del,.conn-del:hover{opacity:1}
```

- [ ] **Step 2: Commit**

```bash
git add index.html && git commit -m "add canvas mode CSS"
```

---

## Task 3: MiniMenu компонент

**Files:**
- Modify: `index.html` — перед `function App()`

- [ ] **Step 1: Создать MiniMenu**

```jsx
function MiniMenu({project,x,y,onDrag,onDblClick,onSlotClick,connectingFrom,isActive}){
  const dragRef=useRef(null);
  const startDrag=e=>{
    if(e.button!==0)return;
    e.stopPropagation();
    const sx=e.clientX-x,sy=e.clientY-y;
    const mv=ev=>onDrag(ev.clientX-sx,ev.clientY-sy);
    const up=()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
    window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);
  };
  return(<div className={"mm"+(isActive?" active":"")} style={{left:x,top:y}} onDoubleClick={onDblClick}>
    <div className="mm-hdr" onMouseDown={startDrag}>
      <span>{project.name}</span>
      <span style={{fontSize:9,color:"var(--tx3)"}}>{project.rows}x9</span>
    </div>
    <div className="mm-grid">
      {Array.from({length:project.rows},(_,r)=>Array.from({length:9},(_,c)=>{
        const k=`${r}-${c}`;const d=project.slots[k];
        const isSrc=connectingFrom&&connectingFrom.menuId===project.id&&connectingFrom.slot===k;
        return <div key={k} className={"mm-sl"+(isSrc?" conn-src":"")}
          onClick={e=>{e.stopPropagation();onSlotClick(project.id,k);}}>
          {d&&<ItemTexture itemId={d.itemId} size={16} potionColor={d.potionColor}/>}
        </div>;
      }))}
    </div>
  </div>);
}
```

- [ ] **Step 2: Commit**

```bash
git add index.html && git commit -m "add MiniMenu component for canvas"
```

---

## Task 4: CanvasView компонент

**Files:**
- Modify: `index.html` — перед `function App()`

- [ ] **Step 1: Создать CanvasView**

```jsx
function CanvasView({workspace,onUpdateWS,onEditMenu,projects}){
  const[pan,setPan]=useState({x:0,y:0});
  const[zoom,setZoom]=useState(1);
  const[connecting,setConnecting]=useState(null); // {menuId,slot}
  const[mousePos,setMousePos]=useState({x:0,y:0});
  const[grabbing,setGrabbing]=useState(false);
  const surfRef=useRef(null);

  const onBgDown=e=>{
    if(e.button!==0)return;
    if(connecting){setConnecting(null);return;}
    setGrabbing(true);
    const sx=e.clientX-pan.x,sy=e.clientY-pan.y;
    const mv=ev=>{setPan({x:ev.clientX-sx,y:ev.clientY-sy});};
    const up=()=>{setGrabbing(false);window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
    window.addEventListener("mousemove",mv);window.addEventListener("mouseup",up);
  };

  const onWheel=e=>{
    e.preventDefault();
    const r=surfRef.current.getBoundingClientRect();
    const mx=e.clientX-r.left,my=e.clientY-r.top;
    const d=e.deltaY>0?0.9:1.1;
    const nz=Math.max(0.2,Math.min(3,zoom*d));
    setPan({x:mx-(mx-pan.x)*nz/zoom,y:my-(my-pan.y)*nz/zoom});
    setZoom(nz);
  };

  const moveMenu=(idx,nx,ny)=>{
    const ws={...workspace,menus:workspace.menus.map((m,i)=>i===idx?{...m,x:Math.round((nx-pan.x)/zoom),y:Math.round((ny-pan.y)/zoom)}:m)};
    onUpdateWS(ws);
  };

  const onSlotClick=(menuId,slot)=>{
    if(!connecting){
      setConnecting({menuId,slot});
    } else {
      if(connecting.menuId===menuId)return; // не к себе
      const conn={id:gid(),fromMenu:connecting.menuId,fromSlot:connecting.slot,toMenu:menuId};
      const ws={...workspace,connections:[...workspace.connections,conn]};
      onUpdateWS(ws);
      setConnecting(null);
    }
  };

  const delConn=id=>{
    const ws={...workspace,connections:workspace.connections.filter(c=>c.id!==id)};
    onUpdateWS(ws);
  };

  const addExisting=id=>{
    if(workspace.menus.find(m=>m.projectId===id))return;
    const ws={...workspace,menus:[...workspace.menus,{projectId:id,x:200+workspace.menus.length*60,y:200+workspace.menus.length*40}]};
    onUpdateWS(ws);
  };

  const addNew=()=>{
    const p=newProj("Меню "+(workspace.menus.length+1),3);
    saveProj(p);
    const ws={...workspace,menus:[...workspace.menus,{projectId:p.id,x:200+workspace.menus.length*60,y:200+workspace.menus.length*40}]};
    onUpdateWS(ws);
  };

  const removeFromCanvas=idx=>{
    const ws={...workspace,
      menus:workspace.menus.filter((_,i)=>i!==idx),
      connections:workspace.connections.filter(c=>{const pid=workspace.menus[idx].projectId;return c.fromMenu!==pid&&c.toMenu!==pid;})
    };
    onUpdateWS(ws);
  };

  // Resolve connections to pixel coords
  const getSlotCenter=(menuId,slot)=>{
    const mi=workspace.menus.findIndex(m=>m.projectId===menuId);
    if(mi<0)return null;
    const m=workspace.menus[mi];
    const[r,c]=slot.split("-").map(Number);
    const sx=m.x+3+c*21+10;
    const sy=m.y+28+r*21+10; // 28=header height approx
    return{x:sx,y:sy};
  };
  const getMenuTop=(menuId)=>{
    const mi=workspace.menus.findIndex(m=>m.projectId===menuId);
    if(mi<0)return null;
    const m=workspace.menus[mi];
    return{x:m.x+90,y:m.y};
  };

  return(<div className={"canvas-wrap"+(grabbing?" grabbing":"")} onMouseDown={onBgDown} onWheel={onWheel}
    onMouseMove={e=>setMousePos({x:(e.clientX-pan.x)/zoom,y:(e.clientY-pan.y)/zoom})} ref={surfRef}
    onKeyDown={e=>{if(e.key==="Escape")setConnecting(null);}} tabIndex={0}>
    <div className="canvas-grid-bg" style={{backgroundPosition:`${pan.x}px ${pan.y}px`,backgroundSize:`${40*zoom}px ${40*zoom}px`}}/>
    <div className="canvas-surf" style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`}}>
      {/* SVG arrows */}
      <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",overflow:"visible",pointerEvents:"none",zIndex:5}}>
        <defs><marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="var(--ac)"/></marker></defs>
        {workspace.connections.map(c=>{
          const from=getSlotCenter(c.fromMenu,c.fromSlot);
          const to=getMenuTop(c.toMenu);
          if(!from||!to)return null;
          const dx=to.x-from.x,dy=to.y-from.y;
          const cx1=from.x+dx*0.2,cy1=from.y+dy*0.5;
          const cx2=to.x-dx*0.2,cy2=to.y-dy*0.5;
          return<g key={c.id} style={{pointerEvents:"auto"}}>
            <path className="conn-line" d={`M${from.x},${from.y} C${cx1},${cy1} ${cx2},${cy2} ${to.x},${to.y}`}/>
            <circle cx={(from.x+to.x)/2} cy={(from.y+to.y)/2} r={6} className="conn-del" onClick={()=>delConn(c.id)}/>
            <text x={(from.x+to.x)/2} y={(from.y+to.y)/2+3.5} textAnchor="middle" fontSize="8" fill="#fff" style={{pointerEvents:"none"}}>{"✕"}</text>
          </g>;
        })}
        {connecting&&<line x1={getSlotCenter(connecting.menuId,connecting.slot)?.x||0} y1={getSlotCenter(connecting.menuId,connecting.slot)?.y||0} x2={mousePos.x} y2={mousePos.y} stroke="var(--ac)" strokeWidth={2} strokeDasharray="5,5" style={{pointerEvents:"none"}}/>}
      </svg>
      {/* Menu cards */}
      {workspace.menus.map((m,i)=>{
        const p=projects[m.projectId];
        if(!p)return null;
        return<MiniMenu key={m.projectId} project={p} x={m.x} y={m.y}
          onDrag={(nx,ny)=>moveMenu(i,nx,ny)}
          onDblClick={()=>onEditMenu(m.projectId)}
          onSlotClick={onSlotClick}
          connectingFrom={connecting}
          isActive={false}/>;
      })}
    </div>
    {/* Canvas toolbar */}
    <div className="canvas-tb">
      <input value={workspace.name} onChange={e=>onUpdateWS({...workspace,name:e.target.value})} className="pn" style={{background:"var(--pan)",border:"1px solid var(--bd)",borderRadius:"var(--r8)",padding:"4px 8px",color:"var(--tx1)",fontSize:12,width:160,textAlign:"center"}}/>
      <button className="b" onClick={addNew}>{"+ Новое меню"}</button>
      <select onChange={e=>{if(e.target.value)addExisting(e.target.value);e.target.value="";}} style={{fontSize:11,padding:"4px 6px"}}>
        <option value="">{"+ Существующее..."}</option>
        {loadProjList().filter(id=>!workspace.menus.find(m=>m.projectId===id)).map(id=>{const p=loadProj(id);return p?<option key={id} value={id}>{p.name}</option>:null;})}
      </select>
      <span style={{fontSize:10,color:"var(--tx3)"}}>{Math.round(zoom*100)}%</span>
    </div>
    {connecting&&<div style={{position:"absolute",bottom:12,left:"50%",transform:"translateX(-50%)",background:"var(--ac)",color:"#0f0f11",padding:"4px 12px",borderRadius:"var(--r8)",fontSize:11,fontWeight:600,zIndex:10}}>
      {"Кликните по целевому меню · Esc — отмена"}
    </div>}
  </div>);
}
```

- [ ] **Step 2: Commit**

```bash
git add index.html && git commit -m "add CanvasView component with pan, zoom, arrows, connections"
```

---

## Task 5: Интеграция Canvas в App

**Files:**
- Modify: `index.html` — функция App

- [ ] **Step 1: Добавить state для режима и workspace**

После существующих useState в App:

```javascript
const[mode,setMode]=useState("editor"); // "editor" | "canvas"
const[activeWS,setActiveWS]=useState(null); // текущий workspace объект
const[projectCache,setProjectCache]=useState({}); // {id: project} кэш для canvas
```

- [ ] **Step 2: Добавить функции управления**

```javascript
const refreshProjectCache=ws=>{
  if(!ws)return;
  const cache={};
  for(const m of ws.menus){const p=loadProj(m.projectId);if(p)cache[m.projectId]=p;}
  setProjectCache(cache);
};

const openCanvas=ws=>{
  setActiveWS(ws);
  refreshProjectCache(ws);
  setMode("canvas");
};

const updateWS=ws=>{
  setActiveWS(ws);
  saveWS(ws);
  refreshProjectCache(ws);
};

const editMenuFromCanvas=projectId=>{
  const p=loadProj(projectId);
  if(p){dispatch({type:'LP',project:p});setSelSlot(null);setMultiSel(new Set());setMode("editor");}
};
```

- [ ] **Step 3: Добавить кнопку Canvas в тулбар**

В тулбаре, рядом с бургером:

```jsx
{mode==="editor"&&<button className="b" onClick={()=>{
  const wsList=loadWSList();
  if(wsList.length){const ws=loadWS(wsList[wsList.length-1]);if(ws){openCanvas(ws);return;}}
  const ws=newWS();saveWS(ws);openCanvas(ws);
}} style={{borderColor:"var(--ac)"}}>{"Canvas"}</button>}
{mode==="canvas"&&<button className="b" onClick={()=>setMode("editor")} style={{borderColor:"var(--ac)"}}>{"← Редактор"}</button>}
```

- [ ] **Step 4: Условный рендер workspace vs editor**

Заменить `<div className="workspace">...</div>` на:

```jsx
{mode==="editor"?<div className="workspace">
  <Palette .../>
  <Grid .../>
  <ItemEditor .../>
</div>
:<CanvasView workspace={activeWS} onUpdateWS={updateWS} onEditMenu={editMenuFromCanvas} projects={projectCache}/>}
```

Status bar тоже условный:
```jsx
{mode==="editor"&&<div className="sb">...</div>}
```

- [ ] **Step 5: Добавить управление workspace-ами в бургер-меню**

Добавить в burger dropdown:

```jsx
<div style={{height:1,background:"var(--bd)",margin:"2px 0"}}/>
<button className="b" onClick={()=>{setShowMenu(false);const ws=newWS();saveWS(ws);openCanvas(ws);}}>{"Новый workspace"}</button>
{loadWSList().map(id=>{const ws=loadWS(id);return ws?<button key={id} className="b" onClick={()=>{setShowMenu(false);openCanvas(ws);}}>{ws.name}</button>:null;})}
```

- [ ] **Step 6: Обновить кэш при возврате из editor**

В setMode обёрнутом handler-е — при возврате на canvas обновить кэш чтобы отразить правки в editor:

```javascript
// Когда mode меняется на canvas, обновить кэш текущего проекта
useEffect(()=>{
  if(mode==="canvas"&&activeWS){
    saveProj(proj); // сохранить текущие правки
    refreshProjectCache(activeWS);
  }
},[mode]);
```

- [ ] **Step 7: Commit**

```bash
git add index.html && git commit -m "integrate canvas mode into App: mode switch, workspace management, toolbar"
```

---

## Task 6: Контекстное меню для MiniMenu

**Files:**
- Modify: `index.html` — MiniMenu и CanvasView

- [ ] **Step 1: Добавить onContextMenu на MiniMenu заголовок**

В MiniMenu, на `.mm-hdr` добавить:

```jsx
onContextMenu={e=>{
  e.preventDefault();e.stopPropagation();
  onCtxMenu&&onCtxMenu(e.clientX,e.clientY);
}}
```

- [ ] **Step 2: В CanvasView обработать контекстное меню**

Добавить state:

```javascript
const[mmCtx,setMmCtx]=useState(null); // {x,y,idx}
```

Передать в MiniMenu:

```jsx
onCtxMenu={(cx,cy)=>setMmCtx({x:cx,y:cy,idx:i})}
```

Рендер:

```jsx
{mmCtx&&<CtxMenu x={mmCtx.x} y={mmCtx.y} onClose={()=>setMmCtx(null)} items={[
  {l:"Редактировать",fn:()=>onEditMenu(workspace.menus[mmCtx.idx].projectId)},
  {sep:true},
  {l:"Убрать с canvas",d:true,fn:()=>removeFromCanvas(mmCtx.idx)},
]}/>}
```

- [ ] **Step 3: Commit**

```bash
git add index.html && git commit -m "add context menu for mini menus on canvas"
```

---

## Порядок выполнения

| # | Task | Зависимости | Размер |
|---|------|-------------|--------|
| 1 | Workspace Storage | — | S |
| 2 | CSS для Canvas | — | S |
| 3 | MiniMenu компонент | — | M |
| 4 | CanvasView компонент | Task 1, 3 | L |
| 5 | Интеграция в App | Task 1–4 | L |
| 6 | Контекстное меню MiniMenu | Task 3–5 | S |

Все задачи последовательные (каждая зависит от предыдущих).
