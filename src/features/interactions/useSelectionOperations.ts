/**
 * PHASE 4: Token-Optimized Selection Operations
 * 
 * Extracts selection manipulation functions from App.tsx.
 */

import { useCallback } from 'react';
import { useVariableResolver } from '../../utils/variableResolver';
import { Circle } from '../../physics';

export function useSelectionOperations() {
  const { $get } = useVariableResolver();

  // Move all selected circles by delta
  const moveSelection = useCallback((dx: number, dy: number) => {
    const circles = $get('circles') as Circle[];
    const selectedIds = $get('selectedIds') as Set<number>;
    const isCircleModifiable = $get('isCircleModifiable') as (c: Circle) => boolean;
    
    for (const c of circles) {
      if (selectedIds.has(c.id) && isCircleModifiable(c)) {
        c.x += dx;
        c.y += dy;
      }
    }
  }, [$get]);

  // Delete all selected circles
  const deleteSelection = useCallback(() => {
    const selectedIds = $get('selectedIds') as Set<number>;
    const removeCircle = $get('removeCircle') as (id: number) => void;
    const setSelectedIds = $get('setSelectedIds') as (ids: Set<number>) => void;
    
    const idsToDelete = Array.from(selectedIds);
    for (const id of idsToDelete) {
      removeCircle(id);
    }
    setSelectedIds(new Set());
  }, [$get]);

  // Recolor all selected circles
  const recolorSelection = useCallback(() => {
    const circles = $get('circles') as Circle[];
    const selectedIds = $get('selectedIds') as Set<number>;
    const isCircleModifiable = $get('isCircleModifiable') as (c: Circle) => boolean;
    const getRandomPaletteColor = $get('getRandomPaletteColor') as () => string;
    
    for (const c of circles) {
      if (selectedIds.has(c.id) && isCircleModifiable(c)) {
        c.color = getRandomPaletteColor();
      }
    }
  }, [$get]);

  // Clear selection
  const clearSelection = useCallback(() => {
    const setSelectedIds = $get('setSelectedIds') as (ids: Set<number>) => void;
    setSelectedIds(new Set());
  }, [$get]);

  // Invert selection
  const invertSelection = useCallback(() => {
    const circles = $get('circles') as Circle[];
    const layers = $get('layers') as any[];
    const selectedIds = $get('selectedIds') as Set<number>;
    const setSelectedIds = $get('setSelectedIds') as (ids: Set<number>) => void;
    
    const visibleCircleIds = circles
      .filter(c => {
        const layer = layers.find(l => l.id === c.layerId);
        return layer?.visible;
      })
      .map(c => c.id);
    
    const newSelection = new Set<number>();
    for (const id of visibleCircleIds) {
      if (!selectedIds.has(id)) {
        newSelection.add(id);
      }
    }
    setSelectedIds(newSelection);
  }, [$get]);

  // Lock inverse - lock all circles NOT selected
  const lockInverse = useCallback(() => {
    const circles = $get('circles') as Circle[];
    const layers = $get('layers') as any[];
    const selectedIds = $get('selectedIds') as Set<number>;
    
    let lockedCount = 0;
    for (const c of circles) {
      if (selectedIds.has(c.id)) continue;
      if (c.locked) continue;
      const layer = layers.find(l => l.id === c.layerId);
      if (!layer?.visible) continue;
      
      c.locked = true;
      lockedCount++;
    }
    console.log(`Locked ${lockedCount} circles (inverse of selection)`);
  }, [$get]);

  // Unlock all circles
  const unlockAll = useCallback(() => {
    const circles = $get('circles') as Circle[];
    
    let unlockedCount = 0;
    for (const c of circles) {
      if (c.locked) {
        c.locked = false;
        unlockedCount++;
      }
    }
    console.log(`Unlocked ${unlockedCount} circles`);
  }, [$get]);

  return {
    moveSelection,
    deleteSelection,
    recolorSelection,
    clearSelection,
    invertSelection,
    lockInverse,
    unlockAll,
  };
}
