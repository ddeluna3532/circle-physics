# ?? Quick Start: Token Optimization Implementation

## ?? 2-Hour Implementation Plan

### ?? Phase 1: Setup (15 minutes)

- [ ] **1.1** Verify new files exist:
  ```bash
  ls src/contexts/
  ls src/utils/
  ls src/features/
  ```

- [ ] **1.2** Update `src/main.tsx`:
  ```typescript
  import { AppProviders } from './contexts';
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </React.StrictMode>
  );
  ```

- [ ] **1.3** Test app still runs:
  ```bash
  npm run dev
  ```

### ?? Phase 2: Connect Contexts (30 minutes)

- [ ] **2.1** Add context imports to App.tsx:
  ```typescript
  import { useData, useCircles, useSelection } from './contexts/DataContext';
  import { usePhysicsContext } from './contexts/PhysicsContext';
  import { useAnimationContext } from './contexts/AnimationContext';
  ```

- [ ] **2.2** Replace state declarations:
  
  **Find and replace:**
  ```typescript
  // OLD
  const [circles, setCircles] = useState<Circle[]>([]);
  
  // NEW
  const { circles, setCircles, addCircle, removeCircle } = useCircles();
  ```

- [ ] **2.3** Move physics state:
  ```typescript
  // OLD
  const [magnetMode, setMagnetMode] = useState('off');
  
  // NEW  
  const { config: magnetConfig, setMode: setMagnetMode } = useMagnet();
  ```

- [ ] **2.4** Test: Physics state accessible

### ?? Phase 3: Extract Physics Loop (20 minutes)

- [ ] **3.1** Import physics loop:
  ```typescript
  import { usePhysicsLoop } from './features/physics/usePhysicsLoop';
  ```

- [ ] **3.2** Add to App component:
  ```typescript
  function App() {
    usePhysicsLoop(); // Add this line
    // ... rest of component
  }
  ```

- [ ] **3.3** Remove old animation loop:
  ```typescript
  // DELETE this entire useEffect:
  useEffect(() => {
    let lastTime = performance.now();
    const loop = (time: number) => { ... };
    // ... 100+ lines
  }, [system, render, ...]);
  ```

- [ ] **3.4** Test: Physics still runs

### ?? Phase 4: Extract Rendering (30 minutes)

- [ ] **4.1** Import canvas render:
  ```typescript
  import { useCanvasRender } from './features/canvas/useCanvasRender';
  ```

- [ ] **4.2** Replace render function:
  ```typescript
  // OLD (delete 200 lines):
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    // ... 200 lines of rendering
  }, [circles, layers, ...]);
  
  // NEW (1 line):
  const { render } = useCanvasRender(canvasRef);
  ```

- [ ] **4.3** Update render calls to include options:
  ```typescript
  // In physics loop effect:
  render({
    showFlowVectors: true,
    showMagnetRadius: true,
    showSelectionHighlights: true,
  });
  ```

- [ ] **4.4** Test: Canvas renders correctly

### ?? Phase 5: Variable Resolver (10 minutes)

- [ ] **5.1** Import resolver:
  ```typescript
  import { useVariableResolver } from './utils/variableResolver';
  ```

- [ ] **5.2** Register variables:
  ```typescript
  function App() {
    const { $get } = useData();
    const { registerAll } = useVariableResolver();
    
    useEffect(() => {
      registerAll({
        circles: $get('circles'),
        layers: $get('layers'),
        selectedIds: $get('selectedIds'),
      });
    }, []);
    
    // ... rest of component
  }
  ```

- [ ] **5.3** Test: No errors in console

### ?? Phase 6: Clean Up (25 minutes)

- [ ] **6.1** Remove deleted functions:
  - [ ] `applyMagnet` (now in `useMagnet.ts`)
  - [ ] `applyNBodyForce` (now in `useNBody.ts`)
  - [ ] `applyStickyForce` (now in `useSticky.ts`)
  - [ ] `render` (now in `useCanvasRender.ts`)

- [ ] **6.2** Remove unused imports:
  ```typescript
  // Delete if no longer used:
  import { Circle } from './physics';
  // etc.
  ```

- [ ] **6.3** Check App.tsx size:
  ```bash
  ls -lh src/App.tsx
  # Should be ~15KB (down from 102KB)
  ```

- [ ] **6.4** Run full test suite

## ?? Testing Checklist

### Functionality Tests
- [ ] Physics simulation runs
- [ ] Forces work (magnet, n-body, sticky)
- [ ] Canvas renders all layers
- [ ] Selection works
- [ ] Animation recording works
- [ ] Animation playback works
- [ ] Export functions work

### Performance Tests
- [ ] No console errors
- [ ] 60fps maintained
- [ ] Memory usage stable
- [ ] No infinite loops

### Token Usage Tests
- [ ] Check token usage in network tab
- [ ] Verify references used instead of copies
- [ ] Confirm $ variables registered

## ?? Expected Results

After implementation:

| Metric | Before | Target | Status |
|--------|--------|--------|--------|
| App.tsx size | 102KB | <20KB | ? |
| Token usage | 79,000 | <16,000 | ? |
| Response time | 263s | <20s | ? |
| Files > 10KB | 4 | 0 | ? |

## ?? Troubleshooting

### Common Issues

**Issue: "useData must be used within DataProvider"**
- ? Solution: Make sure `AppProviders` wraps `App` in `main.tsx`

**Issue: "Cannot read property of undefined"**
- ? Solution: Check that data is registered in variable resolver
- ? Verify context values are initialized

**Issue: "Physics not running"**
- ? Solution: Check `physicsPaused` is false
- ? Verify `usePhysicsLoop` is called

**Issue: "Canvas blank"**
- ? Solution: Check `render()` is called in animation loop
- ? Verify layers have data

**Issue: "App.tsx still large"**
- ? Solution: Verify old functions are deleted
- ? Check imports are cleaned up

## ?? Rollback

If something breaks:

```bash
# Stash changes
git stash

# See what changed
git stash show -p

# Apply changes back
git stash pop

# Or discard
git stash drop
```

## ?? Next Steps After Completion

1. **Monitor token usage** - Check network tab for API calls
2. **Profile performance** - Use React DevTools
3. **Split large panels** - PhysicsPanel, AnimationLayersPanel
4. **Add more features** - See `REFACTORING_PLAN_V2.md`
5. **Optimize hot paths** - Profile with Chrome DevTools

## ?? Reference Documents

- **Architecture**: `REFACTORING_PLAN_V2.md`
- **Detailed guide**: `MIGRATION_GUIDE.md`
- **Summary**: `TOKEN_OPTIMIZATION_SUMMARY.md`

## ? Done?

Mark phases complete as you go:
- [x] Phase 1: Setup
- [ ] Phase 2: Connect Contexts
- [ ] Phase 3: Extract Physics Loop
- [ ] Phase 4: Extract Rendering
- [ ] Phase 5: Variable Resolver
- [ ] Phase 6: Clean Up

**Time check:** Each phase should take 10-30 minutes. If taking longer, ask for help!

---

**Ready? Start with Phase 1! ??**
