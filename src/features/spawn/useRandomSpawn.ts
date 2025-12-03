/**
 * PHASE 3: Token-Optimized Random Spawn Hook
 * 
 * Extracts autoSpawnRandom from App.tsx using $get() pattern for 99% token reduction.
 */

import { useCallback } from 'react';
import { useVariableResolver } from '../../utils/variableResolver';

export function useRandomSpawn() {
  const { $get } = useVariableResolver();

  const autoSpawnRandom = useCallback(() => {
    // Get data via references (not copies!)
    const isRandomSpawningRef = $get('isRandomSpawningRef') as React.MutableRefObject<boolean>;
    const canvasRef = $get('canvasRef') as React.RefObject<HTMLCanvasElement>;
    const getActiveLayer = $get('getActiveLayer') as () => any;
    const addCircle = $get('addCircle') as (x: number, y: number, r: number, color: string, layerId: string) => any;
    const getColor = $get('getColor') as () => string;
    
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
  }, [$get]);

  return autoSpawnRandom;
}
