import { Circle } from '../physics';

// Snapshot of circle state for undo/redo
export interface CircleSnapshot {
  id: number;
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  color: string;
  mass: number;
  locked: boolean;
  layerId: string;
}

export interface HistoryState {
  circles: CircleSnapshot[];
  timestamp: number;
}

export class UndoManager {
  private history: HistoryState[] = [];
  private currentIndex: number = -1;
  private maxHistory: number;
  private lastSaveTime: number = 0;
  private minSaveInterval: number = 500; // Minimum ms between saves
  
  constructor(maxHistory: number = 50) {
    this.maxHistory = maxHistory;
  }

  // Take a snapshot of current circle state
  private createSnapshot(circles: Circle[]): CircleSnapshot[] {
    return circles.map(c => ({
      id: c.id,
      x: c.x,
      y: c.y,
      r: c.r,
      vx: c.vx,
      vy: c.vy,
      color: c.color,
      mass: c.mass,
      locked: c.locked,
      layerId: c.layerId,
    }));
  }

  // Save current state to history
  saveState(circles: Circle[], force: boolean = false): void {
    const now = Date.now();
    
    // Throttle saves unless forced
    if (!force && now - this.lastSaveTime < this.minSaveInterval) {
      return;
    }
    
    // Don't save if circles array is empty and we already have history
    if (circles.length === 0 && this.history.length > 0 && this.currentIndex >= 0) {
      // Only save empty state if previous state wasn't empty
      const prevState = this.history[this.currentIndex];
      if (prevState.circles.length === 0) {
        return;
      }
    }
    
    const snapshot = this.createSnapshot(circles);
    
    // Check if state actually changed
    if (this.currentIndex >= 0) {
      const prevState = this.history[this.currentIndex];
      if (this.statesEqual(prevState.circles, snapshot)) {
        return;
      }
    }
    
    // Remove any future history if we're not at the end
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }
    
    // Add new state
    this.history.push({
      circles: snapshot,
      timestamp: now,
    });
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
    
    this.lastSaveTime = now;
  }

  // Check if two states are equal
  private statesEqual(a: CircleSnapshot[], b: CircleSnapshot[]): boolean {
    if (a.length !== b.length) return false;
    
    for (let i = 0; i < a.length; i++) {
      const ca = a[i];
      const cb = b.find(c => c.id === ca.id);
      if (!cb) return false;
      
      // Check key properties (ignore velocity for comparison)
      if (ca.x !== cb.x || ca.y !== cb.y || ca.r !== cb.r || 
          ca.color !== cb.color || ca.locked !== cb.locked ||
          ca.layerId !== cb.layerId) {
        return false;
      }
    }
    
    return true;
  }

  // Undo - returns previous state or null
  undo(): CircleSnapshot[] | null {
    if (this.currentIndex <= 0) {
      return null;
    }
    
    this.currentIndex--;
    return [...this.history[this.currentIndex].circles];
  }

  // Redo - returns next state or null
  redo(): CircleSnapshot[] | null {
    if (this.currentIndex >= this.history.length - 1) {
      return null;
    }
    
    this.currentIndex++;
    return [...this.history[this.currentIndex].circles];
  }

  // Check if undo is available
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  // Check if redo is available
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  // Get current history info
  getInfo(): { current: number; total: number } {
    return {
      current: this.currentIndex + 1,
      total: this.history.length,
    };
  }

  // Clear all history
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.lastSaveTime = 0;
  }

  // Initialize with current state
  initialize(circles: Circle[]): void {
    this.clear();
    this.saveState(circles, true);
  }
}

// Apply snapshot to circles array (mutates in place and returns updated array)
export function applySnapshot(
  currentCircles: Circle[],
  snapshot: CircleSnapshot[],
  setCircles: (circles: Circle[]) => void
): void {
  // Create new circles array from snapshot
  const newCircles: Circle[] = snapshot.map(s => ({
    id: s.id,
    x: s.x,
    y: s.y,
    r: s.r,
    vx: s.vx,
    vy: s.vy,
    color: s.color,
    mass: s.mass,
    locked: s.locked,
    isDragging: false,
    layerId: s.layerId,
  }));
  
  setCircles(newCircles);
}
