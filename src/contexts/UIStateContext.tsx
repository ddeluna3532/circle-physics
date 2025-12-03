/**
 * UI State Context
 * Manages all UI interaction modes and settings
 */

import React, { createContext, useContext, useState } from 'react';

interface UIStateContextValue {
  // Tab state
  leftTab: 'project' | 'colors' | 'tools' | 'physics';
  setLeftTab: (tab: 'project' | 'colors' | 'tools' | 'physics') => void;
  rightTab: 'layers' | 'effects';
  setRightTab: (tab: 'layers' | 'effects') => void;

  // Tool modes
  eraseMode: boolean;
  setEraseMode: (enabled: boolean) => void;
  lockMode: boolean;
  setLockMode: (enabled: boolean) => void;
  recolorMode: boolean;
  setRecolorMode: (enabled: boolean) => void;
  paintMode: boolean;
  setPaintMode: (enabled: boolean) => void;
  selectMode: boolean;
  setSelectMode: (enabled: boolean) => void;

  // Selection state
  selectedIds: Set<number>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<number>>>;

  // Canvas settings
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;

  // Magnet settings
  magnetMode: 'off' | 'attract' | 'repel';
  setMagnetMode: (mode: 'off' | 'attract' | 'repel') => void;
  magnetStrength: number;
  setMagnetStrength: (strength: number) => void;
  magnetRadius: number;
  setMagnetRadius: (radius: number) => void;

  // Flow field settings
  flowMode: 'off' | 'draw' | 'erase';
  setFlowMode: (mode: 'off' | 'draw' | 'erase') => void;
  flowVisible: boolean;
  setFlowVisible: (visible: boolean) => void;
  flowStrength: number;
  setFlowStrength: (strength: number) => void;
  flowRadius: number;
  setFlowRadius: (radius: number) => void;

  // N-body settings
  nBodyMode: 'off' | 'clump' | 'spread';
  setNBodyMode: (mode: 'off' | 'clump' | 'spread') => void;
  nBodyStrength: number;
  setNBodyStrength: (strength: number) => void;

  // Sticky settings
  stickyMode: boolean;
  setStickyMode: (enabled: boolean) => void;
  stickyStrength: number;
  setStickyStrength: (strength: number) => void;

  // Turbulence settings
  turbulenceMode: boolean;
  setTurbulenceMode: (enabled: boolean) => void;
  turbulenceStrength: number;
  setTurbulenceStrength: (strength: number) => void;
  turbulenceScale: number;
  setTurbulenceScale: (scale: number) => void;
  turbulenceFrequency: number;
  setTurbulenceFrequency: (frequency: number) => void;

  // Collision settings
  collisionIterations: number;
  setCollisionIterations: (iterations: number) => void;
  restitution: number;
  setRestitution: (restitution: number) => void;
  physicsPaused: boolean;
  setPhysicsPaused: (paused: boolean) => void;

  // Video export camera settings
  exportCameraZoom: number;
  setExportCameraZoom: (zoom: number) => void;
  exportCameraPanX: number;
  setExportCameraPanX: (pan: number) => void;
  exportCameraPanY: number;
  setExportCameraPanY: (pan: number) => void;
  showCameraPreview: boolean;
  setShowCameraPreview: (show: boolean) => void;

  // Animation smoothing
  smoothingStrength: number;
  setSmoothingStrength: (strength: number) => void;
}

const UIStateContext = createContext<UIStateContextValue | null>(null);

export function UIStateProvider({ children }: { children: React.ReactNode }) {
  // Tab state
  const [leftTab, setLeftTab] = useState<'project' | 'colors' | 'tools' | 'physics'>('project');
  const [rightTab, setRightTab] = useState<'layers' | 'effects'>('layers');

  // Tool modes
  const [eraseMode, setEraseMode] = useState(false);
  const [lockMode, setLockMode] = useState(false);
  const [recolorMode, setRecolorMode] = useState(false);
  const [paintMode, setPaintMode] = useState(false);
  const [selectMode, setSelectMode] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Canvas settings
  const [aspectRatio, setAspectRatio] = useState("4:3");
  const [brushSize, setBrushSize] = useState(30);

  // Magnet settings
  const [magnetMode, setMagnetMode] = useState<'off' | 'attract' | 'repel'>('off');
  const [magnetStrength, setMagnetStrength] = useState(3);
  const [magnetRadius, setMagnetRadius] = useState(200);

  // Flow field settings
  const [flowMode, setFlowMode] = useState<'off' | 'draw' | 'erase'>('off');
  const [flowVisible, setFlowVisible] = useState(true);
  const [flowStrength, setFlowStrength] = useState(0.15);
  const [flowRadius, setFlowRadius] = useState(100);

  // N-body settings
  const [nBodyMode, setNBodyMode] = useState<'off' | 'clump' | 'spread'>('off');
  const [nBodyStrength, setNBodyStrength] = useState(1.5);

  // Sticky settings
  const [stickyMode, setStickyMode] = useState(false);
  const [stickyStrength, setStickyStrength] = useState(0.15);

  // Turbulence settings
  const [turbulenceMode, setTurbulenceMode] = useState(false);
  const [turbulenceStrength, setTurbulenceStrength] = useState(2);
  const [turbulenceScale, setTurbulenceScale] = useState(100);
  const [turbulenceFrequency, setTurbulenceFrequency] = useState(0.5);

  // Collision settings
  const [collisionIterations, setCollisionIterations] = useState(3);
  const [restitution, setRestitution] = useState(0.6);
  const [physicsPaused, setPhysicsPaused] = useState(false);

  // Video export camera settings
  const [exportCameraZoom, setExportCameraZoom] = useState(1);
  const [exportCameraPanX, setExportCameraPanX] = useState(0);
  const [exportCameraPanY, setExportCameraPanY] = useState(0);
  const [showCameraPreview, setShowCameraPreview] = useState(false);

  // Animation smoothing
  const [smoothingStrength, setSmoothingStrength] = useState(0.4);

  const value: UIStateContextValue = {
    leftTab,
    setLeftTab,
    rightTab,
    setRightTab,
    eraseMode,
    setEraseMode,
    lockMode,
    setLockMode,
    recolorMode,
    setRecolorMode,
    paintMode,
    setPaintMode,
    selectMode,
    setSelectMode,
    selectedIds,
    setSelectedIds,
    aspectRatio,
    setAspectRatio,
    brushSize,
    setBrushSize,
    magnetMode,
    setMagnetMode,
    magnetStrength,
    setMagnetStrength,
    magnetRadius,
    setMagnetRadius,
    flowMode,
    setFlowMode,
    flowVisible,
    setFlowVisible,
    flowStrength,
    setFlowStrength,
    flowRadius,
    setFlowRadius,
    nBodyMode,
    setNBodyMode,
    nBodyStrength,
    setNBodyStrength,
    stickyMode,
    setStickyMode,
    stickyStrength,
    setStickyStrength,
    turbulenceMode,
    setTurbulenceMode,
    turbulenceStrength,
    setTurbulenceStrength,
    turbulenceScale,
    setTurbulenceScale,
    turbulenceFrequency,
    setTurbulenceFrequency,
    collisionIterations,
    setCollisionIterations,
    restitution,
    setRestitution,
    physicsPaused,
    setPhysicsPaused,
    exportCameraZoom,
    setExportCameraZoom,
    exportCameraPanX,
    setExportCameraPanX,
    exportCameraPanY,
    setExportCameraPanY,
    showCameraPreview,
    setShowCameraPreview,
    smoothingStrength,
    setSmoothingStrength,
  };

  return <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>;
}

export function useUIState() {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within UIStateProvider');
  }
  return context;
}
