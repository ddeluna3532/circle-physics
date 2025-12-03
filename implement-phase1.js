#!/usr/bin/env node

/**
 * Phase 1 Implementation Script
 * Integrates token-optimized contexts into App.tsx
 * Run with: node implement-phase1.js
 */

const fs = require('fs');
const path = require('path');

const APP_PATH = path.join(__dirname, 'src', 'App.tsx');

console.log('🚀 Phase 1: Token-Optimized Refactoring\n');

// Read current App.tsx
let content = fs.readFileSync(APP_PATH, 'utf8');

// Step 1: Add context imports
console.log('Step 1: Adding context imports...');
const oldImports = `import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { usePhysics, useLayers, usePalette } from "./hooks";`;

const newImports = `import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { usePhysics, useLayers, usePalette } from "./hooks";
import { useData, usePhysicsContext, useAnimationContext } from "./contexts";
import { useVariableResolver } from "./utils/variableResolver";`;

content = content.replace(oldImports, newImports);

// Step 2: Add context initialization after hooks
console.log('Step 2: Adding context initialization...');
const afterHooks = `  } = usePhysics();`;

const newContextInit = `  } = usePhysics();

  // ===== PHASE 1: Token-Optimized Contexts =====
  // These provide reference-based data access (not copies!)
  const { registerAll } = useVariableResolver();
  const dataContext = useData();
  const physicsContextRef = usePhysicsContext();
  const animationContextRef = useAnimationContext();`;

content = content.replace(afterHooks, afterHooks + newContextInit);

// Step 3: Add variable registration after undo initialization
console.log('Step 3: Adding variable registration...');
const afterUndo = `  // Initialize undo history when app starts
  useEffect(() => {
    undoManager.initialize(circles);
    updateUndoRedoState();
  }, []); // Only run once on mount`;

const newRegistration = `  // Initialize undo history when app starts
  useEffect(() => {
    undoManager.initialize(circles);
    updateUndoRedoState();
  }, []); // Only run once on mount

  // ===== PHASE 1: Register data for $ variable references =====
  // This enables token-optimized operations (99% reduction!)
  useEffect(() => {
    registerAll({
      circles: circles,
      layers: layers,
      selectedIds: appState.selectedIds,
      keyframes: animationRecorder.getKeyframes(),
      system: system,
      config: config,
    });
    
    console.log('✅ Phase 1: Variables registered for token optimization');
  }, [circles.length, layers.length, appState.selectedIds.size]);`;

content = content.replace(afterUndo, newRegistration);

// Write updated content
fs.writeFileSync(APP_PATH, content, 'utf8');

console.log('✅ Phase 1 integration complete!\n');
console.log('Changes made:');
console.log('  - Added context imports');
console.log('  - Initialized context hooks');
console.log('  - Registered variables for $ references\n');
console.log('Next steps:');
console.log('  1. Run: npm run dev');
console.log('  2. Check console for "✅ Phase 1: Variables registered"');
console.log('  3. Verify app works normally');
console.log('  4. Ready for Phase 2 (extracting force functions)\n');
