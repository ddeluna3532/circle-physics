# Animation Layer Integration Guide

## Step 1: Add Animation Layer Callbacks

Add these callbacks after the `clearAnimation` function (around line 905):

```typescript
// Animation layer management callbacks
const addAnimationLayer = useCallback(() => {
  const layer = animationLayerManager.addLayer();
  setAnimationLayers(animationLayerManager.getLayers());
  setActiveAnimLayerId(layer.id);
}, [animationLayerManager]);

const removeAnimationLayer = useCallback((id: string) => {
  animationLayerManager.removeLayer(id);
  setAnimationLayers(animationLayerManager.getLayers());
  setActiveAnimLayerId(animationLayerManager.getActiveLayer()?.id || null);
}, [animationLayerManager]);

const updateAnimationLayer = useCallback((id: string, updates: Partial<AnimationLayer>) => {
  animationLayerManager.updateLayer(id, updates);
  setAnimationLayers(animationLayerManager.getLayers());
}, [animationLayerManager]);

const toggleAnimLayerVisibility = useCallback((id: string) => {
  animationLayerManager.toggleVisibility(id);
  setAnimationLayers(animationLayerManager.getLayers());
}, [animationLayerManager]);

const toggleAnimLayerLock = useCallback((id: string) => {
  animationLayerManager.toggleLock(id);
  setAnimationLayers(animationLayerManager.getLayers());
}, [animationLayerManager]);

const moveAnimationLayer = useCallback((id: string, direction: 'up' | 'down') => {
  animationLayerManager.moveLayer(id, direction);
  setAnimationLayers(animationLayerManager.getLayers());
}, [animationLayerManager]);

const recordToAnimationLayer = useCallback(() => {
  const activeLayer = animationLayerManager.getActiveLayer();
  if (!activeLayer || activeLayer.locked) {
    alert('Please select an unlocked animation layer');
    return;
  }
  
  animationRecorder.setRecordingCallback((duration, frames) => {
    setRecordingDuration(duration);
    setRecordingFrames(frames);
  });
  animationRecorder.startRecording(system.circles);
  setIsRecording(true);
  setPhysicsPaused(false);
}, [animationRecorder, animationLayerManager, system.circles]);

const stopRecordingToLayer = useCallback(() => {
  const data = animationRecorder.stopRecording();
  setIsRecording(false);
  
  if (data) {
    const activeLayer = animationLayerManager.getActiveLayer();
    if (activeLayer) {
      animationLayerManager.loadAnimationToLayer(activeLayer.id, data);
      setAnimationLayers(animationLayerManager.getLayers());
      console.log(`Recorded animation to layer: ${activeLayer.name}`);
    }
  }
}, [animationRecorder, animationLayerManager]);

const playBlendedAnimation = useCallback(() => {
  if (!animationLayerManager.hasAnimations()) {
    alert('No animations in any layer');
    return;
  }
  
  setPhysicsPaused(true);
  setIsPlayingBlended(true);
  setIsPlayingAnimation(false);
  
  animationLayerManager.startPlayback(
    (circles: BlendedCircleState[]) => {
      setPlaybackCircles(circles as any);
    },
    () => {
      setIsPlayingBlended(false);
      setPlaybackCircles(null);
    },
    true
  );
}, [animationLayerManager]);

const stopBlendedAnimation = useCallback(() => {
  animationLayerManager.stopPlayback();
  setIsPlayingBlended(false);
  setPlaybackCircles(null);
}, [animationLayerManager]);

const loadAnimationToActiveLayer = useCallback(async () => {
  const activeLayer = animationLayerManager.getActiveLayer();
  if (!activeLayer) {
    alert('Please select an animation layer');
    return;
  }
  if (activeLayer.locked) {
    alert('Cannot load to locked layer');
    return;
  }
  
  const data = await loadAnimationFile();
  if (data) {
    animationLayerManager.loadAnimationToLayer(activeLayer.id, data);
    setAnimationLayers(animationLayerManager.getLayers());
    console.log(`Loaded animation to layer: ${activeLayer.name}`);
  }
}, [animationLayerManager]);

const exportBlendedAnimation = useCallback(() => {
  if (!animationLayerManager.hasAnimations()) {
    alert('No animations to export');
    return;
  }
  
  const blended = animationLayerManager.exportBlended(30);
  const name = prompt('Blended animation name:', blended.name) || blended.name;
  saveAnimation(blended, name);
}, [animationLayerManager]);
```

## Step 2: Add Animation Layers Tab to Right Panel

Add a third tab button in the right panel nav (around line 3220):

```tsx
<button 
  className={`tab-button ${rightTab === 'animlayers' ? 'active' : ''}`}
  onClick={() => setRightTab('animlayers')}
>
  Anim Layers
</button>
```

Update the rightTab state type (around line 1945):

```typescript
const [rightTab, setRightTab] = useState<'physics' | 'layers' | 'animlayers'>('physics');
```

## Step 3: Add Animation Layers Tab Content

Add this new tab pane after the "Layers Tab" closing div (around line 3570):

```tsx
{/* Animation Layers Tab */}
<div className={`tab-pane ${rightTab === 'animlayers' ? 'active' : ''}`}>
  <div className="section-header">Animation Layers</div>
  
  <div className="control-group button-row">
    <button onClick={addAnimationLayer}>+ Layer</button>
  </div>
  
  <div className="layer-list">
    {[...animationLayers].reverse().map((layer) => (
      <div 
        key={layer.id}
        className={`layer-item ${layer.id === activeAnimLayerId ? 'active' : ''}`}
        onClick={() => {
          animationLayerManager.setActiveLayer(layer.id);
          setActiveAnimLayerId(layer.id);
        }}
      >
        <div className="layer-info">
          <span className="layer-type">??</span>
          <span className="layer-name">{layer.name}</span>
          <span style={{ fontSize: '0.75em', opacity: 0.7 }}>
            {layer.animation ? `${(layer.animation.duration / 1000).toFixed(1)}s` : 'empty'}
          </span>
        </div>
        <div className="layer-controls">
          <button 
            className={`layer-btn ${layer.visible ? '' : 'off'}`}
            onClick={(e) => { e.stopPropagation(); toggleAnimLayerVisibility(layer.id); }}
            title="Toggle visibility"
          >
            {layer.visible ? '??' : '?'}
          </button>
          <button 
            className={`layer-btn ${layer.locked ? 'on' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleAnimLayerLock(layer.id); }}
            title="Toggle lock"
          >
            {layer.locked ? '??' : '?'}
          </button>
          <button 
            className="layer-btn"
            onClick={(e) => { e.stopPropagation(); moveAnimationLayer(layer.id, 'up'); }}
            title="Move up"
          >
            ?
          </button>
          <button 
            className="layer-btn"
            onClick={(e) => { e.stopPropagation(); moveAnimationLayer(layer.id, 'down'); }}
            title="Move down"
          >
            ?
          </button>
          {animationLayers.length > 1 && (
            <button 
              className="layer-btn danger"
              onClick={(e) => { 
                e.stopPropagation(); 
                if (confirm(`Delete ${layer.name}?`)) {
                  removeAnimationLayer(layer.id);
                }
              }}
              title="Delete layer"
            >
              ×
            </button>
          )}
        </div>
        <div className="layer-opacity" onClick={(e) => e.stopPropagation()}>
          <span className="opacity-label">?</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={layer.opacity}
            onChange={(e) => updateAnimationLayer(layer.id, { opacity: Number(e.target.value) })}
            title={`Influence: ${Math.round(layer.opacity * 100)}%`}
          />
        </div>
      </div>
    ))}
  </div>
  
  <div className="section-header">Record to Layer</div>
  
  <div className="control-group">
    {!isRecording ? (
      <button
        onClick={recordToAnimationLayer}
        className="danger"
        disabled={isPlayingBlended || isPlayingAnimation}
      >
        ? Record to Layer
      </button>
    ) : (
      <button
        onClick={stopRecordingToLayer}
        className="active danger"
      >
        ? Stop ({(recordingDuration / 1000).toFixed(1)}s)
      </button>
    )}
  </div>
  
  <div className="section-header">Playback</div>
  
  <div className="control-group">
    {!isPlayingBlended ? (
      <button
        onClick={playBlendedAnimation}
        className="active"
        disabled={!animationLayerManager.hasAnimations() || isRecording}
      >
        ? Play Blended
      </button>
    ) : (
      <button
        onClick={stopBlendedAnimation}
        className="active warning"
      >
        ? Stop
      </button>
    )}
  </div>
  
  <div className="section-header">Actions</div>
  
  <div className="control-group button-row">
    <button
      onClick={loadAnimationToActiveLayer}
      disabled={!activeAnimLayerId || isRecording || isPlayingBlended}
    >
      Load
    </button>
    <button
      onClick={exportBlendedAnimation}
      disabled={!animationLayerManager.hasAnimations()}
    >
      Export
    </button>
  </div>
</div>
```

## How It Works

1. **Layer Management**: Add/remove animation layers, each can hold one recorded animation
2. **Opacity Control**: Each layer's opacity controls its "influence" in the blend (0% = no effect, 100% = full effect)
3. **Blending**: When playing, all visible layers blend together using weighted averaging
4. **Record to Layer**: Record physics simulation directly to the selected layer
5. **Load to Layer**: Load saved animation files into specific layers
6. **Play Blended**: Preview the combined result of all visible layers
7. **Export**: Save the blended animation as a single file

## Example Workflow

1. Record a gravity simulation ? Layer 1
2. Record a magnet attraction ? Layer 2  
3. Record collisions ? Layer 3
4. Adjust layer opacities to control influence
5. Play blended to see combined animation
6. Export the final blended result
