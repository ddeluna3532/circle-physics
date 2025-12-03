/**
 * PHASE 4: Canvas Helper Functions
 * 
 * Extracts canvas coordinate and geometry helper functions from App.tsx.
 * FIXED: These now use proper React dependencies instead of variable resolver.
 */

import { useCallback } from 'react';
import { useVariableResolver } from '../../utils/variableResolver';
import { Circle } from '../../physics';

export function useCanvasHelpers() {
  const { $get } = useVariableResolver();

  // Get canvas-relative coordinates from mouse or touch event
  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvasRef = $get('canvasRef') as React.RefObject<HTMLCanvasElement>;
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
  }, [$get]);

  // Get distance between two touch points
  const getTouchDistance = useCallback((e: React.TouchEvent<HTMLCanvasElement>): number => {
    if (e.touches.length < 2) return 0;
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Check if a circle can be modified (not locked, layer not locked, and respects selection)
  // This must be called fresh each time from pointer handlers via $get
  const isCircleModifiable = useCallback((c: Circle): boolean => {
    const layers = $get('layers') as any[];
    const selectMode = $get('selectMode') as boolean;
    const selectedIds = $get('selectedIds') as Set<number>;
    
    if (c.locked) return false;
    const layer = layers.find(l => l.id === c.layerId);
    if (layer?.locked) return false;
    if (selectMode && selectedIds.size > 0 && !selectedIds.has(c.id)) return false;
    return true;
  }, [$get]);

  // Check if a point is inside a circle (pure function)
  const isPointInCircle = useCallback((px: number, py: number, c: Circle): boolean => {
    const dx = px - c.x;
    const dy = py - c.y;
    return dx * dx + dy * dy <= c.r * c.r;
  }, []);

  // Check if a circle intersects a rectangle (pure function)
  const isCircleInRect = useCallback((c: Circle, rx: number, ry: number, rw: number, rh: number): boolean => {
    // Normalize rect (handle negative width/height)
    const left = rw < 0 ? rx + rw : rx;
    const top = rh < 0 ? ry + rh : ry;
    const right = rw < 0 ? rx : rx + rw;
    const bottom = rh < 0 ? ry : ry + rh;
    
    return c.x >= left - c.r && c.x <= right + c.r && 
           c.y >= top - c.r && c.y <= bottom + c.r;
  }, []);

  // Get all circles in selection rectangle
  // This must be called fresh each time from pointer handlers via $get
  const getCirclesInRect = useCallback((rx: number, ry: number, rw: number, rh: number): Circle[] => {
    const circles = $get('circles') as Circle[];
    const layers = $get('layers') as any[];
    
    return circles.filter(c => {
      const layer = layers.find(l => l.id === c.layerId);
      // Normalize rect (handle negative width/height)
      const left = rw < 0 ? rx + rw : rx;
      const top = rh < 0 ? ry + rh : ry;
      const right = rw < 0 ? rx : rx + rw;
      const bottom = rh < 0 ? ry : ry + rh;
      
      return layer?.visible && 
             c.x >= left - c.r && c.x <= right + c.r && 
             c.y >= top - c.r && c.y <= bottom + c.r;
    });
  }, [$get]);

  // Check if click is on any selected circle
  // This must be called fresh each time from pointer handlers via $get
  const isClickOnSelection = useCallback((x: number, y: number): boolean => {
    const circles = $get('circles') as Circle[];
    const selectedIds = $get('selectedIds') as Set<number>;
    
    for (const c of circles) {
      if (selectedIds.has(c.id)) {
        const dx = x - c.x;
        const dy = y - c.y;
        if (dx * dx + dy * dy <= c.r * c.r) {
          return true;
        }
      }
    }
    return false;
  }, [$get]);

  return {
    getCanvasCoords,
    getTouchDistance,
    isCircleModifiable,
    isPointInCircle,
    isCircleInRect,
    getCirclesInRect,
    isClickOnSelection,
  };
}
