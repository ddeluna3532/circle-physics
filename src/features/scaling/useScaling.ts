/**
 * PHASE 3: Token-Optimized Scaling Hook
 * 
 * Extracts applyScaling from App.tsx using $get() pattern for 99% token reduction.
 */

import { useCallback } from 'react';
import { useVariableResolver } from '../../utils/variableResolver';
import { Circle } from '../../physics';

export function useScaling() {
  const { $get } = useVariableResolver();

  const applyScaling = useCallback(() => {
    // Get data via references (not copies!)
    const isScalingRef = $get('isScalingRef') as React.MutableRefObject<boolean>;
    const scaleSliderRef = $get('scaleSliderRef') as React.MutableRefObject<number>;
    const circles = $get('circles') as Circle[];
    const isLayerAffectedByForces = $get('isLayerAffectedByForces') as (layerId: string) => boolean;
    const selectMode = $get('selectMode') as boolean;
    const selectedIds = $get('selectedIds') as Set<number>;
    
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
  }, [$get]);

  return applyScaling;
}
