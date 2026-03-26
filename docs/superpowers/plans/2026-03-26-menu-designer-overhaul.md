# MC Menu Designer — масштабное обновление

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить все недостающие предметы/рендеры, FunTime пресеты, шаблоны из FunMenu, экспорт в FunMenu/AbstractMenus, color picker, градиентные пресеты, ластик, drag-delete и баг-фиксы.

**Architecture:** Всё в одном файле `index.html`. Новые данные добавляются в секцию констант (~строки 190–452). Новые компоненты — в секцию React (~строки 1027–1420). Новые форматы экспорта — в `ExportModal`. Color Picker — отдельный компонент-модалка.

**Tech Stack:** React 18 (UMD), Babel standalone, vanilla CSS, Canvas API (для color picker).

**Файл:** `index.html` — единственный файл, все изменения в нём.

---

## Task 1: Исправление битых ID в ITEM_DB

**Files:**
- Modify: `index.html` — секция ITEM_DB (~строки 190–350)

- [ ] **Step 1: Найти и исправить 4 битых ID**

В `ITEM_DB` найти и заменить:

```javascript
// В категории boats:
// bamboo_boat → bamboo_raft
{id:"bamboo_boat",name:"Bamboo Boat"} → {id:"bamboo_raft",name:"Bamboo Raft"}

// В категории logs:
// bamboo_log → bamboo_block
{id:"bamboo_log",name:"Bamboo Log"} → {id:"bamboo_block",name:"Bamboo Block"}

// В категории misc/tools:
// Удалить horse_armor (абстрактный ID, не существует в MC)
// Уже есть iron_horse_armor, golden_horse_armor, diamond_horse_armor

// В категории saplings:
// mangrove_sapling → mangrove_propagule
{id:"mangrove_sapling",name:"Mangrove Sapling"} → {id:"mangrove_propagule",name:"Mangrove Propagule"}
```

- [ ] **Step 2: Проверить в браузере что предметы отображаются**

Открыть http://localhost:8765, найти bamboo_raft, bamboo_block, mangrove_propagule в палитре — убедиться что рендеры загружаются.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "fix broken item IDs: bamboo_boat, bamboo_log, horse_armor, mangrove_sapling"
```

---

## Task 2: Добавление ~553 недостающих предметов в ITEM_DB

**Files:**
- Modify: `index.html` — секция ITEM_DB (~строки 190–350)

Все предметы ниже имеют готовые рендеры в `assets/minecraft/renders/`. Добавлять новые категории в `ITEM_DB` после существующих.

- [ ] **Step 1: Добавить категорию "Сундуки и хранение"**

После последней существующей категории в `ITEM_DB` добавить:

```javascript
chests:{label:"Сундуки и хранение",items:[
  {id:"chest",name:"Chest"},{id:"trapped_chest",name:"Trapped Chest"},
  {id:"ender_chest",name:"Ender Chest"},{id:"decorated_pot",name:"Decorated Pot"},
  {id:"conduit",name:"Conduit"},{id:"chiseled_bookshelf",name:"Chiseled Bookshelf"},
  {id:"copper_chest",name:"Copper Chest"},
  {id:"exposed_copper_chest",name:"Exposed Copper Chest"},
  {id:"weathered_copper_chest",name:"Weathered Copper Chest"},
  {id:"oxidized_copper_chest",name:"Oxidized Copper Chest"},
  {id:"waxed_copper_chest",name:"Waxed Copper Chest"},
  {id:"waxed_exposed_copper_chest",name:"Waxed Exposed Copper Chest"},
  {id:"waxed_weathered_copper_chest",name:"Waxed Weathered Copper Chest"},
  {id:"waxed_oxidized_copper_chest",name:"Waxed Oxidized Copper Chest"},
]},
```

- [ ] **Step 2: Добавить категорию "Кораллы"**

```javascript
corals:{label:"Кораллы",items:[
  ...(()=>{const types=["brain","bubble","fire","horn","tube"];const r=[];
  for(const t of types){r.push({id:t+"_coral",name:t+" Coral"},{id:t+"_coral_block",name:t+" Coral Block"},{id:t+"_coral_fan",name:t+" Coral Fan"});
  r.push({id:"dead_"+t+"_coral",name:"Dead "+t+" Coral"},{id:"dead_"+t+"_coral_block",name:"Dead "+t+" Coral Block"},{id:"dead_"+t+"_coral_fan",name:"Dead "+t+" Coral Fan"});}return r;})()
]},
```

- [ ] **Step 3: Добавить категорию "Медные блоки"**

```javascript
copper_blocks:{label:"Медные блоки",items:(()=>{
  const stages=["","exposed_","weathered_","oxidized_"];
  const waxed=["waxed_","waxed_exposed_","waxed_weathered_","waxed_oxidized_"];
  const types=["copper","chiseled_copper","copper_bulb","copper_grate","copper_door","copper_trapdoor","cut_copper","cut_copper_slab","cut_copper_stairs","copper_bars","copper_chain","copper_lantern"];
  const r=[];
  for(const s of [...stages,...waxed])for(const t of types){
    const id=s+t;r.push({id,name:id.replace(/_/g," ")});
  }
  return r;
})()},
```

Заметка: это генерирует ~96 предметов. Некоторые комбинации (waxed_copper_bars и т.д.) могут не иметь рендеров — `ItemTexture` автоматически покажет фолбэк, это нормально.

- [ ] **Step 4: Добавить категории "Плиты", "Ступени", "Стены"**

```javascript
slabs:{label:"Плиты",items:[
  ...(_w.map(w=>({id:w+"_slab",name:w.replace(/_/g," ")+" Slab"}))),
  ...(["stone","smooth_stone","cobblestone","stone_brick","mossy_stone_brick","mossy_cobblestone","brick","andesite","diorite","granite","polished_andesite","polished_diorite","polished_granite","sandstone","smooth_sandstone","red_sandstone","smooth_red_sandstone","cut_sandstone","cut_red_sandstone","nether_brick","red_nether_brick","blackstone","polished_blackstone","polished_blackstone_brick","deepslate_brick","deepslate_tile","cobbled_deepslate","polished_deepslate","end_stone_brick","prismarine","prismarine_brick","dark_prismarine","purpur","quartz","smooth_quartz","mud_brick","resin_brick","tuff","polished_tuff","tuff_brick","bamboo_mosaic","petrified_oak"].map(b=>({id:b+"_slab",name:b.replace(/_/g," ")+" Slab"}))),
  ...(["cut_copper","exposed_cut_copper","weathered_cut_copper","oxidized_cut_copper"].map(b=>({id:b+"_slab",name:b.replace(/_/g," ")+" Slab"}))),
]},
stairs:{label:"Ступени",items:[
  ...(_w.map(w=>({id:w+"_stairs",name:w.replace(/_/g," ")+" Stairs"}))),
  ...(["stone","cobblestone","stone_brick","mossy_stone_brick","mossy_cobblestone","brick","andesite","diorite","granite","polished_andesite","polished_diorite","polished_granite","sandstone","smooth_sandstone","red_sandstone","smooth_red_sandstone","nether_brick","red_nether_brick","blackstone","polished_blackstone","polished_blackstone_brick","deepslate_brick","deepslate_tile","cobbled_deepslate","polished_deepslate","end_stone_brick","prismarine","prismarine_brick","dark_prismarine","purpur","quartz","smooth_quartz","mud_brick","resin_brick","tuff","polished_tuff","tuff_brick","bamboo_mosaic"].map(b=>({id:b+"_stairs",name:b.replace(/_/g," ")+" Stairs"}))),
  ...(["cut_copper","exposed_cut_copper","weathered_cut_copper","oxidized_cut_copper"].map(b=>({id:b+"_stairs",name:b.replace(/_/g," ")+" Stairs"}))),
]},
walls:{label:"Стены",items:[
  ...(["cobblestone","mossy_cobblestone","stone_brick","mossy_stone_brick","brick","andesite","diorite","granite","sandstone","red_sandstone","nether_brick","red_nether_brick","blackstone","polished_blackstone","polished_blackstone_brick","deepslate_brick","deepslate_tile","cobbled_deepslate","polished_deepslate","end_stone_brick","prismarine","mud_brick","resin_brick","tuff","polished_tuff","tuff_brick"].map(b=>({id:b+"_wall",name:b.replace(/_/g," ")+" Wall"}))),
]},
```

- [ ] **Step 5: Добавить категории "Заборы", "Кнопки", "Нажимные плиты", "Люки"**

```javascript
fences:{label:"Заборы и калитки",items:[
  ...(_w.map(w=>({id:w+"_fence",name:w.replace(/_/g," ")+" Fence"}))),
  ...(_w.map(w=>({id:w+"_fence_gate",name:w.replace(/_/g," ")+" Fence Gate"}))),
  {id:"nether_brick_fence",name:"Nether Brick Fence"},
]},
buttons:{label:"Кнопки",items:[
  ...(_w.map(w=>({id:w+"_button",name:w.replace(/_/g," ")+" Button"}))),
  {id:"stone_button",name:"Stone Button"},
  {id:"polished_blackstone_button",name:"Polished Blackstone Button"},
]},
pressure_plates:{label:"Нажимные плиты",items:[
  ...(_w.map(w=>({id:w+"_pressure_plate",name:w.replace(/_/g," ")+" Pressure Plate"}))),
  {id:"stone_pressure_plate",name:"Stone Pressure Plate"},
  {id:"polished_blackstone_pressure_plate",name:"Polished Blackstone Pressure Plate"},
  {id:"heavy_weighted_pressure_plate",name:"Heavy Weighted Pressure Plate"},
  {id:"light_weighted_pressure_plate",name:"Light Weighted Pressure Plate"},
]},
trapdoors_cat:{label:"Люки",items:[
  ...(_w.map(w=>({id:w+"_trapdoor",name:w.replace(/_/g," ")+" Trapdoor"}))),
  {id:"iron_trapdoor",name:"Iron Trapdoor"},
]},
```

- [ ] **Step 6: Добавить категории "Древесина", "Stripped", "Освещение", "Растения"**

```javascript
wood_variants:{label:"Древесина и кора",items:[
  ...(_w.filter(w=>!["crimson","warped"].includes(w)).flatMap(w=>[{id:w+"_wood",name:w.replace(/_/g," ")+" Wood"},{id:"stripped_"+w+"_wood",name:"Stripped "+w.replace(/_/g," ")+" Wood"},{id:"stripped_"+w+"_log",name:"Stripped "+w.replace(/_/g," ")+" Log"}])),
  {id:"crimson_hyphae",name:"Crimson Hyphae"},{id:"stripped_crimson_hyphae",name:"Stripped Crimson Hyphae"},{id:"stripped_crimson_stem",name:"Stripped Crimson Stem"},
  {id:"warped_hyphae",name:"Warped Hyphae"},{id:"stripped_warped_hyphae",name:"Stripped Warped Hyphae"},{id:"stripped_warped_stem",name:"Stripped Warped Stem"},
  {id:"stripped_bamboo_block",name:"Stripped Bamboo Block"},
  {id:"bamboo_block",name:"Bamboo Block"},{id:"bamboo_mosaic",name:"Bamboo Mosaic"},
]},
torches:{label:"Освещение",items:[
  {id:"torch",name:"Torch"},{id:"soul_torch",name:"Soul Torch"},
  {id:"redstone_torch",name:"Redstone Torch"},{id:"redstone_lamp",name:"Redstone Lamp"},
]},
plants:{label:"Растения и природа",items:[
  {id:"short_grass",name:"Short Grass"},{id:"tall_grass",name:"Tall Grass"},
  {id:"chorus_flower",name:"Chorus Flower"},{id:"chorus_plant",name:"Chorus Plant"},
  {id:"twisting_vines",name:"Twisting Vines"},{id:"weeping_vines",name:"Weeping Vines"},
  {id:"crimson_roots",name:"Crimson Roots"},{id:"warped_roots",name:"Warped Roots"},
  {id:"crimson_nylium",name:"Crimson Nylium"},{id:"warped_nylium",name:"Warped Nylium"},
  {id:"mangrove_propagule",name:"Mangrove Propagule"},{id:"mangrove_roots",name:"Mangrove Roots"},
  {id:"muddy_mangrove_roots",name:"Muddy Mangrove Roots"},
  {id:"brown_mushroom_block",name:"Brown Mushroom Block"},{id:"red_mushroom_block",name:"Red Mushroom Block"},
  {id:"mushroom_stem",name:"Mushroom Stem"},{id:"sea_pickle",name:"Sea Pickle"},
  {id:"pale_moss_block",name:"Pale Moss Block"},{id:"pale_moss_carpet",name:"Pale Moss Carpet"},
  {id:"pale_hanging_moss",name:"Pale Hanging Moss"},{id:"leaf_litter",name:"Leaf Litter"},
  {id:"firefly_bush",name:"Firefly Bush"},{id:"bush",name:"Bush"},
  {id:"open_eyeblossom",name:"Open Eyeblossom"},{id:"closed_eyeblossom",name:"Closed Eyeblossom"},
  {id:"cactus_flower",name:"Cactus Flower"},{id:"creaking_heart",name:"Creaking Heart"},
]},
```

- [ ] **Step 7: Добавить оставшиеся категории**

```javascript
amethyst:{label:"Аметист",items:[
  {id:"amethyst_cluster",name:"Amethyst Cluster"},
  {id:"large_amethyst_bud",name:"Large Amethyst Bud"},
  {id:"medium_amethyst_bud",name:"Medium Amethyst Bud"},
  {id:"small_amethyst_bud",name:"Small Amethyst Bud"},
]},
sculk_cat:{label:"Скалк",items:[{id:"sculk_vein",name:"Sculk Vein"}]},
functional:{label:"Функциональные блоки",items:[
  {id:"lever",name:"Lever"},{id:"ladder",name:"Ladder"},
  {id:"tripwire_hook",name:"Tripwire Hook"},{id:"end_portal_frame",name:"End Portal Frame"},
  {id:"tipped_arrow",name:"Tipped Arrow"},{id:"recovery_compass",name:"Recovery Compass"},
]},
chest_boats:{label:"Лодки с сундуком",items:[
  ...(_w.filter(w=>!["crimson","warped","bamboo"].includes(w)).map(w=>({id:w+"_chest_boat",name:w.replace(/_/g," ")+" Chest Boat"}))),
  {id:"bamboo_chest_raft",name:"Bamboo Chest Raft"},
]},
mob_buckets:{label:"Вёдра с существами",items:[
  {id:"axolotl_bucket",name:"Axolotl Bucket"},{id:"cod_bucket",name:"Cod Bucket"},
  {id:"salmon_bucket",name:"Salmon Bucket"},{id:"pufferfish_bucket",name:"Pufferfish Bucket"},
  {id:"tropical_fish_bucket",name:"Tropical Fish Bucket"},{id:"tadpole_bucket",name:"Tadpole Bucket"},
]},
building_extra:{label:"Строительные (доп.)",items:[
  {id:"chiseled_deepslate",name:"Chiseled Deepslate"},{id:"chiseled_nether_bricks",name:"Chiseled Nether Bricks"},
  {id:"chiseled_polished_blackstone",name:"Chiseled Polished Blackstone"},
  {id:"chiseled_quartz_block",name:"Chiseled Quartz Block"},{id:"chiseled_sandstone",name:"Chiseled Sandstone"},
  {id:"chiseled_red_sandstone",name:"Chiseled Red Sandstone"},{id:"chiseled_tuff",name:"Chiseled Tuff"},
  {id:"chiseled_tuff_bricks",name:"Chiseled Tuff Bricks"},{id:"chiseled_resin_bricks",name:"Chiseled Resin Bricks"},
  {id:"tuff_bricks",name:"Tuff Bricks"},{id:"polished_tuff",name:"Polished Tuff"},
  {id:"polished_deepslate",name:"Polished Deepslate"},
  {id:"cracked_deepslate_bricks",name:"Cracked Deepslate Bricks"},{id:"cracked_deepslate_tiles",name:"Cracked Deepslate Tiles"},
  {id:"cracked_nether_bricks",name:"Cracked Nether Bricks"},{id:"cracked_polished_blackstone_bricks",name:"Cracked Polished Blackstone Bricks"},
  {id:"cut_sandstone",name:"Cut Sandstone"},{id:"cut_red_sandstone",name:"Cut Red Sandstone"},
  {id:"smooth_basalt",name:"Smooth Basalt"},{id:"mossy_cobblestone",name:"Mossy Cobblestone"},
  {id:"dirt_path",name:"Dirt Path"},{id:"snow",name:"Snow"},
]},
misc_extra:{label:"Разное",items:[
  {id:"rotten_flesh",name:"Rotten Flesh"},{id:"glistering_melon_slice",name:"Glistering Melon Slice"},
  {id:"popped_chorus_fruit",name:"Popped Chorus Fruit"},{id:"music_disc_tears",name:"Music Disc (Tears)"},
  {id:"dried_ghast",name:"Dried Ghast"},{id:"netherite_horse_armor",name:"Netherite Horse Armor"},
  {id:"iron_chain",name:"Iron Chain"},
]},
harnesses:{label:"Упряжь",items:_c.map(c=>({id:c+"_harness",name:c.replace(/_/g," ")+" Harness"}))},
shelves:{label:"Полки",items:_w.map(w=>({id:w+"_shelf",name:w.replace(/_/g," ")+" Shelf"}))},
```

- [ ] **Step 8: Проверить в браузере**

Открыть сайт, прокрутить палитру — убедиться что все новые категории отображаются, рендеры загружаются. Проверить: chest, ender_chest, brain_coral_block, oak_slab, cobblestone_wall, torch, amethyst_cluster.

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "add 553 missing items to palette: chests, corals, copper, slabs, stairs, walls, fences, wood, plants"
```

---

## Task 3: FunTime пресеты в палитре

**Files:**
- Modify: `index.html` — секция ITEM_DB + `defSlot` / палитра логика

FunTime предметы — это не просто материалы, а готовые слоты с полным оформлением (имя, лор, зачарование). Механика отличается от обычных предметов палитры.

- [ ] **Step 1: Добавить структуру FUN_PRESETS**

После `BUILT_TPLS` (перед `// ========== HELPERS`) добавить:

```javascript
const FUN_PRESETS={
  fun_cases:{label:"FT: Ключи от кейсов",preset:true,items:[
    {id:"tripwire_hook",name:"Ключ от Обычного кейса",preset:{displayName:parseMM("<#ff6600>[★]<#ffffe6> Ключ от<#FFC155> Обычного кейса"),lore:[parseMM("<dark_gray>●</dark_gray> <gray>Открывает:</gray> <blue>Обычный кейс"),parseMM("<dark_gray>●</dark_gray> <gray>Место:</gray> <blue>/warp case"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:false}},
    {id:"tripwire_hook",name:"Ключ от кейса с Ресурсами",preset:{displayName:parseMM("<#ff6600>[★]<#ffffe6> Ключ от кейса с<#FFC155> Ресурсами"),lore:[parseMM("<dark_gray>●</dark_gray> <gray>Открывает:</gray> <blue>Кейс с Ресурсами"),parseMM("<dark_gray>●</dark_gray> <gray>Место:</gray> <blue>/warp case"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:false}},
    {id:"tripwire_hook",name:"Ключ от кейса с Токенами",preset:{displayName:parseMM("<#ff6600>[★]<#ffffe6> Ключ от кейса с<#FFC155> Токенами"),lore:[parseMM("<dark_gray>●</dark_gray> <gray>Открывает:</gray> <blue>Кейс с Токенами"),parseMM("<dark_gray>●</dark_gray> <gray>Место:</gray> <blue>/warp case"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:false}},
    {id:"tripwire_hook",name:"Ключ от кейса с Привилегиями",preset:{displayName:parseMM("<#ff6600>[★]<#ffffe6> Ключ от кейса с<#FFC155> Привилегиями"),lore:[parseMM("<dark_gray>●</dark_gray> <gray>Открывает:</gray> <blue>Кейс с Привилегиями"),parseMM("<dark_gray>●</dark_gray> <gray>Место:</gray> <blue>/warp case"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:false}},
    {id:"tripwire_hook",name:"Ключ от кейса с Зачарованиями",preset:{displayName:parseMM("<#ff6600>[★]<#ffffe6> Ключ от кейса с<#FFC155> Зачарованиями"),lore:[parseMM("<dark_gray>●</dark_gray> <gray>Открывает:</gray> <blue>Кейс с Зачарованиями"),parseMM("<dark_gray>●</dark_gray> <gray>Место:</gray> <blue>/warp case"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:false}},
    {id:"tripwire_hook",name:"Ключ от кейса с Оружием",preset:{displayName:parseMM("<#ff6600>[★]<#ffffe6> Ключ от кейса с<#FFC155> Оружием"),lore:[parseMM("<dark_gray>●</dark_gray> <gray>Открывает:</gray> <blue>Кейс с Оружием"),parseMM("<dark_gray>●</dark_gray> <gray>Место:</gray> <blue>/warp case"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:false}},
    {id:"tripwire_hook",name:"Ключ от кейса с Бронёй",preset:{displayName:parseMM("<#ff6600>[★]<#ffffe6> Ключ от кейса с<#FFC155> Бронёй"),lore:[parseMM("<dark_gray>●</dark_gray> <gray>Открывает:</gray> <blue>Кейс с Бронёй"),parseMM("<dark_gray>●</dark_gray> <gray>Место:</gray> <blue>/warp case"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:false}},
  ]},
  fun_talismans:{label:"FT: Талисманы",preset:true,items:[
    {id:"totem_of_undying",name:"Талисман Мрака",preset:{displayName:parseMM("<#ff0000>[★]<#ff6600> Талисман Мрака"),lore:[parseMM("<gray>Атрибуты:"),parseMM("<dark_gray>●</dark_gray> <gray>Урон:</gray> <red>+2"),parseMM("<dark_gray>●</dark_gray> <gray>Скорость:</gray> <red>+5%"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:true}},
    {id:"totem_of_undying",name:"Талисман Демона",preset:{displayName:parseMM("<#ff0000>[★]<#ff6600> Талисман Демона"),lore:[parseMM("<gray>Атрибуты:"),parseMM("<dark_gray>●</dark_gray> <gray>Урон:</gray> <red>+3"),parseMM("<dark_gray>●</dark_gray> <gray>Здоровье:</gray> <red>+2"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:true}},
    {id:"totem_of_undying",name:"Талисман Вихря",preset:{displayName:parseMM("<#ff0000>[★]<#ff6600> Талисман Вихря"),lore:[parseMM("<gray>Атрибуты:"),parseMM("<dark_gray>●</dark_gray> <gray>Скорость:</gray> <red>+15%"),parseMM("<dark_gray>●</dark_gray> <gray>Урон:</gray> <red>+1"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:true}},
    {id:"totem_of_undying",name:"Талисман Крушителя",preset:{displayName:parseMM("<bold><obfuscated><#8D0000>xxx</obfuscated><gradient:#8D0000:#FF0000:#8D0000> Талисман Крушителя </gradient><obfuscated><#8D0000>xxx</obfuscated></bold>"),lore:[parseMM("<gray>Атрибуты:"),parseMM("<dark_gray>●</dark_gray> <gray>Урон:</gray> <red>+6"),parseMM("<dark_gray>●</dark_gray> <gray>Здоровье:</gray> <red>+4"),parseMM("<dark_gray>●</dark_gray> <gray>Броня:</gray> <red>+3"),parseMM(""),parseMM("<gradient:#ADFF00:#B5F100:#BDE300:#C6D500:#CEC700:#D6BA00:#DEAC00:#E69E00:#EF9000:#F78200:#FF7400>Легендарный</gradient>")],enchanted:true}},
  ]},
  fun_weapons:{label:"FT: Оружие",preset:true,items:[
    {id:"netherite_sword",name:"Дезориентация",preset:{displayName:parseMM("<gradient:#5B0000:#FF0000>[★] Дезориентация</gradient>"),lore:[parseMM("<gray>Каст: Звуковая волна"),parseMM("<dark_gray>●</dark_gray> <gray>Оглушает и отбрасывает"),parseMM("<dark_gray>●</dark_gray> <gray>противников вокруг"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:true}},
    {id:"netherite_sword",name:"Божья аура",preset:{displayName:parseMM("<gradient:#5B0000:#FF0000>[★] Божья аура</gradient>"),lore:[parseMM("<gray>Каст: Световая вспышка"),parseMM("<dark_gray>●</dark_gray> <gray>Ослепляет и замедляет"),parseMM("<dark_gray>●</dark_gray> <gray>противников вокруг"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:true}},
    {id:"netherite_sword",name:"Трапка",preset:{displayName:parseMM("<gradient:#5B0000:#FF0000>[★] Трапка</gradient>"),lore:[parseMM("<gray>Каст: Клетка"),parseMM("<dark_gray>●</dark_gray> <gray>Заключает противника"),parseMM("<dark_gray>●</dark_gray> <gray>в стеклянную клетку"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:true}},
  ]},
  fun_modificators:{label:"FT: Модификаторы",preset:true,items:[
    {id:"feather",name:"Модификатор полёта",preset:{displayName:parseMM("<gradient:#77FF67:#6FF0FF:#3E8CFF>[⚡] Модификатор полёта</gradient>"),lore:[parseMM("<gray>Временный доступ к /fly"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:false}},
    {id:"anvil",name:"Модификатор наковальни",preset:{displayName:parseMM("<gradient:#77FF67:#6FF0FF:#3E8CFF>[⚡] Модификатор наковальни</gradient>"),lore:[parseMM("<gray>Временный доступ к /anvil"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:false}},
    {id:"ender_chest",name:"Модификатор эндер-сундука",preset:{displayName:parseMM("<gradient:#77FF67:#6FF0FF:#3E8CFF>[⚡] Модификатор эндер-сундука</gradient>"),lore:[parseMM("<gray>Временный доступ к /ec"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:false}},
  ]},
  fun_events:{label:"FT: Ивентовые",preset:true,items:[
    {id:"player_head",name:"Череп Дракулы",preset:{displayName:parseMM("<gradient:#322E2E:#BC0844:#322E2E:#BC0844>[₪] Череп дракулы</gradient>"),lore:[parseMM("<gradient:#737373:#362F2F>Хеллуинский предмет</gradient>"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:true}},
    {id:"netherite_chestplate",name:"Призрачный нагрудник",preset:{displayName:parseMM("<gradient:#737373:#362F2F>[₪] Призрачный нагрудник</gradient>"),lore:[parseMM("<gradient:#737373:#362F2F>Призрачная броня</gradient>"),parseMM(""),parseMM("<color:#4498DB>[★]</color> <gradient:#4498DB:#DB44C5:#DB8044>Оригинальный предмет</gradient>")],enchanted:true}},
    {id:"totem_of_undying",name:"Талисман Дьявола",preset:{displayName:parseMM("<gradient:#C41010:#362F2F:#C41010:#362F2F:#C41010:#362F2F>[₪] Талисман Дьявола</gradient>"),lore:[parseMM("<gradient:#C41010:#362F2F>Хеллуинский талисман</gradient>"),parseMM(""),parseMM("<gradient:#ADFF00:#B5F100:#BDE300:#C6D500:#CEC700:#D6BA00:#DEAC00:#E69E00:#EF9000:#F78200:#FF7400>Легендарный</gradient>")],enchanted:true}},
  ]},
};
```

- [ ] **Step 2: Объединить FUN_PRESETS с ITEM_DB для палитры**

Перед `function findItem(id)` добавить слияние:

```javascript
for(const[k,v]of Object.entries(FUN_PRESETS))ITEM_DB[k]=v;
```

- [ ] **Step 3: Модифицировать логику размещения предмета для пресетов**

В функции `defSlot` и во всех местах, где вызывается `defSlot(palItem)`, нужно учесть пресеты. Изменить подход: ввести `palPreset` ref рядом с `palItem`.

В `App`:
```javascript
const[palPreset,setPalPreset]=useState(null); // полный пресет, если выбран FunTime предмет
```

В Palette — при клике по предмету с `preset`:
```javascript
// В обработчике клика палитры:
if(item.preset){
  setPalItem(item.id);
  setPalPreset(item.preset);
} else {
  setPalItem(item.id);
  setPalPreset(null);
}
```

В App — при размещении в слот:
```javascript
// Везде где defSlot(palItem), заменить на:
function makeSlot(palItem, palPreset) {
  if(palPreset) return {
    itemId: palItem,
    displayName: palPreset.displayName,
    lore: palPreset.lore,
    amount: 1,
    enchanted: palPreset.enchanted || false,
    customModelData: null,
    hideFlags: 0
  };
  return defSlot(palItem);
}
```

Заменить все вызовы `defSlot(palItem)` на `makeSlot(palItem, palPreset)`.

- [ ] **Step 4: Тултип для пресетов в палитре**

В компоненте `Palette`, при рендеринге предметов (`<div className="pi">`), добавить `onMouseEnter`/`onMouseLeave` для показа `HoverTT` с полным превью пресета (имя + лор в Minecraft-стиле).

- [ ] **Step 5: Проверить в браузере**

Найти категорию "FT: Ключи от кейсов" в палитре. Кликнуть по ключу. Разместить в слот. Убедиться что displayName и lore с цветами отображаются в редакторе справа.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "add FunTime item presets to palette: cases, talismans, weapons, mods, events"
```

---

## Task 4: Фикс ПКМ-drag (контекстное меню после протяжки)

**Files:**
- Modify: `index.html` — обработчики событий в App (~строки 1444–1495)

- [ ] **Step 1: Добавить ref для отслеживания drag-состояния между mouseup и contextmenu**

Проблема: `mouseup` сбрасывает `rmbDragged` до того как `contextmenu` успевает его проверить. Решение — дополнительный ref:

```javascript
// Рядом с существующими refs (строка ~1447):
const rmbWasDragged=useRef(false);
```

- [ ] **Step 2: Изменить mouseup обработчик**

```javascript
// Было:
const h=()=>{painting.current=false;rmbDown.current=false;rmbDragged.current=false;rmbStart.current=null;};

// Стало:
const h=()=>{
  painting.current=false;
  rmbWasDragged.current=rmbDragged.current; // запомнить ДО сброса
  rmbDown.current=false;
  rmbDragged.current=false;
  rmbStart.current=null;
};
```

- [ ] **Step 3: Изменить onSlotCtx**

```javascript
// Было:
if(rmbDragged.current){rmbDown.current=false;rmbDragged.current=false;rmbStart.current=null;return;}

// Стало:
if(rmbWasDragged.current||rmbDragged.current){
  rmbDown.current=false;rmbDragged.current=false;rmbStart.current=null;
  rmbWasDragged.current=false;
  return;
}
rmbWasDragged.current=false;
```

- [ ] **Step 4: Проверить**

В браузере: выбрать предмет в палитре, зажать ПКМ на слоте, провести по нескольким слотам, отпустить. Контекстное меню НЕ должно появиться. Обычный ПКМ-клик без drag — контекстное меню ДОЛЖНО появиться.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "fix context menu appearing after RMB drag painting"
```

---

## Task 5: Middle-click — полная копия слота

**Files:**
- Modify: `index.html` — `onSlotMD` (~строка 1472)

- [ ] **Step 1: Изменить обработчик middle-click**

```javascript
// Было (строка ~1472):
if(e.button===1){e.preventDefault();const d=proj.slots[key];if(d){setPalItem(d.itemId);setRecent(prev=>[d.itemId,...prev.filter(x=>x!==d.itemId)].slice(0,8));}else{setPalItem(null);}return;}

// Стало:
if(e.button===1){
  e.preventDefault();
  const d=proj.slots[key];
  if(d){
    setPalItem(d.itemId);
    // Полная копия слота для размещения
    setPalPreset({
      displayName:JSON.parse(JSON.stringify(d.displayName)),
      lore:JSON.parse(JSON.stringify(d.lore)),
      enchanted:d.enchanted,
      amount:d.amount,
      customModelData:d.customModelData,
      hideFlags:d.hideFlags,
    });
    setRecent(prev=>[d.itemId,...prev.filter(x=>x!==d.itemId)].slice(0,8));
  } else {
    setPalItem(null);
    setPalPreset(null);
  }
  return;
}
```

- [ ] **Step 2: Обновить makeSlot для поддержки amount/customModelData/hideFlags из пресета**

```javascript
function makeSlot(palItem, palPreset) {
  if(palPreset) return {
    itemId: palItem,
    displayName: JSON.parse(JSON.stringify(palPreset.displayName)),
    lore: JSON.parse(JSON.stringify(palPreset.lore || [])),
    amount: palPreset.amount || 1,
    enchanted: palPreset.enchanted || false,
    customModelData: palPreset.customModelData || null,
    hideFlags: palPreset.hideFlags || 0
  };
  return defSlot(palItem);
}
```

- [ ] **Step 3: Сброс palPreset при выборе обычного предмета из палитры**

В обработчике клика палитры убедиться что `setPalPreset(null)` вызывается при выборе обычного (не-пресетного) предмета.

- [ ] **Step 4: Проверить**

Разместить предмет в слот, задать ему кастомное имя и лор. Кликнуть по нему колесиком. Кликнуть ЛКМ по другому слоту — должен появиться полный клон с тем же именем и лором.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "middle-click copies full slot data including name, lore, enchanted"
```

---

## Task 6: Ластик (Eraser tool)

**Files:**
- Modify: `index.html` — палитра, App, стили

- [ ] **Step 1: Добавить CSS для ластика**

В секцию CSS (перед `</style>`):

```css
.pi.eraser{background:rgba(248,113,113,.1);border-color:rgba(248,113,113,.3)}
.pi.eraser:hover{background:rgba(248,113,113,.2);border-color:var(--er)}
.pi.eraser.sel{background:rgba(248,113,113,.2);border-color:var(--er)}
```

- [ ] **Step 2: Добавить специальный ID ластика**

```javascript
const ERASER_ID = "__eraser__";
```

- [ ] **Step 3: Отрисовать ластик в палитре**

В компоненте `Palette`, перед списком категорий, добавить кнопку ластика:

```jsx
<div className="pal-s" style={{borderBottom:"1px solid var(--bd)",paddingBottom:5}}>
  <div className={"pi eraser"+(selItem===ERASER_ID?" sel":"")}
       onClick={()=>onSelect(ERASER_ID)}
       title="Ластик — клик удаляет предмет из слота"
       style={{width:36,height:36,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <span style={{fontSize:18}}>{"🚫"}</span>
  </div>
</div>
```

- [ ] **Step 4: Обработка ластика при клике на слот**

В App, везде где проверяется `palItem` для размещения, добавить проверку:

```javascript
// При ЛКМ-клике по слоту:
if(palItem===ERASER_ID){
  if(proj.slots[key]) dispatch({type:'RS',key});
  setSelSlot(key);
  setMultiSel(new Set());
  return;
}
// При ЛКМ на multiSel:
if(palItem===ERASER_ID && multiSel.size>0){
  const keys=[...multiSel];
  if(key) keys.push(key);
  dispatch({type:'RM',keys:keys.filter(k=>proj.slots[k])});
  setMultiSel(new Set());
  setSelSlot(null);
  return;
}
```

- [ ] **Step 5: Ластик при Alt+drag и RMB-drag**

В `onPaint`, когда `palItem===ERASER_ID`:

```javascript
// Вместо dispatch({type:'SS',key,data:defSlot(palItem)}) делать:
if(palItem===ERASER_ID){
  if(proj.slots[key]) dispatch({type:'RS',key});
} else {
  dispatch({type:'SS',key,data:makeSlot(palItem,palPreset)});
}
```

- [ ] **Step 6: Не помещать ластик в recent**

При обработке ластика не добавлять `ERASER_ID` в `setRecent`.

- [ ] **Step 7: Проверить**

Выбрать ластик в палитре. Кликнуть по заполненному слоту — предмет удалён. Alt+drag по нескольким слотам — все очищены. ПКМ-drag — все очищены.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "add eraser tool to palette for quick slot deletion"
```

---

## Task 7: Drag & drop за пределы грида = удаление

**Files:**
- Modify: `index.html` — Grid компонент, App

- [ ] **Step 1: Добавить state для drag-слота**

```javascript
const[dragSlot,setDragSlot]=useState(null); // ключ слота, который перетаскивается
```

- [ ] **Step 2: Добавить draggable на слоты в Grid**

В компоненте Grid, на каждом div слота:

```jsx
draggable={!!project.slots[key]}
onDragStart={e=>{
  e.dataTransfer.setData("text/plain",key);
  setDragSlot&&setDragSlot(key);
  // Установить drag image из рендера предмета
  const img=e.target.querySelector("img");
  if(img)e.dataTransfer.setDragImage(img,16,16);
}}
onDragEnd={e=>{
  // Если drop произошёл за пределами грида — удалить
  if(e.dataTransfer.dropEffect==="none"&&dragSlot){
    dispatch({type:'RS',key:dragSlot});
    if(selSlot===dragSlot)setSelSlot(null);
  }
  setDragSlot&&setDragSlot(null);
}}
```

- [ ] **Step 3: Добавить drop-зону на грид для перемещения между слотами**

На контейнере грида:

```jsx
onDragOver={e=>e.preventDefault()}
onDrop={e=>{e.preventDefault();/* перемещение обрабатывается на уровне слотов */}}
```

На каждом слоте добавить:

```jsx
onDragOver={e=>{e.preventDefault();e.currentTarget.style.outline="2px solid var(--ac)";}}
onDragLeave={e=>{e.currentTarget.style.outline="";}}
onDrop={e=>{
  e.preventDefault();
  e.currentTarget.style.outline="";
  const from=e.dataTransfer.getData("text/plain");
  if(from&&from!==key)dispatch({type:'MV',from,to:key});
}}
```

- [ ] **Step 4: Визуальная обратная связь при drag за грид**

Добавить CSS:

```css
.sl[draggable=true]{cursor:grab}.sl[draggable=true]:active{cursor:grabbing}
.sl.dragging{opacity:.4}
```

- [ ] **Step 5: Проверить**

Перетащить предмет из одного слота в другой — должен переместиться (swap). Перетащить за пределы грида и отпустить — предмет удалён.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "add drag-and-drop: reorder slots, drag off grid to delete"
```

---

## Task 8: Градиентные пресеты

**Files:**
- Modify: `index.html` — GradientModal компонент (~строки 1342–1416)

- [ ] **Step 1: Добавить массив пресетов**

Перед компонентом `GradientModal`:

```javascript
const GRAD_PRESETS=[
  {name:"Огонь",colors:["#FF0000","#FF6600","#FFFF00"],text:"Огненный текст"},
  {name:"Океан",colors:["#0066FF","#00CCFF","#00FFCC"],text:"Глубины океана"},
  {name:"Закат",colors:["#FF0000","#FF6600","#FF00FF"],text:"Закат солнца"},
  {name:"Радуга",colors:["#FF0000","#FF7700","#FFFF00","#00FF00","#0000FF","#8B00FF"],text:"Радужный текст"},
  {name:"Лёд",colors:["#00FFFF","#0088FF","#FFFFFF"],text:"Ледяной текст"},
  {name:"Оригинальный",colors:["#4498DB","#DB44C5","#DB8044"],text:"Оригинальный предмет"},
  {name:"Легендарный",colors:["#ADFF00","#CEC700","#FF7400"],text:"Легендарный"},
  {name:"Призрачный",colors:["#737373","#362F2F"],text:"Призрачный предмет"},
  {name:"Дьявольский",colors:["#C41010","#362F2F","#C41010"],text:"Талисман Дьявола"},
  {name:"Мистический",colors:["#950000","#FF0000","#950000"],text:"Мистический огонь"},
  {name:"Изумрудный",colors:["#00AA00","#55FF55","#FFFFFF"],text:"Изумрудный блеск"},
  {name:"Золотой",colors:["#FF6600","#FFC155","#FFFFE6"],text:"Золотая надпись"},
  {name:"Неоновый",colors:["#FF00FF","#00FFFF","#FF00FF"],text:"Неоновая вывеска"},
  {name:"Кровавый",colors:["#8D0000","#FF0000","#8D0000"],text:"Кровавый клинок"},
];
```

- [ ] **Step 2: Добавить UI секцию пресетов в GradientModal**

В начале модалки, перед полем ввода текста:

```jsx
<div className="ed-s">
  <div className="ed-st">{"Пресеты"}</div>
  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
    {GRAD_PRESETS.map((p,i)=>{
      const bg=`linear-gradient(90deg,${p.colors.join(",")})`;
      return <button key={i} className="b" style={{background:bg,color:"#fff",textShadow:"0 1px 2px #000",fontSize:10,padding:"3px 8px"}}
        onClick={()=>{setColors(p.colors);setText(p.text);}}>{p.name}</button>;
    })}
  </div>
</div>
```

- [ ] **Step 3: Проверить**

Открыть градиент-модалку. Кликнуть "Огонь" — цвета и текст должны обновиться, превью отрендериться.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "add 14 gradient presets to GradientModal including FunTime color schemes"
```

---

## Task 9: Шаблоны GUI из FunMenu

**Files:**
- Modify: `index.html` — `BUILT_TPLS` (~строка 448)

- [ ] **Step 1: Добавить 8 шаблонов FunMenu в BUILT_TPLS**

После существующих шаблонов (Shop 6x9, Confirm 3x9, Blank) в массиве `BUILT_TPLS` добавить шаблоны: Главное меню, Донат, Навигация, Донат Магазин, Арена смерти, Настройки, Кит-Наборы, Палач.

Каждый шаблон — объект `{name, desc, rows, slots}`. Данные слотов берутся из результатов исследования Task 3 агента (FunMenu templates). Формат:

```javascript
{name:"FT: Главное меню",desc:"Навигация — 9 разделов ромбом",rows:5,slots:(()=>{const s={};
  const g=(id)=>({itemId:id,displayName:[ds(" ")],lore:[],amount:1,enchanted:false,customModelData:null,hideFlags:0});
  // Red glass border corners
  for(const p of["0-0","0-1","0-7","0-8","4-0","4-1","4-7","4-8"])s[p]=g("red_stained_glass_pane");
  for(const p of["1-0","2-0","3-0","1-8","2-8","3-8"])s[p]=g("red_stained_glass_pane");
  // Fill all remaining with orange
  for(let r=0;r<5;r++)for(let c=0;c<9;c++){const k=r+"-"+c;if(!s[k])s[k]=g("orange_stained_glass_pane");}
  // Иконки навигации
  s["1-3"]={itemId:"chest",displayName:[ds("[⚝] ","#FF0000"),ds("Магазин","#FF6600")],lore:[[ds("➥ Нажмите","#FF6600"),ds(", чтобы перейти","#FFE6C0")]],amount:1,enchanted:false,customModelData:null,hideFlags:0};
  s["1-4"]={itemId:"totem_of_undying",displayName:[ds("[⚝] ","#FF0000"),ds("Аукцион","#FF6600")],lore:[[ds("➥ Нажмите","#FF6600"),ds(", чтобы перейти","#FFE6C0")]],amount:1,enchanted:false,customModelData:null,hideFlags:0};
  s["1-5"]={itemId:"crafting_table",displayName:[ds("[⚝] ","#FF0000"),ds("Особые крафты","#FF6600")],lore:[[ds("➥ Нажмите","#FF6600"),ds(", чтобы перейти","#FFE6C0")]],amount:1,enchanted:false,customModelData:null,hideFlags:0};
  s["2-3"]={itemId:"skull_banner_pattern",displayName:[ds("[⚝] ","#FF0000"),ds("Сообщества","#FF6600")],lore:[[ds("➥ Нажмите","#FF6600"),ds(", чтобы ознакомиться","#FFE6C0")]],amount:1,enchanted:false,customModelData:null,hideFlags:0};
  s["2-4"]={itemId:"emerald",displayName:[ds("[⚝] ","#FFFF55"),ds("Донат услуги","#FFFF55")],lore:[[ds("➥ Нажмите","#FF6600"),ds(", чтобы перейти","#FFE6C0")]],amount:1,enchanted:false,customModelData:null,hideFlags:0};
  s["2-5"]={itemId:"firework_rocket",displayName:[ds("[⚝] ","#FF0000"),ds("Дизайн","#FF6600")],lore:[[ds("➥ Нажмите","#FF6600"),ds(", чтобы перейти","#FFE6C0")]],amount:1,enchanted:false,customModelData:null,hideFlags:0};
  s["3-3"]={itemId:"netherite_sword",displayName:[ds("[⚝] ","#FF0000"),ds("Скиллы","#FF6600")],lore:[[ds("➥ Нажмите","#FF6600"),ds(", чтобы перейти","#FFE6C0")]],amount:1,enchanted:false,customModelData:null,hideFlags:0};
  s["3-4"]={itemId:"compass",displayName:[ds("[⚝] ","#FF0000"),ds("Варпы","#FF6600")],lore:[[ds("➥ Нажмите","#FF6600"),ds(", чтобы перейти","#FFE6C0")]],amount:1,enchanted:false,customModelData:null,hideFlags:0};
  s["3-5"]={itemId:"enchanted_book",displayName:[ds("[⚝] ","#FF0000"),ds("Зачарования","#FF6600")],lore:[[ds("➥ Нажмите","#FF6600"),ds(", чтобы перейти","#FFE6C0")]],amount:1,enchanted:false,customModelData:null,hideFlags:0};
  return s;})()},
```

Аналогично для остальных 7 шаблонов (Донат, Навигация, Донат Магазин, Арена смерти, Настройки, Кит-Наборы, Палач) — используя данные из исследования.

- [ ] **Step 2: Проверить**

Кликнуть "Шаблоны" → найти "FT: Главное меню" → применить. Должен появиться 5-рядный грид с красными/оранжевыми стёклами и иконками.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "add 8 FunMenu GUI templates: main menu, donate, warps, shop, arena, settings, kits, palach"
```

---

## Task 10: Color Picker модалка

**Files:**
- Modify: `index.html` — новый компонент + кнопка в тулбаре + CSS

- [ ] **Step 1: Добавить CSS для ColorPicker**

```css
.cpk{display:flex;gap:12px;align-items:flex-start}
.cpk-sq{position:relative;width:200px;height:200px;border-radius:4px;cursor:crosshair}
.cpk-hue{width:20px;height:200px;border-radius:4px;cursor:pointer;position:relative}
.cpk-hue-th,.cpk-sq-th{position:absolute;width:12px;height:12px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 3px rgba(0,0,0,.5);pointer-events:none;transform:translate(-50%,-50%)}
.cpk-prev{width:48px;height:48px;border-radius:4px;border:1px solid var(--bd)}
.cpk-mc{display:grid;grid-template-columns:repeat(8,1fr);gap:3px}
.cpk-mc div{width:24px;height:24px;border-radius:3px;cursor:pointer;border:2px solid transparent}
.cpk-mc div:hover{border-color:var(--tx1)}
```

- [ ] **Step 2: Реализовать компонент ColorPickerModal**

```jsx
function ColorPickerModal({onClose,onApply}){
  const[hue,setHue]=useState(0);
  const[sat,setSat]=useState(100);
  const[val,setVal]=useState(100);
  const[hex,setHex]=useState("#FF0000");
  const[copied,setCopied]=useState(false);
  const sqRef=useRef(null);
  const hueRef=useRef(null);

  // HSV to HEX conversion
  const hsv2hex=(h,s,v)=>{
    s/=100;v/=100;const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
    let r=0,g=0,b=0;
    if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}
    else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
    return rgbToHex(Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255));
  };

  useEffect(()=>{setHex(hsv2hex(hue,sat,val));},[hue,sat,val]);

  // Draw saturation-value square
  useEffect(()=>{
    const c=sqRef.current;if(!c)return;
    const ctx=c.getContext("2d");
    const w=c.width,h=c.height;
    // Hue base color
    const base=hsv2hex(hue,100,100);
    // Horizontal: white → hue
    const gradH=ctx.createLinearGradient(0,0,w,0);
    gradH.addColorStop(0,"#FFFFFF");gradH.addColorStop(1,base);
    ctx.fillStyle=gradH;ctx.fillRect(0,0,w,h);
    // Vertical: transparent → black
    const gradV=ctx.createLinearGradient(0,0,0,h);
    gradV.addColorStop(0,"rgba(0,0,0,0)");gradV.addColorStop(1,"#000000");
    ctx.fillStyle=gradV;ctx.fillRect(0,0,w,h);
  },[hue]);

  // Draw hue strip
  useEffect(()=>{
    const c=hueRef.current;if(!c)return;
    const ctx=c.getContext("2d");
    const grad=ctx.createLinearGradient(0,0,0,c.height);
    for(let i=0;i<=6;i++)grad.addColorStop(i/6,["#FF0000","#FFFF00","#00FF00","#00FFFF","#0000FF","#FF00FF","#FF0000"][i]);
    ctx.fillStyle=grad;ctx.fillRect(0,0,c.width,c.height);
  },[]);

  const onSqMD=e=>{
    const handle=ev=>{const r=sqRef.current.getBoundingClientRect();
      const x=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width));
      const y=Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height));
      setSat(Math.round(x*100));setVal(Math.round((1-y)*100));};
    handle(e);
    const up=()=>{window.removeEventListener("mousemove",handle);window.removeEventListener("mouseup",up);};
    window.addEventListener("mousemove",handle);window.addEventListener("mouseup",up);
  };
  const onHueMD=e=>{
    const handle=ev=>{const r=hueRef.current.getBoundingClientRect();
      const y=Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height));
      setHue(Math.round(y*360));};
    handle(e);
    const up=()=>{window.removeEventListener("mousemove",handle);window.removeEventListener("mouseup",up);};
    window.addEventListener("mousemove",handle);window.addEventListener("mouseup",up);
  };

  const copyHex=()=>{navigator.clipboard.writeText("<"+hex+">");setCopied(true);setTimeout(()=>setCopied(false),1500);};

  const fromHex=h=>{
    // HEX → HSV
    const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);
    const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
    let hh=0;if(d>0){if(mx===r)hh=60*(((g-b)/d)%6);else if(mx===g)hh=60*((b-r)/d+2);else hh=60*((r-g)/d+4);}
    if(hh<0)hh+=360;
    setHue(Math.round(hh));setSat(Math.round(mx?d/mx*100:0));setVal(Math.round(mx/255*100));setHex(h);
  };

  return(<div className="mo" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="md" style={{maxWidth:420}}>
      <div className="md-h">{"Палитра цветов"}<button className="b" onClick={onClose}>{"✕"}</button></div>
      <div className="cpk">
        <div style={{position:"relative"}}>
          <canvas ref={sqRef} width={200} height={200} className="cpk-sq" onMouseDown={onSqMD}/>
          <div className="cpk-sq-th" style={{left:sat*2,top:(100-val)*2}}/>
        </div>
        <div style={{position:"relative"}}>
          <canvas ref={hueRef} width={20} height={200} className="cpk-hue" onMouseDown={onHueMD}/>
          <div className="cpk-hue-th" style={{left:10,top:hue/360*200}}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div className="cpk-prev" style={{background:hex}}/>
          <input value={hex} onChange={e=>{if(/^#[0-9A-Fa-f]{6}$/.test(e.target.value))fromHex(e.target.value.toUpperCase());setHex(e.target.value);}} style={{width:90,fontFamily:"'JetBrains Mono',monospace",fontSize:12}}/>
          <button className="b bp" onClick={copyHex}>{copied?"Скопировано!":"Копировать <#>"}</button>
          {onApply&&<button className="b" onClick={()=>{onApply(hex);onClose();}}>{"Применить"}</button>}
        </div>
      </div>
      <div className="ed-s" style={{marginTop:8}}>
        <div className="ed-st">{"MC цвета"}</div>
        <div className="cpk-mc">
          {MC_COLORS.map((c,i)=><div key={i} style={{background:c.h}} onClick={()=>fromHex(c.h)} title={c.m}/>)}
        </div>
      </div>
    </div>
  </div>);
}
```

- [ ] **Step 3: Добавить кнопку в тулбар и state**

В App:
```javascript
const[showColorPicker,setShowColorPicker]=useState(false);
```

В тулбаре (рядом с кнопкой "Градиент"):
```jsx
<button className="b" onClick={()=>setShowColorPicker(true)} title="Палитра цветов">
  <span style={{display:"inline-block",width:12,height:12,borderRadius:2,background:"linear-gradient(135deg,#ff0000,#00ff00,#0000ff)",marginRight:2}}/>
  {"Цвета"}
</button>
```

В рендере:
```jsx
{showColorPicker&&<ColorPickerModal onClose={()=>setShowColorPicker(false)}/>}
```

- [ ] **Step 4: Интеграция с ItemEditor**

В ItemEditor, рядом с каждым color-input сегмента, добавить маленькую кнопку (🎨), которая открывает ColorPicker с `onApply` — применяет выбранный цвет к данному сегменту.

- [ ] **Step 5: Проверить**

Кликнуть "Цвета" в тулбаре. Выбрать цвет в квадрате. Проверить что hex обновляется. Нажать "Копировать <#>" — в буфере обмена `<#RRGGBB>`. Проверить MC-цвета — клик выбирает цвет.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "add color picker modal with HSV square, hue slider, MC colors, clipboard copy"
```

---

## Task 11: Экспорт в FunMenu (Kotlin preview)

**Files:**
- Modify: `index.html` — ExportModal компонент

- [ ] **Step 1: Добавить функцию генерации Kotlin-кода**

```javascript
function exportFunMenu(proj, className) {
  const rows = proj.rows;
  // Построить pattern: символ для каждого слота (заполнен/пуст)
  const chars = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuv";
  let charIdx = 0;
  const slotChar = {}; // key → char
  const pattern = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < 9; c++) {
      const k = r + "-" + c;
      if (proj.slots[k]) {
        const ch = chars[charIdx++] || "?";
        slotChar[k] = ch;
        line += ch;
      } else {
        line += ".";
      }
    }
    pattern.push(line);
  }

  let code = `package su.funtime.menu.menus.preview\n\n`;
  code += `import org.bukkit.Material\n`;
  code += `import su.funtime.agui.*\n`;
  code += `import su.funtime.menu.FunMenu\n\n`;
  code += `class ${className}(inst: FunMenu) : SingleGUISurface(${rows}, inst) {\n\n`;
  code += `    override fun onUpdateNodes() {\n`;
  code += `        with(newPattern("""\n`;
  for (const line of pattern) code += `            ${line}\n`;
  code += `        """.trimIndent())) {\n`;
  code += `            title { !"${proj.name.replace(/"/g, '\\"')}" }\n\n`;

  // Group identical slots (same material, same display) under one iconAt
  for (const [k, ch] of Object.entries(slotChar)) {
    const d = proj.slots[k];
    if (!d) continue;
    const mat = d.itemId.toUpperCase();
    code += `            iconAt(pos('${ch}')) {\n`;
    code += `                type(Material.${mat})\n`;
    // Name
    const nameSegs = d.displayName || [];
    if (nameSegs.length > 0 && nameSegs.some(s => s.text.trim())) {
      const nameStr = nameSegs.map(s => {
        const hex = s.color.replace("#", "");
        return `"${hex}".hex + "${s.text.replace(/"/g, '\\"')}"`;
      }).join(" + ");
      code += `                name(${nameStr})\n`;
    } else {
      code += `                name(!" ")\n`;
    }
    // Lore
    for (const loreLine of (d.lore || [])) {
      if (!loreLine || !loreLine.length) { code += `                loreLine(!F_BONE + "")\n`; continue; }
      const loreStr = loreLine.map(s => {
        const hex = s.color.replace("#", "");
        return `"${hex}".hex + "${s.text.replace(/"/g, '\\"')}"`;
      }).join(" + ");
      code += `                loreLine(${loreStr})\n`;
    }
    if (d.enchanted) code += `                glow()\n`;
    code += `                allFlags()\n`;
    code += `            }\n`;
  }

  code += `        }\n    }\n}\n`;
  return code;
}
```

- [ ] **Step 2: Добавить вкладку в ExportModal**

В ExportModal, добавить вкладку "FunMenu". При выборе — показать input "Название класса" (по умолчанию `proj.name.replace(/[^a-zA-Z0-9]/g,"")+"GUI"`), и сгенерированный Kotlin-код в `<div className="md-code">`.

Форматы экспорта (tabs): JSON | YAML | §-Codes | MiniMessage | **FunMenu** | **AbstractMenus**

- [ ] **Step 3: Проверить**

Создать меню с несколькими слотами. Экспорт → FunMenu. Убедиться что Kotlin-код содержит правильный pattern, iconAt для каждого слота, Material, name, lore.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "add FunMenu Kotlin export: preview-only SingleGUISurface class"
```

---

## Task 12: Экспорт в AbstractMenus (.conf)

**Files:**
- Modify: `index.html` — ExportModal компонент

- [ ] **Step 1: Добавить функцию генерации HOCON**

```javascript
function exportAbstractMenus(proj, command) {
  const rows = proj.rows;
  let conf = `title: "${seg2amTitle(proj.name)}"\n`;
  conf += `size: ${rows}\n`;
  conf += `activators {\n  command: "${command}"\n}\n`;
  conf += `items: [\n`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 9; c++) {
      const k = r + "-" + c;
      const d = proj.slots[k];
      if (!d) continue;
      const slot = r * 9 + c;
      conf += `  {\n`;
      conf += `    slot: ${slot}\n`;
      conf += `    material: ${d.itemId.toUpperCase()}\n`;

      // Name: use &-codes + <#HEX> format
      const name = seg2amText(d.displayName);
      if (name) conf += `    name: "${name}"\n`;

      // Lore
      if (d.lore && d.lore.length > 0) {
        conf += `    lore: [\n`;
        for (const line of d.lore) {
          conf += `      "${seg2amText(line)}"\n`;
        }
        conf += `    ]\n`;
      }

      if (d.enchanted) conf += `    glow: true\n`;
      if (d.amount > 1) conf += `    count: ${d.amount}\n`;
      conf += `    flags: ["HIDE_ATTRIBUTES","HIDE_ENCHANTS"]\n`;
      conf += `  }\n`;
    }
  }

  conf += `]\n`;
  return conf;
}

// AbstractMenus text formatting: <#HEX> for hex colors, &l/&o for formatting
function seg2amText(segs) {
  if (!segs || !segs.length) return "";
  let r = "";
  for (const s of segs) {
    r += "<" + s.color + ">";
    if (s.bold) r += "&l";
    if (s.italic) r += "&o";
    if (s.underlined) r += "&n";
    if (s.strikethrough) r += "&m";
    if (s.obfuscated) r += "&k";
    r += s.text;
  }
  return r;
}

function seg2amTitle(name) {
  // Simple title — just &-codes
  return "&8" + name;
}
```

- [ ] **Step 2: Добавить вкладку в ExportModal**

Вкладка "AbstractMenus". Input "Команда открытия" (по умолчанию `proj.name.toLowerCase().replace(/[^a-z0-9]/g,"")` или "menu"). Сгенерированный .conf код в `<div className="md-code">`.

- [ ] **Step 3: Проверить**

Экспорт → AbstractMenus. Убедиться что генерируется валидный HOCON с title, size, activators, items. Каждый предмет имеет slot (числовой индекс), material, name с цветами, lore.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "add AbstractMenus .conf export with HOCON format, command activator"
```

---

## Task 13: Улучшения UI

**Files:**
- Modify: `index.html` — CSS + компоненты

- [ ] **Step 1: Enchanted glow CSS-эффект на слотах**

Добавить CSS:

```css
.sl-ench{position:relative;overflow:hidden}
.sl-ench::after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,transparent 30%,rgba(167,139,250,.15) 50%,transparent 70%);background-size:200% 200%;animation:enchGlow 3s ease-in-out infinite;pointer-events:none;border-radius:3px}
@keyframes enchGlow{0%{background-position:200% 0}100%{background-position:-200% 0}}
```

В Grid, добавить класс `sl-ench` к слоту если `data.enchanted`:

```jsx
className={"sl"+(data?.enchanted?" sl-ench":"")+(isSelected?" ss":"")+(isMulti?" sm":"")}
```

- [ ] **Step 2: Отображение amount > 1 в углу слота**

В Grid, внутри div слота, после `<ItemTexture>`:

```jsx
{data&&data.amount>1&&<span style={{position:"absolute",bottom:1,right:3,fontSize:10,fontWeight:700,color:"#fff",textShadow:"1px 1px 0 #000,-1px 1px 0 #000,1px -1px 0 #000,-1px -1px 0 #000",pointerEvents:"none",fontFamily:"'Minecraft',monospace"}}>{data.amount}</span>}
```

- [ ] **Step 3: Ctrl+D — дублирование слота**

В обработчике keydown:

```javascript
if(e.ctrlKey&&e.key==="d"){
  e.preventDefault();
  if(selSlot&&proj.slots[selSlot]){
    // Найти следующий пустой слот
    const[r,c]=selSlot.split("-").map(Number);
    for(let nc=c+1;nc<9;nc++){
      const nk=r+"-"+nc;
      if(!proj.slots[nk]){dispatch({type:'SS',key:nk,data:JSON.parse(JSON.stringify(proj.slots[selSlot]))});setSelSlot(nk);break;}
    }
  }
}
```

- [ ] **Step 4: Проверить**

- Enchanted слоты мерцают фиолетовым
- Amount > 1 виден в правом нижнем углу слота
- Ctrl+D дублирует слот вправо

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "UI: enchanted glow, amount display, Ctrl+D duplicate slot"
```

---

## Порядок выполнения

| # | Task | Зависимости | Размер |
|---|------|-------------|--------|
| 1 | Фикс битых ID | — | S |
| 2 | 553 новых предмета | Task 1 | L |
| 3 | FunTime пресеты | Task 2 (ITEM_DB) | L |
| 4 | Фикс ПКМ-drag | — | S |
| 5 | Middle-click полная копия | Task 3 (palPreset) | M |
| 6 | Ластик | Task 3 (palItem logic) | M |
| 7 | Drag-delete | — | M |
| 8 | Градиентные пресеты | — | S |
| 9 | Шаблоны FunMenu | — | L |
| 10 | Color Picker | — | L |
| 11 | Экспорт FunMenu | — | M |
| 12 | Экспорт AbstractMenus | — | M |
| 13 | Улучшения UI | — | M |

**Параллельные группы:**
- Group A (данные): Task 1 → Task 2 → Task 3 → Task 5 → Task 6
- Group B (баги): Task 4
- Group C (независимые фичи): Task 7, Task 8, Task 9, Task 10, Task 11, Task 12, Task 13

Tasks 4, 7, 8, 9, 10, 11, 12, 13 могут выполняться параллельно друг с другом и с Group A.
