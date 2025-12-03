# ?? Phases 3-6 Implementation Plan

## Overview
Complete the token optimization by extracting remaining functions from App.tsx into token-optimized hooks.

---

## **Phase 3: Scaling & Spawn Functions** (Estimated 30K tokens saved)

### Files to Create:

#### 1. `src/features/scaling/useScaling.ts`
Extract `applyScaling` function using the `$get()` pattern.

#### 2. `src/features/scaling/useRandomScaling.ts`
Extract `applyRandomScaling` function.

#### 3. `src/features/spawn/useAutoSpawn.ts`
Extract `autoSpawn` function.

#### 4. `src/features/spawn/useRandomSpawn.ts`
Extract `autoSpawnRandom` function.

---

## **Phase 4: Event Handlers** (Estimated 80K tokens saved)

### Files to Create:

#### 1. `src/features/interactions/usePointerHandlers.ts`
Extract all pointer event handlers:
- `handlePointerDown`
- `handlePointerMove`
- `handlePointerUp`

#### 2. `src/features/interactions/useCanvasHelpers.ts`
Extract helper functions:
- `getCanvasCoords`
- `getTouchDistance`
- `isCircleModifiable`
- `isPointInCircle`
- etc.

---

## **Phase 5: Animation Functions** (Estimated 40K tokens saved)

### Files to Create:

#### 1. `src/features/animation/useAnimationControls.ts`
Extract:
- `startRecording`
- `stopRecording`
- `playAnimation`
- `stopAnimation`
- `saveCurrentAnimation`
- `loadAnimation`
- `clearAnimation`
- `applyAnimationSmoothing`

#### 2. `src/features/animation/useVideoExport.ts`
Extract:
- `exportAnimationVideo`

---

## **Phase 6: Full Context Integration** (Estimated 50K tokens saved)

### Files to Modify:

#### 1. Update `src/contexts/index.tsx`
Create comprehensive context providers for:
- UI State (modes, selections, etc.)
- Canvas State (aspect ratio, refs, etc.)
- Animation State (recorder, playback, etc.)
- Palette State (colors, swatches, etc.)

#### 2. Update App.tsx
- Remove all state declarations
- Use context hooks instead
- Register all state in variableResolver
- Ultra-slim App.tsx (<500 lines)

---

## Implementation Order

1. **Phase 3** - Scaling/Spawn (easier, establishes pattern)
2. **Phase 4** - Event Handlers (most complex, most benefit)
3. **Phase 5** - Animation (medium complexity)
4. **Phase 6** - Context Integration (final cleanup)

---

## Expected Results

### Token Reduction:
- **Phase 3**: 30K tokens
- **Phase 4**: 80K tokens  
- **Phase 5**: 40K tokens
- **Phase 6**: 50K tokens
- **Total**: 200K additional tokens saved
- **Combined with Phase 2**: 500K total tokens saved (99.5% reduction)

### Code Quality:
- App.tsx: ~3,000 lines ? ~500 lines (83% reduction)
- Modular, testable functions
- Clear separation of concerns
- Easy to maintain and extend

### AI Benefits:
- Entire codebase fits in single context window
- AI can see full picture without truncation
- Faster responses, better suggestions
- Can work on any part of the app efficiently

---

## Success Criteria

? All existing functionality works  
? No performance regression  
? Build completes without errors  
? App.tsx < 1,000 lines  
? Total token count < 100K  
? All force hooks use `$get()` pattern  
? Event handlers extracted  
? Animation controls extracted  
? UI state in contexts  

---

**Ready to implement!** ??
