#!/usr/bin/env node
// Syncs custom textures from FunTime resourcepack into GUICreator assets.
// Usage: node sync-resourcepack.js [path-to-resourcepack]
// Default path: C:\resourcepack

const fs = require("fs");
const path = require("path");

const rpPath = process.argv[2] || "C:\\resourcepack";
const outDir = path.join(__dirname, "assets", "resourcepack");
const outTexDir = path.join(outDir, "textures");
const modelsDir = path.join(rpPath, "assets", "minecraft", "models", "item");
const rpTexBase = path.join(rpPath, "assets", "minecraft", "textures");
const rpModelsBase = path.join(rpPath, "assets", "minecraft", "models");

if (!fs.existsSync(modelsDir)) {
  console.error("Models dir not found:", modelsDir);
  process.exit(1);
}

fs.mkdirSync(outTexDir, { recursive: true });

const index = {}; // { "trial_key:1": "resourcepack/textures/cases/usual_key.png", ... }
let copied = 0;

function readJSON(fp) {
  try { return JSON.parse(fs.readFileSync(fp, "utf-8")); } catch { return null; }
}

function resolveTexture(modelRef) {
  // modelRef like "item/keys/usual_key" or "funtime/new_year/candy1"
  const clean = modelRef.replace("minecraft:", "");
  const modelPath = path.join(rpModelsBase, clean + ".json");
  const model = readJSON(modelPath);
  if (!model) return null;

  // Get layer0 texture
  const tex = model.textures && (model.textures.layer0 || model.textures.texture);
  if (!tex) {
    // Check parent
    if (model.parent && model.parent !== "item/generated" && model.parent !== "minecraft:item/generated") {
      return resolveTexture(model.parent.replace("minecraft:", ""));
    }
    return null;
  }

  const texClean = tex.replace("minecraft:", "");
  const texPath = path.join(rpTexBase, texClean + ".png");
  return fs.existsSync(texPath) ? { texRef: texClean, texPath } : null;
}

// Scan all item model files
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith(".json"));

for (const file of files) {
  const itemId = file.replace(".json", "");
  const model = readJSON(path.join(modelsDir, file));
  if (!model || !model.overrides) continue;

  for (const ov of model.overrides) {
    const pred = ov.predicate;
    if (!pred || pred.custom_model_data === undefined) continue;
    // Skip entries with additional predicates (pulling, pull, etc.)
    const keys = Object.keys(pred);
    if (keys.length > 1 && keys.some(k => k !== "custom_model_data")) continue;

    const cmd = pred.custom_model_data;
    const modelRef = ov.model;
    if (!modelRef) continue;

    const resolved = resolveTexture(modelRef);
    if (!resolved) continue;

    // Copy texture
    const outName = `${itemId}_cmd${cmd}.png`;
    const dest = path.join(outTexDir, outName);
    try {
      fs.copyFileSync(resolved.texPath, dest);
      index[`${itemId}:${cmd}`] = `assets/resourcepack/textures/${outName}`;
      copied++;
    } catch (e) {
      console.warn("  Failed to copy:", resolved.texPath, e.message);
    }
  }
}

// Write index
fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(index, null, 2));
console.log(`Synced ${copied} textures, ${Object.keys(index).length} mappings`);
console.log("Output:", outDir);
