import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { usePhysics, useLayers } from "./hooks";
import { Circle } from "./physics";
import { PaintLayer } from "./layers";
import { interpolateStroke } from "./layers/WatercolorBrush";
import { exportSVG } from "./layers/SVGExporter";
import { saveProject, loadProject, restoreCircles, ProjectData } from "./layers/ProjectManager";
import { UndoManager, applySnapshot } from "./layers/UndoManager";
import { AnimationRecorder, AnimationData, CircleSnapshot, Keyframe, saveAnimation, loadAnimationFile } from "./layers/AnimationRecorder";
import { exportVideoHighQuality, downloadVideo, isVideoExportSupported, VideoExportProgress } from "./layers/VideoExporter";
import "./styles.css";

// Tauri API types (only available in desktop app)
declare global {
  interface Window {
    __TAURI__?: {
      window: {
        getCurrent(): {
          close(): Promise<void>;
        };
      };
    };
  }
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const {
    system,
    circles,
    circleCount,
    config,
    addCircle,
    removeCircle,
    clear,
    getCircleAt,
    setBounds,
    setGravity,
    setWalls,
    setFloor,
  } = usePhysics();

  // Layer system
  const {
    layers,
    setLayers,
    activeLayerId,
    setActiveLayerId,
    getActiveLayer,
    addCircleLayer,
    addPaintLayer,
    removeLayer,
    updateLayer,
    toggleVisibility,
    toggleLock,
    moveLayer,
    resizeAllPaintLayers,
    clearPaintLayer,
    isLayerAffectedByForces,
    restoreLayers,
    brush,
  } = useLayers();

  // Tab state
  const [leftTab, setLeftTab] = useState<'project' | 'colors' | 'tools' | 'physics'>('project');
  const [rightTab, setRightTab] = useState<'layers' | 'effects'>('layers');

  // UI state
  const [brushSize, setBrushSize] = useState(30);
  const [eraseMode, setEraseMode] = useState(false);
  const [lockMode, setLockMode] = useState(false);
  const [recolorMode, setRecolorMode] = useState(false);
  const [paintMode, setPaintMode] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // Canvas aspect ratio
  const [aspectRatio, setAspectRatio] = useState("4:3");
  const [magnetMode, setMagnetMode] = useState<'off' | 'attract' | 'repel'>('off');
  const [magnetStrength, setMagnetStrength] = useState(3);
  const [magnetRadius, setMagnetRadius] = useState(200);
  
  // Flow field state
  const [flowMode, setFlowMode] = useState<'off' | 'draw' | 'erase'>('off');
  const [flowVisible, setFlowVisible] = useState(true);
  const [flowStrength, setFlowStrength] = useState(0.15);
  const [flowRadius, setFlowRadius] = useState(100);
  
  // N-body force state (clump/spread)
  const [nBodyMode, setNBodyMode] = useState<'off' | 'clump' | 'spread'>('off');
  const [nBodyStrength, setNBodyStrength] = useState(1.5);
  const [stickyMode, setStickyMode] = useState(false);
  const [stickyStrength, setStickyStrength] = useState(0.15);
  
  // Turbulence mode state
  const [turbulenceMode, setTurbulenceMode] = useState(false);
  const [turbulenceStrength, setTurbulenceStrength] = useState(2);
  const [turbulenceScale, setTurbulenceScale] = useState(100); // Noise table size
  const [turbulenceFrequency, setTurbulenceFrequency] = useState(0.5); // Speed of animated noise
  
  // Turbulence animation time
  const turbulenceTimeRef = useRef(0);
  
  // Collision settings
  const [collisionIterations, setCollisionIterations] = useState(3);
  const [restitution, setRestitution] = useState(0.6);
  const [physicsPaused, setPhysicsPaused] = useState(false);
  
  // Undo/Redo system
  const undoManager = useMemo(() => new UndoManager(50), []);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // Animation recording/playback state
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
  const [exportResolution, setExportResolution] = useState(1); // 1x, 2x, 4x multiplier
  
  // Export camera state (orthographic)
  const [exportCameraZoom, setExportCameraZoom] = useState(1); // 1 = 100%, 2 = 200% zoom in
  const [exportCameraPanX, setExportCameraPanX] = useState(0); // Pan offset as percentage of canvas
  const [exportCameraPanY, setExportCameraPanY] = useState(0);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  
  // Motion blur state
  const [motionBlurEnabled, setMotionBlurEnabled] = useState(false);
  const [motionBlurSamples, setMotionBlurSamples] = useState(8);
  const [shutterAngle, setShutterAngle] = useState(180);
  
  // Scale all slider state
  const scaleSliderRef = useRef(0); // -1 to 1, 0 is center
  const [scaleSliderValue, setScaleSliderValue] = useState(0);
  const isScalingRef = useRef(false);
  
  // Random scale slider state
  const randomScaleSliderRef = useRef(0);
  const [randomScaleSliderValue, setRandomScaleSliderValue] = useState(0);
  const isRandomScalingRef = useRef(false);
  
  // Auto-spawn state
  const isAutoSpawningRef = useRef(false);
  const isRandomSpawningRef = useRef(false);
  
  // Paint layer refs
  const isPaintingLayerRef = useRef(false);
  const lastPaintPosRef = useRef({ x: 0, y: 0 });
  
  // Default color palettes
  const DEFAULT_CIRCLE_PALETTE = [
    { h: 187, s: 94, l: 18 },  // #034f59 - dark teal
    { h: 156, s: 38, l: 67 },  // #8ccbb2 - sage green
    { h: 41, s: 52, l: 91 },   // #f2ebdc - cream
    { h: 11, s: 100, l: 71 },  // #ff8469 - coral
    { h: 190, s: 8, l: 29 },   // #444e50 - dark gray
  ];
  
  const DEFAULT_BG_PALETTE = [
    { h: 0, s: 0, l: 100 },    // #ffffff - white
    { h: 0, s: 0, l: 0 },      // #000000 - black
    { h: 41, s: 45, l: 85 },   // #ebe0c8 - warm cream
    { h: 0, s: 0, l: 25 },     // #404040 - dark gray
    { h: 0, s: 0, l: 75 },     // #bfbfbf - light gray
  ];

  // Color palette state
  const [palette, setPalette] = useState(DEFAULT_CIRCLE_PALETTE);
  const [selectedSwatch, setSelectedSwatch] = useState(0);
  
  // Background palette state
  const [bgPalette, setBgPalette] = useState(DEFAULT_BG_PALETTE);
  const [selectedBgSwatch, setSelectedBgSwatch] = useState(2); // Default to warm cream
  
  // Get current background color as HSL string
  const getBackgroundColor = useCallback(() => {
    const bg = bgPalette[selectedBgSwatch];
    return `hsl(${bg.h}, ${bg.s}%, ${bg.l}%)`;
  }, [bgPalette, selectedBgSwatch]);
  
  // Get current background color as hex for SVG export
  const getBackgroundHex = useCallback(() => {
    const bg = bgPalette[selectedBgSwatch];
    const h = bg.h;
    const s = bg.s / 100;
    const l = bg.l / 100;
    
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    
    const r = Math.round(f(0) * 255);
    const g = Math.round(f(8) * 255);
    const b = Math.round(f(4) * 255);
    
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }, [bgPalette, selectedBgSwatch]);
  
  // Update background palette
  const updateBgPalette = useCallback((key: 'h' | 's' | 'l', value: number) => {
    setBgPalette(prev => {
      const newPalette = [...prev];
      newPalette[selectedBgSwatch] = { ...newPalette[selectedBgSwatch], [key]: value };
      return newPalette;
    });
  }, [selectedBgSwatch]);

  // Reset palettes to defaults
  const resetCirclePalette = useCallback(() => {
    setPalette(DEFAULT_CIRCLE_PALETTE);
    setSelectedSwatch(0);
  }, []);

  const resetBgPalette = useCallback(() => {
    setBgPalette(DEFAULT_BG_PALETTE);
    setSelectedBgSwatch(2);
  }, []);

  // Save palettes to file
  const savePalettes = useCallback(() => {
    const data = {
      version: 1,
      circlePalette: palette,
      bgPalette: bgPalette,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const name = prompt('Palette name:', 'my-palette') || 'my-palette';
    link.href = url;
    link.download = `${name}.palette.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [palette, bgPalette]);

  // Load palettes from file
  const loadPalettes = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.circlePalette && Array.isArray(data.circlePalette)) {
            setPalette(data.circlePalette);
            setSelectedSwatch(0);
          }
          if (data.bgPalette && Array.isArray(data.bgPalette)) {
            setBgPalette(data.bgPalette);
            setSelectedBgSwatch(0);
          }
          console.log('Palettes loaded');
        } catch (err) {
          console.error('Failed to parse palette file:', err);
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }, []);
  
  // Drag state
  const [dragging, setDragging] = useState<Circle | null>(null);
  const draggingRef = useRef<Circle | null>(null);
  const isPaintingRef = useRef(false);
  const isErasingRef = useRef(false);
  const erasedThisStroke = useRef<Set<number>>(new Set());
  const isLockingRef = useRef(false);
  const lockedThisStroke = useRef<Set<number>>(new Set());
  const isRecoloringRef = useRef(false);
  const recoloredThisStroke = useRef<Set<number>>(new Set());
  const isMagnetActiveRef = useRef(false);
  const magnetPosRef = useRef({ x: 0, y: 0 });
  
  // Flow field drawing refs
  const isFlowDrawingRef = useRef(false);
  const flowStartRef = useRef({ x: 0, y: 0 });
  const lastFlowPosRef = useRef({ x: 0, y: 0 });
  
  // Pinch-to-scale state
  const pinchRef = useRef<{
    circle: Circle | null;
    initialDistance: number;
    initialRadius: number;
  }>({ circle: null, initialDistance: 0, initialRadius: 0 });
  
  // Track mouse position and velocity for momentum
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0 });
  
  // Selection state refs
  const isSelectingRef = useRef(false);
  const selectionStartRef = useRef({ x: 0, y: 0 });
  const selectionRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const isDraggingSelectionRef = useRef(false);
  const selectionDragStartRef = useRef({ x: 0, y: 0 });
  const isPaintSelectingRef = useRef(false); // Paint selection mode
  const paintSelectedThisStroke = useRef<Set<number>>(new Set()); // Track circles selected this stroke

  // Generate color from selected swatch with slight variation
  const getColor = useCallback(() => {
    const swatch = palette[selectedSwatch];
    const h = swatch.h + Math.random() * 10 - 5;
    return `hsl(${h}, ${swatch.s}%, ${swatch.l}%)`;
  }, [palette, selectedSwatch]);
  
  // Get random color from any swatch in the palette
  const getRandomPaletteColor = useCallback(() => {
    const swatch = palette[Math.floor(Math.random() * palette.length)];
    const h = swatch.h + Math.random() * 10 - 5;
    return `hsl(${h}, ${swatch.s}%, ${swatch.l}%)`;
  }, [palette]);
  
  // Update a specific HSL value for the selected swatch
  const updateSwatch = (key: 'h' | 's' | 'l', value: number) => {
    setPalette(prev => {
      const newPalette = [...prev];
      newPalette[selectedSwatch] = { ...newPalette[selectedSwatch], [key]: value };
      return newPalette;
    });
  };

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Reset all simulation parameters to defaults
  const resetSimulationDefaults = useCallback(() => {
    setGravity(true);
    setFloor(true);
    setWalls(false);
    setCollisionIterations(3);
    setRestitution(0.6);
    
    setNBodyMode('off');
    setStickyMode(false);
    setTurbulenceMode(false);
    
    setBrushSize(30);
    setMagnetMode('off');
    setFlowMode('off');
    
    resetCirclePalette();
    resetBgPalette();
    
    setAspectRatio("4:3");
    
    // Clear selection and circles
    clear();
    clearSelection();
  }, [clear, clearSelection, resetCirclePalette, resetBgPalette]);

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.fillStyle = getBackgroundColor();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw floor line if enabled
    if (config.floorEnabled) {
      ctx.strokeStyle = "#8b0000";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, config.floorY);
      ctx.lineTo(canvas.width, config.floorY);
      ctx.stroke();
    }

    // Render layers in order (bottom to top)
    for (const layer of layers) {
      if (!layer.visible) continue;
      
      ctx.globalAlpha = layer.opacity;
      
      if (layer.type === 'paint') {
        // Render paint layer
        const paintLayer = layer as PaintLayer;
        if (paintLayer.canvas) {
          ctx.drawImage(paintLayer.canvas, 0, 0);
        }
      } else if (layer.type === 'circles') {
        // Use playback circles if playing animation, otherwise use real circles
        const circlesToRender = playbackCircles 
          ? playbackCircles.filter(c => c.layerId === layer.id)
          : circles.filter(c => c.layerId === layer.id);
        
        for (const c of circlesToRender) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          
          // Darken and desaturate locked circles (only for real circles)
          const isLocked = !playbackCircles && ((c as Circle).locked || layer.locked);
          if (isLocked) {
            const match = c.color.match(/hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
            if (match) {
              const h = parseFloat(match[1]);
              const s = Math.max(0, parseFloat(match[2]) - 15);
              const l = Math.max(0, parseFloat(match[3]) - 15);
              ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
            } else {
              ctx.fillStyle = c.color;
            }
          } else {
            ctx.fillStyle = c.color;
          }
          
          ctx.fill();
        }
      }
      
      ctx.globalAlpha = 1;
    }
    
    // Update watercolor bleed particles
    const activeLayer = getActiveLayer();
    if (activeLayer?.type === 'paint') {
      const paintLayer = activeLayer as PaintLayer;
      if (paintLayer.ctx && brush.hasActiveParticles()) {
        brush.updateBleed(paintLayer.ctx);
      }
    }
    
    // Draw flow vectors
    if (flowVisible) {
      for (const fv of system.flowVectors) {
        const arrowLength = 25;
        const headLength = 8;
        const headAngle = Math.PI / 6;
        
        const endX = fv.x + Math.cos(fv.angle) * arrowLength;
        const endY = fv.y + Math.sin(fv.angle) * arrowLength;
        
        ctx.beginPath();
        ctx.moveTo(fv.x, fv.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'rgba(100, 200, 100, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLength * Math.cos(fv.angle - headAngle),
          endY - headLength * Math.sin(fv.angle - headAngle)
        );
        ctx.lineTo(
          endX - headLength * Math.cos(fv.angle + headAngle),
          endY - headLength * Math.sin(fv.angle + headAngle)
        );
        ctx.closePath();
        ctx.fillStyle = 'rgba(100, 200, 100, 0.7)';
        ctx.fill();
      }
    }
    
    // Draw magnet radius indicator when active
    if (isMagnetActiveRef.current && magnetMode !== 'off') {
      ctx.beginPath();
      ctx.arc(magnetPosRef.current.x, magnetPosRef.current.y, magnetRadius, 0, Math.PI * 2);
      ctx.strokeStyle = magnetMode === 'attract' ? 'rgba(100, 150, 255, 0.5)' : 'rgba(255, 100, 100, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw center dot
      ctx.beginPath();
      ctx.arc(magnetPosRef.current.x, magnetPosRef.current.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = magnetMode === 'attract' ? 'rgba(100, 150, 255, 0.8)' : 'rgba(255, 100, 100, 0.8)';
      ctx.fill();
    }
    
    // Draw selection highlights
    if (selectedIds.size > 0) {
      ctx.strokeStyle = 'rgba(0, 120, 255, 0.8)';
      ctx.lineWidth = 2;
      for (const c of circles) {
        if (selectedIds.has(c.id)) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r + 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    
    // Draw selection marquee rectangle
    if (selectionRectRef.current) {
      const r = selectionRectRef.current;
      ctx.strokeStyle = 'rgba(0, 120, 255, 0.8)';
      ctx.fillStyle = 'rgba(0, 120, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.setLineDash([]);
    }
    
    // Draw camera preview frame when enabled
    if (showCameraPreview && exportCameraZoom !== 1) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const panX = exportCameraPanX * canvas.width / 100;
      const panY = exportCameraPanY * canvas.height / 100;
      
      // Calculate the visible area at current zoom
      const visibleWidth = canvas.width / exportCameraZoom;
      const visibleHeight = canvas.height / exportCameraZoom;
      
      // Calculate the top-left corner of visible area
      const viewLeft = centerX + panX - visibleWidth / 2;
      const viewTop = centerY + panY - visibleHeight / 2;
      
      // Darken area outside camera view
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      // Top
      ctx.fillRect(0, 0, canvas.width, viewTop);
      // Bottom
      ctx.fillRect(0, viewTop + visibleHeight, canvas.width, canvas.height - viewTop - visibleHeight);
      // Left
      ctx.fillRect(0, viewTop, viewLeft, visibleHeight);
      // Right
      ctx.fillRect(viewLeft + visibleWidth, viewTop, canvas.width - viewLeft - visibleWidth, visibleHeight);
      
      // Draw camera frame border
      ctx.strokeStyle = 'rgba(255, 200, 0, 0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(viewLeft, viewTop, visibleWidth, visibleHeight);
      ctx.setLineDash([]);
      
      // Draw crosshair at center
      const crossSize = 20;
      ctx.strokeStyle = 'rgba(255, 200, 0, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX + panX - crossSize, centerY + panY);
      ctx.lineTo(centerX + panX + crossSize, centerY + panY);
      ctx.moveTo(centerX + panX, centerY + panY - crossSize);
      ctx.lineTo(centerX + panX, centerY + panY + crossSize);
      ctx.stroke();
    }
  }, [circles, config, magnetMode, magnetRadius, flowVisible, system.flowVectors, layers, getActiveLayer, brush, selectedIds, getBackgroundColor, playbackCircles, showCameraPreview, exportCameraZoom, exportCameraPanX, exportCameraPanY]);

  // Apply magnet force to circles
  // Check if a circle should be affected by forces (not locked, layer not locked)
  // When in select mode with selection, only selected circles are affected
  const isCircleAffected = useCallback((c: Circle): boolean => {
    if (c.locked || c.isDragging) return false;
    if (!isLayerAffectedByForces(c.layerId)) return false;
    // If in select mode with selection, only affect selected circles
    if (selectMode && selectedIds.size > 0 && !selectedIds.has(c.id)) return false;
    return true;
  }, [isLayerAffectedByForces, selectMode, selectedIds]);

  // Check if a circle can be modified at all (dragged, recolored, etc)
  // When in select mode with selection, only selected circles are modifiable
  const isCircleModifiable = useCallback((c: Circle): boolean => {
    if (c.locked) return false;
    const layer = layers.find(l => l.id === c.layerId);
    if (layer?.locked) return false;
    // If in select mode with selection, only modify selected circles
    if (selectMode && selectedIds.size > 0 && !selectedIds.has(c.id)) return false;
    return true;
  }, [layers, selectMode, selectedIds]);

  // Check if a point is inside a circle
  const isPointInCircle = useCallback((px: number, py: number, c: Circle): boolean => {
    const dx = px - c.x;
    const dy = py - c.y;
    return dx * dx + dy * dy <= c.r * c.r;
  }, []);

  // Check if a circle is inside or intersects a rectangle
  const isCircleInRect = useCallback((c: Circle, rx: number, ry: number, rw: number, rh: number): boolean => {
    // Normalize rect (handle negative width/height from drag direction)
    const left = rw < 0 ? rx + rw : rx;
    const top = rh < 0 ? ry + rh : ry;
    const right = rw < 0 ? rx : rx + rw;
    const bottom = rh < 0 ? ry : ry + rh;
    
    // Check if circle center is in expanded rect (accounts for radius)
    return c.x >= left - c.r && c.x <= right + c.r && 
           c.y >= top - c.r && c.y <= bottom + c.r;
  }, []);

  // Get all circles in selection rectangle
  const getCirclesInRect = useCallback((rx: number, ry: number, rw: number, rh: number): Circle[] => {
    return circles.filter(c => {
      const layer = layers.find(l => l.id === c.layerId);
      return layer?.visible && isCircleInRect(c, rx, ry, rw, rh);
    });
  }, [circles, layers, isCircleInRect]);

  // Check if click is on any selected circle
  const isClickOnSelection = useCallback((x: number, y: number): boolean => {
    for (const c of circles) {
      if (selectedIds.has(c.id) && isPointInCircle(x, y, c)) {
        return true;
      }
    }
    return false;
  }, [circles, selectedIds, isPointInCircle]);

  // Move all selected circles by delta
  const moveSelection = useCallback((dx: number, dy: number) => {
    for (const c of circles) {
      if (selectedIds.has(c.id) && isCircleModifiable(c)) {
        c.x += dx;
        c.y += dy;
      }
    }
  }, [circles, selectedIds, isCircleModifiable]);

  // Delete all selected circles
  const deleteSelection = useCallback(() => {
    const idsToDelete = Array.from(selectedIds);
    for (const id of idsToDelete) {
      removeCircle(id);
    }
    setSelectedIds(new Set());
  }, [selectedIds, removeCircle]);

  // Recolor all selected circles
  const recolorSelection = useCallback(() => {
    for (const c of circles) {
      if (selectedIds.has(c.id) && isCircleModifiable(c)) {
        c.color = getRandomPaletteColor();
      }
    }
  }, [circles, selectedIds, isCircleModifiable, getRandomPaletteColor]);

  // Invert selection - select unselected, deselect selected
  const invertSelection = useCallback(() => {
    const visibleCircleIds = circles
      .filter(c => {
        const layer = layers.find(l => l.id === c.layerId);
        return layer?.visible;
      })
      .map(c => c.id);
    
    const newSelection = new Set<number>();
    for (const id of visibleCircleIds) {
      if (!selectedIds.has(id)) {
        newSelection.add(id);
      }
    }
    setSelectedIds(newSelection);
  }, [circles, layers, selectedIds]);

  // Lock inverse - lock all circles that are NOT selected
  const lockInverse = useCallback(() => {
    let lockedCount = 0;
    for (const c of circles) {
      // Skip if selected
      if (selectedIds.has(c.id)) continue;
      // Skip if already locked
      if (c.locked) continue;
      // Check if on visible layer
      const layer = layers.find(l => l.id === c.layerId);
      if (!layer?.visible) continue;
      
      c.locked = true;
      lockedCount++;
    }
    console.log(`Locked ${lockedCount} circles (inverse of selection)`);
  }, [circles, layers, selectedIds]);

  // Unlock all circles
  const unlockAll = useCallback(() => {
    let unlockedCount = 0;
    for (const c of circles) {
      if (c.locked) {
        c.locked = false;
        unlockedCount++;
      }
    }
    console.log(`Unlocked ${unlockedCount} circles`);
  }, [circles]);

  // Update undo/redo availability
  const updateUndoRedoState = useCallback(() => {
    setCanUndo(undoManager.canUndo());
    setCanRedo(undoManager.canRedo());
  }, [undoManager]);

  // Save current state to undo history
  const saveUndoState = useCallback((force: boolean = false) => {
    undoManager.saveState(circles, force);
    updateUndoRedoState();
  }, [undoManager, circles, updateUndoRedoState]);

  // Perform undo
  const performUndo = useCallback(() => {
    const snapshot = undoManager.undo();
    if (snapshot) {
      applySnapshot(circles, snapshot, (newCircles) => {
        // Clear existing circles and add new ones
        circles.length = 0;
        circles.push(...newCircles);
      });
      updateUndoRedoState();
      clearSelection();
    }
  }, [undoManager, circles, updateUndoRedoState, clearSelection]);

  // Perform redo
  const performRedo = useCallback(() => {
    const snapshot = undoManager.redo();
    if (snapshot) {
      applySnapshot(circles, snapshot, (newCircles) => {
        // Clear existing circles and add new ones
        circles.length = 0;
        circles.push(...newCircles);
      });
      updateUndoRedoState();
      clearSelection();
    }
  }, [undoManager, circles, updateUndoRedoState, clearSelection]);

  // Initialize undo history when app starts
  useEffect(() => {
    undoManager.initialize(circles);
    updateUndoRedoState();
  }, []); // Only run once on mount

  const applyMagnet = useCallback(() => {
    if (!isMagnetActiveRef.current || magnetMode === 'off') return;
    
    const mx = magnetPosRef.current.x;
    const my = magnetPosRef.current.y;
    const isRepel = magnetMode === 'repel';
    
    for (const c of circles) {
      if (!isCircleAffected(c)) continue;
      
      const dx = mx - c.x;
      const dy = my - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < magnetRadius && dist > 0.01) {
        // Falloff: stronger near center, zero at radius edge
        const falloff = 1 - (dist / magnetRadius);
        // Smaller circles respond more
        const responsiveness = 1 / Math.sqrt(Math.max(5, c.r));
        const force = magnetStrength * falloff * responsiveness;
        
        const nx = dx / dist;
        const ny = dy / dist;
        
        if (isRepel) {
          c.vx -= nx * force;
          c.vy -= ny * force;
        } else {
          c.vx += nx * force;
          c.vy += ny * force;
        }
      }
    }
  }, [circles, magnetMode, magnetRadius, magnetStrength, isCircleAffected]);

  // Apply N-body forces (clump/spread) between all circles
  const applyNBodyForce = useCallback(() => {
    if (nBodyMode === 'off') return;
    
    const direction = nBodyMode === 'clump' ? 1 : -1;
    const startTime = performance.now();
    const maxTime = 8; // Max 8ms for n-body calculations
    
    for (let i = 0; i < circles.length; i++) {
      // Check time budget periodically
      if (i % 50 === 0 && performance.now() - startTime > maxTime) break;
      
      const a = circles[i];
      const aAffected = isCircleAffected(a);
      for (let j = i + 1; j < circles.length; j++) {
        const b = circles[j];
        const bAffected = isCircleAffected(b);
        
        // Skip if both unaffected
        if (!aAffected && !bAffected) return;
        
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 0.01) distance = 0.01;
        
        const touchDistance = a.r + b.r;
        
        // For clump: only attract if NOT touching (avoid sticking)
        // For spread: only repel if close enough
        if (nBodyMode === 'clump' && distance < touchDistance * 1.2) continue;
        if (nBodyMode === 'spread' && distance > touchDistance * 3) continue;
        
        // Force stronger for LARGER circles (they get pulled/pushed more)
        const baseForce = nBodyStrength * 0.002 / Math.max(distance, 30);
        const forceOnA = baseForce * a.r;
        const forceOnB = baseForce * b.r;
        
        const nx = dx / distance;
        const ny = dy / distance;
        
        if (aAffected) {
          a.vx += direction * nx * forceOnA;
          a.vy += direction * ny * forceOnA;
        }
        if (bAffected) {
          b.vx -= direction * nx * forceOnB;
          b.vy -= direction * ny * forceOnB;
        }
      }
    }
  }, [circles, nBodyMode, nBodyStrength, isCircleAffected]);

  // Apply sticky forces between touching circles
  const applyStickyForce = useCallback(() => {
    if (!stickyMode) return;
    
    const startTime = performance.now();
    const maxTime = 8; // Max 8ms for sticky calculations
    
    for (let i = 0; i < circles.length; i++) {
      // Check time budget periodically
      if (i % 50 === 0 && performance.now() - startTime > maxTime) break;
      
      const a = circles[i];
      const aAffected = isCircleAffected(a);
      for (let j = i + 1; j < circles.length; j++) {
        const b = circles[j];
        const bAffected = isCircleAffected(b);
        
        if (!aAffected && !bAffected) return;
        
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 0.01) distance = 0.01;
        
        const touchDistance = a.r + b.r;
        
        // Only apply sticky force when circles are touching or very close
        if (distance < touchDistance * 1.1) {
          // Dampen relative velocity (makes them move together)
          const relVx = b.vx - a.vx;
          const relVy = b.vy - a.vy;
          const dampingFactor = stickyStrength;
          
          if (aAffected) {
            a.vx += relVx * dampingFactor;
            a.vy += relVy * dampingFactor;
          }
          if (bAffected) {
            b.vx -= relVx * dampingFactor;
            b.vy -= relVy * dampingFactor;
          }
          
          // Also dampen absolute velocity to stop sliding
          const absoluteDamping = 1 - stickyStrength * 0.5;
          if (aAffected) {
            a.vx *= absoluteDamping;
            a.vy *= absoluteDamping;
          }
          if (bAffected) {
            b.vx *= absoluteDamping;
            b.vy *= absoluteDamping;
          }
        }
      }
    }
  }, [circles, stickyMode, stickyStrength, isCircleAffected]);

  // Apply turbulence - randomize positions (smaller circles affected more) with animated noise
  const applyTurbulence = useCallback(() => {
    if (!turbulenceMode || turbulenceStrength === 0) return;
    
    // Increment time for animation
    turbulenceTimeRef.current += turbulenceFrequency * 0.01;
    const time = turbulenceTimeRef.current;
    
    for (const c of circles) {
      if (!isCircleAffected(c)) continue;
      
      // Use circle position and time to create animated noise
      // This creates smooth, flowing turbulence instead of random jitter
      const noiseX = (c.x / turbulenceScale) + time;
      const noiseY = (c.y / turbulenceScale) + time * 0.7; // Different time offset for Y
      
      // Simple pseudo-noise function (sine-based for smooth animation)
      const angleX = Math.sin(noiseX) * Math.cos(noiseY * 1.3) * Math.PI * 2;
      const angleY = Math.cos(noiseX * 1.7) * Math.sin(noiseY) * Math.PI * 2;
      
      // Smaller circles are affected more (inversely proportional to radius)
      const responsiveness = 30 / c.r; // Smaller radius = higher value
      const force = turbulenceStrength * responsiveness * 0.05;
      
      c.vx += Math.cos(angleX) * force;
      c.vy += Math.sin(angleY) * force;
    }
  }, [circles, turbulenceMode, turbulenceStrength, turbulenceScale, turbulenceFrequency, isCircleAffected]);

  // Apply continuous scaling to all circles (or just selected if in select mode)
  const applyScaling = useCallback(() => {
    if (!isScalingRef.current || scaleSliderRef.current === 0) return;
    
    const scaleFactor = 1 + scaleSliderRef.current * 0.02; // 0.98 to 1.02 per frame
    
    for (const c of circles) {
      if (c.locked || !isLayerAffectedByForces(c.layerId)) continue;
      // If in select mode with selection, only scale selected circles
      if (selectMode && selectedIds.size > 0 && !selectedIds.has(c.id)) continue;
      const newRadius = c.r * scaleFactor;
      // Clamp between 5 and 200
      c.r = Math.max(5, Math.min(200, newRadius));
      c.mass = c.r * c.r;
    }
  }, [circles, isLayerAffectedByForces, selectMode, selectedIds]);

  // Apply random scaling to all circles (or just selected if in select mode)
  const applyRandomScaling = useCallback(() => {
    if (!isRandomScalingRef.current || randomScaleSliderRef.current === 0) return;
    
    const intensity = Math.abs(randomScaleSliderRef.current);
    
    for (const c of circles) {
      if (c.locked || !isLayerAffectedByForces(c.layerId)) continue;
      // If in select mode with selection, only scale selected circles
      if (selectMode && selectedIds.size > 0 && !selectedIds.has(c.id)) continue;
      
      // More varied random scaling with occasional big changes
      const direction = randomScaleSliderRef.current > 0 ? 1 : -1;
      
      // Base random value with higher variance
      let randomValue = (Math.random() - 0.5) * 2; // -1 to 1
      
      // Add directional bias
      randomValue += direction * 0.3;
      
      // Occasional big jumps (10% chance)
      if (Math.random() < 0.1) {
        randomValue *= 2.5;
      }
      
      // Scale by intensity (0.15 base multiplier, was 0.08)
      const scaleFactor = 1 + randomValue * intensity * 0.15;
      const newRadius = c.r * scaleFactor;
      
      // Clamp between 5 and 200
      c.r = Math.max(5, Math.min(200, newRadius));
      c.mass = c.r * c.r;
    }
  }, [circles, isLayerAffectedByForces, selectMode, selectedIds]);

  // Auto-spawn circles in random open areas
  const autoSpawn = useCallback(() => {
    if (!isAutoSpawningRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const activeLayer = getActiveLayer();
    if (!activeLayer || activeLayer.type !== 'circles') return;
    
    // Try to place a few circles per frame
    for (let attempt = 0; attempt < 3; attempt++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      addCircle(x, y, brushSize, getColor(), activeLayer.id);
    }
  }, [addCircle, brushSize, getColor, getActiveLayer]);

  // Auto-spawn circles with random sizes
  const autoSpawnRandom = useCallback(() => {
    if (!isRandomSpawningRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const activeLayer = getActiveLayer();
    if (!activeLayer || activeLayer.type !== 'circles') return;
    
    // Try to place a few circles per frame
    for (let attempt = 0; attempt < 3; attempt++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const randomSize = 10 + Math.random() * 90; // 10 to 100
      addCircle(x, y, randomSize, getColor(), activeLayer.id);
    }
  }, [addCircle, getColor, getActiveLayer]);

  // Sync flow field settings with physics system
  useEffect(() => {
    system.flowStrength = flowStrength;
    system.flowRadius = flowRadius;
  }, [system, flowStrength, flowRadius]);

  // Sync brush size with watercolor brush
  useEffect(() => {
    brush.setSettings({ size: brushSize });
  }, [brush, brushSize]);

  // Set up physics system to respect layer locks and selection
  useEffect(() => {
    system.setAffectedCheck((c: Circle) => {
      if (c.locked || c.isDragging) return false;
      if (!isLayerAffectedByForces(c.layerId)) return false;
      // If in select mode with selection, only affect selected circles
      if (selectMode && selectedIds.size > 0 && !selectedIds.has(c.id)) return false;
      return true;
    });
  }, [system, isLayerAffectedByForces, selectMode, selectedIds]);

  // Sync collision settings with physics system
  useEffect(() => {
    system.collisionIterations = collisionIterations;
    system.restitution = restitution;
  }, [system, collisionIterations, restitution]);

  // Animation recording controls
  const startRecording = useCallback(() => {
    animationRecorder.setRecordingCallback((duration, frames) => {
      setRecordingDuration(duration);
      setRecordingFrames(frames);
    });
    animationRecorder.startRecording(system.circles);
    setIsRecording(true);
    setPhysicsPaused(false); // Ensure physics is running
  }, [animationRecorder, system.circles]);

  const stopRecording = useCallback(() => {
    const data = animationRecorder.stopRecording();
    setIsRecording(false);
    if (data) {
      setAnimationDuration(data.duration);
      setHasAnimation(true);
    }
  }, [animationRecorder]);

  const playAnimation = useCallback(() => {
    if (!animationRecorder.hasAnimation()) return;
    
    setPhysicsPaused(true); // Pause physics during playback
    setIsPlayingAnimation(true);
    
    animationRecorder.startPlayback(
      (circles) => {
        setPlaybackCircles(circles);
      },
      () => {
        setIsPlayingAnimation(false);
        setPlaybackCircles(null);
      },
      true // loop
    );
  }, [animationRecorder]);

  const stopAnimation = useCallback(() => {
    animationRecorder.stopPlayback();
    setIsPlayingAnimation(false);
    setPlaybackCircles(null);
  }, [animationRecorder]);


  // Exit application
  const exitApplication = useCallback(() => {
    if (window.__TAURI__) {
      window.__TAURI__.window.getCurrent().close();
    } else {
      if (window.confirm('Close the application?')) {
        window.close();
      }
    }
  }, []);

  const saveCurrentAnimation = useCallback(() => {
    if (!animationRecorder.hasAnimation()) {
      console.log('No animation to save');
      return;
    }
    
    // Build animation data from recorder
    const animData: AnimationData = {
      version: 1,
      name: `animation-${Date.now()}`,
      duration: animationRecorder.getDuration(),
      keyframes: animationRecorder.getKeyframes(),
      fps: animationRecorder.getFPS(),
    };
    
    const name = prompt('Animation name:', animData.name) || animData.name;
    saveAnimation({ ...animData, name }, name);
  }, [animationRecorder]);

  const loadAnimation = useCallback(async () => {
    const data = await loadAnimationFile();
    if (data) {
      animationRecorder.loadAnimation(data);
      setAnimationDuration(data.duration);
      setHasAnimation(true);
      console.log(`Loaded animation: ${data.name}`);
    }
  }, [animationRecorder]);

  const clearAnimation = useCallback(() => {
    animationRecorder.clear();
    setHasAnimation(false);
    setAnimationDuration(0);
    setRecordingDuration(0);
    setRecordingFrames(0);
    setPlaybackCircles(null);
  }, [animationRecorder]);

  const applyAnimationSmoothing = useCallback(() => {
    if (!animationRecorder.hasAnimation()) return;
    
    // Stop playback if playing
    if (animationRecorder.getIsPlaying()) {
      animationRecorder.stopPlayback();
      setIsPlayingAnimation(false);
      setPlaybackCircles(null);
    }
    
    // Apply smoothing
    animationRecorder.applySmoothing(smoothingStrength);
    
    console.log(`Applied smoothing with strength ${smoothingStrength}`);
  }, [animationRecorder, smoothingStrength]);

  // Export animation as video
  const exportAnimationVideo = useCallback(async () => {
    if (!animationRecorder.hasAnimation()) return;
    if (!canvasRef.current) return;
    if (!isVideoExportSupported()) {
      alert('Video export is not supported in this browser');
      return;
    }
    
    const sourceCanvas = canvasRef.current;
    
    // Stop any playback
    if (animationRecorder.getIsPlaying()) {
      animationRecorder.stopPlayback();
      setIsPlayingAnimation(false);
      setPlaybackCircles(null);
    }
    
    setIsExportingVideo(true);
    setExportProgress({ phase: 'preparing', progress: 0, message: 'Preparing...' });
    
    // Get a snapshot of keyframes at export time to ensure we use smoothed data
    const keyframesSnapshot = animationRecorder.getKeyframes();
    console.log(`Exporting ${keyframesSnapshot.length} keyframes`);
    
    // Create offscreen canvas at target resolution
    const scale = exportResolution;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = sourceCanvas.width * scale;
    exportCanvas.height = sourceCanvas.height * scale;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) {
      setIsExportingVideo(false);
      return;
    }
    
    const duration = animationRecorder.getDuration();
    
    // Camera parameters
    const zoom = exportCameraZoom;
    const panX = exportCameraPanX * sourceCanvas.width / 100;
    const panY = exportCameraPanY * sourceCanvas.height / 100;
    const centerX = sourceCanvas.width / 2;
    const centerY = sourceCanvas.height / 2;
    
    // Helper function to interpolate frame from snapshot
    const getFrameFromSnapshot = (time: number): CircleSnapshot[] | null => {
      if (keyframesSnapshot.length === 0) return null;
      
      let prevIdx = 0;
      let nextIdx = 0;
      
      for (let i = 0; i < keyframesSnapshot.length; i++) {
        if (keyframesSnapshot[i].time <= time) {
          prevIdx = i;
        }
        if (keyframesSnapshot[i].time >= time) {
          nextIdx = i;
          break;
        }
      }
      
      if (prevIdx === nextIdx || nextIdx === 0) {
        return keyframesSnapshot[prevIdx].circles;
      }
      
      const prevFrame = keyframesSnapshot[prevIdx];
      const nextFrame = keyframesSnapshot[nextIdx];
      const t = (time - prevFrame.time) / (nextFrame.time - prevFrame.time);
      
      const nextMap = new Map<number, CircleSnapshot>();
      for (const c of nextFrame.circles) {
        nextMap.set(c.id, c);
      }
      
      const interpolated: CircleSnapshot[] = [];
      
      for (const prev of prevFrame.circles) {
        const next = nextMap.get(prev.id);
        if (next) {
          interpolated.push({
            id: prev.id,
            x: prev.x + (next.x - prev.x) * t,
            y: prev.y + (next.y - prev.y) * t,
            r: prev.r + (next.r - prev.r) * t,
            color: prev.color,
            layerId: prev.layerId,
          });
        } else {
          interpolated.push({ ...prev });
        }
      }
      
      for (const next of nextFrame.circles) {
        if (!interpolated.find(c => c.id === next.id)) {
          interpolated.push({ ...next });
        }
      }
      
      return interpolated;
    };
    
    // Render function for export - draws a frame at specific time
    const renderFrameForExport = (time: number) => {
      const frame = getFrameFromSnapshot(time);
      if (!frame) return;
      
      // Clear canvas with background
      const bg = bgPalette[selectedBgSwatch];
      ctx.fillStyle = `hsl(${bg.h}, ${bg.s}%, ${bg.l}%)`;
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      
      // Apply transforms: resolution scale, then camera
      ctx.save();
      ctx.scale(scale, scale);
      
      // Apply orthographic camera transform
      ctx.translate(centerX, centerY);
      ctx.scale(zoom, zoom);
      ctx.translate(-centerX - panX, -centerY - panY);
      
      // Render layers in order
      for (const layer of layers) {
        if (!layer.visible) continue;
        
        ctx.globalAlpha = layer.opacity;
        
        if (layer.type === 'paint') {
          // Render paint layer (scaled)
          const paintLayer = layer as PaintLayer;
          if (paintLayer.canvas) {
            ctx.drawImage(paintLayer.canvas, 0, 0);
          }
        } else if (layer.type === 'circles') {
          // Render circles from animation frame
          const layerCircles = frame.filter(c => c.layerId === layer.id);
          
          for (const c of layerCircles) {
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            ctx.fillStyle = c.color;
            ctx.fill();
          }
        }
        
        ctx.globalAlpha = 1;
      }
      
      ctx.restore();
    };
    
    const exportFps = 30;
    
    try {
      const blob = await exportVideoHighQuality(
        exportCanvas,
        renderFrameForExport,
        duration,
        { fps: exportFps, quality: 0.9, format: 'png', motionBlur: motionBlurEnabled, motionBlurSamples: motionBlurSamples, shutterAngle: shutterAngle },
        setExportProgress
      );
      
      if (blob) {
        const resLabel = scale > 1 ? `_${exportCanvas.width}x${exportCanvas.height}` : '';
        const zoomLabel = zoom !== 1 ? `_${zoom}x` : '';
        const defaultName = `animation${resLabel}${zoomLabel}_${exportFps}fps`;
        const name = prompt('PNG Sequence filename:', defaultName) || defaultName;
        downloadVideo(blob, `${name}.zip`);
      }
    } catch (err) {
      console.error('Video export failed:', err);
      setExportProgress({ phase: 'error', progress: 0, message: 'Export failed' });
    }
    
    setIsExportingVideo(false);
    
    // Re-render current state
    render();
  }, [animationRecorder, bgPalette, selectedBgSwatch, layers, render, exportResolution, exportCameraZoom, exportCameraPanX, exportCameraPanY, motionBlurEnabled, motionBlurSamples, shutterAngle]);

  // Animation loop
  useEffect(() => {
    let lastTime = performance.now();
    let slowFrameCount = 0;

    const loop = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      
      // Performance monitoring - if frames are taking too long, auto-pause
      if (delta > 100) { // More than 100ms per frame = very slow
        slowFrameCount++;
        if (slowFrameCount > 5) {
          console.warn('Performance critical - auto-pausing physics');
          setPhysicsPaused(true);
          slowFrameCount = 0;
        }
      } else {
        slowFrameCount = Math.max(0, slowFrameCount - 1);
      }

      // Only run physics if not paused and not playing animation
      if (!physicsPaused && !isPlayingAnimation) {
        applyMagnet();
        applyNBodyForce();
        applyStickyForce();
        applyTurbulence();
        applyScaling();
        applyRandomScaling();
        autoSpawn();
        autoSpawnRandom();
        system.applyFlowField();
        system.update();
      }
      
      // Capture frame if recording
      if (isRecording) {
        animationRecorder.captureFrame(system.circles);
      }
      
      render();

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [system, render, applyMagnet, applyNBodyForce, applyStickyForce, applyTurbulence, applyScaling, applyRandomScaling, autoSpawn, autoSpawnRandom, physicsPaused, isRecording, isPlayingAnimation, animationRecorder]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      // Parse aspect ratio
      const parts = aspectRatio.split(':');
      const ratioW = parseFloat(parts[0]) || 4;
      const ratioH = parseFloat(parts[1]) || 3;
      const targetRatio = ratioW / ratioH;
      
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      const containerRatio = containerW / containerH;
      
      let canvasW, canvasH;
      if (containerRatio > targetRatio) {
        // Container is wider than target, fit to height
        canvasH = containerH;
        canvasW = containerH * targetRatio;
      } else {
        // Container is taller than target, fit to width
        canvasW = containerW;
        canvasH = containerW / targetRatio;
      }
      
      canvas.width = canvasW;
      canvas.height = canvasH;
      setBounds(0, 0, canvas.width, canvas.height);
      
      // Resize all paint layers
      resizeAllPaintLayers(canvasW, canvasH);

      // Update floor position relative to canvas
      system.config.floorY = canvas.height - 50;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [setBounds, system, aspectRatio, resizeAllPaintLayers]);

  // Keyboard shortcuts for selection, physics, undo/redo, and animation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in an input
      const isInput = e.target instanceof HTMLInputElement;
      
      // Undo - Ctrl+Z (works even in inputs for consistency)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        performUndo();
        return;
      }
      
      // Redo - Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        performRedo();
        return;
      }
      
      if (isInput) return;
      
      // Delete key - delete selected circles
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        e.preventDefault();
        deleteSelection();
        saveUndoState(true);
      }
      // Escape - clear selection, exit select mode, stop animation, or close app
      if (e.key === 'Escape') {
        if (isPlayingAnimation) {
          stopAnimation();
        } else if (isRecording) {
          stopRecording();
        } else if (selectedIds.size > 0) {
          clearSelection();
        } else if (selectMode) {
          setSelectMode(false);
        } else {
          // Close app (only works in Tauri desktop app)
          if (window.__TAURI__) {
            window.__TAURI__.window.getCurrent().close();
          }
        }
      }
      // P or Space - toggle physics pause (not during animation)
      if (e.key === 'p' || e.key === 'P' || e.key === ' ') {
        if (isPlayingAnimation) return;
        e.preventDefault();
        setPhysicsPaused(prev => !prev);
      }
      // R - toggle recording
      if (e.key === 'r' || e.key === 'R') {
        if (isPlayingAnimation) return;
        e.preventDefault();
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deleteSelection, clearSelection, selectMode, performUndo, performRedo, saveUndoState, isRecording, isPlayingAnimation, startRecording, stopRecording, stopAnimation]);

  // Get canvas-relative coordinates from mouse or touch event
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Handle touch events
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    
    // Handle mouse events
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Get distance between two touch points
  const getTouchDistance = (e: React.TouchEvent<HTMLCanvasElement>): number => {
    if (e.touches.length < 2) return 0;
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Pointer down handler (mouse or touch)
  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Prevent scrolling on touch
    if ('touches' in e) {
      e.preventDefault();
      
      // Check for second finger added (start pinch-to-scale)
      if (e.touches.length === 2 && draggingRef.current) {
        // Use the circle we were already dragging
        pinchRef.current = {
          circle: draggingRef.current,
          initialDistance: getTouchDistance(e),
          initialRadius: draggingRef.current.r,
        };
        // Stop dragging, switch to scaling
        draggingRef.current.isDragging = false;
        draggingRef.current = null;
        setDragging(null);
        isPaintingRef.current = false;
        console.log("pinch started on circle, initial radius:", pinchRef.current.circle?.r);
        return;
      }
      
      // If already pinching, ignore additional touches
      if (pinchRef.current.circle) {
        return;
      }
    }
    
    const { x, y } = getCanvasCoords(e);
    console.log("pointerDown at", x, y);
    
    // Initialize mouse tracking
    mouseRef.current = { x, y, prevX: x, prevY: y };

    // Check if clicking existing circle
    const hit = getCircleAt(x, y);
    console.log("hit circle?", hit);
    
    // Erase mode
    if (eraseMode) {
      isErasingRef.current = true;
      erasedThisStroke.current.clear();
      if (hit) {
        removeCircle(hit.id);
        erasedThisStroke.current.add(hit.id);
        console.log("erased circle");
      }
      return;
    }
    
    // Lock mode
    if (lockMode) {
      isLockingRef.current = true;
      lockedThisStroke.current.clear();
      if (hit) {
        hit.locked = !hit.locked;
        lockedThisStroke.current.add(hit.id);
        console.log("toggled lock:", hit.locked);
      }
      return;
    }
    
    // Recolor mode
    if (recolorMode) {
      isRecoloringRef.current = true;
      recoloredThisStroke.current.clear();
      if (hit && isCircleModifiable(hit)) {
        hit.color = getRandomPaletteColor();
        recoloredThisStroke.current.add(hit.id);
        console.log("recolored circle");
      }
      return;
    }
    
    // Flow field mode
    if (flowMode === 'draw') {
      isFlowDrawingRef.current = true;
      flowStartRef.current = { x, y };
      lastFlowPosRef.current = { x, y };
      console.log("flow draw started at", x, y);
      return;
    }
    
    if (flowMode === 'erase') {
      system.removeFlowVectorAt(x, y);
      console.log("flow erase at", x, y);
      return;
    }
    
    // Magnet mode
    if (magnetMode !== 'off') {
      isMagnetActiveRef.current = true;
      magnetPosRef.current = { x, y };
      console.log("magnet activated at", x, y);
      return;
    }
    
    // Selection mode
    if (selectMode) {
      // Check if clicking on an already selected circle (to drag selection)
      if (isClickOnSelection(x, y)) {
        isDraggingSelectionRef.current = true;
        selectionDragStartRef.current = { x, y };
        console.log("started dragging selection");
        return;
      }
      
      // Check if clicking on an unselected circle (start paint selection)
      if (hit) {
        // Start paint selection mode
        isPaintSelectingRef.current = true;
        paintSelectedThisStroke.current = new Set();
        
        // Shift+click to add to selection, otherwise replace selection
        if ((e as React.MouseEvent).shiftKey) {
          setSelectedIds(prev => {
            const next = new Set(prev);
            next.add(hit.id);
            paintSelectedThisStroke.current.add(hit.id);
            return next;
          });
        } else {
          setSelectedIds(new Set([hit.id]));
          paintSelectedThisStroke.current.add(hit.id);
        }
        console.log("started paint selection with circle", hit.id);
        return;
      }
      
      // Start marquee selection
      isSelectingRef.current = true;
      selectionStartRef.current = { x, y };
      selectionRectRef.current = { x, y, w: 0, h: 0 };
      if (!(e as React.MouseEvent).shiftKey) {
        setSelectedIds(new Set()); // Clear selection if not shift-clicking
      }
      console.log("started marquee selection at", x, y);
      return;
    }
    
    // Get active layer for drawing
    const activeLayer = getActiveLayer();
    
    // Paint mode on paint layer
    if (paintMode && activeLayer?.type === 'paint') {
      const paintLayer = activeLayer as PaintLayer;
      if (paintLayer.ctx && !activeLayer.locked) {
        isPaintingLayerRef.current = true;
        lastPaintPosRef.current = { x, y };
        brush.stroke(paintLayer.ctx, x, y, getColor());
        console.log("paint layer stroke started at", x, y);
      }
      return;
    }
    
    // Circle layer mode
    if (activeLayer?.type === 'circles' && !activeLayer.locked) {
      if (hit && isCircleModifiable(hit)) {
        hit.isDragging = true;
        draggingRef.current = hit;
        setDragging(hit);
        console.log("started dragging circle");
      } else if (!hit) {
        // Start painting mode and add first circle
        isPaintingRef.current = true;
        const added = addCircle(x, y, brushSize, getColor(), activeLayer.id);
        console.log("started painting, first circle added:", added);
      }
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Prevent scrolling on touch
    if ('touches' in e) {
      e.preventDefault();
      
      // Handle pinch gesture
      if (e.touches.length === 2 && pinchRef.current.circle) {
        // Don't scale if circle became unmodifiable (e.g., layer locked mid-pinch)
        if (!isCircleModifiable(pinchRef.current.circle)) {
          pinchRef.current = { circle: null, initialDistance: 0, initialRadius: 0 };
          return;
        }
        const newDistance = getTouchDistance(e);
        const scale = newDistance / pinchRef.current.initialDistance;
        const newRadius = Math.max(5, Math.min(200, pinchRef.current.initialRadius * scale));
        pinchRef.current.circle.r = newRadius;
        pinchRef.current.circle.mass = newRadius * newRadius;
        console.log("pinch scale:", scale.toFixed(2), "new radius:", newRadius.toFixed(1));
        return;
      }
    }
    
    const { x, y } = getCanvasCoords(e);
    
    // Erase mode - delete circles as we drag over them
    if (isErasingRef.current) {
      const hit = getCircleAt(x, y);
      if (hit && !erasedThisStroke.current.has(hit.id)) {
        removeCircle(hit.id);
        erasedThisStroke.current.add(hit.id);
        console.log("erased circle while dragging");
      }
      return;
    }
    
    // Lock mode - toggle lock on circles as we drag over them
    if (isLockingRef.current) {
      const hit = getCircleAt(x, y);
      if (hit && !lockedThisStroke.current.has(hit.id)) {
        hit.locked = !hit.locked;
        lockedThisStroke.current.add(hit.id);
        console.log("toggled lock while dragging:", hit.locked);
      }
      return;
    }
    
    // Recolor mode - recolor circles as we drag over them
    if (isRecoloringRef.current) {
      const hit = getCircleAt(x, y);
      if (hit && isCircleModifiable(hit) && !recoloredThisStroke.current.has(hit.id)) {
        hit.color = getRandomPaletteColor();
        recoloredThisStroke.current.add(hit.id);
        console.log("recolored circle while dragging");
      }
      return;
    }
    
    // Flow field drawing - add vectors based on drag direction
    if (isFlowDrawingRef.current) {
      const dx = x - lastFlowPosRef.current.x;
      const dy = y - lastFlowPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Only add vector if we've moved enough
      if (dist > 30) {
        const angle = Math.atan2(dy, dx);
        system.addFlowVector(lastFlowPosRef.current.x, lastFlowPosRef.current.y, angle);
        lastFlowPosRef.current = { x, y };
      }
      return;
    }
    
    // Flow field erase - remove vectors while dragging
    if (flowMode === 'erase') {
      system.removeFlowVectorAt(x, y);
      return;
    }
    
    // Magnet mode - update position while dragging
    if (isMagnetActiveRef.current) {
      magnetPosRef.current = { x, y };
      return;
    }
    
    // Selection mode - update marquee or drag selection
    if (isSelectingRef.current) {
      // Update marquee rectangle
      selectionRectRef.current = {
        x: selectionStartRef.current.x,
        y: selectionStartRef.current.y,
        w: x - selectionStartRef.current.x,
        h: y - selectionStartRef.current.y,
      };
      return;
    }
    
    // Paint selection mode - add circles under cursor to selection
    if (isPaintSelectingRef.current) {
      const hit = getCircleAt(x, y);
      if (hit && !paintSelectedThisStroke.current.has(hit.id)) {
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.add(hit.id);
          return next;
        });
        paintSelectedThisStroke.current.add(hit.id);
      }
      return;
    }
    
    if (isDraggingSelectionRef.current) {
      // Move all selected circles
      const dx = x - selectionDragStartRef.current.x;
      const dy = y - selectionDragStartRef.current.y;
      moveSelection(dx, dy);
      selectionDragStartRef.current = { x, y };
      return;
    }
    
    // Paint layer mode - draw continuous strokes
    if (isPaintingLayerRef.current) {
      const activeLayer = getActiveLayer();
      if (activeLayer?.type === 'paint') {
        const paintLayer = activeLayer as PaintLayer;
        if (paintLayer.ctx) {
          interpolateStroke(
            brush,
            paintLayer.ctx,
            lastPaintPosRef.current.x,
            lastPaintPosRef.current.y,
            x,
            y,
            getColor()
          );
          lastPaintPosRef.current = { x, y };
        }
      }
      return;
    }
    
    // Calculate velocity before updating positions
    const vx = (x - mouseRef.current.x) * 0.5;
    const vy = (y - mouseRef.current.y) * 0.5;
    
    // Update mouse tracking
    mouseRef.current.prevX = mouseRef.current.x;
    mouseRef.current.prevY = mouseRef.current.y;
    mouseRef.current.x = x;
    mouseRef.current.y = y;

    if (draggingRef.current) {
      // Move dragged circle
      draggingRef.current.x = x;
      draggingRef.current.y = y;
      // Store velocity for momentum on release
      draggingRef.current.vx = vx;
      draggingRef.current.vy = vy;
    } else if (isPaintingRef.current) {
      // Continuously spawn circles while dragging
      const activeLayer = getActiveLayer();
      if (activeLayer?.type === 'circles') {
        const added = addCircle(x, y, brushSize, getColor(), activeLayer.id);
        if (added) console.log("painted circle at", x, y);
      }
    }
  };

  const handlePointerUp = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Track if we made changes that need undo save
    let madeChanges = false;
    
    // Clear pinch state
    if (pinchRef.current.circle) {
      console.log("pinch ended, final radius:", pinchRef.current.circle.r);
      pinchRef.current = { circle: null, initialDistance: 0, initialRadius: 0 };
      madeChanges = true;
    }
    
    // Clear erase state
    if (isErasingRef.current) {
      madeChanges = true;
    }
    isErasingRef.current = false;
    
    // Clear lock state
    isLockingRef.current = false;
    
    // Clear recolor state
    if (isRecoloringRef.current) {
      madeChanges = true;
    }
    isRecoloringRef.current = false;
    
    // Clear magnet state
    isMagnetActiveRef.current = false;
    
    // Clear paint layer state
    isPaintingLayerRef.current = false;
    
    // Clear flow drawing state (add final vector if moved enough)
    if (isFlowDrawingRef.current) {
      isFlowDrawingRef.current = false;
    }
    
    // Handle selection completion
    if (isSelectingRef.current && selectionRectRef.current) {
      const r = selectionRectRef.current;
      const circlesInRect = getCirclesInRect(r.x, r.y, r.w, r.h);
      
      // Add to selection (shift key) or replace
      if ((e as React.MouseEvent)?.shiftKey) {
        setSelectedIds(prev => {
          const next = new Set(prev);
          for (const c of circlesInRect) {
            next.add(c.id);
          }
          return next;
        });
      } else {
        setSelectedIds(new Set(circlesInRect.map(c => c.id)));
      }
      
      console.log("selected", circlesInRect.length, "circles");
      selectionRectRef.current = null;
      isSelectingRef.current = false;
    }
    
    // Clear selection drag state
    if (isDraggingSelectionRef.current) {
      madeChanges = true;
    }
    isDraggingSelectionRef.current = false;
    
    // Clear paint selection state
    if (isPaintSelectingRef.current) {
      console.log("paint selected", paintSelectedThisStroke.current.size, "circles");
    }
    isPaintSelectingRef.current = false;
    paintSelectedThisStroke.current.clear();
    
    console.log("pointerUp, wasDragging:", !!draggingRef.current, "wasPainting:", isPaintingRef.current);
    
    if (draggingRef.current) {
      // Release with momentum (velocity already set in handlePointerMove)
      console.log("releasing with velocity:", draggingRef.current.vx, draggingRef.current.vy);
      draggingRef.current.isDragging = false;
      draggingRef.current = null;
      setDragging(null);
      madeChanges = true;
    }
    
    if (isPaintingRef.current) {
      madeChanges = true;
    }
    isPaintingRef.current = false;
    
    // Save undo state if we made changes
    if (madeChanges) {
      saveUndoState(true);
    }
  };

  return (
    <div className="app">
      {/* Left Panel */}
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

        {/* Tab Content */}
        <div className="tab-content">
          {/* PROJECT TAB */}
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
            title="Export as multi-layered SVG (includes stencil layers for cutting)"
          >
            SVG
          </button>
        </div>

        <h2>Animation</h2>

        <div className="control-group">
          {!isRecording && !isPlayingAnimation && (
            <button
              onClick={startRecording}
              className="danger"
              title="Start recording animation (R)"
            >
              ⏺ Record
            </button>
          )}
          {isRecording && (
            <button
              onClick={stopRecording}
              className="active danger"
              title="Stop recording (R or Escape)"
            >
              ⏹ Stop ({(recordingDuration / 1000).toFixed(1)}s, {recordingFrames} frames)
            </button>
          )}
        </div>

        {hasAnimation && !isRecording && (
          <div className="control-group">
            {!isPlayingAnimation ? (
              <button
                onClick={playAnimation}
                className="active"
                title="Play recorded animation"
              >
                ▶ Play ({(animationDuration / 1000).toFixed(1)}s)
              </button>
            ) : (
              <button
                onClick={stopAnimation}
                className="active warning"
                title="Stop playback (Escape)"
              >
                ⏹ Stop Playback
              </button>
            )}
          </div>
        )}

        {hasAnimation && !isRecording && !isPlayingAnimation && (
          <div className="control-group">
            <label>Smoothing: {(smoothingStrength * 100).toFixed(0)}%</label>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={smoothingStrength}
              onChange={(e) => setSmoothingStrength(Number(e.target.value))}
            />
            <button
              onClick={applyAnimationSmoothing}
              title="Apply smoothing to recorded animation (makes movements more organic)"
            >
              Apply Smoothing
            </button>
          </div>
        )}

        {hasAnimation && !isRecording && !isPlayingAnimation && (
          <div className="control-group">
            <label>Export Resolution:</label>
            <div className="resolution-selector">
              {[1, 2, 4].map(res => (
                <button
                  key={res}
                  onClick={() => setExportResolution(res)}
                  className={exportResolution === res ? 'active' : ''}
                  disabled={isExportingVideo}
                  title={`${res}x resolution (${canvasRef.current ? canvasRef.current.width * res : '?'}x${canvasRef.current ? canvasRef.current.height * res : '?'})`}
                >
                  {res}x
                </button>
              ))}
            </div>
            <span className="resolution-info">
              {canvasRef.current ? `${canvasRef.current.width * exportResolution}×${canvasRef.current.height * exportResolution}` : ''}
            </span>
          </div>
        )}

        {hasAnimation && !isRecording && !isPlayingAnimation && (
          <div className="control-group camera-controls">
            <div className="camera-header">
              <label>Camera:</label>
              <button
                onClick={() => setShowCameraPreview(!showCameraPreview)}
                className={showCameraPreview ? 'active small' : 'small'}
                title="Toggle camera preview overlay"
              >
                {showCameraPreview ? '👁 Hide' : '👁 Preview'}
              </button>
            </div>
            
            <label>Zoom: {exportCameraZoom.toFixed(1)}x</label>
            <input
              type="range"
              min="0.5"
              max="4"
              step="0.1"
              value={exportCameraZoom}
              onChange={(e) => setExportCameraZoom(Number(e.target.value))}
              disabled={isExportingVideo}
            />
            
            <label>Pan X: {exportCameraPanX.toFixed(0)}%</label>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={exportCameraPanX}
              onChange={(e) => setExportCameraPanX(Number(e.target.value))}
              disabled={isExportingVideo}
            />
            
            <label>Pan Y: {exportCameraPanY.toFixed(0)}%</label>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={exportCameraPanY}
              onChange={(e) => setExportCameraPanY(Number(e.target.value))}
              disabled={isExportingVideo}
            />
            
            <button
              onClick={() => {
                setExportCameraZoom(1);
                setExportCameraPanX(0);
                setExportCameraPanY(0);
              }}
              disabled={isExportingVideo || (exportCameraZoom === 1 && exportCameraPanX === 0 && exportCameraPanY === 0)}
              title="Reset camera to default"
            >
              Reset Camera
            </button>
          </div>
        )}


        {/* Motion Blur Controls */}
        {hasAnimation && !isRecording && !isPlayingAnimation && (
          <>
            <h3>Motion Blur</h3>
            
            <div className="control-group">
              <button
                onClick={() => setMotionBlurEnabled(!motionBlurEnabled)}
                className={motionBlurEnabled ? "active" : ""}
              >
                Motion Blur {motionBlurEnabled ? "ON" : "OFF"}
              </button>
            </div>

            {motionBlurEnabled && (
              <>
                <div className="control-group">
                  <label>Samples: {motionBlurSamples}</label>
                  <input
                    type="range"
                    min="2"
                    max="32"
                    value={motionBlurSamples}
                    onChange={(e) => setMotionBlurSamples(Number(e.target.value))}
                  />
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    More samples = smoother blur (2-32)
                  </div>
                </div>

                <div className="control-group">
                  <label>Shutter Angle: {shutterAngle}°</label>
                  <input
                    type="range"
                    min="45"
                    max="360"
                    step="45"
                    value={shutterAngle}
                    onChange={(e) => setShutterAngle(Number(e.target.value))}
                  />
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    180° = cinematic, 360° = maximum blur
                  </div>
                </div>

                <div style={{
                  padding: '10px',
                  background: 'rgba(74, 158, 255, 0.1)',
                  border: '1px solid rgba(74, 158, 255, 0.3)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '10px'
                }}>
                  <strong>Render time:</strong> ~{(motionBlurSamples * 0.1).toFixed(1)}s per frame
                  <br />
                  ({motionBlurSamples}x slower than no blur)
                </div>
              </>
            )}
          </>
        )}
        {hasAnimation && !isRecording && !isPlayingAnimation && (
          <div className="control-group">
            <button
              onClick={exportAnimationVideo}
              disabled={isExportingVideo}
              className="active"
              title="Export animation as PNG sequence (ZIP) for After Effects"
            >
              {isExportingVideo ? 'Exporting...' : '🎬 Export PNG Sequence'}
            </button>
            {exportProgress && isExportingVideo && (
              <div className="export-progress">
                <div 
                  className="export-progress-bar"
                  style={{ width: `${exportProgress.progress}%` }}
                />
                <span className="export-progress-text">
                  {exportProgress.message}
                </span>
              </div>
            )}
          </div>
        )}

        {(hasAnimation || isRecording) && (
          <div className="control-group button-row">
            <button
              onClick={saveCurrentAnimation}
              disabled={isRecording}
              title="Save animation to file"
            >
              Save
            </button>
            <button
              onClick={loadAnimation}
              disabled={isRecording || isPlayingAnimation}
              title="Load animation from file"
            >
              Load
            </button>
            <button
              onClick={clearAnimation}
              disabled={isRecording || isPlayingAnimation}
              className="danger"
              title="Clear recorded animation"
            >
              Clear
            </button>
          </div>
        )}

        {!hasAnimation && !isRecording && (
          <div className="control-group">
            <button
              onClick={loadAnimation}
              title="Load animation from file"
            >
              Load Animation
            </button>
          </div>
        )}

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
              
              // Restore circles
              system.circles = restoreCircles(data);
              
              // Restore layers
              restoreLayers(data.layers, data.activeLayerId);
              
              // Restore canvas settings
              setAspectRatio(data.aspectRatio);
              
              // Restore physics
              system.config.gravityEnabled = data.physics.gravityEnabled;
              system.config.gravityStrength = data.physics.gravityStrength;
              system.config.floorEnabled = data.physics.floorEnabled;
              system.config.floorY = data.physics.floorY;
              system.config.wallsEnabled = data.physics.wallsEnabled;
              system.config.damping = data.physics.damping;
              setGravity(data.physics.gravityEnabled);
              setFloor(data.physics.floorEnabled);
              
              // Restore collision settings
              if (data.physics.collisionIterations !== undefined) {
                setCollisionIterations(data.physics.collisionIterations);
              }
              if (data.physics.restitution !== undefined) {
                setRestitution(data.physics.restitution);
              }
              
              // Restore other settings
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
              
              // Restore palette
              setPalette(data.palette);
              setSelectedSwatch(data.selectedSwatch);
              
              // Restore background palette
              if (data.bgPalette) {
                setBgPalette(data.bgPalette);
              }
              if (data.selectedBgSwatch !== undefined) {
                setSelectedBgSwatch(data.selectedBgSwatch);
              }
              
              // Initialize undo history with loaded state
              undoManager.initialize(system.circles);
              updateUndoRedoState();
              
              console.log(`Loaded project: ${data.name} (saved ${new Date(data.savedAt).toLocaleString()})`);
            }}
            title="Load project from JSON file"
          >
            Load
          </button>
          <button 
            onClick={exitApplication}
            className="danger"
            title="Exit application"
          >
            Exit
          </button>
        </div>

        
          </div>

          {/* COLORS TAB */}
          <div className={`tab-pane ${leftTab === 'colors' ? 'active' : ''}`}>
     <h2>Draw</h2>

        <div className="control-group">
          <label>Circles: {circleCount}</label>
        </div>

        <div className="control-group">
          <label>Brush Size: {brushSize}</label>
          <input
            type="range"
            min="10"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
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
          className="hue-slider" />
        </div>

        <div className="control-group">
          <label>Saturation: {bgPalette[selectedBgSwatch].s}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={bgPalette[selectedBgSwatch].s}
            onChange={(e) => updateBgPalette('s', Number(e.target.value))}
            style={{ background: `linear-gradient(to right, hsl(${bgPalette[selectedBgSwatch].h}, 0%, 50%), hsl(${bgPalette[selectedBgSwatch].h}, 100%, 50%))`, height: '4px' }}
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
            style={{ background: `linear-gradient(to right, hsl(${bgPalette[selectedBgSwatch].h}, ${bgPalette[selectedBgSwatch].s}%, 0%), hsl(${bgPalette[selectedBgSwatch].h}, ${bgPalette[selectedBgSwatch].s}%, 50%), hsl(${bgPalette[selectedBgSwatch].h}, ${bgPalette[selectedBgSwatch].s}%, 100%))`, height: '4px' }}
          />
        </div>

        <div className="control-group">
          <button
            onClick={resetBgPalette}
            title="Reset background palette to defaults"
          >
            Reset Backgrounds
          </button>
        </div>

        <h2>Color</h2>

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
          className="hue-slider" />
        </div>

        <div className="control-group">
          <label>Saturation: {palette[selectedSwatch].s}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={palette[selectedSwatch].s}
            style={{ background: `linear-gradient(to right, hsl(${palette[selectedSwatch].h}, 0%, 50%), hsl(${palette[selectedSwatch].h}, 100%, 50%))`, height: '4px' }}
            onChange={(e) => updateSwatch('s', Number(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label>Lightness: {palette[selectedSwatch].l}%</label>
          <input
            type="range"
            min="0"
            max="100"
            style={{ background: `linear-gradient(to right, hsl(${palette[selectedSwatch].h}, ${palette[selectedSwatch].s}%, 0%), hsl(${palette[selectedSwatch].h}, ${palette[selectedSwatch].s}%, 50%), hsl(${palette[selectedSwatch].h}, ${palette[selectedSwatch].s}%, 100%))`, height: '4px' }}
            value={palette[selectedSwatch].l}
            onChange={(e) => updateSwatch('l', Number(e.target.value))}
          />
        </div>

        <div className="control-group">
          <button
            onClick={resetCirclePalette}
            title="Reset circle palette to defaults"
          >
            Reset Colors
          </button>
        </div>

        <div className="control-group button-row">
          <button
            onClick={savePalettes}
            title="Save both palettes to file"
          >
            Save Palettes
          </button>
          <button
            onClick={loadPalettes}
            title="Load palettes from file"
          >
            Load Palettes
          </button>
        </div>

        
          </div>

          {/* TOOLS TAB */}
          <div className={`tab-pane ${leftTab === 'tools' ? 'active' : ''}`}>
            <h2>Tools</h2>

        <div className="control-group button-row">
          <button 
            onClick={() => { 
              saveUndoState(true);
              clear(); 
              clearSelection(); 
              saveUndoState(true);
            }}
          >
            Clear All
          </button>
          <button 
            onClick={performUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button 
            onClick={performRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
        </div>

        <div className="control-group">
          <label>Hold to spawn circles</label>
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

        <div className="control-group">
          <button
            onClick={() => {
              setEraseMode(!eraseMode);
              if (!eraseMode) { setLockMode(false); setRecolorMode(false); setMagnetMode('off'); setFlowMode('off'); setSelectMode(false); clearSelection(); }
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
              if (!lockMode) { setEraseMode(false); setRecolorMode(false); setMagnetMode('off'); setFlowMode('off'); setSelectMode(false); clearSelection(); }
            }}
            className={lockMode ? "active warning" : ""}
          >
            Lock {lockMode ? "ON" : "OFF"}
          </button>
          <button
            onClick={unlockAll}
            title="Unlock all circles"
          >
            Unlock All
          </button>
        </div>

        <div className="control-group">
          <button
            onClick={() => {
              setRecolorMode(!recolorMode);
              if (!recolorMode) { setEraseMode(false); setLockMode(false); setMagnetMode('off'); setFlowMode('off'); setSelectMode(false); }
            }}
            className={recolorMode ? "active info" : ""}
          >
            Recolor {recolorMode ? "ON" : "OFF"}
          </button>
        </div>

        <div className="control-group">
          <button
            onClick={() => {
              setSelectMode(!selectMode);
              if (!selectMode) { setEraseMode(false); setLockMode(false); setRecolorMode(false); setMagnetMode('off'); setFlowMode('off'); }
              else { clearSelection(); }
            }}
            className={selectMode ? "active info" : ""}
          >
            Select {selectMode ? "ON" : "OFF"}
          </button>
        </div>

        {selectedIds.size > 0 && (
          <div className="control-group selection-actions">
            <label>Selected: {selectedIds.size} circles</label>
            <div className="button-row">
              <button onClick={recolorSelection} className="info" title="Recolor selected circles">
                Recolor
              </button>
              <button onClick={deleteSelection} className="danger" title="Delete selected circles">
                Delete
              </button>
              <button onClick={invertSelection} title="Invert selection">
                Invert
              </button>
            </div>
            <div className="button-row">
              <button onClick={lockInverse} title="Lock all circles that are NOT selected">
                Lock Inverse
              </button>
              <button onClick={unlockAll} title="Unlock all circles">
                Unlock All
              </button>
            </div>
          </div>
        )}

        
          </div>

          {/* PHYSICS TAB */}
          <div className={`tab-pane ${leftTab === 'physics' ? 'active' : ''}`}> 
            <h2>Magnet</h2>

        <div className="control-group button-row">
          <button
            onClick={() => {
              const newMode = magnetMode === 'attract' ? 'off' : 'attract';
              setMagnetMode(newMode);
              if (newMode !== 'off') { setEraseMode(false); setLockMode(false); setRecolorMode(false); setFlowMode('off'); setSelectMode(false); clearSelection(); }
            }}
            className={magnetMode === 'attract' ? "active" : ""}
          >
            Attract
          </button>
          <button
            onClick={() => {
              const newMode = magnetMode === 'repel' ? 'off' : 'repel';
              setMagnetMode(newMode);
              if (newMode !== 'off') { setEraseMode(false); setLockMode(false); setRecolorMode(false); setFlowMode('off'); setSelectMode(false); clearSelection(); }
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

        <h2>Physics</h2>

        <div className="control-group">
          <button
            onClick={() => setPhysicsPaused(!physicsPaused)}
            className={physicsPaused ? "active warning" : ""}
            title={physicsPaused ? "Resume physics simulation" : "Pause physics (use if app becomes unresponsive)"}
          >
            {physicsPaused ? "▶ Resume" : "⏸ Pause"}
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

        <div className="control-group">
          <label>Collision Accuracy: {collisionIterations}</label>
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

        <div className="control-group">
          <button
            onClick={() => setTurbulenceMode(!turbulenceMode)}
            className={turbulenceMode ? "active danger" : ""}
          >
            Turbulence {turbulenceMode ? "ON" : "OFF"}
          </button>
        </div>

        <div className="control-group">
          <label>Strength: {turbulenceStrength.toFixed(1)}</label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={turbulenceStrength}
            onChange={(e) => setTurbulenceStrength(Number(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label>Scale: {turbulenceScale}</label>
          <input
            type="range"
            min="20"
            max="300"
            step="10"
            value={turbulenceScale}
            onChange={(e) => setTurbulenceScale(Number(e.target.value))}
            title="Noise table size - larger = broader patterns"
          />
        </div>

        <div className="control-group">
          <label>Speed: {turbulenceFrequency.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={turbulenceFrequency}
            onChange={(e) => setTurbulenceFrequency(Number(e.target.value))}
            title="Animation speed of turbulence"
          />
        </div>
      
        </div>
      </div>
    </aside>

      {/* Canvas Area */}
      <main className="canvas-container">
        {isRecording && (
          <div className="recording-indicator">
            REC {(recordingDuration / 1000).toFixed(1)}s
          </div>
        )}
        {isPlayingAnimation && (
          <div className="playback-indicator">
            ▶ Playing
          </div>
        )}
        {isExportingVideo && (
          <div className="exporting-indicator">
            🎬 Exporting {exportResolution}x... {exportProgress?.progress || 0}%
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{ cursor: eraseMode ? 'not-allowed' : lockMode ? 'pointer' : recolorMode ? 'cell' : selectMode ? 'crosshair' : magnetMode !== 'off' ? 'move' : flowMode === 'draw' ? 'crosshair' : flowMode === 'erase' ? 'not-allowed' : 'crosshair' }}
          // Mouse events
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          // Touch events
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          onTouchCancel={handlePointerUp}
        />
      </main>

      {/* Right Panel */}
      <aside className="panel right-panel">
        
        {/* Tab Navigation */}
        <div className="tab-nav">
          <button 
            className={`tab-button ${rightTab === 'effects' ? 'active' : ''}`}
            onClick={() => setRightTab('effects')}
          >
            Effects
          </button>
          <button 
            className={`tab-button ${rightTab === 'layers' ? 'active' : ''}`}
            onClick={() => setRightTab('layers')}
          >
            Layers
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* EFFECTS TAB */}
          <div className={`tab-pane ${rightTab === 'effects' ? 'active' : ''}`}>
            <h2>Flow Field</h2>

        <div className="control-group button-row">
          <button
            onClick={() => {
              const newMode = flowMode === 'draw' ? 'off' : 'draw';
              setFlowMode(newMode);
              if (newMode !== 'off') { setEraseMode(false); setLockMode(false); setRecolorMode(false); setMagnetMode('off'); setSelectMode(false); clearSelection(); }
            }}
            className={flowMode === 'draw' ? "active" : ""}
          >
            Draw
          </button>
          <button
            onClick={() => {
              const newMode = flowMode === 'erase' ? 'off' : 'erase';
              setFlowMode(newMode);
              if (newMode !== 'off') { setEraseMode(false); setLockMode(false); setRecolorMode(false); setMagnetMode('off'); setSelectMode(false); clearSelection(); }
            }}
            className={flowMode === 'erase' ? "active danger" : ""}
          >
            Erase
          </button>
        </div>

        <div className="control-group">
          <button
            onClick={() => setFlowVisible(!flowVisible)}
            className={flowVisible ? "active" : ""}
          >
            Visible {flowVisible ? "ON" : "OFF"}
          </button>
        </div>

        <div className="control-group">
          <button onClick={() => system.clearFlowField()}>
            Clear All
          </button>
        </div>

        <div className="control-group">
          <label>Strength: {flowStrength.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.01"
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
            value={flowRadius}
            onChange={(e) => setFlowRadius(Number(e.target.value))}
          />
        </div>

        <h2>Scale All</h2>
        
        <div className="control-group">
          <label>Hold & drag to scale</label>
          <div className="spring-slider">
            <span className="slider-label">−</span>
            <input
              type="range"
              min="-100"
              max="100"
              value={scaleSliderValue}
              onChange={(e) => {
                const val = Number(e.target.value);
                setScaleSliderValue(val);
                scaleSliderRef.current = val / 100;
              }}
              onMouseDown={() => { isScalingRef.current = true; }}
              onMouseUp={() => {
                isScalingRef.current = false;
                scaleSliderRef.current = 0;
                setScaleSliderValue(0);
              }}
              onMouseLeave={() => {
                if (isScalingRef.current) {
                  isScalingRef.current = false;
                  scaleSliderRef.current = 0;
                  setScaleSliderValue(0);
                }
              }}
              onTouchStart={() => { isScalingRef.current = true; }}
              onTouchEnd={() => {
                isScalingRef.current = false;
                scaleSliderRef.current = 0;
                setScaleSliderValue(0);
              }}
            />
            <span className="slider-label">+</span>
          </div>
        </div>

        <h2>Random Scale</h2>
        
        <div className="control-group">
          <label>Hold & drag to randomize</label>
          <div className="spring-slider">
            <span className="slider-label">−</span>
            <input
              type="range"
              min="-100"
              max="100"
              value={randomScaleSliderValue}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRandomScaleSliderValue(val);
                randomScaleSliderRef.current = val / 100;
              }}
              onMouseDown={() => { isRandomScalingRef.current = true; }}
              onMouseUp={() => {
                isRandomScalingRef.current = false;
                randomScaleSliderRef.current = 0;
                setRandomScaleSliderValue(0);
              }}
              onMouseLeave={() => {
                if (isRandomScalingRef.current) {
                  isRandomScalingRef.current = false;
                  randomScaleSliderRef.current = 0;
                  setRandomScaleSliderValue(0);
                }
              }}
              onTouchStart={() => { isRandomScalingRef.current = true; }}
              onTouchEnd={() => {
                isRandomScalingRef.current = false;
                randomScaleSliderRef.current = 0;
                setRandomScaleSliderValue(0);
              }}
            />
            <span className="slider-label">+</span>
          </div>
        </div>

        
          </div>

          {/* LAYERS TAB */}
          <div className={`tab-pane ${rightTab === 'layers' ? 'active' : ''}`}>
            <h2>Layers</h2>
        
        <div className="control-group button-row">
          <button onClick={() => addCircleLayer()}>+ Circles</button>
          <button onClick={() => addPaintLayer()}>+ Paint</button>
        </div>
        
        <div className="layer-list">
          {[...layers].reverse().map((layer) => (
            <div 
              key={layer.id}
              className={`layer-item ${layer.id === activeLayerId ? 'active' : ''}`}
              onClick={() => setActiveLayerId(layer.id)}
            >
              <div className="layer-info">
                <span className="layer-type">{layer.type === 'circles' ? '●' : '◐'}</span>
                <span className="layer-name">{layer.name}</span>
              </div>
              <div className="layer-controls">
                <button 
                  className={`layer-btn ${layer.visible ? '' : 'off'}`}
                  onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }}
                  title="Toggle visibility"
                >
                  {layer.visible ? '👁' : '○'}
                </button>
                <button 
                  className={`layer-btn ${layer.locked ? 'on' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleLock(layer.id); }}
                  title="Toggle lock"
                >
                  {layer.locked ? '🔒' : '○'}
                </button>
                <button 
                  className="layer-btn"
                  onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'up'); }}
                  title="Move up"
                >
                  ↑
                </button>
                <button 
                  className="layer-btn"
                  onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'down'); }}
                  title="Move down"
                >
                  ↓
                </button>
                {layers.length > 1 && (
                  <button 
                    className="layer-btn danger"
                    onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                    title="Delete layer"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="layer-opacity" onClick={(e) => e.stopPropagation()}>
                <span className="opacity-label">α</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={layer.opacity}
                  onChange={(e) => updateLayer(layer.id, { opacity: Number(e.target.value) })}
                  title={`Opacity: ${Math.round(layer.opacity * 100)}%`}
                />
              </div>
            </div>
          ))}
        </div>
        
        {getActiveLayer()?.type === 'paint' && (
          <>
            <h3>Paint Settings</h3>
            <div className="control-group">
              <button
                onClick={() => setPaintMode(!paintMode)}
                className={paintMode ? "active" : ""}
              >
                Paint {paintMode ? "ON" : "OFF"}
              </button>
            </div>
            <div className="control-group">
              <label>Wetness: {brush.getSettings().wetness.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={brush.getSettings().wetness}
                onChange={(e) => brush.setSettings({ wetness: Number(e.target.value) })}
              />
            </div>
            <div className="control-group">
              <label>Flow: {brush.getSettings().flow.toFixed(2)}</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={brush.getSettings().flow}
                onChange={(e) => brush.setSettings({ flow: Number(e.target.value) })}
              />
            </div>
            <div className="control-group">
              <label>Bleed: {brush.getSettings().bleedStrength.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={brush.getSettings().bleedStrength}
                onChange={(e) => brush.setSettings({ bleedStrength: Number(e.target.value) })}
              />
            </div>
            <div className="control-group">
              <button onClick={() => clearPaintLayer(activeLayerId)}>Clear Paint</button>
            </div>
          </>
        )}
      
        </div>
      </div>
    </aside>
    </div>
  );
}

export default App;
