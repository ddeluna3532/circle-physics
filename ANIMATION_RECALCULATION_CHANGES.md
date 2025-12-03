# Animation Layer Recalculation Changes

## Summary
Changed the animation layer functionality so that:
1. Each layer stores its own animation information independently
2. The "Play Blended" button has been replaced with a "Recalculate" button
3. Recalculation creates a new physics simulation with accurate collisions and interactions from all animation layers

## Files Modified

### 1. `src/layers/AnimationLayer.ts`
- **Removed**: Blending functionality (`blendLayersAtTime()`, `exportBlended()`)
- **Changed**: Playback now plays the recalculated animation instead of blending layers in real-time
- **Added**: `recalculateWithPhysics()` method that:
  - Takes all visible animation layers as input
  - Gets initial circle state from frame 0 of all layers
  - Creates a new PhysicsSystem instance with current physics settings
  - Runs the simulation forward frame by frame
  - Captures each frame with proper collision detection and physics
  - Returns the result as a new AnimationData

### 2. `src/components/AnimationLayersPanel.tsx`
- **Changed**: Interface now expects `system` with full physics config
- **Replaced**: "Play Blended" button ? "Recalculate" button
- **Added**: Progress bar during recalculation
- **Added**: `recalculateAnimation()` callback that runs physics simulation asynchronously
- **Modified**: Playback now plays the recalculated result instead of blended layers
- **Added**: "Play Result" button to play the recalculated animation
- **Added**: "Save Result" and "Clear Result" buttons

### 3. `src/App.tsx`
- **Added**: Pass `canvasBounds={system.bounds}` to AnimationLayersPanel component
- This provides the bounds needed for physics recalculation

### 4. `src/styles.css`
- **Added**: CSS for progress bar (`.progress-bar`, `.progress-fill`)

## How It Works Now

1. **Recording**: Each animation layer can record its own animation independently
2. **Recalculation**: 
   - User clicks "Recalculate" button
   - System gathers initial positions from all visible layers at time 0
   - Creates a fresh physics simulation with those circles
   - Runs the simulation forward, capturing each frame
   - Stores the result as a new animation with accurate collisions
3. **Playback**: User can play back the recalculated result with proper physics

## Benefits

- Accurate physics simulation with real collisions between all circles
- Each layer maintains its original recording
- Can recalculate multiple times with different physics settings
- Clear separation between source animations and calculated result
