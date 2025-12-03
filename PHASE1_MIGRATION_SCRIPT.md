# Phase 1: App.tsx Reference Migration Script

## ? Step 1: Import Added
```typescript
import { useAppState } from "./state/useAppState";
```

## ? Step 2: Hook Called
```typescript
const appState = useAppState();
```

## ?? Step 3: Update All References

Due to the size of App.tsx (2,638 lines), here's a systematic approach to update all references:

---

## Method 1: Find & Replace (Recommended)

Use VS Code's Find & Replace (Ctrl+H) with **Match Whole Word** enabled:

### A. State Variables (40 replacements)

Replace each pattern **IN ORDER** (order matters!):

```
1. Find: `setBrushSize` ? Replace: `appState.setBrushSize`
2. Find: `brushSize` ? Replace: `appState.brushSize`

3. Find: `setEraseMode` ? Replace: `appState.setEraseMode`
4. Find: `eraseMode` ? Replace: `appState.eraseMode`

5. Find: `setLockMode` ? Replace: `appState.setLockMode`
6. Find: `lockMode` ? Replace: `appState.lockMode`

7. Find: `setRecolorMode` ? Replace: `appState.setRecolorMode`
8. Find: `recolorMode` ? Replace: `appState.recolorMode`

9. Find: `setPaintMode` ? Replace: `appState.setPaintMode`
10. Find: `paintMode` ? Replace: `appState.paintMode`

11. Find: `setSelectMode` ? Replace: `appState.setSelectMode`
12. Find: `selectMode` ? Replace: `appState.selectMode`

13. Find: `setSelectedIds` ? Replace: `appState.setSelectedIds`
14. Find: `selectedIds` ? Replace: `appState.selectedIds`

15. Find: `setMagnetMode` ? Replace: `appState.setMagnetMode`
16. Find: `magnetMode` ? Replace: `appState.magnetMode`

17. Find: `setMagnetStrength` ? Replace: `appState.setMagnetStrength`
18. Find: `magnetStrength` ? Replace: `appState.magnetStrength`

19. Find: `setMagnetRadius` ? Replace: `appState.setMagnetRadius`
20. Find: `magnetRadius` ? Replace: `appState.magnetRadius`

21. Find: `setNBodyMode` ? Replace: `appState.setNBodyMode`
22. Find: `nBodyMode` ? Replace: `appState.nBodyMode`

23. Find: `setNBodyStrength` ? Replace: `appState.setNBodyStrength`
24. Find: `nBodyStrength` ? Replace: `appState.nBodyStrength`

25. Find: `setStickyMode` ? Replace: `appState.setStickyMode`
26. Find: `stickyMode` ? Replace: `appState.stickyMode`

27. Find: `setStickyStrength` ? Replace: `appState.setStickyStrength`
28. Find: `stickyStrength` ? Replace: `appState.stickyStrength`

29. Find: `setFlowMode` ? Replace: `appState.setFlowMode`
30. Find: `flowMode` ? Replace: `appState.flowMode`

31. Find: `setFlowVisible` ? Replace: `appState.setFlowVisible`
32. Find: `flowVisible` ? Replace: `appState.flowVisible`

33. Find: `setFlowStrength` ? Replace: `appState.setFlowStrength`
34. Find: `flowStrength` ? Replace: `appState.flowStrength`

35. Find: `setFlowRadius` ? Replace: `appState.setFlowRadius`
36. Find: `flowRadius` ? Replace: `appState.flowRadius`

37. Find: `setCollisionIterations` ? Replace: `appState.setCollisionIterations`
38. Find: `collisionIterations` ? Replace: `appState.collisionIterations`

39. Find: `setRestitution` ? Replace: `appState.setRestitution`
40. Find: `restitution` ? Replace: `appState.restitution`

41. Find: `setPhysicsPaused` ? Replace: `appState.setPhysicsPaused`
42. Find: `physicsPaused` ? Replace: `appState.physicsPaused`
```

### B. Refs (28 replacements)

```
43. Find: `draggingRef.current` ? Replace: `appState.draggingRef.current`
44. Find: `draggingRef` ? Replace: `appState.draggingRef`

45. Find: `isPaintingRef.current` ? Replace: `appState.isPaintingRef.current`
46. Find: `isPaintingRef` ? Replace: `appState.isPaintingRef`

47. Find: `isErasingRef.current` ? Replace: `appState.isErasingRef.current`
48. Find: `isErasingRef` ? Replace: `appState.isErasingRef`

49. Find: `erasedThisStroke.current` ? Replace: `appState.erasedThisStroke.current`
50. Find: `erasedThisStroke` ? Replace: `appState.erasedThisStroke`

51. Find: `isLockingRef.current` ? Replace: `appState.isLockingRef.current`
52. Find: `isLockingRef` ? Replace: `appState.isLockingRef`

53. Find: `lockedThisStroke.current` ? Replace: `appState.lockedThisStroke.current`
54. Find: `lockedThisStroke` ? Replace: `appState.lockedThisStroke`

55. Find: `isRecoloringRef.current` ? Replace: `appState.isRecoloringRef.current`
56. Find: `isRecoloringRef` ? Replace: `appState.isRecoloringRef`

57. Find: `recoloredThisStroke.current` ? Replace: `appState.recoloredThisStroke.current`
58. Find: `recoloredThisStroke` ? Replace: `appState.recoloredThisStroke`

59. Find: `isMagnetActiveRef.current` ? Replace: `appState.isMagnetActiveRef.current`
60. Find: `isMagnetActiveRef` ? Replace: `appState.isMagnetActiveRef`

61. Find: `magnetPosRef.current` ? Replace: `appState.magnetPosRef.current`
62. Find: `magnetPosRef` ? Replace: `appState.magnetPosRef`

63. Find: `isFlowDrawingRef.current` ? Replace: `appState.isFlowDrawingRef.current`
64. Find: `isFlowDrawingRef` ? Replace: `appState.isFlowDrawingRef`

65. Find: `flowStartRef.current` ? Replace: `appState.flowStartRef.current`
66. Find: `flowStartRef` ? Replace: `appState.flowStartRef`

67. Find: `lastFlowPosRef.current` ? Replace: `appState.lastFlowPosRef.current`
68. Find: `lastFlowPosRef` ? Replace: `appState.lastFlowPosRef`

69. Find: `pinchRef.current` ? Replace: `appState.pinchRef.current`
70. Find: `pinchRef` ? Replace: `appState.pinchRef`

71. Find: `mouseRef.current` ? Replace: `appState.mouseRef.current`
72. Find: `mouseRef` ? Replace: `appState.mouseRef`

73. Find: `isSelectingRef.current` ? Replace: `appState.isSelectingRef.current`
74. Find: `isSelectingRef` ? Replace: `appState.isSelectingRef`

75. Find: `selectionStartRef.current` ? Replace: `appState.selectionStartRef.current`
76. Find: `selectionStartRef` ? Replace: `appState.selectionStartRef`

77. Find: `selectionRectRef.current` ? Replace: `appState.selectionRectRef.current`
78. Find: `selectionRectRef` ? Replace: `appState.selectionRectRef`

79. Find: `isDraggingSelectionRef.current` ? Replace: `appState.isDraggingSelectionRef.current`
80. Find: `isDraggingSelectionRef` ? Replace: `appState.isDraggingSelectionRef`

81. Find: `selectionDragStartRef.current` ? Replace: `appState.selectionDragStartRef.current`
82. Find: `selectionDragStartRef` ? Replace: `appState.selectionDragStartRef`

83. Find: `isPaintSelectingRef.current` ? Replace: `appState.isPaintSelectingRef.current`
84. Find: `isPaintSelectingRef` ? Replace: `appState.isPaintSelectingRef`

85. Find: `paintSelectedThisStroke.current` ? Replace: `appState.paintSelectedThisStroke.current`
86. Find: `paintSelectedThisStroke` ? Replace: `appState.paintSelectedThisStroke`

87. Find: `isPaintingLayerRef.current` ? Replace: `appState.isPaintingLayerRef.current`
88. Find: `isPaintingLayerRef` ? Replace: `appState.isPaintingLayerRef`

89. Find: `lastPaintPosRef.current` ? Replace: `appState.lastPaintPosRef.current`
90. Find: `lastPaintPosRef` ? Replace: `appState.lastPaintPosRef`

91. Find: `scaleSliderRef.current` ? Replace: `appState.scaleSliderRef.current`
92. Find: `scaleSliderRef` ? Replace: `appState.scaleSliderRef`

93. Find: `isScalingRef.current` ? Replace: `appState.isScalingRef.current`
94. Find: `isScalingRef` ? Replace: `appState.isScalingRef`

95. Find: `randomScaleSliderRef.current` ? Replace: `appState.randomScaleSliderRef.current`
96. Find: `randomScaleSliderRef` ? Replace: `appState.randomScaleSliderRef`

97. Find: `isRandomScalingRef.current` ? Replace: `appState.isRandomScalingRef.current`
98. Find: `isRandomScalingRef` ? Replace: `appState.isRandomScalingRef`

99. Find: `isAutoSpawningRef.current` ? Replace: `appState.isAutoSpawningRef.current`
100. Find: `isAutoSpawningRef` ? Replace: `appState.isAutoSpawningRef`

101. Find: `isRandomSpawningRef.current` ? Replace: `appState.isRandomSpawningRef.current`
102. Find: `isRandomSpawningRef` ? Replace: `appState.isRandomSpawningRef`
```

---

## Method 2: Automated Script

Create a Node.js script to automate the replacements:

```javascript
// migrate-app-state.js
const fs = require('fs');

const appFile = './src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

const replacements = [
  // State variables (setters first, then getters)
  ['setBrushSize', 'appState.setBrushSize'],
  ['brushSize', 'appState.brushSize'],
  ['setEraseMode', 'appState.setEraseMode'],
  ['eraseMode', 'appState.eraseMode'],
  // ... (full list from Method 1)
];

// Apply replacements with word boundaries
replacements.forEach(([find, replace]) => {
  const regex = new RegExp(`\\b${find}\\b`, 'g');
  content = content.replace(regex, replace);
});

fs.writeFileSync(appFile, content, 'utf8');
console.log('Migration complete!');
```

Run:
```bash
node migrate-app-state.js
```

---

## Method 3: Manual (Not Recommended - Too Error-Prone)

If you choose manual editing:

1. Search for each variable name
2. Update each occurrence
3. Check dependency arrays in useCallback/useEffect
4. Verify JSX prop bindings

?? **Warning**: This method is prone to missing occurrences!

---

## ?? Critical Areas to Check

After running Find & Replace, manually verify these sections:

### 1. useCallback Dependencies
Example around line ~600-1500:
```typescript
const isCircleAffected = useCallback((c: Circle): boolean => {
  if (c.locked || c.isDragging) return false;
  if (!isLayerAffectedByForces(c.layerId)) return false;
  if (appState.selectMode && appState.selectedIds.size > 0 && !appState.selectedIds.has(c.id)) return false;
  return true;
}, [isLayerAffectedByForces, appState.selectMode, appState.selectedIds]);
```

### 2. useEffect Dependencies
Example around line ~1800:
```typescript
useEffect(() => {
  system.flowStrength = appState.flowStrength;
  system.flowRadius = appState.flowRadius;
}, [system, appState.flowStrength, appState.flowRadius]);
```

### 3. Event Handler Props
Example in JSX:
```typescript
<button
  onMouseDown={() => { appState.isAutoSpawningRef.current = true; }}
  onMouseUp={() => { appState.isAutoSpawningRef.current = false; }}
>
  Brush
</button>
```

### 4. PhysicsPanel Props
Around line ~2700:
```typescript
<PhysicsPanel
  physicsPaused={appState.physicsPaused}
  setPhysicsPaused={appState.setPhysicsPaused}
  // ... all other props updated
/>
```

---

## ?? Verification Steps

### 1. TypeScript Check
```bash
npx tsc --noEmit
```
Should show no errors related to undefined variables.

### 2. Run Dev Server
```bash
npm run dev
```

### 3. Browser Console
Open DevTools ? Console. Should see no errors.

### 4. Feature Testing
- Click canvas ? circles should appear
- Adjust brush size slider ? works
- Toggle erase mode ? can delete circles
- Try all physics modes
- Check all panels work

---

## ?? Expected Results

**Before:**
- Individual `useState` calls: 21
- Individual `useRef` calls: 28
- Total state lines: ~120 lines

**After:**
- One `useAppState()` call: 1 line
- References updated: ~300 occurrences
- Cleaner, more maintainable code ?

---

## ?? Common Issues

### Issue 1: "Cannot read property 'xxx' of undefined"
**Cause**: Missed a reference or called before `useAppState()`
**Fix**: Make sure `const appState = useAppState()` is called early in App component

### Issue 2: TypeScript errors about missing properties
**Cause**: Typo in property name
**Fix**: Check spelling matches the `AppState` interface

### Issue 3: Stale values in effects
**Cause**: Forgot to update dependency array
**Fix**: Add `appState.xxx` to the dependency array

---

## ?? Success Criteria

Phase 1 is complete when:
- ? No TypeScript errors
- ? App runs without console errors
- ? All interactive features work
- ? Can draw, erase, select, and apply forces
- ? All sliders and buttons respond correctly

---

## ?? Next: Phase 2

Once Phase 1 is verified working, we'll create:
- `src/state/usePaletteState.ts` (~200 lines)
- `src/state/useAnimationState.ts` (~150 lines)
- `src/state/useCanvasState.ts` (~100 lines)

**Ready to proceed?** Test Phase 1 thoroughly first!
