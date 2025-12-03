# App Refactoring Plan

## Current Issues
1. App.tsx is over 2500 lines (way too large)
2. All UI panels are in one file
3. All handlers are in one file  
4. State management is scattered

## Proposed Structure

```
src/
??? App.tsx (main component, ~200 lines)
??? components/
?   ??? panels/
?   ?   ??? CanvasPanel.tsx
?   ?   ??? ColorsPanel.tsx
?   ?   ??? ToolsPanel.tsx
?   ?   ??? PhysicsPanel.tsx
?   ?   ??? LayersPanel.tsx
?   ?   ??? AnimationLayersPanel.tsx (already exists)
?   ??? Canvas.tsx
?   ??? indicators/
?       ??? RecordingIndicator.tsx
?       ??? PlaybackIndicator.tsx
?       ??? ExportingIndicator.tsx
??? hooks/
?   ??? usePhysics.ts (already exists)
?   ??? useLayers.ts (already exists)
?   ??? useCanvas.ts (new - canvas interaction logic)
?   ??? usePalette.ts (new - color management)
?   ??? useAnimation.ts (new - animation state)
?   ??? useKeyboardShortcuts.ts (new - keyboard handlers)
??? utils/
    ??? canvasCoordinates.ts
    ??? touchGestures.ts
```

## Refactoring Steps

### Phase 1: Extract UI Panels (Immediate)
- Create `components/panels/CanvasPanel.tsx` - canvas settings & export
- Create `components/panels/ColorsPanel.tsx` - color palettes
- Create `components/panels/ToolsPanel.tsx` - draw tools & selection
- Create `components/panels/PhysicsPanel.tsx` - physics controls
- Create `components/panels/LayersPanel.tsx` - layer management

### Phase 2: Extract Canvas Logic
- Create `components/Canvas.tsx` - canvas rendering component
- Create `hooks/useCanvas.ts` - pointer events, gestures, rendering

### Phase 3: Extract State Management
- Create `hooks/usePalette.ts` - palette state and operations
- Create `hooks/useAnimation.ts` - animation recording/playback state
- Create `hooks/useKeyboardShortcuts.ts` - keyboard event handlers

### Phase 4: Extract Utilities
- Create `utils/canvasCoordinates.ts` - coordinate conversion helpers
- Create `utils/touchGestures.ts` - touch gesture detection

## Benefits
- Each file under 300 lines
- Clear separation of concerns
- Easier to test individual components
- Better code organization
- Easier to maintain and extend
