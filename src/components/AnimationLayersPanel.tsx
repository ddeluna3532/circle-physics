import { useCallback, useMemo, useState } from 'react';
import { AnimationLayerManager, AnimationLayer } from '../layers/AnimationLayer';
import { AnimationRecorder, saveAnimation, loadAnimationFile } from '../layers/AnimationRecorder';
import { Circle } from '../physics';

interface AnimationLayersPanelProps {
  system: { 
    circles: Circle[]; 
    config: any; 
    collisionIterations: number; 
    restitution: number;
    bounds: { x: number; y: number; width: number; height: number };
  };
  isRecording: boolean;
  isPlayingAnimation: boolean;
  setIsRecording: (value: boolean) => void;
  setIsPlayingAnimation: (value: boolean) => void;
  setPhysicsPaused: (value: boolean) => void;
  setPlaybackCircles: (circles: any) => void;
  setRecordingDuration: (value: number) => void;
  setRecordingFrames: (value: number) => void;
  animationRecorder: AnimationRecorder;
  canvasBounds: { x: number; y: number; width: number; height: number };
}

export function AnimationLayersPanel({
  system,
  isRecording,
  isPlayingAnimation,
  setIsRecording,
  setIsPlayingAnimation,
  setPhysicsPaused,
  setPlaybackCircles,
  setRecordingDuration,
  setRecordingFrames,
  animationRecorder,
  canvasBounds,
}: AnimationLayersPanelProps) {
  const animationLayerManager = useMemo(() => new AnimationLayerManager(), []);
  const [animationLayers, setAnimationLayers] = useState<AnimationLayer[]>(
    () => animationLayerManager.getLayers()
  );
  const [activeAnimLayerId, setActiveAnimLayerId] = useState<string | null>(
    () => animationLayerManager.getActiveLayer()?.id || null
  );
  const [isPlayingRecalculated, setIsPlayingRecalculated] = useState(false);
  const [recordingDuration, setLocalRecordingDuration] = useState(0);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculationProgress, setRecalculationProgress] = useState(0);
  const [hasRecalculated, setHasRecalculated] = useState(false);

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
      setLocalRecordingDuration(duration);
      setRecordingDuration(duration);
      setRecordingFrames(frames);
    });
    animationRecorder.startRecording(system.circles);
    setIsRecording(true);
    setPhysicsPaused(false);
  }, [animationRecorder, animationLayerManager, system.circles, setIsRecording, setPhysicsPaused, setRecordingDuration, setRecordingFrames]);

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
  }, [animationRecorder, animationLayerManager, setIsRecording]);

  const recalculateAnimation = useCallback(() => {
    if (!animationLayerManager.hasAnimations()) {
      alert('No animations in any layer');
      return;
    }
    
    setIsRecalculating(true);
    setRecalculationProgress(0);
    
    // Run recalculation asynchronously to allow UI updates
    setTimeout(() => {
      const result = animationLayerManager.recalculateWithPhysics(
        {
          gravityEnabled: system.config.gravityEnabled,
          gravityStrength: system.config.gravityStrength,
          floorEnabled: system.config.floorEnabled,
          floorY: system.config.floorY,
          wallsEnabled: system.config.wallsEnabled,
          damping: system.config.damping,
          collisionIterations: system.collisionIterations,
          restitution: system.restitution,
        },
        canvasBounds,
        30,
        setRecalculationProgress
      );
      
      setIsRecalculating(false);
      if (result) {
        setHasRecalculated(true);
        console.log('Recalculation complete');
      }
    }, 100);
  }, [animationLayerManager, system, canvasBounds]);

  const playRecalculatedAnimation = useCallback(() => {
    const recalculated = animationLayerManager.getRecalculatedAnimation();
    if (!recalculated) {
      alert('No recalculated animation. Press Recalculate first.');
      return;
    }
    
    setPhysicsPaused(true);
    setIsPlayingRecalculated(true);
    setIsPlayingAnimation(false);
    
    animationLayerManager.startPlayback(
      (circles) => {
        setPlaybackCircles(circles as any);
      },
      () => {
        setIsPlayingRecalculated(false);
        setPlaybackCircles(null);
      },
      true
    );
  }, [animationLayerManager, setPhysicsPaused, setIsPlayingAnimation, setPlaybackCircles]);

  const stopRecalculatedAnimation = useCallback(() => {
    animationLayerManager.stopPlayback();
    setIsPlayingRecalculated(false);
    setPlaybackCircles(null);
  }, [animationLayerManager, setPlaybackCircles]);

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

  const saveRecalculatedAnimation = useCallback(() => {
    const recalculated = animationLayerManager.getRecalculatedAnimation();
    if (!recalculated) {
      alert('No recalculated animation to save');
      return;
    }
    
    const name = prompt('Animation name:', recalculated.name) || recalculated.name;
    saveAnimation(recalculated, name);
  }, [animationLayerManager]);

  const clearRecalculated = useCallback(() => {
    animationLayerManager.clearRecalculated();
    setHasRecalculated(false);
  }, [animationLayerManager]);

  return (
    <>
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
                title={`Opacity: ${Math.round(layer.opacity * 100)}%`}
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
            disabled={isPlayingRecalculated || isPlayingAnimation || isRecalculating}
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
      
      <div className="section-header">Recalculation</div>
      
      <div className="control-group">
        <button
          onClick={recalculateAnimation}
          className="active info"
          disabled={!animationLayerManager.hasAnimations() || isRecording || isRecalculating}
        >
          {isRecalculating ? `? Recalculating... ${recalculationProgress.toFixed(0)}%` : '? Recalculate'}
        </button>
        {isRecalculating && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${recalculationProgress}%` }} />
          </div>
        )}
      </div>

      {hasRecalculated && (
        <>
          <div className="control-group">
            {!isPlayingRecalculated ? (
              <button
                onClick={playRecalculatedAnimation}
                className="active"
                disabled={isRecording || isRecalculating}
              >
                ? Play Result
              </button>
            ) : (
              <button
                onClick={stopRecalculatedAnimation}
                className="active warning"
              >
                ? Stop
              </button>
            )}
          </div>

          <div className="control-group button-row">
            <button
              onClick={saveRecalculatedAnimation}
              disabled={isRecording || isPlayingRecalculated}
            >
              Save Result
            </button>
            <button
              onClick={clearRecalculated}
              disabled={isRecording || isPlayingRecalculated}
              className="danger"
            >
              Clear Result
            </button>
          </div>
        </>
      )}
      
      <div className="section-header">Actions</div>
      
      <div className="control-group button-row">
        <button
          onClick={loadAnimationToActiveLayer}
          disabled={!activeAnimLayerId || isRecording || isPlayingRecalculated || isRecalculating}
        >
          Load to Layer
        </button>
      </div>
    </>
  );
}
