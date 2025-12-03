import { MutableRefObject, useState, useEffect } from 'react';

interface PhysicsPanelProps {
  // Physics state
  physicsPaused: boolean;
  setPhysicsPaused: (paused: boolean) => void;
  config: {
    gravityEnabled: boolean;
    gravityStrength: number;
    wallsEnabled: boolean;
    floorEnabled: boolean;
    damping: number;
  };
  system: {
    config: any;
    flowVectors: any[];
    clearFlowField: () => void;
  };
  
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
  scaleSliderRef: MutableRefObject<number>;
  isScalingRef: MutableRefObject<boolean>;
  randomScaleSliderRef: MutableRefObject<number>;
  isRandomScalingRef: MutableRefObject<boolean>;
}

export function PhysicsPanel({
  physicsPaused,
  setPhysicsPaused,
  config,
  system,
  setGravity,
  setWalls,
  setFloor,
  collisionIterations,
  setCollisionIterations,
  restitution,
  setRestitution,
  magnetMode,
  setMagnetMode,
  magnetStrength,
  setMagnetStrength,
  magnetRadius,
  setMagnetRadius,
  nBodyMode,
  setNBodyMode,
  nBodyStrength,
  setNBodyStrength,
  stickyMode,
  setStickyMode,
  stickyStrength,
  setStickyStrength,
  flowMode,
  setFlowMode,
  flowVisible,
  setFlowVisible,
  flowStrength,
  setFlowStrength,
  flowRadius,
  setFlowRadius,
  scaleSliderRef,
  isScalingRef,
  randomScaleSliderRef,
  isRandomScalingRef,
}: PhysicsPanelProps) {
  // Local state for sliders that need visual feedback
  const [gravityStrengthDisplay, setGravityStrengthDisplay] = useState(config.gravityStrength);
  const [dampingDisplay, setDampingDisplay] = useState(config.damping);
  const [scaleSliderDisplay, setScaleSliderDisplay] = useState(0);
  const [randomScaleSliderDisplay, setRandomScaleSliderDisplay] = useState(0);
  
  // Sync display values with actual config
  useEffect(() => {
    setGravityStrengthDisplay(config.gravityStrength);
    setDampingDisplay(config.damping);
  }, [config.gravityStrength, config.damping]);
  
  // Poll slider refs for display updates
  useEffect(() => {
    const interval = setInterval(() => {
      setScaleSliderDisplay(scaleSliderRef.current);
      setRandomScaleSliderDisplay(randomScaleSliderRef.current);
    }, 50); // Update display 20 times per second
    
    return () => clearInterval(interval);
  }, [scaleSliderRef, randomScaleSliderRef]);
  
  return (
    <>
      <div className="section-header">Physics</div>
      
      <div className="control-group">
        <button 
          onClick={() => setPhysicsPaused(!physicsPaused)}
          className={physicsPaused ? "warning" : "active"}
        >
          {physicsPaused ? "? Paused" : "? Running"}
        </button>
      </div>

      <div className="section-header">Gravity</div>
      
      <div className="control-group">
        <button
          onClick={() => setGravity(!config.gravityEnabled)}
          className={config.gravityEnabled ? "active" : ""}
        >
          Gravity {config.gravityEnabled ? "ON" : "OFF"}
        </button>
      </div>

      {config.gravityEnabled && (
        <div className="control-group">
          <label>Strength: {gravityStrengthDisplay.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={gravityStrengthDisplay}
            onChange={(e) => {
              const value = Number(e.target.value);
              setGravityStrengthDisplay(value);
              system.config.gravityStrength = value;
            }}
          />
        </div>
      )}

      <div className="section-header">Boundaries</div>
      
      <div className="control-group">
        <button
          onClick={() => setWalls(!config.wallsEnabled)}
          className={config.wallsEnabled ? "active" : ""}
        >
          Walls {config.wallsEnabled ? "ON" : "OFF"}
        </button>
      </div>

      <div className="control-group">
        <button
          onClick={() => setFloor(!config.floorEnabled)}
          className={config.floorEnabled ? "active" : ""}
        >
          Floor {config.floorEnabled ? "ON" : "OFF"}
        </button>
      </div>

      <div className="section-header">Collisions</div>
      
      <div className="control-group">
        <label>Iterations: {collisionIterations}</label>
        <input
          type="range"
          min="1"
          max="10"
          value={collisionIterations}
          onChange={(e) => setCollisionIterations(Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label>Bounciness: {restitution.toFixed(2)}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={restitution}
          onChange={(e) => setRestitution(Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label>Damping: {dampingDisplay.toFixed(2)}</label>
        <input
          type="range"
          min="0.9"
          max="1"
          step="0.01"
          value={dampingDisplay}
          onChange={(e) => {
            const value = Number(e.target.value);
            setDampingDisplay(value);
            system.config.damping = value;
          }}
        />
      </div>

      <div className="section-header">Forces</div>
      
      <div className="control-group">
        <label>Magnet</label>
        <div className="button-row">
          <button
            onClick={() => setMagnetMode('off')}
            className={magnetMode === 'off' ? 'active' : ''}

          >
            Off
          </button>
          <button
            onClick={() => setMagnetMode('attract')}
            className={magnetMode === 'attract' ? 'active info' : ''}

          >
            Attract
          </button>
          <button
            onClick={() => setMagnetMode('repel')}
            className={magnetMode === 'repel' ? 'active danger' : ''}

          >
            Repel
          </button>
        </div>
      </div>

      {magnetMode !== 'off' && (
        <>
          <div className="control-group">
            <label>Strength: {magnetStrength.toFixed(1)}</label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={magnetStrength}
              onChange={(e) => setMagnetStrength(Number(e.target.value))}

            />
          </div>
          <div className="control-group">
            <label>Radius: {magnetRadius}</label>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={magnetRadius}
              onChange={(e) => setMagnetRadius(Number(e.target.value))}

            />
          </div>
        </>
      )}

      <div className="control-group">
        <label>N-Body Force</label>
        <div className="button-row">
          <button
            onClick={() => setNBodyMode('off')}
            className={nBodyMode === 'off' ? 'active' : ''}

          >
            Off
          </button>
          <button
            onClick={() => setNBodyMode('clump')}
            className={nBodyMode === 'clump' ? 'active info' : ''}

          >
            Clump
          </button>
          <button
            onClick={() => setNBodyMode('spread')}
            className={nBodyMode === 'spread' ? 'active danger' : ''}

          >
            Spread
          </button>
        </div>
      </div>

      {nBodyMode !== 'off' && (
        <div className="control-group">
          <label>Strength: {nBodyStrength.toFixed(1)}</label>
          <input
            type="range"
            min="5"
            max="20"
            step="0.5"
            value={nBodyStrength}
            onChange={(e) => setNBodyStrength(Number(e.target.value))}

          />
        </div>
      )}

      <div className="control-group">
        <button
          onClick={() => setStickyMode(!stickyMode)}
          className={stickyMode ? "active" : ""}
        >
          Sticky {stickyMode ? "ON" : "OFF"}
        </button>
      </div>

      {stickyMode && (
        <div className="control-group">
          <label>Strength: {stickyStrength.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.05"
            value={stickyStrength}
            onChange={(e) => setStickyStrength(Number(e.target.value))}

          />
        </div>
      )}

      <div className="section-header">Flow Field</div>
      
      <div className="control-group">
        <div className="button-row">
          <button
            onClick={() => setFlowMode('off')}
            className={flowMode === 'off' ? 'active' : ''}

          >
            Off
          </button>
          <button
            onClick={() => setFlowMode('draw')}
            className={flowMode === 'draw' ? 'active info' : ''}

          >
            Draw
          </button>
          <button
            onClick={() => setFlowMode('erase')}
            className={flowMode === 'erase' ? 'active danger' : ''}

          >
            Erase
          </button>
        </div>
      </div>

      <div className="control-group">
        <button
          onClick={() => setFlowVisible(!flowVisible)}
          className={flowVisible ? "active" : ""}
        >
          Show Vectors {flowVisible ? "ON" : "OFF"}
        </button>
      </div>

      {system.flowVectors.length > 0 && (
        <div className="control-group">
          <button
            onClick={() => system.clearFlowField()}
            className="danger"
          >
            Clear All Vectors
          </button>
        </div>
      )}

      <div className="control-group">
        <label>Strength: {flowStrength.toFixed(2)}</label>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.05"
          value={flowStrength}
          onChange={(e) => setFlowStrength(Number(e.target.value))}

        />
      </div>

      <div className="control-group">
        <label>Radius: {flowRadius}</label>
        <input
          type="range"
          min="50"
          max="300"
          step="10"
          value={flowRadius}
          onChange={(e) => setFlowRadius(Number(e.target.value))}

        />
      </div>

      <div className="section-header">Scaling</div>
      
      <div className="control-group">
        <label>Scale All: {scaleSliderDisplay > 0 ? '+' : ''}{(scaleSliderDisplay * 100).toFixed(0)}%</label>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={scaleSliderDisplay}
          onChange={(e) => {
            const value = Number(e.target.value);
            scaleSliderRef.current = value;
            setScaleSliderDisplay(value);
          }}
          onMouseDown={() => { isScalingRef.current = true; }}
          onMouseUp={() => { 
            isScalingRef.current = false;
            scaleSliderRef.current = 0;
            setScaleSliderDisplay(0);
          }}
          onMouseLeave={() => { 
            isScalingRef.current = false;
            scaleSliderRef.current = 0;
            setScaleSliderDisplay(0);
          }}
          onTouchStart={() => { isScalingRef.current = true; }}
          onTouchEnd={() => { 
            isScalingRef.current = false;
            scaleSliderRef.current = 0;
            setScaleSliderDisplay(0);
          }}
          style={{
            background: `linear-gradient(to right, #ff6b6b 0%, #666 50%, #4ecdc4 100%)`
          }}
        />
        <span className="slider-hint">? Shrink | Grow ?</span>
      </div>

      <div className="control-group">
        <label>Scale Random: {randomScaleSliderDisplay > 0 ? '+' : ''}{(randomScaleSliderDisplay * 100).toFixed(0)}%</label>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={randomScaleSliderDisplay}
          onChange={(e) => {
            const value = Number(e.target.value);
            randomScaleSliderRef.current = value;
            setRandomScaleSliderDisplay(value);
          }}
          onMouseDown={() => { isRandomScalingRef.current = true; }}
          onMouseUp={() => { 
            isRandomScalingRef.current = false;
            randomScaleSliderRef.current = 0;
            setRandomScaleSliderDisplay(0);
          }}
          onMouseLeave={() => { 
            isRandomScalingRef.current = false;
            randomScaleSliderRef.current = 0;
            setRandomScaleSliderDisplay(0);
          }}
          onTouchStart={() => { isRandomScalingRef.current = true; }}
          onTouchEnd={() => { 
            isRandomScalingRef.current = false;
            randomScaleSliderRef.current = 0;
            setRandomScaleSliderDisplay(0);
          }}
          style={{
            background: `linear-gradient(to right, #ff6b6b 0%, #666 50%, #4ecdc4 100%)`
          }}
        />
        <span className="slider-hint">? Chaos | Chaos ?</span>
      </div>
    </>
  );
}
