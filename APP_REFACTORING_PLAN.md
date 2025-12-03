# App.tsx Refactoring Plan

## Current Problem
`App.tsx` is **2,638 lines** - too large to load into memory efficiently. It contains:
- State management (100+ state variables)
- Business logic (50+ useCallback functions)  
- Event handlers (3 major pointer handlers)
- Animation loop
- Canvas rendering
- UI rendering (3 panel tabs with complex JSX)

## Refactoring Goals
1. **Break into focused modules** (~200-300 lines each)
2. **Single Responsibility** - each file has one clear purpose
3. **Easy to load** - files small enough to fit in AI context
4. **Maintainable** - clear boundaries between concerns

---

## ?? New File Structure

```
src/
??? App.tsx (NEW - 150 lines) - Main orchestrator
??? state/
?   ??? useAppState.ts - All state management
?   ??? useUIState.ts - UI-specific state
?   ??? useCanvasState.ts - Canvas/aspect ratio state
?   ??? useAnimationState.ts - Animation recording/playback state
??? handlers/
?   ??? usePointerHandlers.ts - Mouse/touch event handlers
?   ??? useKeyboardHandlers.ts - Keyboard shortcuts
?   ??? useCanvasInteraction.ts - Canvas coordinate utils
??? effects/
?   ??? usePhysicsEffects.ts - Physics forces (magnet, n-body, sticky)
?   ??? useAnimationLoop.ts - Main animation loop
?   ??? useCanvasResize.ts - Canvas resize handling
?   ??? useSystemSync.ts - Sync settings with physics system
??? rendering/
?   ??? useCanvasRenderer.ts - Main render function
?   ??? renderLayers.ts - Layer rendering logic
?   ??? renderOverlays.ts - Selection, magnet, flow vectors
??? actions/
?   ??? useSelectionActions.ts - Selection operations
?   ??? useUndoActions.ts - Undo/redo operations  
?   ??? useAnimationActions.ts - Animation controls
?   ??? usePaletteActions.ts - Color palette management
?   ??? useProjectActions.ts - Project save/load
??? panels/
?   ??? CanvasPanel.tsx - Canvas settings & export tab
?   ??? ColorsPanel.tsx - ALREADY EXISTS (reuse)
?   ??? ToolsPanel.tsx - Drawing & selection tools
?   ??? PhysicsPanel.tsx - ALREADY EXISTS (reuse)
?   ??? LayersPanel.tsx - Layer management
?   ??? LeftPanel.tsx - Tab wrapper for left panel
?   ??? RightPanel.tsx - Tab wrapper for right panel
??? constants/
    ??? defaultPalettes.ts - Default color palettes
```

---

## ?? Refactoring Steps

### Phase 1: Extract State (Priority: HIGH)
**Goal:** Move all useState/useRef/useMemo to custom hooks

#### File: `src/state/useAppState.ts` (~250 lines)
**Responsibility:** All non-UI state management

```typescript
export function useAppState() {
  // Physics state
  const [brushSize, setBrushSize] = useState(30);
  const [eraseMode, setEraseMode] = useState(false);
  const [lockMode, setLockMode] = useState(false);
  const [recolorMode, setRecolorMode] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // Force modes
  const [magnetMode, setMagnetMode] = useState<'off' | 'attract' | 'repel'>('off');
  const [magnetStrength, setMagnetStrength] = useState(3);
  const [magnetRadius, setMagnetRadius] = useState(200);
  
  const [nBodyMode, setNBodyMode] = useState<'off' | 'clump' | 'spread'>('off');
  const [nBodyStrength, setNBodyStrength] = useState(12);
  
  const [stickyMode, setStickyMode] = useState(false);
  const [stickyStrength, setStickyStrength] = useState(0.15);
  
  // Flow field
  const [flowMode, setFlowMode] = useState<'off' | 'draw' | 'erase'>('off');
  const [flowVisible, setFlowVisible] = useState(true);
  const [flowStrength, setFlowStrength] = useState(0.15);
  const [flowRadius, setFlowRadius] = useState(100);
  
  // Collision
  const [collisionIterations, setCollisionIterations] = useState(3);
  const [restitution, setRestitution] = useState(0.6);
  const [physicsPaused, setPhysicsPaused] = useState(false);
  
  // Refs for interaction
  const draggingRef = useRef<Circle | null>(null);
  const isPaintingRef = useRef(false);
  const isErasingRef = useRef(false);
  const erasedThisStroke = useRef<Set<number>>(new Set());
  // ... all other refs
  
  return {
    brushSize, setBrushSize,
    eraseMode, setEraseMode,
    lockMode, setLockMode,
    // ... all state and setters
  };
}
```

#### File: `src/state/useAnimationState.ts` (~150 lines)
**Responsibility:** Animation recording/playback state

```typescript
export function useAnimationState() {
  const animationRecorder = useMemo(() => new AnimationRecorder(30), []);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingFrames, setRecordingFrames] = useState(0);
  const [animationDuration, setAnimationDuration] = useState(0);
  const [playbackCircles, setPlaybackCircles] = useState<CircleSnapshot[] | null>(null);
  const [hasAnimation, setHasAnimation] = useState(false);
  const [smoothingStrength, setSmoothingStrength] = useState(0.4);
  
  // Video export state
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState<VideoExportProgress | null>(null);
  const [exportResolution, setExportResolution] = useState(1);
  const [exportCameraZoom, setExportCameraZoom] = useState(1);
  const [exportCameraPanX, setExportCameraPanX] = useState(0);
  const [exportCameraPanY, setExportCameraPanY] = useState(0);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  
  return {
    animationRecorder,
    isRecording, setIsRecording,
    // ... all animation state
  };
}
```

#### File: `src/state/usePaletteState.ts` (~200 lines)
**Responsibility:** Color palette management

```typescript
export function usePaletteState() {
  const DEFAULT_CIRCLE_PALETTE = [
    { h: 187, s: 94, l: 18 },
    // ...
  ];
  
  const DEFAULT_BG_PALETTE = [
    { h: 0, s: 0, l: 100 },
    // ...
  ];
  
  const [palette, setPalette] = useState(DEFAULT_CIRCLE_PALETTE);
  const [selectedSwatch, setSelectedSwatch] = useState(0);
  const [bgPalette, setBgPalette] = useState(DEFAULT_BG_PALETTE);
  const [selectedBgSwatch, setSelectedBgSwatch] = useState(2);
  const [colorEditMode, setColorEditMode] = useState<'circle' | 'background'>('circle');
  
  const getColor = useCallback(() => {
    const swatch = palette[selectedSwatch];
    const h = swatch.h + Math.random() * 10 - 5;
    return `hsl(${h}, ${swatch.s}%, ${swatch.l}%)`;
  }, [palette, selectedSwatch]);
  
  const getRandomPaletteColor = useCallback(() => {
    // ...
  }, [palette]);
  
  const getBackgroundColor = useCallback(() => {
    // ...
  }, [bgPalette, selectedBgSwatch]);
  
  const getBackgroundHex = useCallback(() => {
    // ...
  }, [bgPalette, selectedBgSwatch]);
  
  return {
    palette, setPalette,
    selectedSwatch, setSelectedSwatch,
    bgPalette, setBgPalette,
    selectedBgSwatch, setSelectedBgSwatch,
    colorEditMode, setColorEditMode,
    getColor,
    getRandomPaletteColor,
    getBackgroundColor,
    getBackgroundHex,
    DEFAULT_CIRCLE_PALETTE,
    DEFAULT_BG_PALETTE,
  };
}
```

---

### Phase 2: Extract Actions (Priority: HIGH)
**Goal:** Move all useCallback business logic to custom hooks

#### File: `src/actions/useSelectionActions.ts` (~200 lines)
**Responsibility:** All selection-related operations

```typescript
export function useSelectionActions(
  circles: Circle[],
  layers: Layer[],
  selectedIds: Set<number>,
  setSelectedIds: (ids: Set<number>) => void,
  removeCircle: (id: number) => void,
  getRandomPaletteColor: () => string,
  isLayerAffectedByForces: (layerId: string) => boolean,
  selectMode: boolean
) {
  const isCircleModifiable = useCallback((c: Circle): boolean => {
    // ...
  }, [layers, selectMode, selectedIds]);
  
  const isPointInCircle = useCallback((px: number, py: number, c: Circle): boolean => {
    // ...
  }, []);
  
  const isCircleInRect = useCallback((c: Circle, rx: number, ry: number, rw: number, rh: number): boolean => {
    // ...
  }, []);
  
  const getCirclesInRect = useCallback((rx: number, ry: number, rw: number, rh: number): Circle[] => {
    // ...
  }, [circles, layers, isCircleInRect]);
  
  const isClickOnSelection = useCallback((x: number, y: number): boolean => {
    // ...
  }, [circles, selectedIds, isPointInCircle]);
  
  const moveSelection = useCallback((dx: number, dy: number) => {
    // ...
  }, [circles, selectedIds, isCircleModifiable]);
  
  const deleteSelection = useCallback(() => {
    // ...
  }, [selectedIds, removeCircle]);
  
  const recolorSelection = useCallback(() => {
    // ...
  }, [circles, selectedIds, isCircleModifiable, getRandomPaletteColor]);
  
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);
  
  const invertSelection = useCallback(() => {
    // ...
  }, [circles, layers, selectedIds]);
  
  const selectAll = useCallback(() => {
    // ...
  }, [circles, layers]);
  
  const lockInverse = useCallback(() => {
    // ...
  }, [circles, layers, selectedIds]);
  
  const unlockAll = useCallback(() => {
    // ...
  }, [circles]);
  
  return {
    isCircleModifiable,
    isPointInCircle,
    isCircleInRect,
    getCirclesInRect,
    isClickOnSelection,
    moveSelection,
    deleteSelection,
    recolorSelection,
    clearSelection,
    invertSelection,
    selectAll,
    lockInverse,
    unlockAll,
  };
}
```

#### File: `src/actions/useAnimationActions.ts` (~250 lines)
**Responsibility:** Animation controls & video export

```typescript
export function useAnimationActions(
  animationRecorder: AnimationRecorder,
  system: PhysicsSystem,
  // ... dependencies
) {
  const startRecording = useCallback(() => {
    // ...
  }, [animationRecorder, system.circles]);
  
  const stopRecording = useCallback(() => {
    // ...
  }, [animationRecorder]);
  
  const playAnimation = useCallback(() => {
    // ...
  }, [animationRecorder]);
  
  const stopAnimation = useCallback(() => {
    // ...
  }, [animationRecorder]);
  
  const saveCurrentAnimation = useCallback(() => {
    // ...
  }, [animationRecorder]);
  
  const loadAnimation = useCallback(async () => {
    // ...
  }, [animationRecorder]);
  
  const clearAnimation = useCallback(() => {
    // ...
  }, [animationRecorder]);
  
  const applyAnimationSmoothing = useCallback(() => {
    // ...
  }, [animationRecorder, smoothingStrength]);
  
  const exportAnimationVideo = useCallback(async () => {
    // HUGE function - 200+ lines
    // ...
  }, [animationRecorder, bgPalette, selectedBgSwatch, layers, exportResolution, exportCameraZoom, exportCameraPanX, exportCameraPanY]);
  
  return {
    startRecording,
    stopRecording,
    playAnimation,
    stopAnimation,
    saveCurrentAnimation,
    loadAnimation,
    clearAnimation,
    applyAnimationSmoothing,
    exportAnimationVideo,
  };
}
```

---

### Phase 3: Extract Event Handlers (Priority: HIGH)
**Goal:** Move all event handling logic to custom hooks

#### File: `src/handlers/usePointerHandlers.ts` (~400 lines)
**Responsibility:** Mouse and touch event handlers

```typescript
export function usePointerHandlers(
  canvasRef: RefObject<HTMLCanvasElement>,
  // ... all dependencies
) {
  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // ...
  }, [canvasRef]);
  
  const getTouchDistance = useCallback((e: React.TouchEvent<HTMLCanvasElement>): number => {
    // ...
  }, []);
  
  const handlePointerDown = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // HUGE - 200+ lines
    // ...
  }, [/* many dependencies */]);
  
  const handlePointerMove = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // HUGE - 200+ lines
    // ...
  }, [/* many dependencies */]);
  
  const handlePointerUp = useCallback((e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // 150+ lines
    // ...
  }, [/* many dependencies */]);
  
  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
```

#### File: `src/handlers/useKeyboardHandlers.ts` (~150 lines)
**Responsibility:** Keyboard shortcuts

```typescript
export function useKeyboardHandlers(
  selectedIds: Set<number>,
  deleteSelection: () => void,
  clearSelection: () => void,
  // ... other dependencies
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // All keyboard shortcut logic
      // ...
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deleteSelection, clearSelection, /* ... */]);
}
```

---

### Phase 4: Extract Effects (Priority: MEDIUM)
**Goal:** Move useEffect logic to focused hooks

#### File: `src/effects/usePhysicsEffects.ts` (~300 lines)
**Responsibility:** Physics forces (magnet, n-body, sticky, scaling)

```typescript
export function usePhysicsEffects(
  circles: Circle[],
  magnetMode: 'off' | 'attract' | 'repel',
  magnetStrength: number,
  magnetRadius: number,
  nBodyMode: 'off' | 'clump' | 'spread',
  nBodyStrength: number,
  stickyMode: boolean,
  stickyStrength: number,
  scaleSliderRef: MutableRefObject<number>,
  isScalingRef: MutableRefObject<boolean>,
  randomScaleSliderRef: MutableRefObject<number>,
  isRandomScalingRef: MutableRefObject<boolean>,
  isMagnetActiveRef: MutableRefObject<boolean>,
  magnetPosRef: MutableRefObject<{ x: number; y: number }>,
  isCircleAffected: (c: Circle) => boolean,
  isLayerAffectedByForces: (layerId: string) => boolean,
  selectMode: boolean,
  selectedIds: Set<number>
) {
  const applyMagnet = useCallback(() => {
    // ...
  }, [circles, magnetMode, magnetRadius, magnetStrength, isCircleAffected]);
  
  const applyNBodyForce = useCallback(() => {
    // ...
  }, [circles, nBodyMode, nBodyStrength, isCircleAffected]);
  
  const applyStickyForce = useCallback(() => {
    // ...
  }, [circles, stickyMode, stickyStrength, isCircleAffected]);
  
  const applyScaling = useCallback(() => {
    // ...
  }, [circles, isLayerAffectedByForces, selectMode, selectedIds]);
  
  const applyRandomScaling = useCallback(() => {
    // ...
  }, [circles, isLayerAffectedByForces, selectMode, selectedIds]);
  
  return {
    applyMagnet,
    applyNBodyForce,
    applyStickyForce,
    applyScaling,
    applyRandomScaling,
  };
}
```

#### File: `src/effects/useAnimationLoop.ts` (~100 lines)
**Responsibility:** Main animation/rendering loop

```typescript
export function useAnimationLoop(
  system: PhysicsSystem,
  render: () => void,
  applyMagnet: () => void,
  applyNBodyForce: () => void,
  applyStickyForce: () => void,
  applyScaling: () => void,
  applyRandomScaling: () => void,
  autoSpawn: () => void,
  autoSpawnRandom: () => void,
  physicsPaused: boolean,
  isRecording: boolean,
  isPlayingAnimation: boolean,
  animationRecorder: AnimationRecorder,
  setPhysicsPaused: (paused: boolean) => void
) {
  useEffect(() => {
    let lastTime = performance.now();
    let slowFrameCount = 0;
    
    const loop = (time: number) => {
      // Animation loop logic
      // ...
    };
    
    const animationRef = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef);
  }, [system, render, applyMagnet, /* ... */]);
}
```

---

### Phase 5: Extract Rendering (Priority: MEDIUM)
**Goal:** Move render function and helpers to separate files

#### File: `src/rendering/useCanvasRenderer.ts` (~150 lines)
**Responsibility:** Main render orchestration

```typescript
export function useCanvasRenderer(
  canvasRef: RefObject<HTMLCanvasElement>,
  circles: Circle[],
  config: PhysicsConfig,
  layers: Layer[],
  getActiveLayer: () => Layer | undefined,
  brush: WatercolorBrush,
  // ... other dependencies
) {
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear background
    ctx.fillStyle = getBackgroundColor();
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw floor
    if (config.floorEnabled) {
      drawFloor(ctx, config.floorY, canvas.width);
    }
    
    // Render layers
    renderLayers(ctx, layers, circles, playbackCircles, getActiveLayer, brush);
    
    // Draw overlays
    renderOverlays(ctx, {
      flowVisible,
      flowVectors: system.flowVectors,
      magnetMode,
      magnetRadius,
      magnetPos: magnetPosRef.current,
      isMagnetActive: isMagnetActiveRef.current,
      selectedIds,
      selectionRect: selectionRectRef.current,
      showCameraPreview,
      exportCameraZoom,
      exportCameraPanX,
      exportCameraPanY,
      canvas,
    });
  }, [canvasRef, circles, config, layers, /* ... */]);
  
  return { render };
}
```

#### File: `src/rendering/renderLayers.ts` (~100 lines)
**Responsibility:** Layer rendering logic (pure functions)

```typescript
export function renderLayers(
  ctx: CanvasRenderingContext2D,
  layers: Layer[],
  circles: Circle[],
  playbackCircles: CircleSnapshot[] | null,
  getActiveLayer: () => Layer | undefined,
  brush: WatercolorBrush
) {
  for (const layer of layers) {
    if (!layer.visible) continue;
    
    ctx.globalAlpha = layer.opacity;
    
    if (layer.type === 'paint') {
      renderPaintLayer(ctx, layer as PaintLayer);
    } else if (layer.type === 'circles') {
      renderCircleLayer(ctx, layer, circles, playbackCircles);
    }
    
    ctx.globalAlpha = 1;
  }
  
  // Update watercolor bleed
  const activeLayer = getActiveLayer();
  if (activeLayer?.type === 'paint') {
    const paintLayer = activeLayer as PaintLayer;
    if (paintLayer.ctx && brush.hasActiveParticles()) {
      brush.updateBleed(paintLayer.ctx);
    }
  }
}

function renderPaintLayer(ctx: CanvasRenderingContext2D, layer: PaintLayer) {
  if (layer.canvas) {
    ctx.drawImage(layer.canvas, 0, 0);
  }
}

function renderCircleLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  circles: Circle[],
  playbackCircles: CircleSnapshot[] | null
) {
  const circlesToRender = playbackCircles 
    ? playbackCircles.filter(c => c.layerId === layer.id)
    : circles.filter(c => c.layerId === layer.id);
  
  for (const c of circlesToRender) {
    // Draw circle logic...
  }
}
```

#### File: `src/rendering/renderOverlays.ts` (~150 lines)
**Responsibility:** Draw selection, magnet, flow vectors, camera preview

```typescript
export interface OverlayOptions {
  flowVisible: boolean;
  flowVectors: FlowVector[];
  magnetMode: 'off' | 'attract' | 'repel';
  magnetRadius: number;
  magnetPos: { x: number; y: number };
  isMagnetActive: boolean;
  selectedIds: Set<number>;
  selectionRect: { x: number; y: number; w: number; h: number } | null;
  showCameraPreview: boolean;
  exportCameraZoom: number;
  exportCameraPanX: number;
  exportCameraPanY: number;
  canvas: HTMLCanvasElement;
}

export function renderOverlays(ctx: CanvasRenderingContext2D, options: OverlayOptions) {
  // Draw flow vectors
  if (options.flowVisible) {
    drawFlowVectors(ctx, options.flowVectors);
  }
  
  // Draw magnet indicator
  if (options.isMagnetActive && options.magnetMode !== 'off') {
    drawMagnetIndicator(ctx, options.magnetPos, options.magnetRadius, options.magnetMode);
  }
  
  // Draw selection highlights
  if (options.selectedIds.size > 0) {
    drawSelectionHighlights(ctx, options.selectedIds, circles);
  }
  
  // Draw selection marquee
  if (options.selectionRect) {
    drawSelectionMarquee(ctx, options.selectionRect);
  }
  
  // Draw camera preview
  if (options.showCameraPreview && options.exportCameraZoom !== 1) {
    drawCameraPreview(ctx, options);
  }
}

function drawFlowVectors(ctx: CanvasRenderingContext2D, flowVectors: FlowVector[]) {
  // Flow vector drawing logic...
}

function drawMagnetIndicator(/* ... */) {
  // Magnet indicator logic...
}

// ... other drawing functions
```

---

### Phase 6: Extract Panels (Priority: LOW - Already partially done)
**Goal:** Move JSX panel components to separate files

#### File: `src/panels/CanvasPanel.tsx` (~300 lines)
**Responsibility:** Canvas settings & export UI

```typescript
interface CanvasPanelProps {
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  canvasRef: RefObject<HTMLCanvasElement>;
  system: PhysicsSystem;
  layers: Layer[];
  getBackgroundHex: () => string;
  
  // Animation state
  isRecording: boolean;
  isPlayingAnimation: boolean;
  recordingDuration: number;
  recordingFrames: number;
  hasAnimation: boolean;
  animationDuration: number;
  
  // Animation actions
  startRecording: () => void;
  stopRecording: () => void;
  playAnimation: () => void;
  stopAnimation: () => void;
  saveCurrentAnimation: () => void;
  loadAnimation: () => void;
  clearAnimation: () => void;
  applyAnimationSmoothing: () => void;
  exportAnimationVideo: () => void;
  
  // Export settings
  smoothingStrength: number;
  setSmoothingStrength: (val: number) => void;
  exportResolution: number;
  setExportResolution: (res: number) => void;
  isExportingVideo: boolean;
  exportProgress: VideoExportProgress | null;
  
  // Camera
  exportCameraZoom: number;
  setExportCameraZoom: (zoom: number) => void;
  exportCameraPanX: number;
  setExportCameraPanX: (x: number) => void;
  exportCameraPanY: number;
  setExportCameraPanY: (y: number) => void;
  showCameraPreview: boolean;
  setShowCameraPreview: (show: boolean) => void;
  
  // Project
  saveProject: () => void;
  loadProject: () => void;
}

export function CanvasPanel(props: CanvasPanelProps) {
  return (
    <>
      <div className="section-header">Canvas Settings</div>
      {/* Aspect ratio input */}
      
      <div className="section-header">Export</div>
      {/* PNG/SVG export buttons */}
      
      <div className="section-header">Animation</div>
      {/* Record/Play/Stop controls */}
      {/* Smoothing slider */}
      {/* Export resolution selector */}
      {/* Camera controls */}
      {/* Export video button */}
      {/* Save/Load/Clear animation */}
      
      <div className="section-header">Project</div>
      {/* Save/Load project */}
    </>
  );
}
```

#### File: `src/panels/ToolsPanel.tsx` (~250 lines)
**Responsibility:** Drawing & selection tools UI

```typescript
interface ToolsPanelProps {
  circleCount: number;
  brushSize: number;
  setBrushSize: (size: number) => void;
  
  // Auto spawn
  isAutoSpawningRef: MutableRefObject<boolean>;
  isRandomSpawningRef: MutableRefObject<boolean>;
  
  // Edit modes
  eraseMode: boolean;
  setEraseMode: (mode: boolean) => void;
  lockMode: boolean;
  setLockMode: (mode: boolean) => void;
  recolorMode: boolean;
  setRecolorMode: (mode: boolean) => void;
  unlockAll: () => void;
  clearSelection: () => void;
  
  // Selection
  selectMode: boolean;
  setSelectMode: (mode: boolean) => void;
  selectedIds: Set<number>;
  selectAll: () => void;
  invertSelection: () => void;
  recolorSelection: () => void;
  deleteSelection: () => void;
  lockInverse: () => void;
  
  // Undo/Redo
  clear: () => void;
  performUndo: () => void;
  performRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveUndoState: (force: boolean) => void;
  
  // Mode clearing
  setMagnetMode: (mode: 'off' | 'attract' | 'repel') => void;
  setFlowMode: (mode: 'off' | 'draw' | 'erase') => void;
}

export function ToolsPanel(props: ToolsPanelProps) {
  return (
    <>
      <div className="section-header">Draw</div>
      {/* Circle count */}
      {/* Brush size slider */}
      {/* Auto spawn buttons */}
      
      <div className="section-header">Edit Modes</div>
      {/* Erase/Recolor buttons */}
      {/* Lock/Unlock buttons */}
      
      <div className="section-header">Selection</div>
      {/* Select mode toggle */}
      {/* Select All/Invert buttons */}
      {/* Selection actions (if selectedIds.size > 0) */}
      
      <div className="section-header">Undo / Redo</div>
      {/* Clear All/Undo/Redo buttons */}
    </>
  );
}
```

#### File: `src/panels/LayersPanel.tsx` (~200 lines)
**Responsibility:** Layer management UI

```typescript
interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
  addCircleLayer: () => void;
  addPaintLayer: () => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  
  // Paint settings (if active layer is paint)
  getActiveLayer: () => Layer | undefined;
  paintMode: boolean;
  setPaintMode: (mode: boolean) => void;
  brush: WatercolorBrush;
  clearPaintLayer: (id: string) => void;
}

export function LayersPanel(props: LayersPanelProps) {
  return (
    <>
      <div className="section-header">Layer Management</div>
      {/* Add circle/paint buttons */}
      
      <div className="layer-list">
        {/* Layer items with controls */}
      </div>
      
      {props.getActiveLayer()?.type === 'paint' && (
        <>
          <div className="section-header">Paint Settings</div>
          {/* Paint mode toggle */}
          {/* Wetness/Flow/Bleed sliders */}
          {/* Clear paint button */}
        </>
      )}
    </>
  );
}
```

---

### Phase 7: New App.tsx (~200 lines)
**Goal:** Orchestrate all modules, minimal logic

```typescript
import { useRef } from "react";
import { usePhysics, useLayers } from "./hooks";
import { useAppState } from "./state/useAppState";
import { useUIState } from "./state/useUIState";
import { useAnimationState } from "./state/useAnimationState";
import { usePaletteState } from "./state/usePaletteState";
import { useSelectionActions } from "./actions/useSelectionActions";
import { useUndoActions } from "./actions/useUndoActions";
import { useAnimationActions } from "./actions/useAnimationActions";
import { usePaletteActions } from "./actions/usePaletteActions";
import { useProjectActions } from "./actions/useProjectActions";
import { usePointerHandlers } from "./handlers/usePointerHandlers";
import { useKeyboardHandlers } from "./handlers/useKeyboardHandlers";
import { usePhysicsEffects } from "./effects/usePhysicsEffects";
import { useAnimationLoop } from "./effects/useAnimationLoop";
import { useCanvasResize } from "./effects/useCanvasResize";
import { useSystemSync } from "./effects/useSystemSync";
import { useCanvasRenderer } from "./rendering/useCanvasRenderer";
import { LeftPanel } from "./panels/LeftPanel";
import { RightPanel } from "./panels/RightPanel";
import { RecordingIndicator, PlaybackIndicator, ExportingIndicator } from "./components";
import "./styles.css";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Core systems
  const physics = usePhysics();
  const layers = useLayers();
  
  // State hooks
  const appState = useAppState();
  const uiState = useUIState();
  const animationState = useAnimationState();
  const paletteState = usePaletteState();
  
  // Action hooks
  const selectionActions = useSelectionActions(physics.circles, layers.layers, appState.selectedIds, appState.setSelectedIds, /* ... */);
  const undoActions = useUndoActions(physics.circles, selectionActions.clearSelection);
  const animationActions = useAnimationActions(animationState.animationRecorder, physics.system, /* ... */);
  const paletteActions = usePaletteActions(paletteState.palette, paletteState.bgPalette, /* ... */);
  const projectActions = useProjectActions(physics.system, layers, /* ... */);
  
  // Effect hooks
  const physicsEffects = usePhysicsEffects(physics.circles, appState.magnetMode, /* ... */);
  const { render } = useCanvasRenderer(canvasRef, physics.circles, physics.config, layers.layers, /* ... */);
  
  // Event handler hooks
  const pointerHandlers = usePointerHandlers(canvasRef, physics, layers, appState, paletteState, selectionActions, /* ... */);
  useKeyboardHandlers(appState.selectedIds, selectionActions.deleteSelection, selectionActions.clearSelection, /* ... */);
  
  // System sync hooks
  useSystemSync(physics.system, appState.flowStrength, appState.flowRadius, layers.brush, appState.brushSize, /* ... */);
  useCanvasResize(canvasRef, uiState.aspectRatio, physics.setBounds, layers.resizeAllPaintLayers, physics.system);
  useAnimationLoop(physics.system, render, physicsEffects.applyMagnet, physicsEffects.applyNBodyForce, /* ... */);
  
  return (
    <div className="app">
      <LeftPanel
        uiState={uiState}
        physics={physics}
        layers={layers}
        paletteState={paletteState}
        paletteActions={paletteActions}
        appState={appState}
        selectionActions={selectionActions}
        undoActions={undoActions}
        animationState={animationState}
        animationActions={animationActions}
        projectActions={projectActions}
        canvasRef={canvasRef}
      />
      
      <main className="canvas-container">
        {animationState.isRecording && <RecordingIndicator duration={animationState.recordingDuration} />}
        {animationState.isPlayingAnimation && <PlaybackIndicator />}
        {animationState.isExportingVideo && <ExportingIndicator progress={animationState.exportProgress} resolution={animationState.exportResolution} />}
        
        <canvas
          ref={canvasRef}
          style={{ cursor: getCursor(appState) }}
          onMouseDown={pointerHandlers.handlePointerDown}
          onMouseMove={pointerHandlers.handlePointerMove}
          onMouseUp={pointerHandlers.handlePointerUp}
          onMouseLeave={pointerHandlers.handlePointerUp}
          onTouchStart={pointerHandlers.handlePointerDown}
          onTouchMove={pointerHandlers.handlePointerMove}
          onTouchEnd={pointerHandlers.handlePointerUp}
          onTouchCancel={pointerHandlers.handlePointerUp}
        />
      </main>
      
      <RightPanel
        uiState={uiState}
        physics={physics}
        layers={layers}
        appState={appState}
        physicsEffects={physicsEffects}
      />
    </div>
  );
}

function getCursor(appState: AppState): string {
  if (appState.eraseMode) return 'not-allowed';
  if (appState.lockMode) return 'pointer';
  if (appState.recolorMode) return 'cell';
  if (appState.selectMode) return 'crosshair';
  if (appState.magnetMode !== 'off') return 'move';
  if (appState.flowMode === 'draw') return 'crosshair';
  if (appState.flowMode === 'erase') return 'not-allowed';
  return 'crosshair';
}

export default App;
```

---

## ?? Size Comparison

### Before:
- **App.tsx**: 2,638 lines ? (too large)

### After:
- **App.tsx**: ~200 lines ?
- **State hooks**: ~600 lines (4 files × ~150 lines) ?
- **Action hooks**: ~900 lines (5 files × ~180 lines) ?
- **Handler hooks**: ~550 lines (3 files × ~180 lines) ?
- **Effect hooks**: ~550 lines (4 files × ~140 lines) ?
- **Rendering**: ~400 lines (3 files × ~130 lines) ?
- **Panel components**: ~950 lines (5 files × ~190 lines) ?

**Total lines unchanged** (~4,150 lines), but now split into **25 focused files** averaging ~165 lines each!

---

## ?? Migration Strategy

### Recommended Order:
1. **Extract State** (Phase 1) - Foundation for everything
2. **Extract Actions** (Phase 2) - Business logic separation
3. **Extract Handlers** (Phase 3) - Event handling isolation
4. **Extract Effects** (Phase 4) - Side effect management
5. **Extract Rendering** (Phase 5) - View layer separation
6. **Extract Panels** (Phase 6) - UI component modularization
7. **Refactor App.tsx** (Phase 7) - Final orchestration

### Testing Between Phases:
- Run `npm run dev` after each phase
- Verify all functionality works
- Fix any import/export issues
- Commit changes

---

## ? Benefits After Refactoring

1. **Loadable** - Each file fits in AI context window
2. **Focused** - One responsibility per file
3. **Testable** - Isolated units are easier to test
4. **Maintainable** - Clear boundaries, easier to find code
5. **Reusable** - Hooks can be shared across components
6. **Debuggable** - Smaller files = easier to trace bugs
7. **Collaborative** - Multiple devs can work on different files

---

## ?? Notes

- **Keep TypeScript types** - Create `src/types` folder for shared types
- **Keep existing hooks** - usePhysics, useLayers already well-structured
- **No behavior changes** - Pure refactoring, same functionality
- **Incremental approach** - Can do one phase at a time
- **Git commits** - Commit after each successfully working phase

---

## ?? Next Steps

1. Review this plan
2. Choose starting phase (recommend: Phase 1 - State)
3. Create first hook file
4. Move code incrementally
5. Test thoroughly
6. Repeat for next phase

Would you like me to start with **Phase 1** and create the first state hook file?
