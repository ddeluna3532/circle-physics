/**
 * PHASE 4: Token-Optimized Pointer Event Handlers
 * 
 * Extracts all pointer event handling from App.tsx using $get() pattern.
 * This is the BIGGEST token savings - event handlers have 30-40 dependencies each!
 */

import { useCallback } from 'react';
import { useVariableResolver } from '../../utils/variableResolver';
import { Circle } from '../../physics';
import { PaintLayer } from '../../layers';

export function usePointerHandlers() {
  const { $get } = useVariableResolver();

  const handlePointerDown = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Check if variables are registered first
    const isRegistered = $get('isRegistered') as boolean | undefined;
    if (!isRegistered) {
      console.warn('?? Pointer down before variables registered - ignoring');
      return;
    }
    
    // Get all state via $get() - no dependencies!
    const eraseMode = $get('eraseMode') as boolean;
    const lockMode = $get('lockMode') as boolean;
    const recolorMode = $get('recolorMode') as boolean;
    const paintMode = $get('paintMode') as boolean;
    const selectMode = $get('selectMode') as boolean;
    const magnetMode = $get('magnetMode') as 'off' | 'attract' | 'repel';
    const flowMode = $get('flowMode') as 'off' | 'draw' | 'erase';
    
    const getCanvasCoords = $get('getCanvasCoords') as (e: any) => { x: number; y: number };
    const getTouchDistance = $get('getTouchDistance') as (e: any) => number;
    const getCircleAt = $get('getCircleAt') as (x: number, y: number) => Circle | null;
    const isCircleModifiable = $get('isCircleModifiable') as (c: Circle) => boolean;
    const isClickOnSelection = $get('isClickOnSelection') as (x: number, y: number) => boolean;
    const removeCircle = $get('removeCircle') as (id: number) => void;
    const getRandomPaletteColor = $get('getRandomPaletteColor') as () => string;
    const getActiveLayer = $get('getActiveLayer') as () => any;
    const addCircle = $get('addCircle') as (x: number, y: number, r: number, color: string, layerId: string) => any;
    const getColor = $get('getColor') as () => string;
    const system = $get('system') as any;
    const brush = $get('brush') as any;
    const brushSize = $get('brushSize') as number;
    const setSelectedIds = $get('setSelectedIds') as (fn: (prev: Set<number>) => Set<number>) => void;
    const setDragging = $get('setDragging') as (c: Circle | null) => void;
    
    // Refs
    const draggingRef = $get('draggingRef') as React.MutableRefObject<Circle | null>;
    const isPaintingRef = $get('isPaintingRef') as React.MutableRefObject<boolean>;
    const isErasingRef = $get('isErasingRef') as React.MutableRefObject<boolean>;
    const erasedThisStroke = $get('erasedThisStroke') as React.MutableRefObject<Set<number>>;
    const isLockingRef = $get('isLockingRef') as React.MutableRefObject<boolean>;
    const lockedThisStroke = $get('lockedThisStroke') as React.MutableRefObject<Set<number>>;
    const isRecoloringRef = $get('isRecoloringRef') as React.MutableRefObject<boolean>;
    const recoloredThisStroke = $get('recoloredThisStroke') as React.MutableRefObject<Set<number>>;
    const isMagnetActiveRef = $get('isMagnetActiveRef') as React.MutableRefObject<boolean>;
    const magnetPosRef = $get('magnetPosRef') as React.MutableRefObject<{ x: number; y: number }>;
    const isFlowDrawingRef = $get('isFlowDrawingRef') as React.MutableRefObject<boolean>;
    const flowStartRef = $get('flowStartRef') as React.MutableRefObject<{ x: number; y: number }>;
    const lastFlowPosRef = $get('lastFlowPosRef') as React.MutableRefObject<{ x: number; y: number }>;
    const pinchRef = $get('pinchRef') as React.MutableRefObject<{ circle: Circle | null; initialDistance: number; initialRadius: number }>;
    const mouseRef = $get('mouseRef') as React.MutableRefObject<{ x: number; y: number; prevX: number; prevY: number }>;
    const isSelectingRef = $get('isSelectingRef') as React.MutableRefObject<boolean>;
    const selectionStartRef = $get('selectionStartRef') as React.MutableRefObject<{ x: number; y: number }>;
    const selectionRectRef = $get('selectionRectRef') as React.MutableRefObject<{ x: number; y: number; w: number; h: number } | null>;
    const isDraggingSelectionRef = $get('isDraggingSelectionRef') as React.MutableRefObject<boolean>;
    const selectionDragStartRef = $get('selectionDragStartRef') as React.MutableRefObject<{ x: number; y: number }>;
    const isPaintSelectingRef = $get('isPaintSelectingRef') as React.MutableRefObject<boolean>;
    const paintSelectedThisStroke = $get('paintSelectedThisStroke') as React.MutableRefObject<Set<number>>;
    const isPaintingLayerRef = $get('isPaintingLayerRef') as React.MutableRefObject<boolean>;
    const lastPaintPosRef = $get('lastPaintPosRef') as React.MutableRefObject<{ x: number; y: number }>;

    // Prevent scrolling on touch
    if ('touches' in e) {
      e.preventDefault();
      
      // Check for second finger added (start pinch-to-scale)
      if (e.touches.length === 2 && draggingRef.current) {
        pinchRef.current = {
          circle: draggingRef.current,
          initialDistance: getTouchDistance(e),
          initialRadius: draggingRef.current.r,
        };
        draggingRef.current.isDragging = false;
        draggingRef.current = null;
        setDragging(null);
        isPaintingRef.current = false;
        if (pinchRef.current.circle) {
          console.log("pinch started on circle, initial radius:", pinchRef.current.circle.r);
        }
        return;
      }
      
      if (pinchRef.current.circle) {
        return;
      }
    }
    
    const { x, y } = getCanvasCoords(e);
    console.log("pointerDown at", x, y);
    
    mouseRef.current = { x, y, prevX: x, prevY: y };

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
      if (isClickOnSelection(x, y)) {
        isDraggingSelectionRef.current = true;
        selectionDragStartRef.current = { x, y };
        console.log("started dragging selection");
        return;
      }
      
      if (hit) {
        isPaintSelectingRef.current = true;
        paintSelectedThisStroke.current = new Set();
        
        if ((e as React.MouseEvent).shiftKey) {
          setSelectedIds(prev => {
            const next = new Set(prev);
            next.add(hit.id);
            paintSelectedThisStroke.current.add(hit.id);
            return next;
          });
        } else {
          setSelectedIds(() => new Set([hit.id]));
          paintSelectedThisStroke.current.add(hit.id);
        }
        console.log("started paint selection with circle", hit.id);
        return;
      }
      
      isSelectingRef.current = true;
      selectionStartRef.current = { x, y };
      selectionRectRef.current = { x, y, w: 0, h: 0 };
      if (!(e as React.MouseEvent).shiftKey) {
        setSelectedIds(() => new Set());
      }
      console.log("started marquee selection at", x, y);
      return;
    }
    
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
        isPaintingRef.current = true;
        const added = addCircle(x, y, brushSize, getColor(), activeLayer.id);
        console.log("started painting, first circle added:", added);
      }
    }
  }, [$get]);

  const handlePointerMove = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Check if variables are registered first
    const isRegistered = $get('isRegistered') as boolean | undefined;
    if (!isRegistered) return; // Silent return for move events
    
    // Get all state via $get()
    const flowMode = $get('flowMode') as 'off' | 'draw' | 'erase';
    const getCanvasCoords = $get('getCanvasCoords') as (e: any) => { x: number; y: number };
    const getTouchDistance = $get('getTouchDistance') as (e: any) => number;
    const getCircleAt = $get('getCircleAt') as (x: number, y: number) => Circle | null;
    const isCircleModifiable = $get('isCircleModifiable') as (c: Circle) => boolean;
    const removeCircle = $get('removeCircle') as (id: number) => void;
    const getRandomPaletteColor = $get('getRandomPaletteColor') as () => string;
    const getActiveLayer = $get('getActiveLayer') as () => any;
    const addCircle = $get('addCircle') as (x: number, y: number, r: number, color: string, layerId: string) => any;
    const getColor = $get('getColor') as () => string;
    const system = $get('system') as any;
    const brush = $get('brush') as any;
    const brushSize = $get('brushSize') as number;
    const moveSelection = $get('moveSelection') as (dx: number, dy: number) => void;
    const setSelectedIds = $get('setSelectedIds') as (fn: (prev: Set<number>) => Set<number>) => void;
    const interpolateStroke = $get('interpolateStroke') as any;
    
    // Refs
    const draggingRef = $get('draggingRef') as React.MutableRefObject<Circle | null>;
    const isPaintingRef = $get('isPaintingRef') as React.MutableRefObject<boolean>;
    const isErasingRef = $get('isErasingRef') as React.MutableRefObject<boolean>;
    const erasedThisStroke = $get('erasedThisStroke') as React.MutableRefObject<Set<number>>;
    const isLockingRef = $get('isLockingRef') as React.MutableRefObject<boolean>;
    const lockedThisStroke = $get('lockedThisStroke') as React.MutableRefObject<Set<number>>;
    const isRecoloringRef = $get('isRecoloringRef') as React.MutableRefObject<boolean>;
    const recoloredThisStroke = $get('recoloredThisStroke') as React.MutableRefObject<Set<number>>;
    const isMagnetActiveRef = $get('isMagnetActiveRef') as React.MutableRefObject<boolean>;
    const magnetPosRef = $get('magnetPosRef') as React.MutableRefObject<{ x: number; y: number }>;
    const isFlowDrawingRef = $get('isFlowDrawingRef') as React.MutableRefObject<boolean>;
    const lastFlowPosRef = $get('lastFlowPosRef') as React.MutableRefObject<{ x: number; y: number }>;
    const pinchRef = $get('pinchRef') as React.MutableRefObject<{ circle: Circle | null; initialDistance: number; initialRadius: number }>;
    const mouseRef = $get('mouseRef') as React.MutableRefObject<{ x: number; y: number; prevX: number; prevY: number }>;
    const isSelectingRef = $get('isSelectingRef') as React.MutableRefObject<boolean>;
    const selectionStartRef = $get('selectionStartRef') as React.MutableRefObject<{ x: number; y: number }>;
    const selectionRectRef = $get('selectionRectRef') as React.MutableRefObject<{ x: number; y: number; w: number; h: number } | null>;
    const isDraggingSelectionRef = $get('isDraggingSelectionRef') as React.MutableRefObject<boolean>;
    const selectionDragStartRef = $get('selectionDragStartRef') as React.MutableRefObject<{ x: number; y: number }>;
    const isPaintSelectingRef = $get('isPaintSelectingRef') as React.MutableRefObject<boolean>;
    const paintSelectedThisStroke = $get('paintSelectedThisStroke') as React.MutableRefObject<Set<number>>;
    const isPaintingLayerRef = $get('isPaintingLayerRef') as React.MutableRefObject<boolean>;
    const lastPaintPosRef = $get('lastPaintPosRef') as React.MutableRefObject<{ x: number; y: number }>;

    // Prevent scrolling on touch
    if ('touches' in e) {
      e.preventDefault();
      
      // Handle pinch gesture
      if (e.touches.length === 2 && pinchRef.current.circle) {
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
    
    // Erase mode
    if (isErasingRef.current) {
      const hit = getCircleAt(x, y);
      if (hit && !erasedThisStroke.current.has(hit.id)) {
        removeCircle(hit.id);
        erasedThisStroke.current.add(hit.id);
        console.log("erased circle while dragging");
      }
      return;
    }
    
    // Lock mode
    if (isLockingRef.current) {
      const hit = getCircleAt(x, y);
      if (hit && !lockedThisStroke.current.has(hit.id)) {
        hit.locked = !hit.locked;
        lockedThisStroke.current.add(hit.id);
        console.log("toggled lock while dragging:", hit.locked);
      }
      return;
    }
    
    // Recolor mode
    if (isRecoloringRef.current) {
      const hit = getCircleAt(x, y);
      if (hit && isCircleModifiable(hit) && !recoloredThisStroke.current.has(hit.id)) {
        hit.color = getRandomPaletteColor();
        recoloredThisStroke.current.add(hit.id);
        console.log("recolored circle while dragging");
      }
      return;
    }
    
    // Flow field drawing
    if (isFlowDrawingRef.current) {
      const dx = x - lastFlowPosRef.current.x;
      const dy = y - lastFlowPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 30) {
        const angle = Math.atan2(dy, dx);
        system.addFlowVector(lastFlowPosRef.current.x, lastFlowPosRef.current.y, angle);
        lastFlowPosRef.current = { x, y };
      }
      return;
    }
    
    // Flow field erase
    if (flowMode === 'erase') {
      system.removeFlowVectorAt(x, y);
      return;
    }
    
    // Magnet mode
    if (isMagnetActiveRef.current) {
      magnetPosRef.current = { x, y };
      return;
    }
    
    // Selection mode - update marquee
    if (isSelectingRef.current) {
      selectionRectRef.current = {
        x: selectionStartRef.current.x,
        y: selectionStartRef.current.y,
        w: x - selectionStartRef.current.x,
        h: y - selectionStartRef.current.y,
      };
      return;
    }
    
    // Paint selection mode
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
      const dx = x - selectionDragStartRef.current.x;
      const dy = y - selectionDragStartRef.current.y;
      moveSelection(dx, dy);
      selectionDragStartRef.current = { x, y };
      return;
    }
    
    // Paint layer mode
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
    
    // Calculate velocity
    const vx = (x - mouseRef.current.x) * 0.5;
    const vy = (y - mouseRef.current.y) * 0.5;
    
    mouseRef.current.prevX = mouseRef.current.x;
    mouseRef.current.prevY = mouseRef.current.y;
    mouseRef.current.x = x;
    mouseRef.current.y = y;

    if (draggingRef.current) {
      draggingRef.current.x = x;
      draggingRef.current.y = y;
      draggingRef.current.vx = vx;
      draggingRef.current.vy = vy;
    } else if (isPaintingRef.current) {
      const activeLayer = getActiveLayer();
      if (activeLayer?.type === 'circles') {
        const added = addCircle(x, y, brushSize, getColor(), activeLayer.id);
        if (added) console.log("painted circle at", x, y);
      }
    }
  }, [$get]);

  const handlePointerUp = useCallback((e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Check if variables are registered first
    const isRegistered = $get('isRegistered') as boolean | undefined;
    if (!isRegistered) return; // Silent return for up events
    
    // Get all state via $get()
    const getCirclesInRect = $get('getCirclesInRect') as (x: number, y: number, w: number, h: number) => Circle[];
    const setSelectedIds = $get('setSelectedIds') as any;
    const setDragging = $get('setDragging') as (c: Circle | null) => void;
    const saveUndoState = $get('saveUndoState') as (force: boolean) => void;
    
    // Refs
    const draggingRef = $get('draggingRef') as React.MutableRefObject<Circle | null>;
    const isPaintingRef = $get('isPaintingRef') as React.MutableRefObject<boolean>;
    const isErasingRef = $get('isErasingRef') as React.MutableRefObject<boolean>;
    const isLockingRef = $get('isLockingRef') as React.MutableRefObject<boolean>;
    const isRecoloringRef = $get('isRecoloringRef') as React.MutableRefObject<boolean>;
    const isMagnetActiveRef = $get('isMagnetActiveRef') as React.MutableRefObject<boolean>;
    const isFlowDrawingRef = $get('isFlowDrawingRef') as React.MutableRefObject<boolean>;
    const pinchRef = $get('pinchRef') as React.MutableRefObject<{ circle: Circle | null; initialDistance: number; initialRadius: number }>;
    const isSelectingRef = $get('isSelectingRef') as React.MutableRefObject<boolean>;
    const selectionRectRef = $get('selectionRectRef') as React.MutableRefObject<{ x: number; y: number; w: number; h: number } | null>;
    const isDraggingSelectionRef = $get('isDraggingSelectionRef') as React.MutableRefObject<boolean>;
    const isPaintSelectingRef = $get('isPaintSelectingRef') as React.MutableRefObject<boolean>;
    const paintSelectedThisStroke = $get('paintSelectedThisStroke') as React.MutableRefObject<Set<number>>;
    const isPaintingLayerRef = $get('isPaintingLayerRef') as React.MutableRefObject<boolean>;

    let madeChanges = false;
    
    if (pinchRef.current.circle) {
      console.log("pinch ended, final radius:", pinchRef.current.circle.r);
      pinchRef.current = { circle: null, initialDistance: 0, initialRadius: 0 };
      madeChanges = true;
    }
    
    if (isErasingRef.current) {
      madeChanges = true;
    }
    isErasingRef.current = false;
    
    isLockingRef.current = false;
    
    if (isRecoloringRef.current) {
      madeChanges = true;
    }
    isRecoloringRef.current = false;
    
    isMagnetActiveRef.current = false;
    isPaintingLayerRef.current = false;
    
    if (isFlowDrawingRef.current) {
      isFlowDrawingRef.current = false;
    }
    
    if (isSelectingRef.current && selectionRectRef.current) {
      const r = selectionRectRef.current;
      const circlesInRect = getCirclesInRect(r.x, r.y, r.w, r.h);
      
      if ((e as React.MouseEvent)?.shiftKey) {
        setSelectedIds((prev: Set<number>) => {
          const next = new Set(prev);
          for (const c of circlesInRect) {
            next.add(c.id);
          }
          return next;
        });
      } else {
        setSelectedIds(new Set(circlesInRect.map((c: Circle) => c.id)));
      }
      
      console.log("selected", circlesInRect.length, "circles");
      selectionRectRef.current = null;
      isSelectingRef.current = false;
    }
    
    if (isDraggingSelectionRef.current) {
      madeChanges = true;
    }
    isDraggingSelectionRef.current = false;
    
    if (isPaintSelectingRef.current) {
      console.log("paint selected", paintSelectedThisStroke.current.size, "circles");
    }
    isPaintSelectingRef.current = false;
    paintSelectedThisStroke.current.clear();
    
    console.log("pointerUp, wasDragging:", !!draggingRef.current, "wasPainting:", isPaintingRef.current);
    
    if (draggingRef.current) {
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
    
    if (madeChanges) {
      saveUndoState(true);
    }
  }, [$get]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
