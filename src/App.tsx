import { useRef, useEffect, useState, useCallback } from "react";
import { usePhysics, useLayers } from "./hooks";
import { Circle } from "./physics";
import { PaintLayer } from "./layers";
import { interpolateStroke } from "./layers/WatercolorBrush";
import { exportSingleSVG, exportStencils } from "./layers/SVGExporter";
import { saveProject, loadProject, restoreCircles, ProjectData } from "./layers/ProjectManager";
import "./styles.css";

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
  
  // Color palette state
  const [palette, setPalette] = useState([
    { h: 200, s: 70, l: 60 },
    { h: 350, s: 70, l: 60 },
    { h: 120, s: 70, l: 50 },
    { h: 45, s: 80, l: 55 },
    { h: 280, s: 60, l: 60 },
  ]);
  const [selectedSwatch, setSelectedSwatch] = useState(0);
  
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

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.fillStyle = "#ebe0cc";
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
        // Render circles on this layer
        for (const c of circles) {
          if (c.layerId !== layer.id) continue;
          
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          
          // Darken and desaturate locked circles
          if (c.locked || layer.locked) {
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
  }, [circles, config, magnetMode, magnetRadius, flowVisible, system.flowVectors, layers, getActiveLayer, brush, selectedIds]);

  // Apply magnet force to circles
  // Check if a circle should be affected by forces (not locked, layer not locked)
  const isCircleAffected = useCallback((c: Circle): boolean => {
    if (c.locked || c.isDragging) return false;
    return isLayerAffectedByForces(c.layerId);
  }, [isLayerAffectedByForces]);

  // Check if a circle can be modified at all (dragged, recolored, etc)
  const isCircleModifiable = useCallback((c: Circle): boolean => {
    if (c.locked) return false;
    const layer = layers.find(l => l.id === c.layerId);
    return layer ? !layer.locked : true;
  }, [layers]);

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

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

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
    
    for (let i = 0; i < circles.length; i++) {
      const a = circles[i];
      const aAffected = isCircleAffected(a);
      for (let j = i + 1; j < circles.length; j++) {
        const b = circles[j];
        const bAffected = isCircleAffected(b);
        
        // Skip if both unaffected
        if (!aAffected && !bAffected) continue;
        
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
    
    for (let i = 0; i < circles.length; i++) {
      const a = circles[i];
      const aAffected = isCircleAffected(a);
      for (let j = i + 1; j < circles.length; j++) {
        const b = circles[j];
        const bAffected = isCircleAffected(b);
        
        if (!aAffected && !bAffected) continue;
        
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

  // Apply continuous scaling to all circles
  const applyScaling = useCallback(() => {
    if (!isScalingRef.current || scaleSliderRef.current === 0) return;
    
    const scaleFactor = 1 + scaleSliderRef.current * 0.02; // 0.98 to 1.02 per frame
    
    for (const c of circles) {
      if (c.locked || !isLayerAffectedByForces(c.layerId)) continue;
      const newRadius = c.r * scaleFactor;
      // Clamp between 5 and 200
      c.r = Math.max(5, Math.min(200, newRadius));
      c.mass = c.r * c.r;
    }
  }, [circles, isLayerAffectedByForces]);

  // Apply random scaling to all circles
  const applyRandomScaling = useCallback(() => {
    if (!isRandomScalingRef.current || randomScaleSliderRef.current === 0) return;
    
    const intensity = Math.abs(randomScaleSliderRef.current);
    
    for (const c of circles) {
      if (c.locked || !isLayerAffectedByForces(c.layerId)) continue;
      // Random scale factor for each circle - can grow OR shrink regardless of direction
      // Direction just biases toward growing or shrinking
      const bias = randomScaleSliderRef.current > 0 ? 0.6 : -0.6;
      const randomValue = (Math.random() - 0.5 + bias) * intensity * 0.08;
      const scaleFactor = 1 + randomValue;
      const newRadius = c.r * scaleFactor;
      // Clamp between 5 and 200
      c.r = Math.max(5, Math.min(200, newRadius));
      c.mass = c.r * c.r;
    }
  }, [circles, isLayerAffectedByForces]);

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

  // Set up physics system to respect layer locks
  useEffect(() => {
    system.setAffectedCheck((c: Circle) => {
      if (c.locked || c.isDragging) return false;
      return isLayerAffectedByForces(c.layerId);
    });
  }, [system, isLayerAffectedByForces]);

  // Animation loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const _delta = time - lastTime;
      lastTime = time;

      applyMagnet();
      applyNBodyForce();
      applyStickyForce();
      applyScaling();
      applyRandomScaling();
      autoSpawn();
      autoSpawnRandom();
      system.applyFlowField();
      system.update();
      render();

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [system, render, applyMagnet, applyNBodyForce, applyStickyForce, applyScaling, applyRandomScaling, autoSpawn, autoSpawnRandom]);

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

  // Keyboard shortcuts for selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key - delete selected circles
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        e.preventDefault();
        deleteSelection();
      }
      // Escape - clear selection or exit select mode
      if (e.key === 'Escape') {
        if (selectedIds.size > 0) {
          clearSelection();
        } else if (selectMode) {
          setSelectMode(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, deleteSelection, clearSelection, selectMode]);

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
        console.log("pinch started on circle, initial radius:", pinchRef.current.circle.r);
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
      
      // Check if clicking on an unselected circle (select just that one)
      if (hit) {
        // Shift+click to add to selection, otherwise replace selection
        if ((e as React.MouseEvent).shiftKey) {
          setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(hit.id)) {
              next.delete(hit.id);
            } else {
              next.add(hit.id);
            }
            return next;
          });
        } else {
          setSelectedIds(new Set([hit.id]));
        }
        console.log("selected circle", hit.id);
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
    // Clear pinch state
    if (pinchRef.current.circle) {
      console.log("pinch ended, final radius:", pinchRef.current.circle.r);
      pinchRef.current = { circle: null, initialDistance: 0, initialRadius: 0 };
    }
    
    // Clear erase state
    isErasingRef.current = false;
    
    // Clear lock state
    isLockingRef.current = false;
    
    // Clear recolor state
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
    isDraggingSelectionRef.current = false;
    
    console.log("pointerUp, wasDragging:", !!draggingRef.current, "wasPainting:", isPaintingRef.current);
    
    if (draggingRef.current) {
      // Release with momentum (velocity already set in handlePointerMove)
      console.log("releasing with velocity:", draggingRef.current.vx, draggingRef.current.vy);
      draggingRef.current.isDragging = false;
      draggingRef.current = null;
      setDragging(null);
    }
    isPaintingRef.current = false;
  };

  return (
    <div className="app">
      {/* Left Panel */}
      <aside className="panel left-panel">
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
              exportSingleSVG(system.circles, canvas.width, canvas.height, layers, {
                backgroundColor: '#ebe0cc',
              });
            }}
            title="Export all visible circles as a single SVG file"
          >
            SVG
          </button>
          <button 
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              exportStencils(system.circles, canvas.width, canvas.height, layers, {
                backgroundColor: '#ebe0cc',
                stencilMargin: 10,
              });
            }}
            title="Export as stencil layers (non-overlapping circles separated for cutting)"
          >
            Stencils
          </button>
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
              
              console.log(`Loaded project: ${data.name} (saved ${new Date(data.savedAt).toLocaleString()})`);
            }}
            title="Load project from JSON file"
          >
            Load
          </button>
        </div>

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

        <h2>Tools</h2>

        <div className="control-group">
          <button onClick={() => { clear(); clearSelection(); }}>Clear All</button>
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

        <div className="control-group">
          <button
            onClick={() => {
              setLockMode(!lockMode);
              if (!lockMode) { setEraseMode(false); setRecolorMode(false); setMagnetMode('off'); setFlowMode('off'); setSelectMode(false); clearSelection(); }
            }}
            className={lockMode ? "active warning" : ""}
          >
            Lock {lockMode ? "ON" : "OFF"}
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
              <button onClick={clearSelection} title="Clear selection">
                Deselect
              </button>
            </div>
          </div>
        )}

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
      </aside>

      {/* Canvas Area */}
      <main className="canvas-container">
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
            min="0.05"
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
      </aside>
    </div>
  );
}

export default App;
