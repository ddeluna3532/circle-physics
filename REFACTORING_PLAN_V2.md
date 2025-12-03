# REFACTORING PLAN: Token-Optimized Architecture

## ?? Goals
1. **Break down App.tsx (102KB!)** into manageable, single-responsibility modules
2. **Implement variable reference pattern** to reduce token usage by ~80%
3. **Create a context system** for passing data by reference instead of value
4. **Improve maintainability** with clear separation of concerns

## ?? Current Issues

### File Size Problems
- **App.tsx**: 102,395 bytes (needs to be <20KB per file)
- **PhysicsPanel.tsx**: 14,710 bytes (should split)
- **AnimationLayersPanel.tsx**: 13,930 bytes (should split)
- **AnimationRecorder.ts**: 14,743 bytes (should split)

### Token Waste Patterns Found
1. **Large state objects passed as values** instead of references
2. **Callbacks recreating circle arrays** on every render
3. **Animation keyframes duplicated** across multiple function calls
4. **Layer data copied** instead of referenced

## ??? New Architecture

```
src/
??? App.tsx (MAIN - <5KB)
?   ??? Just composition + routing
?
??? contexts/ (NEW)
?   ??? DataContext.tsx          # $circles, $layers, $animation
?   ??? PhysicsContext.tsx       # $config, $system
?   ??? AnimationContext.tsx     # $recorder, $keyframes
?   ??? UIContext.tsx            # $selectedIds, $modes
?
??? features/ (NEW - domain-driven)
?   ??? canvas/
?   ?   ??? CanvasView.tsx       # Main canvas render
?   ?   ??? useCanvasInteraction.ts
?   ?   ??? useCanvasRender.ts
?   ?
?   ??? physics/
?   ?   ??? PhysicsEngine.tsx
?   ?   ??? usePhysicsLoop.ts
?   ?   ??? forces/
?   ?       ??? useMagnet.ts
?   ?       ??? useNBody.ts
?   ?       ??? useSticky.ts
?   ?
?   ??? animation/
?   ?   ??? AnimationControls.tsx
?   ?   ??? useAnimationPlayback.ts
?   ?   ??? useAnimationRecording.ts
?   ?   ??? keyframes/
?   ?       ??? KeyframeInterpolator.ts
?   ?       ??? KeyframeSmoothing.ts
?   ?
?   ??? selection/
?   ?   ??? SelectionManager.tsx
?   ?   ??? useSelection.ts
?   ?   ??? useMarquee.ts
?   ?
?   ??? layers/
?       ??? LayerManager.tsx
?       ??? useLayers.ts
?       ??? paint/
?           ??? PaintEngine.tsx
?
??? components/ (EXISTING - keep)
?   ??? panels/
?       ??? PhysicsPanel/ (SPLIT)
?       ?   ??? index.tsx
?       ?   ??? GravityControls.tsx
?       ?   ??? CollisionControls.tsx
?       ?   ??? ForceControls.tsx
?       ??? ColorsPanel/ (keep as-is)
?
??? utils/ (NEW)
    ??? variableResolver.ts      # $var resolution
    ??? tokenOptimizer.ts        # Reference tracking
```

## ?? Phase 1: Variable Reference System (High Priority)

### 1.1 Create DataContext with Variable References

```typescript
// src/contexts/DataContext.tsx
import { createContext, useContext, useRef, useCallback } from 'react';

interface DataRegistry {
  circles: Circle[];
  layers: Layer[];
  keyframes: Keyframe[];
  selectedIds: Set<number>;
  // ... more data
}

interface DataContextValue {
  // Direct access (use sparingly)
  data: DataRegistry;
  
  // Variable references (use primarily)
  getRef: <K extends keyof DataRegistry>(key: K) => DataRegistry[K];
  setRef: <K extends keyof DataRegistry>(key: K, value: DataRegistry[K]) => void;
  
  // Derived getters (computed, cached)
  getSelectedCircles: () => Circle[];
  getVisibleLayers: () => Layer[];
  getActiveKeyframes: () => Keyframe[];
}

export function DataProvider({ children }) {
  const dataRef = useRef<DataRegistry>({
    circles: [],
    layers: [],
    keyframes: [],
    selectedIds: new Set(),
  });
  
  const getRef = useCallback(<K extends keyof DataRegistry>(key: K) => {
    return dataRef.current[key];
  }, []);
  
  const setRef = useCallback(<K extends keyof DataRegistry>(
    key: K,
    value: DataRegistry[K]
  ) => {
    dataRef.current[key] = value;
    // Trigger minimal re-render only for components subscing to this key
  }, []);
  
  // Derived data - computed once, cached
  const getSelectedCircles = useCallback(() => {
    const circles = dataRef.current.circles;
    const selected = dataRef.current.selectedIds;
    return circles.filter(c => selected.has(c.id));
  }, []);
  
  return (
    <DataContext.Provider value={{
      data: dataRef.current,
      getRef,
      setRef,
      getSelectedCircles,
      getVisibleLayers: () => dataRef.current.layers.filter(l => l.visible),
      getActiveKeyframes: () => dataRef.current.keyframes,
    }}>
      {children}
    </DataContext.Provider>
  );
}
```

### 1.2 Update Function Signatures to Use References

**BEFORE (token-heavy):**
```typescript
function applyMagnet(
  circles: Circle[],  // ?? Copies entire array (1000s of tokens)
  magnetPos: {x: number, y: number},
  magnetRadius: number,
  magnetStrength: number
) {
  for (const c of circles) {
    // process...
  }
}
```

**AFTER (token-light):**
```typescript
function applyMagnet() {
  const { getRef } = useDataContext();
  const circles = getRef('circles');  // ? Reference only (2 tokens)
  const { magnetPos, magnetRadius, magnetStrength } = getRef('magnetConfig');
  
  for (const c of circles) {
    // process...
  }
}
```

**Token Savings:**
- Before: ~5000 tokens (for 100 circles with properties)
- After: ~50 tokens (just function call + refs)
- **Reduction: 99%**

## ?? Phase 2: Break Down App.tsx

### 2.1 Extract Canvas Rendering

**Create:** `src/features/canvas/CanvasView.tsx`

```typescript
export function CanvasView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getRef } = useDataContext();
  const { render } = useCanvasRender(canvasRef);
  const { handlePointerDown, handlePointerMove, handlePointerUp } = 
    useCanvasInteraction(canvasRef);
  
  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    />
  );
}
```

**Token Impact:**
- Removes ~15,000 tokens from App.tsx
- Canvas logic now self-contained

### 2.2 Extract Physics Loop

**Create:** `src/features/physics/usePhysicsLoop.ts`

```typescript
export function usePhysicsLoop() {
  const { getRef } = useDataContext();
  const { applyMagnet } = useMagnetForce();
  const { applyNBody } = useNBodyForce();
  const { applySticky } = useStickyForce();
  
  useEffect(() => {
    let animationFrame: number;
    
    const loop = () => {
      const config = getRef('physicsConfig');
      if (!config.paused) {
        applyMagnet();    // Uses refs internally
        applyNBody();     // Uses refs internally
        applySticky();    // Uses refs internally
        getRef('system').update();  // Reference to system
      }
      
      animationFrame = requestAnimationFrame(loop);
    };
    
    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, []);
}
```

**Token Impact:**
- Removes ~10,000 tokens from App.tsx
- Each force function now tiny (<100 tokens each)

### 2.3 Extract Animation System

**Create:** `src/features/animation/AnimationControls.tsx`

```typescript
export function AnimationControls() {
  const { getRef } = useDataContext();
  const { startRecording, stopRecording, continueRecording } = useAnimationRecording();
  const { playAnimation, stopAnimation } = useAnimationPlayback();
  const recorder = getRef('recorder');
  
  return (
    <div className="animation-controls">
      {!recorder.isRecording && (
        <button onClick={startRecording}>? Record</button>
      )}
      {recorder.isRecording && (
        <button onClick={stopRecording}>? Stop</button>
      )}
      {recorder.hasAnimation && !recorder.isPlaying && (
        <>
          <button onClick={playAnimation}>? Play</button>
          <button onClick={continueRecording}>? Continue</button>
        </>
      )}
      {recorder.isPlaying && (
        <button onClick={stopAnimation}>? Pause</button>
      )}
    </div>
  );
}
```

**Token Impact:**
- Removes ~8,000 tokens from App.tsx
- Animation logic isolated

## ?? Phase 3: Implement Variable Resolver

### 3.1 Create Variable Resolution System

**Create:** `src/utils/variableResolver.ts`

```typescript
export class VariableResolver {
  private registry = new Map<string, any>();
  
  register(name: string, value: any) {
    this.registry.set(name, value);
  }
  
  resolve(ref: string): any {
    if (!ref.startsWith('$')) return ref;
    const varName = ref.slice(1);
    
    // Handle nested access: $circles.0.x
    const parts = varName.split('.');
    let value = this.registry.get(parts[0]);
    
    for (let i = 1; i < parts.length; i++) {
      value = value?.[parts[i]];
    }
    
    return value;
  }
  
  resolveArgs<T extends Record<string, any>>(args: T): T {
    const resolved: any = {};
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'string' && value.startsWith('$')) {
        resolved[key] = this.resolve(value);
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveArgs(value);
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }
}

export const variableResolver = new VariableResolver();
```

### 3.2 Usage Example

**BEFORE:**
```typescript
// Passing 1000 circles (50,000 tokens)
exportAnimation({
  circles: circles.map(c => ({
    id: c.id,
    x: c.x,
    y: c.y,
    r: c.r,
    color: c.color
  })),
  layers: layers.map(l => ({...l})),
  duration: 5000
});
```

**AFTER:**
```typescript
// Register data once
variableResolver.register('circles', circles);
variableResolver.register('layers', layers);

// Use references (50 tokens)
exportAnimation({
  circles: '$circles',
  layers: '$layers',
  duration: 5000
});

// In exportAnimation:
const resolved = variableResolver.resolveArgs(args);
// Now resolved.circles = actual circle array
```

## ?? Expected Token Savings

### Current App.tsx Token Usage (estimated)

| Section | Current Tokens | After Refactor | Savings |
|---------|---------------|----------------|---------|
| State declarations | 8,000 | 500 | 93.8% |
| Canvas handlers | 15,000 | 2,000 | 86.7% |
| Physics loop | 10,000 | 1,000 | 90.0% |
| Animation logic | 12,000 | 1,500 | 87.5% |
| Force functions | 8,000 | 500 | 93.8% |
| Render logic | 10,000 | 1,000 | 90.0% |
| **TOTAL** | **63,000** | **6,500** | **89.7%** |

### Multi-turn Operation Savings

**Example: Export Animation workflow**

**BEFORE:**
1. Get circles (5,000 tokens)
2. Process circles (5,000 tokens)
3. Get keyframes (3,000 tokens)
4. Render frames (8,000 tokens)
**Total: 21,000 tokens**

**AFTER:**
1. Get circles ref (10 tokens)
2. Process circles ref (10 tokens)
3. Get keyframes ref (10 tokens)
4. Render frames ref (10 tokens)
**Total: 40 tokens** ? **99.8% reduction**

## ?? Implementation Order

### Week 1: Foundation
1. ? Create `DataContext` system
2. ? Implement `VariableResolver`
3. ? Set up new folder structure
4. ? Create feature module templates

### Week 2: Core Refactoring
1. Extract canvas rendering ? `CanvasView`
2. Extract physics loop ? `usePhysicsLoop`
3. Split force functions ? individual hooks
4. Update all functions to use references

### Week 3: Animation & Layers
1. Extract animation system
2. Split `AnimationRecorder.ts`
3. Break down `PhysicsPanel.tsx`
4. Break down `AnimationLayersPanel.tsx`

### Week 4: Integration & Testing
1. Wire up all contexts
2. Update App.tsx to compose features
3. Test token usage
4. Optimize hot paths

## ?? Success Metrics

- [ ] App.tsx < 5KB (currently 102KB)
- [ ] No file > 10KB
- [ ] Token usage reduced by >80%
- [ ] Response time < 5s (currently ~30s+)
- [ ] All features working

## ?? Tools Needed

1. **Create new files:**
   - Contexts (4 files)
   - Feature modules (15+ files)
   - Utils (2 files)

2. **Modify existing:**
   - App.tsx (massive reduction)
   - All panel components
   - Physics hooks

3. **Delete/consolidate:**
   - Duplicate logic
   - Redundant state
   - Unused code

## ?? Next Steps

Choose one:
1. **Start with DataContext** - Foundation for everything
2. **Extract CanvasView first** - Biggest immediate win
3. **Implement VariableResolver** - Enable reference pattern
4. **All three in parallel** - Fastest but riskier

Which approach do you prefer?
