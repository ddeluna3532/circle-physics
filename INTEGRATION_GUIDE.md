# Integration Guide: Using New Panel Components

## Files Created ?

1. ? `src/hooks/usePalette.ts` - Palette management hook
2. ? `src/components/indicators/` - Recording, Playback, Exporting indicators
3. ? `src/components/panels/PhysicsPanel.tsx` - Physics controls panel
4. ? `src/components/panels/ColorsPanel.tsx` - Color palette panel
5. ? `src/components/panels/index.tsx` - Panel exports
6. ? `src/components/index.tsx` - Main components export
7. ? Updated `tsconfig.json` - Fixed compatibility issues

## How to Integrate into App.tsx

### Step 1: Update Imports

Replace the current palette-related code with:

```typescript
import { usePhysics, useLayers, usePalette } from "./hooks";
import { 
  PhysicsPanel, 
  ColorsPanel, 
  AnimationLayersPanel,
  RecordingIndicator,
  PlaybackIndicator,
  ExportingIndicator 
} from "./components";
```

### Step 2: Use usePalette Hook

Replace all palette state declarations (lines ~130-155) with:

```typescript
// Use palette hook
const paletteHook = usePalette();
const {
  palette,
  selectedSwatch,
  setSelectedSwatch,
  updateSwatch,
  resetCirclePalette,
  bgPalette,
  selectedBgSwatch,
  setSelectedBgSwatch,
  updateBgPalette,
  resetBgPalette,
  colorEditMode,
  setColorEditMode,
  activeColor,
  updateActiveColor,
  getColor,
  getRandomPaletteColor,
  getBackgroundColor,
  getBackgroundHex,
  savePalettes,
  loadPalettes,
} = paletteHook;
```

### Step 3: Replace Indicators in JSX

Find the recording indicator (around line 2540):

```typescript
// OLD:
{isRecording && (
  <div className="recording-indicator">
    REC {(recordingDuration / 1000).toFixed(1)}s
  </div>
)}

// NEW:
{isRecording && <RecordingIndicator duration={recordingDuration} />}
```

Find the playback indicator (around line 2550):

```typescript
// OLD:
{isPlayingAnimation && (
  <div className="playback-indicator">
    ? Playing
  </div>
)}

// NEW:
{isPlayingAnimation && <PlaybackIndicator />}
```

Find the exporting indicator (around line 2560):

```typescript
// OLD:
{isExportingVideo && exportProgress && (
  <div className="exporting-indicator">
    ?? Exporting {exportResolution}x... {exportProgress.progress.toFixed(0)}%
  </div>
)}

// NEW:
{isExportingVideo && exportProgress && (
  <ExportingIndicator 
    resolution={exportResolution} 
    progress={exportProgress.progress} 
  />
)}
```

### Step 4: Replace Colors Tab Content

Find the Colors tab (around line 2350-2500), replace with:

```typescript
<div className={`tab-pane ${leftTab === 'colors' ? 'active' : ''}`}>
  <ColorsPanel
    palette={palette}
    selectedSwatch={selectedSwatch}
    setSelectedSwatch={setSelectedSwatch}
    updateSwatch={updateSwatch}
    resetCirclePalette={resetCirclePalette}
    bgPalette={bgPalette}
    selectedBgSwatch={selectedBgSwatch}
    setSelectedBgSwatch={setSelectedBgSwatch}
    updateBgPalette={updateBgPalette}
    resetBgPalette={resetBgPalette}
    colorEditMode={colorEditMode}
    setColorEditMode={setColorEditMode}
    activeColor={activeColor}
    updateActiveColor={updateActiveColor}
    savePalettes={savePalettes}
    loadPalettes={loadPalettes}
  />
</div>
```

### Step 5: Replace Physics Tab Content

Find the Physics tab (around line 2650-2950), replace with:

```typescript
<div className={`tab-pane ${rightTab === 'physics' ? 'active' : ''}`}>
  <PhysicsPanel
    physicsPaused={physicsPaused}
    setPhysicsPaused={setPhysicsPaused}
    config={config}
    system={system}
    setGravity={setGravity}
    setWalls={setWalls}
    setFloor={setFloor}
    collisionIterations={collisionIterations}
    setCollisionIterations={setCollisionIterations}
    restitution={restitution}
    setRestitution={setRestitution}
    magnetMode={magnetMode}
    setMagnetMode={setMagnetMode}
    magnetStrength={magnetStrength}
    setMagnetStrength={setMagnetStrength}
    magnetRadius={magnetRadius}
    setMagnetRadius={setMagnetRadius}
    nBodyMode={nBodyMode}
    setNBodyMode={setNBodyMode}
    nBodyStrength={nBodyStrength}
    setNBodyStrength={setNBodyStrength}
    stickyMode={stickyMode}
    setStickyMode={setStickyMode}
    stickyStrength={stickyStrength}
    setStickyStrength={setStickyStrength}
    flowMode={flowMode}
    setFlowMode={setFlowMode}
    flowVisible={flowVisible}
    setFlowVisible={setFlowVisible}
    flowStrength={flowStrength}
    setFlowStrength={setFlowStrength}
    flowRadius={flowRadius}
    setFlowRadius={setFlowRadius}
    scaleSliderRef={scaleSliderRef}
    isScalingRef={isScalingRef}
    randomScaleSliderRef={randomScaleSliderRef}
    isRandomScalingRef={isRandomScalingRef}
  />
</div>
```

### Step 6: Update AnimationLayersPanel Usage

Find AnimationLayersPanel usage (around line 2950), add canvasBounds prop:

```typescript
<AnimationLayersPanel
  system={system}
  isRecording={isRecording}
  isPlayingAnimation={isPlayingAnimation}
  setIsRecording={setIsRecording}
  setIsPlayingAnimation={setIsPlayingAnimation}
  setPhysicsPaused={setPhysicsPaused}
  setPlaybackCircles={setPlaybackCircles}
  setRecordingDuration={setRecordingDuration}
  setRecordingFrames={setRecordingFrames}
  animationRecorder={animationRecorder}
  canvasBounds={system.bounds}  // ? ADD THIS LINE
/>
```

### Step 7: Delete Old Code

After integration, delete the following from App.tsx:

1. ? Delete palette state declarations (lines ~130-155)
2. ? Delete palette functions (getBackgroundColor, getBackgroundHex, updateBgPalette, resetCirclePalette, resetBgPalette, savePalettes, loadPalettes)
3. ? Delete Colors tab JSX (lines ~2350-2500)
4. ? Delete Physics tab JSX (lines ~2650-2950)

## Expected Results ??

- **App.tsx**: Reduced from ~2500 lines to ~2100 lines (400 lines saved!)
- **Better organization**: Physics and Colors logic are now in separate, focused files
- **Reusable components**: Can easily test or reuse these panels
- **Type safety**: All props are properly typed with interfaces

## Testing Checklist ?

After integration, test:

- [ ] Color palette selection works
- [ ] HSL sliders update colors correctly
- [ ] Save/Load palettes works
- [ ] Reset palette buttons work
- [ ] Physics pause/resume works
- [ ] Gravity toggle and strength slider work
- [ ] Walls and floor toggles work
- [ ] Collision settings update properly
- [ ] Magnet modes (attract/repel) work
- [ ] N-body forces (clump/spread) work
- [ ] Sticky mode works
- [ ] Flow field draw/erase works
- [ ] Scaling sliders work
- [ ] Recording indicator shows during recording
- [ ] Playback indicator shows during playback
- [ ] Export indicator shows during video export
- [ ] Animation recalculation with proper collisions works

## Next Steps ??

Continue refactoring by creating:

1. **ToolsPanel.tsx** - Draw tools, selection, undo/redo (~250 lines saved)
2. **LayersPanel.tsx** - Layer management (~250 lines saved)
3. **CanvasPanel.tsx** - Canvas settings, export (~200 lines saved)
4. **useAnimation.ts** hook - Animation state management (~150 lines saved)
5. **useKeyboardShortcuts.ts** hook - Keyboard handlers (~100 lines saved)

**Total potential savings**: ~1350 more lines!

Target: App.tsx at ~300-400 lines (currently at ~2100 after this step)
