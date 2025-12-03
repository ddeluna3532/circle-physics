# Quick Start: Continue Refactoring

## ?? Goal
Reduce App.tsx from 2500 lines to ~300 lines by extracting UI panels and logic into focused components and hooks.

## ? Already Done
- `usePalette` hook - color/palette management
- Indicator components - RecordingIndicator, PlaybackIndicator, ExportingIndicator
- CSS fixes
- Documentation

## ?? Next Task: Extract PhysicsPanel

This will reduce App.tsx by ~300 lines immediately!

### Step 1: Create the Component File

Create `src/components/panels/PhysicsPanel.tsx`:

```typescript
interface PhysicsPanelProps {
  // Physics state
  physicsPaused: boolean;
  setPhysicsPaused: (paused: boolean) => void;
  config: any; // Replace with proper type
  system: any; // Replace with proper type
  
  // Gravity
  setGravity: (enabled: boolean) => void;
  
  // Boundaries
  setWalls: (enabled: boolean) => void;
  setFloor: (enabled: boolean) => void;
  
  // Collisions
  collisionIterations: number;
  setCollisionIterations: (val: number) => void;
  restitution: number;
  setRestitution: (val: number) => void;
  
  // Forces
  magnetMode: 'off' | 'attract' | 'repel';
  setMagnetMode: (mode: 'off' | 'attract' | 'repel') => void;
  magnetStrength: number;
  setMagnetStrength: (val: number) => void;
  magnetRadius: number;
  setMagnetRadius: (val: number) => void;
  
  nBodyMode: 'off' | 'clump' | 'spread';
  setNBodyMode: (mode: 'off' | 'clump' | 'spread') => void;
  nBodyStrength: number;
  setNBodyStrength: (val: number) => void;
  
  stickyMode: boolean;
  setStickyMode: (enabled: boolean) => void;
  stickyStrength: number;
  setStickyStrength: (val: number) => void;
  
  // Flow field
  flowMode: 'off' | 'draw' | 'erase';
  setFlowMode: (mode: 'off' | 'draw' | 'erase') => void;
  flowVisible: boolean;
  setFlowVisible: (visible: boolean) => void;
  flowStrength: number;
  setFlowStrength: (val: number) => void;
  flowRadius: number;
  setFlowRadius: (val: number) => void;
  
  // Scaling
  scaleSliderRef: React.MutableRefObject<number>;
  isScalingRef: React.MutableRefObject<boolean>;
  randomScaleSliderRef: React.MutableRefObject<number>;
  isRandomScalingRef: React.MutableRefObject<boolean>;
}

export function PhysicsPanel(props: PhysicsPanelProps) {
  // Copy the entire Physics tab JSX from App.tsx lines ~2650-2950
  // Replace state references with props
  return (
    <div className="section-header">Physics</div>
    // ... rest of physics panel JSX
  );
}
```

### Step 2: Update App.tsx

In App.tsx:

1. Import the component:
```typescript
import { PhysicsPanel } from './components/panels/PhysicsPanel';
```

2. Replace the Physics tab content with:
```typescript
<div className={`tab-pane ${rightTab === 'physics' ? 'active' : ''}`}>
  <PhysicsPanel
    physicsPaused={physicsPaused}
    setPhysicsPaused={setPhysicsPaused}
    config={config}
    system={system}
    // ... pass all other props
  />
</div>
```

3. Delete the old Physics tab JSX (lines ~2650-2950)

### Step 3: Test
```bash
npm run dev
```

Check that physics controls still work!

## ?? Checklist for Each Panel

- [ ] PhysicsPanel (~300 lines)
- [ ] ToolsPanel (~250 lines)
- [ ] LayersPanel (~250 lines)
- [ ] CanvasPanel (~200 lines)
- [ ] ColorsPanel (~150 lines)

## ?? Tips

1. **Copy-paste first, refactor later** - Get it working, then clean up
2. **Props are OK** - Don't over-optimize, passing props is fine
3. **Test frequently** - Run `npm run dev` after each extraction
4. **Git commit often** - Commit after each successful panel extraction
5. **TypeScript errors are OK** - If runtime works, TS errors can be fixed later

## ?? Pattern to Follow

For each panel:

```typescript
// 1. Define props interface
interface PanelNameProps {
  // All state and handlers needed
}

// 2. Create component
export function PanelName(props: PanelNameProps) {
  return (
    // JSX from App.tsx
  );
}

// 3. In App.tsx, replace JSX with:
<PanelName {...allNeededProps} />
```

## ?? When You're Done

After extracting all panels, App.tsx should look like:

```typescript
function App() {
  // State declarations (~200 lines)
  // Hook calls (~50 lines)
  // Helper functions (~50 lines)
  
  return (
    <div className="app">
      <aside className="panel left-panel">
        <CanvasPanel {...props} />
        <ColorsPanel {...props} />
        <ToolsPanel {...props} />
      </aside>
      
      <main className="canvas-container">
        <Canvas {...props} />
      </main>
      
      <aside className="panel right-panel">
        <PhysicsPanel {...props} />
        <LayersPanel {...props} />
        <AnimationLayersPanel {...props} />
      </aside>
    </div>
  );
}
```

Total: ~300 lines! ??

## Need Help?

- Check `REFACTORING_SUMMARY.md` for detailed plan
- Check `REFACTORING_PROGRESS.md` for current status  
- Look at existing components like `AnimationLayersPanel.tsx` for examples
