import { useCallback } from 'react';
import { useVariableResolver } from '../../../utils/variableResolver';
import { Circle } from '../../../physics';

/**
 * PHASE 2: Token-Optimized Sticky Force Hook
 * 
 * Applies sticky/cohesion forces between touching circles using $get() pattern.
 */
export function useSticky() {
  const { $get } = useVariableResolver();

  const applyStickyForce = useCallback(() => {
    // Get data via references (not copies!)
    const circles = $get('circles') as Circle[];
    const appState = $get('appState') as any;
    const isLayerAffectedByForces = $get('isLayerAffectedByForces') as any;
    
    if (!appState?.stickyMode) return;
    
    const startTime = performance.now();
    const maxTime = 8; // Max 8ms for sticky calculations
    
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
        
        if (!aAffected && !bAffected) continue; // Fixed: was 'return'
        
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
          const dampingFactor = appState.stickyStrength;
          
          if (aAffected) {
            a.vx += relVx * dampingFactor;
            a.vy += relVy * dampingFactor;
          }
          if (bAffected) {
            b.vx -= relVx * dampingFactor;
            b.vy -= relVy * dampingFactor;
          }
          
          // Also dampen absolute velocity to stop sliding
          const absoluteDamping = 1 - appState.stickyStrength * 0.5;
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
  }, [$get]); // ? Only depends on $get!

  return applyStickyForce;
}
