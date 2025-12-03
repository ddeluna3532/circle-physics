import { useCallback } from 'react';
import { useVariableResolver } from '../../../utils/variableResolver';
import { Circle } from '../../../physics';

/**
 * PHASE 2: Token-Optimized N-Body Force Hook
 * 
 * Handles clump/spread forces between circles using $get() pattern.
 */
export function useNBody() {
  const { $get } = useVariableResolver();

  const applyNBodyForce = useCallback(() => {
    // Get data via references (not copies!)
    const circles = $get('circles') as Circle[];
    const appState = $get('appState') as any;
    const isLayerAffectedByForces = $get('isLayerAffectedByForces') as any;
    
    if (appState?.nBodyMode === 'off') return;
    
    const direction = appState.nBodyMode === 'clump' ? 1 : -1;
    const startTime = performance.now();
    const maxTime = 8; // Max 8ms for n-body calculations
    
    for (let i = 0; i < circles.length; i++) {
      // Check time budget periodically
      if (i % 50 === 0 && performance.now() - startTime > maxTime) break;
      
      const a = circles[i];
      
      // Check if a is affected
      const aAffected = !(a.locked || a.isDragging) && 
                       isLayerAffectedByForces(a.layerId) &&
                       !(appState.selectMode && appState.selectedIds.size > 0 && !appState.selectedIds.has(a.id));
      
      for (let j = i + 1; j < circles.length; j++) {
        const b = circles[j];
        
        // Check if b is affected
        const bAffected = !(b.locked || b.isDragging) && 
                         isLayerAffectedByForces(b.layerId) &&
                         !(appState.selectMode && appState.selectedIds.size > 0 && !appState.selectedIds.has(b.id));
        
        // Skip if both unaffected
        if (!aAffected && !bAffected) continue;
        
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 0.01) distance = 0.01;
        
        const touchDistance = a.r + b.r;
        
        // For clump: only attract if NOT touching (avoid sticking)
        // For spread: only repel if close enough
        if (appState.nBodyMode === 'clump' && distance < touchDistance * 1.2) continue;
        if (appState.nBodyMode === 'spread' && distance > touchDistance * 3) continue;
        
        // Force stronger for LARGER circles (they get pulled/pushed more)
        const baseForce = appState.nBodyStrength * 0.002 / Math.max(distance, 30);
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
  }, [$get]); // ? Only depends on $get!

  return applyNBodyForce;
}
