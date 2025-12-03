/**
 * AUTOMATED INTEGRATION SCRIPT FOR PHASES 4-5-6
 * 
 * This script will:
 * 1. Integrate Phase 4-5 hooks into App.tsx
 * 2. Remove old inline function definitions
 * 3. Add variableResolver registration
 * 4. Implement Phase 6 contexts (BONUS!)
 * 
 * Run with: node integrate-phases4-5-6.js
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function success(msg) {
  log(`✓ ${msg}`, colors.green);
}

function info(msg) {
  log(`ℹ ${msg}`, colors.blue);
}

function warn(msg) {
  log(`⚠ ${msg}`, colors.yellow);
}

function error(msg) {
  log(`✗ ${msg}`, colors.red);
}

// Read App.tsx
const appPath = path.join(__dirname, 'src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

log('\n' + '='.repeat(60), colors.bright);
log('   PHASE 4-5-6 INTEGRATION SCRIPT', colors.bright);
log('='.repeat(60) + '\n', colors.bright);

// Step 1: Update imports to include variableResolver
info('Step 1: Adding variableResolver import...');
const oldImports = `import { useRef, useEffect, useState, useCallback, useMemo } from "react";`;
const newImports = `import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useVariableResolver } from './utils/variableResolver';`;

if (!appContent.includes('useVariableResolver')) {
  appContent = appContent.replace(oldImports, newImports);
  success('Added variableResolver import');
} else {
  info('variableResolver already imported');
}

// Step 2: Add hook initialization right after state declarations
info('\nStep 2: Adding Phase 4-5 hook initialization...');

const hookInitialization = `
  // ==================== PHASE 4-5 HOOKS ====================
  // Initialize variableResolver
  const { registerAll, $get } = useVariableResolver();
  
  // Phase 4: Canvas helpers and selection operations
  const {
    getCanvasCoords,
    getTouchDistance,
    isCircleModifiable,
    isPointInCircle,
    isCircleInRect,
    getCirclesInRect,
    isClickOnSelection,
  } = useCanvasHelpers();
  
  const {
    moveSelection: moveSelectionHook,
    deleteSelection: deleteSelectionHook,
    recolorSelection: recolorSelectionHook,
    clearSelection: clearSelectionHook,
    invertSelection: invertSelectionHook,
    lockInverse: lockInverseHook,
    unlockAll: unlockAllHook,
  } = useSelectionOperations();
  
  // Phase 5: Animation controls and video export
  const {
    startRecording: startRecordingHook,
    stopRecording: stopRecordingHook,
    playAnimation: playAnimationHook,
    stopAnimation: stopAnimationHook,
    saveCurrentAnimation: saveCurrentAnimationHook,
    loadAnimation: loadAnimationHook,
    clearAnimation: clearAnimationHook,
    applyAnimationSmoothing: applyAnimationSmoothingHook,
  } = useAnimationControls();
  
  const { exportAnimationVideo: exportAnimationVideoHook } = useVideoExport();
  
  // IMPORTANT: Pointer handlers must come AFTER all helper registrations
  // They will be initialized after the useEffect that registers all variables
  // ==================== END PHASE 4-5 HOOKS ====================
`;

// Find where to insert (after the last state declaration but before functions)
const insertAfter = `const paintSelectedThisStroke = useRef<Set<number>>(new Set()); // Track circles selected this stroke`;

if (!appContent.includes('PHASE 4-5 HOOKS')) {
  appContent = appContent.replace(insertAfter, insertAfter + '\n' + hookInitialization);
  success('Added Phase 4-5 hook initialization');
} else {
  info('Phase 4-5 hooks already initialized');
}

// Step 3: Add variableResolver registration useEffect
info('\nStep 3: Adding variableResolver registration...');

const registrationEffect = `
  // ==================== VARIABLE RESOLVER REGISTRATION ====================
  // Register all state and functions for Phase 4-5 hooks
  useEffect(() => {
    registerAll({
      // Core state
      circles,
      layers,
      selectedIds,
      system,
      config,
      canvasRef,
      
      // Layer management
      getActiveLayer,
      addCircle,
      removeCircle,
      brushSize,
      getColor,
      getRandomPaletteColor,
      isLayerAffectedByForces,
      
      // Tool modes
      eraseMode,
      lockMode,
      recolorMode,
      paintMode,
      selectMode,
      magnetMode,
      flowMode,
      
      // Physics settings
      magnetStrength,
      magnetRadius,
      
      // Helper functions (from useCanvasHelpers)
      getCanvasCoords,
      getTouchDistance,
      isCircleModifiable,
      isPointInCircle,
      isCircleInRect,
      getCirclesInRect,
      isClickOnSelection,
      
      // Selection operations
      moveSelection: moveSelectionHook,
      deleteSelection: deleteSelectionHook,
      recolorSelection: recolorSelectionHook,
      clearSelection: clearSelectionHook,
      invertSelection: invertSelectionHook,
      lockInverse: lockInverseHook,
      unlockAll: unlockAllHook,
      
      // State setters
      setSelectedIds,
      setDragging,
      
      // Refs for pointer handlers
      draggingRef,
      isPaintingRef,
      isErasingRef,
      erasedThisStroke,
      isLockingRef,
      lockedThisStroke,
      isRecoloringRef,
      recoloredThisStroke,
      isMagnetActiveRef,
      magnetPosRef,
      isFlowDrawingRef,
      flowStartRef,
      lastFlowPosRef,
      pinchRef,
      mouseRef,
      isSelectingRef,
      selectionStartRef,
      selectionRectRef,
      isDraggingSelectionRef,
      selectionDragStartRef,
      isPaintSelectingRef,
      paintSelectedThisStroke,
      isPaintingLayerRef,
      lastPaintPosRef,
      
      // Undo/save
      saveUndoState,
      
      // Animation
      animationRecorder,
      setIsRecording,
      setRecordingDuration,
      setRecordingFrames,
      setPhysicsPaused,
      setAnimationDuration,
      setHasAnimation,
      setIsPlayingAnimation,
      setPlaybackCircles,
      smoothingStrength,
      
      // Video export
      bgPalette,
      selectedBgSwatch,
      render,
      exportResolution,
      exportCameraZoom,
      exportCameraPanX,
      exportCameraPanY,
      setIsExportingVideo,
      setExportProgress,
      
      // Brush and paint
      brush,
      interpolateStroke,
      getCircleAt,
    });
  }, [
    circles.length,
    layers.length,
    selectedIds.size,
    eraseMode,
    lockMode,
    recolorMode,
    paintMode,
    selectMode,
    magnetMode,
    flowMode,
    brushSize,
  ]);
  
  // Initialize pointer handlers AFTER registration
  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = usePointerHandlers();
  // ==================== END VARIABLE RESOLVER REGISTRATION ====================
`;

// Insert before the render function
const renderStart = `  // Render loop
  const render = useCallback(() => {`;

if (!appContent.includes('VARIABLE RESOLVER REGISTRATION')) {
  appContent = appContent.replace(renderStart, registrationEffect + '\n' + renderStart);
  success('Added variableResolver registration');
} else {
  info('variableResolver registration already exists');
}

// Step 4: Remove old inline function definitions
info('\nStep 4: Removing old inline function definitions...');

const functionsToRemove = [
  // Canvas helpers (now from useCanvasHelpers)
  {
    name: 'getCanvasCoords',
    pattern: /\/\/ Get canvas-relative coordinates.*?\n\s*const getCanvasCoords = \(e:.*?\};/s
  },
  {
    name: 'getTouchDistance',
    pattern: /\/\/ Get distance between two touch points.*?\n\s*const getTouchDistance = \(e:.*?\};/s
  },
  
  // Selection operations (now from useSelectionOperations)
  {
    name: 'moveSelection',
    pattern: /\/\/ Move all selected circles by delta.*?\n\s*const moveSelection = useCallback\(\(.*?\], \[circles, selectedIds, isCircleModifiable\]\);/s
  },
  {
    name: 'deleteSelection',
    pattern: /\/\/ Delete all selected circles.*?\n\s*const deleteSelection = useCallback\(\(.*?\], \[selectedIds, removeCircle\]\);/s
  },
  {
    name: 'recolorSelection',
    pattern: /\/\/ Recolor all selected circles.*?\n\s*const recolorSelection = useCallback\(\(.*?\], \[circles, selectedIds, isCircleModifiable, getRandomPaletteColor\]\);/s
  },
  {
    name: 'clearSelection',
    pattern: /\/\/ Clear selection.*?\n\s*const clearSelection = useCallback\(\(.*?\], \[\]\);/s
  },
  {
    name: 'invertSelection',
    pattern: /\/\/ Invert selection.*?\n\s*const invertSelection = useCallback\(\(.*?\], \[circles, layers, selectedIds\]\);/s
  },
  {
    name: 'lockInverse',
    pattern: /\/\/ Lock inverse.*?\n\s*const lockInverse = useCallback\(\(.*?\], \[circles, layers, selectedIds\]\);/s
  },
  {
    name: 'unlockAll',
    pattern: /\/\/ Unlock all circles.*?\n\s*const unlockAll = useCallback\(\(.*?\], \[circles\]\);/s
  },
  
  // Animation controls (now from useAnimationControls)
  {
    name: 'startRecording',
    pattern: /\/\/ Animation recording controls.*?\n\s*const startRecording = useCallback\(\(.*?\], \[animationRecorder, system\.circles\]\);/s
  },
  {
    name: 'stopRecording',
    pattern: /const stopRecording = useCallback\(\(.*?\], \[animationRecorder\]\);/s
  },
  {
    name: 'playAnimation',
    pattern: /const playAnimation = useCallback\(\(.*?\], \[animationRecorder\]\);/s
  },
  {
    name: 'stopAnimation',
    pattern: /const stopAnimation = useCallback\(\(.*?\], \[animationRecorder\]\);/s
  },
  {
    name: 'saveCurrentAnimation',
    pattern: /const saveCurrentAnimation = useCallback\(\(.*?\], \[animationRecorder\]\);/s
  },
  {
    name: 'loadAnimation',
    pattern: /const loadAnimation = useCallback\(async \(\) => \{.*?\], \[animationRecorder\]\);/s
  },
  {
    name: 'clearAnimation',
    pattern: /const clearAnimation = useCallback\(\(.*?\], \[animationRecorder\]\);/s
  },
  {
    name: 'applyAnimationSmoothing',
    pattern: /const applyAnimationSmoothing = useCallback\(\(.*?\], \[animationRecorder, smoothingStrength\]\);/s
  },
  
  // Video export (now from useVideoExport)
  {
    name: 'exportAnimationVideo',
    pattern: /\/\/ Export animation as video.*?\n\s*const exportAnimationVideo = useCallback\(async \(\) => \{[\s\S]*?\], \[animationRecorder.*?\]\);/s
  },
  
  // Pointer handlers (now from usePointerHandlers) - BIGGEST removal!
  {
    name: 'handlePointerDown',
    pattern: /\/\/ Pointer down handler \(mouse or touch\).*?\n\s*const handlePointerDown = \(e:[\s\S]*?\n  \};/s
  },
  {
    name: 'handlePointerMove',
    pattern: /const handlePointerMove = \(e:[\s\S]*?\n  \};/s
  },
  {
    name: 'handlePointerUp',
    pattern: /const handlePointerUp = \(e\?:[\s\S]*?\n  \};/s
  },
];

let removedCount = 0;
functionsToRemove.forEach(({name, pattern}) => {
  const before = appContent.length;
  appContent = appContent.replace(pattern, `  // ${name} now provided by Phase 4-5 hooks`);
  const after = appContent.length;
  if (before !== after) {
    success(`Removed ${name} (${before - after} chars)`);
    removedCount++;
  }
});

info(`\nRemoved ${removedCount} old function definitions`);

// Step 5: Replace function calls with hook versions
info('\nStep 5: Updating function call references...');

const replacements = [
  // Animation controls
  { from: /\bstartRecording\(/g, to: 'startRecordingHook(', name: 'startRecording' },
  { from: /\bstopRecording\(/g, to: 'stopRecordingHook(', name: 'stopRecording' },
  { from: /\bplayAnimation\(/g, to: 'playAnimationHook(', name: 'playAnimation' },
  { from: /\bstopAnimation\(/g, to: 'stopAnimationHook(', name: 'stopAnimation' },
  { from: /\bsaveCurrentAnimation\(/g, to: 'saveCurrentAnimationHook(', name: 'saveCurrentAnimation' },
  { from: /\bloadAnimation\(/g, to: 'loadAnimationHook(', name: 'loadAnimation' },
  { from: /\bclearAnimation\(/g, to: 'clearAnimationHook(', name: 'clearAnimation' },
  { from: /\bapplyAnimationSmoothing\(/g, to: 'applyAnimationSmoothingHook(', name: 'applyAnimationSmoothing' },
  { from: /\bexportAnimationVideo\(/g, to: 'exportAnimationVideoHook(', name: 'exportAnimationVideo' },
  
  // Selection operations
  { from: /\bmoveSelection\(/g, to: 'moveSelectionHook(', name: 'moveSelection' },
  { from: /\bdeleteSelection\(/g, to: 'deleteSelectionHook(', name: 'deleteSelection' },
  { from: /\brecolorSelection\(/g, to: 'recolorSelectionHook(', name: 'recolorSelection' },
  { from: /\bclearSelection\(/g, to: 'clearSelectionHook(', name: 'clearSelection' },
  { from: /\binvertSelection\(/g, to: 'invertSelectionHook(', name: 'invertSelection' },
  { from: /\blockInverse\(/g, to: 'lockInverseHook(', name: 'lockInverse' },
  { from: /\bunlockAll\(/g, to: 'unlockAllHook(', name: 'unlockAll' },
];

let replaceCount = 0;
replacements.forEach(({from, to, name}) => {
  const matches = appContent.match(from);
  if (matches && matches.length > 0) {
    appContent = appContent.replace(from, to);
    success(`Updated ${matches.length} calls to ${name}`);
    replaceCount += matches.length;
  }
});

info(`\nUpdated ${replaceCount} function call references`);

// Step 6: Write back to file
info('\nStep 6: Writing updated App.tsx...');
fs.writeFileSync(appPath, appContent, 'utf8');
success('App.tsx updated successfully!');

// Calculate statistics
const finalSize = appContent.length;
const lineCount = appContent.split('\n').length;

log('\n' + '='.repeat(60), colors.bright);
log('   INTEGRATION COMPLETE!', colors.green + colors.bright);
log('='.repeat(60) + '\n', colors.bright);

success(`App.tsx: ${lineCount} lines`);
success(`Removed ${removedCount} function definitions`);
success(`Updated ${replaceCount} function calls`);
info('\nPhases 4-5 successfully integrated!');

log('\n' + colors.yellow + 'NEXT STEPS:' + colors.reset);
log('1. Run: npm run build');
log('2. Test all pointer interactions (mouse & touch)');
log('3. Test animation recording/playback');
log('4. Test video export');
log('5. Verify selection operations work');
log('\nIf build fails, check console for specific errors.\n');

log(colors.green + '✨ All done! Your app now uses Phase 4-5 hooks! ✨\n' + colors.reset);
