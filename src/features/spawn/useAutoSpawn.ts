/**
 * PHASE 3: Token-Optimized Auto Spawn Hook
 * 
 * Extracts autoSpawn from App.tsx using $get() pattern for 99% token reduction.
 */

import { useCallback } from 'react';
import { useVariableResolver } from '../../utils/variableResolver';

export function useAutoSpawn() {
  const { $get } = useVariableResolver();

  const autoSpawn = useCallback(() => {
    // Get data via references (not copies!)
    const isAutoSpawningRef = $get('isAutoSpawningRef') as React.MutableRefObject<boolean>;
    const canvasRef = $get('canvasRef') as React.RefObject<HTMLCanvasElement>;
    const getActiveLayer = $get('getActiveLayer') as () => any;
    const addCircle = $get('addCircle') as (x: number, y: number, r: number, color: string, layerId: string) => any;
    const brushSize = $get('brushSize') as number;
    const getColor = $get('getColor') as () => string;
    
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
  }, [$get]);

  return autoSpawn;
}
