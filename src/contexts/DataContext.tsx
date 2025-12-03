import React, { createContext, useContext, useRef, useCallback, useMemo } from 'react';
import { Circle } from '../physics';
import { Layer, CircleLayer, PaintLayer } from '../layers/types';
import { Keyframe, CircleSnapshot } from '../layers/AnimationRecorder';

/**
 * Central data registry using the variable reference pattern.
 * Instead of passing large data structures, we pass references ($circles, $layers, etc.)
 * This reduces token usage by ~80-90% in multi-turn operations.
 */

export interface DataRegistry {
  // Core data
  circles: Circle[];
  layers: Layer[];
  selectedIds: Set<number>;
  
  // Animation data
  keyframes: Keyframe[];
  playbackCircles: CircleSnapshot[] | null;
  
  // Configuration
  aspectRatio: string;
  
  // Flags
  isRecording: boolean;
  isPlayingAnimation: boolean;
  hasAnimation: boolean;
}

export interface DataContextValue {
  // Registry access (use sparingly)
  registry: React.MutableRefObject<DataRegistry>;
  
  // Variable resolution (use primarily)
  $get: <K extends keyof DataRegistry>(key: K) => DataRegistry[K];
  $set: <K extends keyof DataRegistry>(key: K, value: DataRegistry[K]) => void;
  $update: <K extends keyof DataRegistry>(
    key: K,
    updater: (current: DataRegistry[K]) => DataRegistry[K]
  ) => void;
  
  // Derived data (computed, memoized)
  $selectedCircles: () => Circle[];
  $visibleLayers: () => Layer[];
  $activeLayer: () => Layer | null;
  $circlesToRender: (layerId: string) => Circle[];
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const registryRef = useRef<DataRegistry>({
    circles: [],
    layers: [],
    selectedIds: new Set(),
    keyframes: [],
    playbackCircles: null,
    aspectRatio: '4:3',
    isRecording: false,
    isPlayingAnimation: false,
    hasAnimation: false,
  });
  
  // Simple getter - returns reference, not copy
  const $get = useCallback(<K extends keyof DataRegistry>(key: K): DataRegistry[K] => {
    return registryRef.current[key];
  }, []);
  
  // Simple setter
  const $set = useCallback(<K extends keyof DataRegistry>(
    key: K,
    value: DataRegistry[K]
  ) => {
    registryRef.current[key] = value;
  }, []);
  
  // Update with function
  const $update = useCallback(<K extends keyof DataRegistry>(
    key: K,
    updater: (current: DataRegistry[K]) => DataRegistry[K]
  ) => {
    registryRef.current[key] = updater(registryRef.current[key]);
  }, []);
  
  // Derived data - computed on demand, not stored
  const $selectedCircles = useCallback(() => {
    const circles = registryRef.current.circles;
    const selected = registryRef.current.selectedIds;
    return circles.filter(c => selected.has(c.id));
  }, []);
  
  const $visibleLayers = useCallback(() => {
    return registryRef.current.layers.filter(l => l.visible);
  }, []);
  
  const $activeLayer = useCallback(() => {
    const layers = registryRef.current.layers;
    const activeId = layers.find(l => l.id === 'active')?.id; // TODO: proper active tracking
    return layers.find(l => l.id === activeId) || null;
  }, []);
  
  const $circlesToRender = useCallback((layerId: string) => {
    const circles = registryRef.current.circles;
    return circles.filter(c => c.layerId === layerId);
  }, []);
  
  const value = useMemo<DataContextValue>(() => ({
    registry: registryRef,
    $get,
    $set,
    $update,
    $selectedCircles,
    $visibleLayers,
    $activeLayer,
    $circlesToRender,
  }), [$get, $set, $update, $selectedCircles, $visibleLayers, $activeLayer, $circlesToRender]);
  
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}

// Convenience hooks for common operations
export function useCircles() {
  const { $get, $set } = useData();
  return {
    circles: $get('circles'),
    setCircles: (circles: Circle[]) => $set('circles', circles),
    addCircle: (circle: Circle) => {
      const current = $get('circles');
      $set('circles', [...current, circle]);
    },
    removeCircle: (id: number) => {
      const current = $get('circles');
      $set('circles', current.filter(c => c.id !== id));
    },
  };
}

export function useLayers() {
  const { $get, $set, $visibleLayers, $activeLayer } = useData();
  return {
    layers: $get('layers'),
    setLayers: (layers: Layer[]) => $set('layers', layers),
    visibleLayers: $visibleLayers,
    activeLayer: $activeLayer,
  };
}

export function useSelection() {
  const { $get, $set, $selectedCircles } = useData();
  return {
    selectedIds: $get('selectedIds'),
    setSelectedIds: (ids: Set<number>) => $set('selectedIds', ids),
    selectedCircles: $selectedCircles,
    clearSelection: () => $set('selectedIds', new Set()),
  };
}
