# Complete UI Implementation with Tabs

## Current Issue
The tab state variables exist (lines 64-65), but the JSX still uses the old flat structure starting around line 1467. The UI needs to be reorganized with tabs.

## Drawing Function
The drawing function appears to be working - there are mouse/touch event handlers on the canvas. If drawing circles doesn't work when clicking, it might be because you need to:
1. Hold the spawn buttons (lines would be in Tools tab)
2. Enable paintMode for paint layers (in Layers tab > Paint Settings)

## Complete JSX Replacement

### Replace Left Panel (starting line ~1467)

Replace everything from `<aside className="panel left-panel">` to `</aside>` with:

```tsx
<aside className="panel left-panel">
  {/* Tab Navigation */}
  <div className="tab-nav">
    <button 
      className={`tab-button ${leftTab === 'project' ? 'active' : ''}`}
      onClick={() => setLeftTab('project')}
    >
      Project
    </button>
    <button 
      className={`tab-button ${leftTab === 'colors' ? 'active' : ''}`}
      onClick={() => setLeftTab('colors')}
    >
      Colors
    </button>
    <button 
      className={`tab-button ${leftTab === 'tools' ? 'active' : ''}`}
      onClick={() => setLeftTab('tools')}
    >
      Tools
    </button>
    <button 
      className={`tab-button ${leftTab === 'physics' ? 'active' : ''}`}
      onClick={() => setLeftTab('physics')}
    >
      Physics
    </button>
  </div>

  <div className="tab-content">
    {/* ========== PROJECT TAB ========== */}
    <div className={`tab-pane ${leftTab === 'project' ? 'active' : ''}`}>
      <h2>Canvas</h2>
      <div className="control-group">
        <label>Aspect Ratio</label>
        <input
          type="text"
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
          placeholder="4:3"
          className="aspect-input"
        />
      </div>
      
      <div className="control-group">
        <label>Circles: {circleCount}</label>
      </div>

      <h2>Project</h2>
      <div className="control-group button-row">
        <button 
          onClick={() => {
            const projectName = prompt('Project name:', 'circles-project') || 'circles-project';
            saveProject(
              system.circles,
              layers,
              activeLayerId,
              aspectRatio,
              {
                gravityEnabled: system.config.gravityEnabled,
                gravityStrength: system.config.gravityStrength,
                floorEnabled: system.config.floorEnabled,
                floorY: system.config.floorY,
                wallsEnabled: system.config.wallsEnabled,
                damping: system.config.damping,
                collisionIterations,
                restitution,
              },
              {
                brushSize,
                stickyEnabled: stickyMode,
                stickyStrength,
                clumpEnabled: nBodyMode === 'clump',
                spreadEnabled: nBodyMode === 'spread',
              },
              palette,
              selectedSwatch,
              bgPalette,
              selectedBgSwatch,
              projectName
            );
          }}
          title="Save project to JSON file"
        >
          Save
        </button>
        <button 
          onClick={async () => {
            const data = await loadProject();
            if (!data) return;
            
            system.circles = restoreCircles(data);
            restoreLayers(data.layers, data.activeLayerId);
            setAspectRatio(data.aspectRatio);
            system.config.gravityEnabled = data.physics.gravityEnabled;
            system.config.gravityStrength = data.physics.gravityStrength;
            system.config.floorEnabled = data.physics.floorEnabled;
            system.config.floorY = data.physics.floorY;
            system.config.wallsEnabled = data.physics.wallsEnabled;
            system.config.damping = data.physics.damping;
            setGravity(data.physics.gravityEnabled);
            setFloor(data.physics.floorEnabled);
            
            if (data.physics.collisionIterations !== undefined) {
              setCollisionIterations(data.physics.collisionIterations);
            }
            if (data.physics.restitution !== undefined) {
              setRestitution(data.physics.restitution);
            }
            
            setBrushSize(data.settings.brushSize);
            setStickyMode(data.settings.stickyEnabled);
            setStickyStrength(data.settings.stickyStrength);
            if (data.settings.clumpEnabled) {
              setNBodyMode('clump');
            } else if (data.settings.spreadEnabled) {
              setNBodyMode('spread');
            } else {
              setNBodyMode('off');
            }
            
            setPalette(data.palette);
            setSelectedSwatch(data.selectedSwatch);
            
            if (data.bgPalette) {
              setBgPalette(data.bgPalette);
            }
            if (data.selectedBgSwatch !== undefined) {
              setSelectedBgSwatch(data.selectedBgSwatch);
            }
            
            undoManager.initialize(system.circles);
            updateUndoRedoState();
            
            console.log(`Loaded project: ${data.name} (saved ${new Date(data.savedAt).toLocaleString()})`);
          }}
          title="Load project from JSON file"
        >
          Load
        </button>
      </div>

      <h2>Export</h2>
      <div className="control-group button-row">
        <button 
          onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const link = document.createElement('a');
            link.download = `circles-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          }}
          title="Export canvas as PNG image"
        >
          PNG
        </button>
        <button 
          onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            exportSVG(system.circles, canvas.width, canvas.height, layers, {
              backgroundColor: getBackgroundHex(),
              stencilMargin: 10,
              includeStencilLayers: true,
            });
          }}
          title="Export as multi-layered SVG"
        >
          SVG
        </button>
      </div>

      <h2>Undo/Redo</h2>
      <div className="control-group button-row">
        <button 
          onClick={performUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          ? Undo
        </button>
        <button 
          onClick={performRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          ? Redo
        </button>
      </div>
    </div>

    {/* ========== COLORS TAB ========== */}
    <div className={`tab-pane ${leftTab === 'colors' ? 'active' : ''}`}>
      <h2>Circle Colors</h2>
      <div className="control-group">
        <div className="swatch-row">
          {palette.map((color, i) => (
            <div
              key={i}
              className={`swatch ${selectedSwatch === i ? 'selected' : ''}`}
              style={{ background: `hsl(${color.h}, ${color.s}%, ${color.l}%)` }}
              onClick={() => setSelectedSwatch(i)}
            />
          ))}
        </div>
      </div>

      <div className="control-group">
        <label>Hue: {palette[selectedSwatch].h}</label>
        <input
          type="range"
          min="0"
          max="360"
          value={palette[selectedSwatch].h}
          onChange={(e) => updateSwatch('h', Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label>Saturation: {palette[selectedSwatch].s}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={palette[selectedSwatch].s}
          onChange={(e) => updateSwatch('s', Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label>Lightness: {palette[selectedSwatch].l}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={palette[selectedSwatch].l}
          onChange={(e) => updateSwatch('l', Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <button onClick={resetCirclePalette}>Reset Colors</button>
      </div>

      <h2>Background</h2>
      <div className="control-group">
        <div className="swatch-row">
          {bgPalette.map((color, i) => (
            <div
              key={i}
              className={`swatch ${selectedBgSwatch === i ? 'selected' : ''}`}
              style={{ background: `hsl(${color.h}, ${color.s}%, ${color.l}%)` }}
              onClick={() => setSelectedBgSwatch(i)}
            />
          ))}
        </div>
      </div>

      <div className="control-group">
        <label>Hue: {bgPalette[selectedBgSwatch].h}</label>
        <input
          type="range"
          min="0"
          max="360"
          value={bgPalette[selectedBgSwatch].h}
          onChange={(e) => updateBgPalette('h', Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label>Saturation: {bgPalette[selectedBgSwatch].s}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={bgPalette[selectedBgSwatch].s}
          onChange={(e) => updateBgPalette('s', Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label>Lightness: {bgPalette[selectedBgSwatch].l}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={bgPalette[selectedBgSwatch].l}
          onChange={(e) => updateBgPalette('l', Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <button onClick={resetBgPalette}>Reset Backgrounds</button>
      </div>

      <h2>Brush Size</h2>
      <div className="control-group">
        <label>Size: {brushSize}</label>
        <input
          type="range"
          min="10"
          max="100"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
        />
      </div>

      <div className="control-group button-row">
        <button onClick={savePalettes}>Save Palettes</button>
        <button onClick={loadPalettes}>Load Palettes</button>
      </div>
    </div>

    {/* ========== TOOLS TAB ========== */}
    <div className={`tab-pane ${leftTab === 'tools' ? 'active' : ''}`}>
      <h2>Modes</h2>
      <div className="control-group">
        <button
          onClick={() => {
            setSelectMode(!selectMode);
            if (!selectMode) { 
              setEraseMode(false); 
              setLockMode(false); 
              setRecolorMode(false); 
              setMagnetMode('off'); 
              setFlowMode('off'); 
            } else { 
              clearSelectionHook(); 
            }
          }}
          className={selectMode ? "active info" : ""}
        >
          Select {selectMode ? "ON" : "OFF"}
        </button>
      </div>

      <div className="control-group">
        <button
          onClick={() => {
            setEraseMode(!eraseMode);
            if (!eraseMode) { 
              setLockMode(false); 
              setRecolorMode(false); 
              setMagnetMode('off'); 
              setFlowMode('off'); 
              setSelectMode(false); 
              clearSelectionHook(); 
            }
          }}
          className={eraseMode ? "active danger" : ""}
        >
          Erase {eraseMode ? "ON" : "OFF"}
        </button>
      </div>

      <div className="control-group button-row">
        <button
          onClick={() => {
            setLockMode(!lockMode);
            if (!lockMode) { 
              setEraseMode(false); 
              setRecolorMode(false); 
              setMagnetMode('off'); 
              setFlowMode('off'); 
              setSelectMode(false); 
              clearSelectionHook(); 
            }
          }}
          className={lockMode ? "active warning" : ""}
        >
          Lock {lockMode ? "ON" : "OFF"}
        </button>
        <button onClick={unlockAllHook}>Unlock All</button>
      </div>

      <div className="control-group">
        <button
          onClick={() => {
            setRecolorMode(!recolorMode);
            if (!recolorMode) { 
              setEraseMode(false); 
              setLockMode(false); 
              setMagnetMode('off'); 
              setFlowMode('off'); 
              setSelectMode(false); 
            }
          }}
          className={recolorMode ? "active info" : ""}
        >
          Recolor {recolorMode ? "ON" : "OFF"}
        </button>
      </div>

      <h2>Spawn Circles</h2>
      <div className="control-group">
        <label>Hold to spawn</label>
        <div className="button-row">
          <button
            onMouseDown={() => { isAutoSpawningRef.current = true; }}
            onMouseUp={() => { isAutoSpawningRef.current = false; }}
            onMouseLeave={() => { isAutoSpawningRef.current = false; }}
            onTouchStart={() => { isAutoSpawningRef.current = true; }}
            onTouchEnd={() => { isAutoSpawningRef.current = false; }}
            className="hold-button"
          >
            Brush Size
          </button>
          <button
            onMouseDown={() => { isRandomSpawningRef.current = true; }}
            onMouseUp={() => { isRandomSpawningRef.current = false; }}
            onMouseLeave={() => { isRandomSpawningRef.current = false; }}
            onTouchStart={() => { isRandomSpawningRef.current = true; }}
            onTouchEnd={() => { isRandomSpawningRef.current = false; }}
            className="hold-button"
          >
            Random Size
          </button>
        </div>
      </div>

      <h2>Actions</h2>
      <div className="control-group">
        <button 
          onClick={() => { 
            saveUndoState(true);
            clear(); 
            clearSelectionHook(); 
            saveUndoState(true);
          }}
        >
          Clear All
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="selection-actions">
          <label>Selected: {selectedIds.size} circles</label>
          <div className="button-row">
            <button onClick={recolorSelectionHook} className="info">Recolor</button>
            <button onClick={deleteSelectionHook} className="danger">Delete</button>
            <button onClick={invertSelectionHook}>Invert</button>
          </div>
          <div className="button-row">
            <button onClick={lockInverseHook}>Lock Inverse</button>
            <button onClick={unlockAllHook}>Unlock All</button>
          </div>
        </div>
      )}
    </div>

    {/* ========== PHYSICS TAB ========== */}
    <div className={`tab-pane ${leftTab === 'physics' ? 'active' : ''}`}>
      <h2>Simulation</h2>
      <div className="control-group">
        <button
          onClick={() => setPhysicsPaused(!physicsPaused)}
          className={physicsPaused ? "active warning" : ""}
        >
          {physicsPaused ? "? Resume" : "? Pause"}
        </button>
      </div>

      <div className="control-group">
        <button
          onClick={() => setGravity(!config.gravityEnabled)}
          className={config.gravityEnabled ? "active" : ""}
        >
          Gravity {config.gravityEnabled ? "ON" : "OFF"}
        </button>
      </div>

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

      <h2>Collision</h2>
      <div className="control-group">
        <label>Accuracy: {collisionIterations}</label>
        <input
          type="range"
          min="1"
          max="8"
          step="1"
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

      <h2>Forces</h2>
      <div className="control-group button-row">
        <button
          onClick={() => setNBodyMode(nBodyMode === 'clump' ? 'off' : 'clump')}
          className={nBodyMode === 'clump' ? "active" : ""}
        >
          Clump
        </button>
        <button
          onClick={() => setNBodyMode(nBodyMode === 'spread' ? 'off' : 'spread')}
          className={nBodyMode === 'spread' ? "active danger" : ""}
        >
          Spread
        </button>
      </div>

      <div className="control-group">
        <label>Strength: {nBodyStrength.toFixed(1)}</label>
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.1"
          value={nBodyStrength}
          onChange={(e) => setNBodyStrength(Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <button
          onClick={() => setStickyMode(!stickyMode)}
          className={stickyMode ? "active warning" : ""}
        >
          Sticky {stickyMode ? "ON" : "OFF"}
        </button>
      </div>

      <div className="control-group">
        <label>Sticky Strength: {stickyStrength.toFixed(2)}</label>
        <input
          type="range"
          min="0.05"
          max="0.4"
          step="0.01"
          value={stickyStrength}
          onChange={(e) => setStickyStrength(Number(e.target.value))}
        />
      </div>

      <h2>Magnet</h2>
      <div className="control-group button-row">
        <button
          onClick={() => {
            const newMode = magnetMode === 'attract' ? 'off' : 'attract';
            setMagnetMode(newMode);
            if (newMode !== 'off') { 
              setEraseMode(false); 
              setLockMode(false); 
              setRecolorMode(false); 
              setFlowMode('off'); 
              setSelectMode(false); 
              clearSelectionHook(); 
            }
          }}
          className={magnetMode === 'attract' ? "active" : ""}
        >
          Attract
        </button>
        <button
          onClick={() => {
            const newMode = magnetMode === 'repel' ? 'off' : 'repel';
            setMagnetMode(newMode);
            if (newMode !== 'off') { 
              setEraseMode(false); 
              setLockMode(false); 
              setRecolorMode(false); 
              setFlowMode('off'); 
              setSelectMode(false); 
              clearSelectionHook(); 
            }
          }}
          className={magnetMode === 'repel' ? "active danger" : ""}
        >
          Repel
        </button>
      </div>

      <div className="control-group">
        <label>Strength: {magnetStrength}</label>
        <input
          type="range"
          min="1"
          max="10"
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
          value={magnetRadius}
          onChange={(e) => setMagnetRadius(Number(e.target.value))}
        />
      </div>
    </div>
  </div>
</aside>
```

Due to length limits, I'll create a second file for the right panel...
