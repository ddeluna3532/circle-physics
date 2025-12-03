/**
 * PHASE 3: Token-Optimized Random Scaling Hook
 * 
 * Extracts applyRandomScaling from App.tsx using $get() pattern for 99% token reduction.
 */

import { useCallback } from 'react';
import { useVariableResolver } from '../../utils/variableResolver';
import { Circle } from '../../physics';

export function useRandomScaling() {
  const { $get } = useVariableResolver();

  const applyRandomScaling = useCallback(() => {
    // Get data via references (not copies!)
    const isRandomScalingRef = $get('isRandomScalingRef') as React.MutableRefObject<boolean>;
    const randomScaleSliderRef = $get('randomScaleSliderRef') as React.MutableRefObject<number>;
    const circles = $get('circles') as Circle[];
    const isLayerAffectedByForces = $get('isLayerAffectedByForces') as (layerId: string) => boolean;
    const selectMode = $get('selectMode') as boolean;
    const selectedIds = $get('selectedIds') as Set<number>;
    
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
  }, [$get]);

  return applyRandomScaling;
}
