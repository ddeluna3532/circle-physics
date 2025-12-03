import { useState, useRef, MutableRefObject } from 'react';
import { Circle } from '../physics';

export interface AppState {
  // Drawing state
  brushSize: number;
  setBrushSize: (size: number) => void;
  
  // Edit modes
  eraseMode: boolean;
  setEraseMode: (mode: boolean) => void;
  lockMode: boolean;
  setLockMode: (mode: boolean) => void;
  recolorMode: boolean;
  setRecolorMode: (mode: boolean) => void;
  paintMode: boolean;
  setPaintMode: (mode: boolean) => void;
  selectMode: boolean;
  setSelectMode: (mode: boolean) => void;
  selectedIds: Set<number>;
  setSelectedIds: (ids: Set<number>) => void;
  
  // Force modes
  magnetMode: 'off' | 'attract' | 'repel';
  setMagnetMode: (mode: 'off' | 'attract' | 'repel') => void;
  magnetStrength: number;
  setMagnetStrength: (val: number) => void;
  magnetRadius: number;
  setMagnetRadius: (val: number) => void;
  
  nBodyMode: 'off' | 'clump' | 'spread';
  setNBodyMode: (mode: 'off' | 'clump' | 'spread') => void;
  nBodyStrength: number;
  setNBodyStrength: (val: number) => void;
  
  stickyMode: boolean;
  setStickyMode: (enabled: boolean) => void;
  stickyStrength: number;
  setStickyStrength: (val: number) => void;
  
  // Flow field
  flowMode: 'off' | 'draw' | 'erase';
  setFlowMode: (mode: 'off' | 'draw' | 'erase') => void;
  flowVisible: boolean;
  setFlowVisible: (visible: boolean) => void;
  flowStrength: number;
  setFlowStrength: (val: number) => void;
  flowRadius: number;
  setFlowRadius: (val: number) => void;
  
  // Collision settings
  collisionIterations: number;
  setCollisionIterations: (val: number) => void;
  restitution: number;
  setRestitution: (val: number) => void;
  physicsPaused: boolean;
  setPhysicsPaused: (paused: boolean) => void;
  
  // Interaction refs
  draggingRef: MutableRefObject<Circle | null>;
  isPaintingRef: MutableRefObject<boolean>;
  isErasingRef: MutableRefObject<boolean>;
  erasedThisStroke: MutableRefObject<Set<number>>;
  isLockingRef: MutableRefObject<boolean>;
  lockedThisStroke: MutableRefObject<Set<number>>;
  isRecoloringRef: MutableRefObject<boolean>;
  recoloredThisStroke: MutableRefObject<Set<number>>;
  isMagnetActiveRef: MutableRefObject<boolean>;
  magnetPosRef: MutableRefObject<{ x: number; y: number }>;
  
  // Flow field drawing refs
  isFlowDrawingRef: MutableRefObject<boolean>;
  flowStartRef: MutableRefObject<{ x: number; y: number }>;
  lastFlowPosRef: MutableRefObject<{ x: number; y: number }>;
  
  // Pinch-to-scale state
  pinchRef: MutableRefObject<{
    circle: Circle | null;
    initialDistance: number;
    initialRadius: number;
  }>;
  
  // Mouse tracking
  mouseRef: MutableRefObject<{ x: number; y: number; prevX: number; prevY: number }>;
  
  // Selection refs
  isSelectingRef: MutableRefObject<boolean>;
  selectionStartRef: MutableRefObject<{ x: number; y: number }>;
  selectionRectRef: MutableRefObject<{ x: number; y: number; w: number; h: number } | null>;
  isDraggingSelectionRef: MutableRefObject<boolean>;
  selectionDragStartRef: MutableRefObject<{ x: number; y: number }>;
  isPaintSelectingRef: MutableRefObject<boolean>;
  paintSelectedThisStroke: MutableRefObject<Set<number>>;
  
  // Paint layer refs
  isPaintingLayerRef: MutableRefObject<boolean>;
  lastPaintPosRef: MutableRefObject<{ x: number; y: number }>;
  
  // Scaling refs
  scaleSliderRef: MutableRefObject<number>;
  isScalingRef: MutableRefObject<boolean>;
  randomScaleSliderRef: MutableRefObject<number>;
  isRandomScalingRef: MutableRefObject<boolean>;
  
  // Auto-spawn refs
  isAutoSpawningRef: MutableRefObject<boolean>;
  isRandomSpawningRef: MutableRefObject<boolean>;
}

export function useAppState(): AppState {
  // UI state
  const [brushSize, setBrushSize] = useState(30);
  const [eraseMode, setEraseMode] = useState(false);
  const [lockMode, setLockMode] = useState(false);
  const [recolorMode, setRecolorMode] = useState(false);
  const [paintMode, setPaintMode] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // Force modes
  const [magnetMode, setMagnetMode] = useState<'off' | 'attract' | 'repel'>('off');
  const [magnetStrength, setMagnetStrength] = useState(3);
  const [magnetRadius, setMagnetRadius] = useState(200);
  
  const [nBodyMode, setNBodyMode] = useState<'off' | 'clump' | 'spread'>('off');
  const [nBodyStrength, setNBodyStrength] = useState(12);
  
  const [stickyMode, setStickyMode] = useState(false);
  const [stickyStrength, setStickyStrength] = useState(0.15);
  
  // Flow field state
  const [flowMode, setFlowMode] = useState<'off' | 'draw' | 'erase'>('off');
  const [flowVisible, setFlowVisible] = useState(true);
  const [flowStrength, setFlowStrength] = useState(0.15);
  const [flowRadius, setFlowRadius] = useState(100);
  
  // Collision settings
  const [collisionIterations, setCollisionIterations] = useState(3);
  const [restitution, setRestitution] = useState(0.6);
  const [physicsPaused, setPhysicsPaused] = useState(false);
  
  // Interaction refs
  const draggingRef = useRef<Circle | null>(null);
  const isPaintingRef = useRef(false);
  const isErasingRef = useRef(false);
  const erasedThisStroke = useRef<Set<number>>(new Set());
  const isLockingRef = useRef(false);
  const lockedThisStroke = useRef<Set<number>>(new Set());
  const isRecoloringRef = useRef(false);
  const recoloredThisStroke = useRef<Set<number>>(new Set());
  const isMagnetActiveRef = useRef(false);
  const magnetPosRef = useRef({ x: 0, y: 0 });
  
  // Flow field drawing refs
  const isFlowDrawingRef = useRef(false);
  const flowStartRef = useRef({ x: 0, y: 0 });
  const lastFlowPosRef = useRef({ x: 0, y: 0 });
  
  // Pinch-to-scale state
  const pinchRef = useRef<{
    circle: Circle | null;
    initialDistance: number;
    initialRadius: number;
  }>({ circle: null, initialDistance: 0, initialRadius: 0 });
  
  // Track mouse position and velocity for momentum
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0 });
  
  // Selection state refs
  const isSelectingRef = useRef(false);
  const selectionStartRef = useRef({ x: 0, y: 0 });
  const selectionRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const isDraggingSelectionRef = useRef(false);
  const selectionDragStartRef = useRef({ x: 0, y: 0 });
  const isPaintSelectingRef = useRef(false);
  const paintSelectedThisStroke = useRef<Set<number>>(new Set());
  
  // Paint layer refs
  const isPaintingLayerRef = useRef(false);
  const lastPaintPosRef = useRef({ x: 0, y: 0 });
  
  // Scale all slider state
  const scaleSliderRef = useRef(0);
  const isScalingRef = useRef(false);
  
  // Random scale slider state
  const randomScaleSliderRef = useRef(0);
  const isRandomScalingRef = useRef(false);
  
  // Auto-spawn state
  const isAutoSpawningRef = useRef(false);
  const isRandomSpawningRef = useRef(false);
  
  return {
    brushSize,
    setBrushSize,
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
    magnetMode,
    setMagnetMode,
    magnetStrength,
    setMagnetStrength,
    magnetRadius,
    setMagnetRadius,
    nBodyMode,
    setNBodyMode,
    nBodyStrength,
    setNBodyStrength,
    stickyMode,
    setStickyMode,
    stickyStrength,
    setStickyStrength,
    flowMode,
    setFlowMode,
    flowVisible,
    setFlowVisible,
    flowStrength,
    setFlowStrength,
    flowRadius,
    setFlowRadius,
    collisionIterations,
    setCollisionIterations,
    restitution,
    setRestitution,
    physicsPaused,
    setPhysicsPaused,
    draggingRef,
    isPaintingRef,
    isErasingRef,
    erasedThisStroke,
    isLockingRef,
    lockedThisStroke,
    isRecoloringRef,
    recoloredThisStroke,
    isMagnetActiveRef,
    magnetPosRef,
    isFlowDrawingRef,
    flowStartRef,
    lastFlowPosRef,
    pinchRef,
    mouseRef,
    isSelectingRef,
    selectionStartRef,
    selectionRectRef,
    isDraggingSelectionRef,
    selectionDragStartRef,
    isPaintSelectingRef,
    paintSelectedThisStroke,
    isPaintingLayerRef,
    lastPaintPosRef,
    scaleSliderRef,
    isScalingRef,
    randomScaleSliderRef,
    isRandomScalingRef,
    isAutoSpawningRef,
    isRandomSpawningRef,
  };
}
