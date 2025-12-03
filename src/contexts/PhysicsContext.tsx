import React, { createContext, useContext, useRef, useCallback, useMemo } from 'react';
import { PhysicsSystem, PhysicsConfig } from '../physics';

/**
 * Physics Context - Manages physics simulation state
 * Uses variable references to minimize token usage
 */

export interface PhysicsState {
  system: PhysicsSystem;
  config: PhysicsConfig;
  isPaused: boolean;
  
  // Force configurations
  magnetMode: 'off' | 'attract' | 'repel';
  magnetStrength: number;
  magnetRadius: number;
  magnetPos: { x: number; y: number };
  isMagnetActive: boolean;
  
  nBodyMode: 'off' | 'clump' | 'spread';
  nBodyStrength: number;
  
  stickyMode: boolean;
  stickyStrength: number;
  
  // Flow field
  flowMode: 'off' | 'draw' | 'erase';
  flowStrength: number;
  flowRadius: number;
  flowVisible: boolean;
  
  // Collision settings
  collisionIterations: number;
  restitution: number;
  
  // Scaling
  scaleValue: number;
  isScaling: boolean;
  randomScaleValue: number;
  isRandomScaling: boolean;
}

export interface PhysicsContextValue {
  // State access (by reference)
  stateRef: React.MutableRefObject<PhysicsState>;
  
  // Variable-style getters ($ prefix for convention)
  $getSystem: () => PhysicsSystem;
  $getConfig: () => PhysicsConfig;
  $getMagnetConfig: () => { mode: string; strength: number; radius: number; pos: { x: number; y: number } };
  $getNBodyConfig: () => { mode: string; strength: number };
  $getStickyConfig: () => { mode: boolean; strength: number };
  
  // Setters (minimal re-renders)
  setMagnetMode: (mode: 'off' | 'attract' | 'repel') => void;
  setMagnetPos: (x: number, y: number) => void;
  setMagnetActive: (active: boolean) => void;
  setNBodyMode: (mode: 'off' | 'clump' | 'spread') => void;
  setStickyMode: (enabled: boolean) => void;
  togglePause: () => void;
}

const PhysicsContext = createContext<PhysicsContextValue | null>(null);

export function PhysicsProvider({ children }: { children: React.ReactNode }) {
  const stateRef = useRef<PhysicsState>({
    system: new PhysicsSystem(),
    config: {
      gravityEnabled: false,
      gravityStrength: 0.5,
      wallsEnabled: true,
      floorEnabled: false,
      floorY: 0,
      damping: 0.99,
    },
    isPaused: false,
    
    magnetMode: 'off',
    magnetStrength: 3,
    magnetRadius: 200,
    magnetPos: { x: 0, y: 0 },
    isMagnetActive: false,
    
    nBodyMode: 'off',
    nBodyStrength: 1.5,
    
    stickyMode: false,
    stickyStrength: 0.15,
    
    flowMode: 'off',
    flowStrength: 0.15,
    flowRadius: 100,
    flowVisible: true,
    
    collisionIterations: 3,
    restitution: 0.6,
    
    scaleValue: 0,
    isScaling: false,
    randomScaleValue: 0,
    isRandomScaling: false,
  });
  
  // Getters return references, not copies
  const $getSystem = useCallback(() => stateRef.current.system, []);
  const $getConfig = useCallback(() => stateRef.current.config, []);
  
  const $getMagnetConfig = useCallback(() => ({
    mode: stateRef.current.magnetMode,
    strength: stateRef.current.magnetStrength,
    radius: stateRef.current.magnetRadius,
    pos: stateRef.current.magnetPos,
  }), []);
  
  const $getNBodyConfig = useCallback(() => ({
    mode: stateRef.current.nBodyMode,
    strength: stateRef.current.nBodyStrength,
  }), []);
  
  const $getStickyConfig = useCallback(() => ({
    mode: stateRef.current.stickyMode,
    strength: stateRef.current.stickyStrength,
  }), []);
  
  // Setters
  const setMagnetMode = useCallback((mode: 'off' | 'attract' | 'repel') => {
    stateRef.current.magnetMode = mode;
  }, []);
  
  const setMagnetPos = useCallback((x: number, y: number) => {
    stateRef.current.magnetPos = { x, y };
  }, []);
  
  const setMagnetActive = useCallback((active: boolean) => {
    stateRef.current.isMagnetActive = active;
  }, []);
  
  const setNBodyMode = useCallback((mode: 'off' | 'clump' | 'spread') => {
    stateRef.current.nBodyMode = mode;
  }, []);
  
  const setStickyMode = useCallback((enabled: boolean) => {
    stateRef.current.stickyMode = enabled;
  }, []);
  
  const togglePause = useCallback(() => {
    stateRef.current.isPaused = !stateRef.current.isPaused;
  }, []);
  
  const value = useMemo<PhysicsContextValue>(() => ({
    stateRef,
    $getSystem,
    $getConfig,
    $getMagnetConfig,
    $getNBodyConfig,
    $getStickyConfig,
    setMagnetMode,
    setMagnetPos,
    setMagnetActive,
    setNBodyMode,
    setStickyMode,
    togglePause,
  }), [
    $getSystem,
    $getConfig,
    $getMagnetConfig,
    $getNBodyConfig,
    $getStickyConfig,
    setMagnetMode,
    setMagnetPos,
    setMagnetActive,
    setNBodyMode,
    setStickyMode,
    togglePause,
  ]);
  
  return (
    <PhysicsContext.Provider value={value}>
      {children}
    </PhysicsContext.Provider>
  );
}

export function usePhysicsContext(): PhysicsContextValue {
  const context = useContext(PhysicsContext);
  if (!context) {
    throw new Error('usePhysicsContext must be used within PhysicsProvider');
  }
  return context;
}

// Convenience hook for magnet controls
export function useMagnet() {
  const { $getMagnetConfig, setMagnetMode, setMagnetPos, setMagnetActive } = usePhysicsContext();
  
  return {
    config: $getMagnetConfig,
    setMode: setMagnetMode,
    setPosition: setMagnetPos,
    setActive: setMagnetActive,
  };
}

// Convenience hook for n-body controls
export function useNBody() {
  const { $getNBodyConfig, setNBodyMode } = usePhysicsContext();
  
  return {
    config: $getNBodyConfig,
    setMode: setNBodyMode,
  };
}

// Convenience hook for sticky controls
export function useSticky() {
  const { $getStickyConfig, setStickyMode } = usePhysicsContext();
  
  return {
    config: $getStickyConfig,
    setMode: setStickyMode,
  };
}
