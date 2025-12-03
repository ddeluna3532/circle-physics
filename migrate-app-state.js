import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appFile = path.join(__dirname, 'src', 'App.tsx');
console.log('Reading App.tsx from:', appFile);

let content = fs.readFileSync(appFile, 'utf8');

// List of replacements (setters first, then getters to avoid partial matches)
// Order matters! Do .current refs before bare refs, setters before getters
const replacements = [
  // Refs with .current first (to avoid double-replacement)
  ['draggingRef.current', 'appState.draggingRef.current'],
  ['isPaintingRef.current', 'appState.isPaintingRef.current'],
  ['isErasingRef.current', 'appState.isErasingRef.current'],
  ['erasedThisStroke.current', 'appState.erasedThisStroke.current'],
  ['isLockingRef.current', 'appState.isLockingRef.current'],
  ['lockedThisStroke.current', 'appState.lockedThisStroke.current'],
  ['isRecoloringRef.current', 'appState.isRecoloringRef.current'],
  ['recoloredThisStroke.current', 'appState.recoloredThisStroke.current'],
  ['isMagnetActiveRef.current', 'appState.isMagnetActiveRef.current'],
  ['magnetPosRef.current', 'appState.magnetPosRef.current'],
  ['isFlowDrawingRef.current', 'appState.isFlowDrawingRef.current'],
  ['flowStartRef.current', 'appState.flowStartRef.current'],
  ['lastFlowPosRef.current', 'appState.lastFlowPosRef.current'],
  ['pinchRef.current', 'appState.pinchRef.current'],
  ['mouseRef.current', 'appState.mouseRef.current'],
  ['isSelectingRef.current', 'appState.isSelectingRef.current'],
  ['selectionStartRef.current', 'appState.selectionStartRef.current'],
  ['selectionRectRef.current', 'appState.selectionRectRef.current'],
  ['isDraggingSelectionRef.current', 'appState.isDraggingSelectionRef.current'],
  ['selectionDragStartRef.current', 'appState.selectionDragStartRef.current'],
  ['isPaintSelectingRef.current', 'appState.isPaintSelectingRef.current'],
  ['paintSelectedThisStroke.current', 'appState.paintSelectedThisStroke.current'],
  ['isPaintingLayerRef.current', 'appState.isPaintingLayerRef.current'],
  ['lastPaintPosRef.current', 'appState.lastPaintPosRef.current'],
  ['scaleSliderRef.current', 'appState.scaleSliderRef.current'],
  ['isScalingRef.current', 'appState.isScalingRef.current'],
  ['randomScaleSliderRef.current', 'appState.randomScaleSliderRef.current'],
  ['isRandomScalingRef.current', 'appState.isRandomScalingRef.current'],
  ['isAutoSpawningRef.current', 'appState.isAutoSpawningRef.current'],
  ['isRandomSpawningRef.current', 'appState.isRandomSpawningRef.current'],
  
  // State setters (before getters to avoid partial matches)
  ['setBrushSize', 'appState.setBrushSize'],
  ['setEraseMode', 'appState.setEraseMode'],
  ['setLockMode', 'appState.setLockMode'],
  ['setRecolorMode', 'appState.setRecolorMode'],
  ['setPaintMode', 'appState.setPaintMode'],
  ['setSelectMode', 'appState.setSelectMode'],
  ['setSelectedIds', 'appState.setSelectedIds'],
  ['setMagnetMode', 'appState.setMagnetMode'],
  ['setMagnetStrength', 'appState.setMagnetStrength'],
  ['setMagnetRadius', 'appState.setMagnetRadius'],
  ['setNBodyMode', 'appState.setNBodyMode'],
  ['setNBodyStrength', 'appState.setNBodyStrength'],
  ['setStickyMode', 'appState.setStickyMode'],
  ['setStickyStrength', 'appState.setStickyStrength'],
  ['setFlowMode', 'appState.setFlowMode'],
  ['setFlowVisible', 'appState.setFlowVisible'],
  ['setFlowStrength', 'appState.setFlowStrength'],
  ['setFlowRadius', 'appState.setFlowRadius'],
  ['setCollisionIterations', 'appState.setCollisionIterations'],
  ['setRestitution', 'appState.setRestitution'],
  ['setPhysicsPaused', 'appState.setPhysicsPaused'],
  
  // State getters
  ['brushSize', 'appState.brushSize'],
  ['eraseMode', 'appState.eraseMode'],
  ['lockMode', 'appState.lockMode'],
  ['recolorMode', 'appState.recolorMode'],
  ['paintMode', 'appState.paintMode'],
  ['selectMode', 'appState.selectMode'],
  ['selectedIds', 'appState.selectedIds'],
  ['magnetMode', 'appState.magnetMode'],
  ['magnetStrength', 'appState.magnetStrength'],
  ['magnetRadius', 'appState.magnetRadius'],
  ['nBodyMode', 'appState.nBodyMode'],
  ['nBodyStrength', 'appState.nBodyStrength'],
  ['stickyMode', 'appState.stickyMode'],
  ['stickyStrength', 'appState.stickyStrength'],
  ['flowMode', 'appState.flowMode'],
  ['flowVisible', 'appState.flowVisible'],
  ['flowStrength', 'appState.flowStrength'],
  ['flowRadius', 'appState.flowRadius'],
  ['collisionIterations', 'appState.collisionIterations'],
  ['restitution', 'appState.restitution'],
  ['physicsPaused', 'appState.physicsPaused'],
  
  // Bare refs (after .current refs)
  ['draggingRef', 'appState.draggingRef'],
  ['isPaintingRef', 'appState.isPaintingRef'],
  ['isErasingRef', 'appState.isErasingRef'],
  ['erasedThisStroke', 'appState.erasedThisStroke'],
  ['isLockingRef', 'appState.isLockingRef'],
  ['lockedThisStroke', 'appState.lockedThisStroke'],
  ['isRecoloringRef', 'appState.isRecoloringRef'],
  ['recoloredThisStroke', 'appState.recoloredThisStroke'],
  ['isMagnetActiveRef', 'appState.isMagnetActiveRef'],
  ['magnetPosRef', 'appState.magnetPosRef'],
  ['isFlowDrawingRef', 'appState.isFlowDrawingRef'],
  ['flowStartRef', 'appState.flowStartRef'],
  ['lastFlowPosRef', 'appState.lastFlowPosRef'],
  ['pinchRef', 'appState.pinchRef'],
  ['mouseRef', 'appState.mouseRef'],
  ['isSelectingRef', 'appState.isSelectingRef'],
  ['selectionStartRef', 'appState.selectionStartRef'],
  ['selectionRectRef', 'appState.selectionRectRef'],
  ['isDraggingSelectionRef', 'appState.isDraggingSelectionRef'],
  ['selectionDragStartRef', 'appState.selectionDragStartRef'],
  ['isPaintSelectingRef', 'appState.isPaintSelectingRef'],
  ['paintSelectedThisStroke', 'appState.paintSelectedThisStroke'],
  ['isPaintingLayerRef', 'appState.isPaintingLayerRef'],
  ['lastPaintPosRef', 'appState.lastPaintPosRef'],
  ['scaleSliderRef', 'appState.scaleSliderRef'],
  ['isScalingRef', 'appState.isScalingRef'],
  ['randomScaleSliderRef', 'appState.randomScaleSliderRef'],
  ['isRandomScalingRef', 'appState.isRandomScalingRef'],
  ['isAutoSpawningRef', 'appState.isAutoSpawningRef'],
  ['isRandomSpawningRef', 'appState.isRandomSpawningRef'],
];

// Apply replacements with word boundaries
console.log('\nStarting migration...\n');
let totalReplacements = 0;

replacements.forEach(([find, replace]) => {
  // Use word boundary regex to match whole words only
  const regex = new RegExp(`\\b${find.replace(/\./g, '\\.')}\\b`, 'g');
  const matches = content.match(regex);
  
  if (matches) {
    const count = matches.length;
    console.log(`✓ ${find.padEnd(30)} → ${count} occurrence(s)`);
    totalReplacements += count;
    content = content.replace(regex, replace);
  }
});

// Write back to file
fs.writeFileSync(appFile, content, 'utf8');

console.log('\n' + '='.repeat(60));
console.log(`✅ Migration complete!`);
console.log(`   Total replacements made: ${totalReplacements}`);
console.log(`   File updated: ${appFile}`);
console.log('='.repeat(60));
console.log('\n📋 Next steps:');
console.log('   1. Run: npx tsc --noEmit');
console.log('   2. Run: npm run dev');
console.log('   3. Test all features in browser');
console.log('   4. Commit changes if everything works\n');
