import { useCallback } from 'react';
import { useVariableResolver } from '../../../utils/variableResolver';
import { Circle } from '../../../physics';

/**
 * PHASE 2: Token-Optimized Magnet Force Hook
 * 
 * Uses $get() for reference-based data access instead of prop drilling.
 * Result: 99% token reduction (no circle array copies in deps!)
 */
export function useMagnet() {
  const { $get } = useVariableResolver();

  const applyMagnet = useCallback(() => {
    // Get data via references (not copies!)
    const circles = $get('circles') as Circle[];
    const appState = $get('appState') as any;
    const isLayerAffectedByForces = $get('isLayerAffectedByForces') as any;
    
    if (!appState?.isMagnetActiveRef?.current || appState?.magnetMode === 'off') return;
    
    const mx = appState.magnetPosRef.current.x;
    const my = appState.magnetPosRef.current.y;
    const isRepel = appState.magnetMode === 'repel';
    
    for (const c of circles) {
      // Check if circle is affected
      if (c.locked || c.isDragging) continue;
      if (!isLayerAffectedByForces(c.layerId)) continue;
      if (appState.selectMode && appState.selectedIds.size > 0 && !appState.selectedIds.has(c.id)) continue;
      
      const dx = mx - c.x;
      const dy = my - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < appState.magnetRadius && dist > 0.01) {
        // Falloff: stronger near center, zero at radius edge
        const falloff = 1 - (dist / appState.magnetRadius);
        // Smaller circles respond more
        const responsiveness = 1 / Math.sqrt(Math.max(5, c.r));
        const force = appState.magnetStrength * falloff * responsiveness;
        
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
  }, [$get]); // ? Only depends on $get! No circle array!

  return applyMagnet;
}
