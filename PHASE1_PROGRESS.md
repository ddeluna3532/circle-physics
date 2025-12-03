# Phase 1 Implementation Progress

## ? Completed

### 1. Created `src/state/useAppState.ts`
- **Lines**: 259 lines
- **Purpose**: Centralized state management for all UI and interaction state
- **Exports**: `AppState` interface and `useAppState()` hook

**What it contains:**
- ? Drawing state (brushSize)
- ? Edit modes (erase, lock, recolor, paint, select)
- ? Force modes (magnet, nBody, sticky, flow)
- ? Collision settings
- ? All interaction refs (dragging, painting, erasing, etc.)
- ? Selection refs
- ? Scaling refs
- ? Auto-spawn refs

---

## ?? Next Steps

### Step 2: Update App.tsx Imports

At the top of `src/App.tsx`, add:

```typescript
import { useAppState } from "./state/useAppState";
```

### Step 3: Replace State Declarations in App.tsx

**FIND and REMOVE** these lines from App.tsx (around lines 52-118):

```typescript
// UI state
const [brushSize, setBrushSize] = useState(30);
const [eraseMode, setEraseMode] = useState(false);
const [lockMode, setLockMode] = useState(false);
const [recolorMode, setRecolorMode] = useState(false);
const [paintMode, setPaintMode] = useState(false);
const [selectMode, setSelectMode] = useState(false);
const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

// Canvas aspect ratio
const [aspectRatio, setAspectRatio] = useState("4:3"); // KEEP THIS - not in hook yet
const [magnetMode, setMagnetMode] = useState<'off' | 'attract' | 'repel'>('off');
const [magnetStrength, setMagnetStrength] = useState(3);
const [magnetRadius, setMagnetRadius] = useState(200);

// Flow field state
const [flowMode, setFlowMode] = useState<'off' | 'draw' | 'erase'>('off');
const [flowVisible, setFlowVisible] = useState(true);
const [flowStrength, setFlowStrength] = useState(0.15);
const [flowRadius, setFlowRadius] = useState(100);

// N-body force state (clump/spread)
const [nBodyMode, setNBodyMode] = useState<'off' | 'clump' | 'spread'>('off');
const [nBodyStrength, setNBodyStrength] = useState(12);
const [stickyMode, setStickyMode] = useState(false);
const [stickyStrength, setStickyStrength] = useState(0.15);

// Collision settings
const [collisionIterations, setCollisionIterations] = useState(3);
const [restitution, setRestitution] = useState(0.6);
const [physicsPaused, setPhysicsPaused] = useState(false);

// ... (all the refs too)
const draggingRef = useRef<Circle | null>(null);
const isPaintingRef = useRef(false);
// ... etc
```

**REPLACE WITH** (add after the `useLayers()` hook call):

```typescript
// App state hook
const appState = useAppState();
```

### Step 4: Update All References

You'll need to update EVERY reference to these variables throughout App.tsx.

**Example transformations:**

? **OLD:**
```typescript
const [brushSize, setBrushSize] = useState(30);
// Later...
<input value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
```

? **NEW:**
```typescript
const appState = useAppState();
// Later...
<input value={appState.brushSize} onChange={(e) => appState.setBrushSize(Number(e.target.value))} />
```

---

## ?? Reference Changes Needed

Here are the most common patterns to update:

### State Variables ? `appState.xxx`

| Old Variable | New Reference |
|-------------|---------------|
| `brushSize` | `appState.brushSize` |
| `setBrushSize` | `appState.setBrushSize` |
| `eraseMode` | `appState.eraseMode` |
| `setEraseMode` | `appState.setEraseMode` |
| `lockMode` | `appState.lockMode` |
| `setLockMode` | `appState.setLockMode` |
| `recolorMode` | `appState.recolorMode` |
| `setRecolorMode` | `appState.setRecolorMode` |
| `paintMode` | `appState.paintMode` |
| `setPaintMode` | `appState.setPaintMode` |
| `selectMode` | `appState.selectMode` |
| `setSelectMode` | `appState.setSelectMode` |
| `selectedIds` | `appState.selectedIds` |
| `setSelectedIds` | `appState.setSelectedIds` |
| `magnetMode` | `appState.magnetMode` |
| `setMagnetMode` | `appState.setMagnetMode` |
| `magnetStrength` | `appState.magnetStrength` |
| `setMagnetStrength` | `appState.setMagnetStrength` |
| `magnetRadius` | `appState.magnetRadius` |
| `setMagnetRadius` | `appState.setMagnetRadius` |
| `nBodyMode` | `appState.nBodyMode` |
| `setNBodyMode` | `appState.setNBodyMode` |
| `nBodyStrength` | `appState.nBodyStrength` |
| `setNBodyStrength` | `appState.setNBodyStrength` |
| `stickyMode` | `appState.stickyMode` |
| `setStickyMode` | `appState.setStickyMode` |
| `stickyStrength` | `appState.stickyStrength` |
| `setStickyStrength` | `appState.setStickyStrength` |
| `flowMode` | `appState.flowMode` |
| `setFlowMode` | `appState.setFlowMode` |
| `flowVisible` | `appState.flowVisible` |
| `setFlowVisible` | `appState.setFlowVisible` |
| `flowStrength` | `appState.flowStrength` |
| `setFlowStrength` | `appState.setFlowStrength` |
| `flowRadius` | `appState.flowRadius` |
| `setFlowRadius` | `appState.setFlowRadius` |
| `collisionIterations` | `appState.collisionIterations` |
| `setCollisionIterations` | `appState.setCollisionIterations` |
| `restitution` | `appState.restitution` |
| `setRestitution` | `appState.setRestitution` |
| `physicsPaused` | `appState.physicsPaused` |
| `setPhysicsPaused` | `appState.setPhysicsPaused` |

### Refs ? `appState.xxxRef`

| Old Ref | New Reference |
|---------|---------------|
| `draggingRef` | `appState.draggingRef` |
| `isPaintingRef` | `appState.isPaintingRef` |
| `isErasingRef` | `appState.isErasingRef` |
| `erasedThisStroke` | `appState.erasedThisStroke` |
| `isLockingRef` | `appState.isLockingRef` |
| `lockedThisStroke` | `appState.lockedThisStroke` |
| `isRecoloringRef` | `appState.isRecoloringRef` |
| `recoloredThisStroke` | `appState.recoloredThisStroke` |
| `isMagnetActiveRef` | `appState.isMagnetActiveRef` |
| `magnetPosRef` | `appState.magnetPosRef` |
| `isFlowDrawingRef` | `appState.isFlowDrawingRef` |
| `flowStartRef` | `appState.flowStartRef` |
| `lastFlowPosRef` | `appState.lastFlowPosRef` |
| `pinchRef` | `appState.pinchRef` |
| `mouseRef` | `appState.mouseRef` |
| `isSelectingRef` | `appState.isSelectingRef` |
| `selectionStartRef` | `appState.selectionStartRef` |
| `selectionRectRef` | `appState.selectionRectRef` |
| `isDraggingSelectionRef` | `appState.isDraggingSelectionRef` |
| `selectionDragStartRef` | `appState.selectionDragStartRef` |
| `isPaintSelectingRef` | `appState.isPaintSelectingRef` |
| `paintSelectedThisStroke` | `appState.paintSelectedThisStroke` |
| `isPaintingLayerRef` | `appState.isPaintingLayerRef` |
| `lastPaintPosRef` | `appState.lastPaintPosRef` |
| `scaleSliderRef` | `appState.scaleSliderRef` |
| `isScalingRef` | `appState.isScalingRef` |
| `randomScaleSliderRef` | `appState.randomScaleSliderRef` |
| `isRandomScalingRef` | `appState.isRandomScalingRef` |
| `isAutoSpawningRef` | `appState.isAutoSpawningRef` |
| `isRandomSpawningRef` | `appState.isRandomSpawningRef` |

---

## ?? Where to Find References

These variables are used extensively throughout App.tsx. Major sections:

1. **useCallback dependencies** (lines ~500-1500)
2. **useEffect dependencies** (lines ~1500-1800)
3. **Event handlers** (handlePointerDown, handlePointerMove, handlePointerUp)
4. **JSX rendering** (lines ~2000-2638)

---

## ?? Quick Find & Replace

Use your editor's find & replace (Ctrl+H) with these patterns:

**Pattern 1: Simple state updates**
- Find: `setBrushSize(`
- Replace: `appState.setBrushSize(`

**Pattern 2: Ref access**
- Find: `draggingRef.current`
- Replace: `appState.draggingRef.current`

**Pattern 3: State checks**
- Find: `if (eraseMode)`
- Replace: `if (appState.eraseMode)`

---

## ?? Important Notes

### DON'T Update These (Not in the hook yet):
- `aspectRatio` / `setAspectRatio` - Canvas state (Phase 2)
- Animation state variables - Animation state (Phase 2)
- Palette variables - Palette state (Phase 2)
- `canvasRef` / `animationRef` - Keep in App.tsx
- `undoManager` / `animationRecorder` - Keep in App.tsx for now

### Dependencies to Update:
Many `useCallback` and `useEffect` hooks have these variables in their dependency arrays. You'll need to update those too:

? **OLD:**
```typescript
const someFunction = useCallback(() => {
  // ...
}, [brushSize, eraseMode, lockMode]);
```

? **NEW:**
```typescript
const someFunction = useCallback(() => {
  // ...
}, [appState.brushSize, appState.eraseMode, appState.lockMode]);
```

---

## ? Testing Checklist

After making all changes, test these features:

- [ ] Can draw circles by clicking/dragging
- [ ] Brush size slider works
- [ ] Erase mode works
- [ ] Lock mode works
- [ ] Recolor mode works
- [ ] Select mode works (marquee selection)
- [ ] Magnet mode (attract/repel) works
- [ ] N-Body force (clump/spread) works
- [ ] Sticky mode works
- [ ] Flow field drawing works
- [ ] Collision settings affect behavior
- [ ] Physics pause button works
- [ ] All sliders update values correctly
- [ ] Keyboard shortcuts still work

---

## ?? Next Phase Preview

After Phase 1 is working, we'll create:
- **Phase 2**: `usePaletteState.ts` - Color management
- **Phase 3**: `useAnimationState.ts` - Animation/export state
- **Phase 4**: `useCanvasState.ts` - Canvas/UI state (tabs, aspect ratio)

---

## ?? Need Help?

If you get stuck:
1. Check for TypeScript errors in your editor
2. Look for console errors in browser dev tools
3. Make sure all imports are correct
4. Verify the hook is being called before any code that uses appState

**Ready for the next file?** Let me know when Phase 1 is working!
