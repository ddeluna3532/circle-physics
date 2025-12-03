/**
 * Token-Optimized Feature Hooks
 * 
 * Central export point for all Phase 2-5 hooks.
 */

/**
 * PHASE 2: Force Hooks
 */

export { useMagnet } from './physics/forces/useMagnet';
export { useNBody } from './physics/forces/useNBody';
export { useSticky } from './physics/forces/useSticky';

/**
 * PHASE 3: Scaling & Spawn Hooks
 * 
 * Export all Phase 3 hooks for easy importing.
 */

export { useScaling } from './scaling/useScaling';
export { useRandomScaling } from './scaling/useRandomScaling';
export { useAutoSpawn } from './spawn/useAutoSpawn';
export { useRandomSpawn } from './spawn/useRandomSpawn';

/**
 * PHASE 4: Interaction Hooks
 * 
 * Export all Phase 4 hooks for easy importing.
 */

export { usePointerHandlers } from './interactions/usePointerHandlers';
export { useCanvasHelpers } from './interactions/useCanvasHelpers';
export { useSelectionOperations } from './interactions/useSelectionOperations';

/**
 * PHASE 5: Animation Hooks
 * 
 * Export all Phase 5 hooks for easy importing.
 */

export { useAnimationControls } from './animation/useAnimationControls';
export { useVideoExport } from './animation/useVideoExport';
