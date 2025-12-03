// Animation Layer Manager
// Manages multiple recorded animations as layers that can be combined and resimulated

import { AnimationData, CircleSnapshot, Keyframe } from './AnimationRecorder';
import { Circle, PhysicsSystem, createCircle } from '../physics';

export interface AnimationLayer {
  id: string;
  name: string;
  animation: AnimationData;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface ResimulationProgress {
  phase: 'preparing' | 'simulating' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  currentFrame?: number;
  totalFrames?: number;
}

export type ResimulationCallback = (progress: ResimulationProgress) => void;

export class AnimationLayerManager {
  private layers: AnimationLayer[] = [];
  private nextId: number = 1;
  
  /**
   * Add an animation as a new layer
   */
  addLayer(animation: AnimationData, name?: string): AnimationLayer {
    const layer: AnimationLayer = {
      id: `anim-layer-${this.nextId++}`,
      name: name || `Animation ${this.layers.length + 1}`,
      animation: { ...animation },
      visible: true,
      locked: false,
      opacity: 1.0,
    };
    
    this.layers.push(layer);
    return layer;
  }
  
  /**
   * Remove a layer
   */
  removeLayer(id: string): boolean {
    const index = this.layers.findIndex(l => l.id === id);
    if (index === -1) return false;
    
    this.layers.splice(index, 1);
    return true;
  }
  
  /**
   * Get all layers
   */
  getLayers(): AnimationLayer[] {
    return [...this.layers];
  }
  
  /**
   * Get a specific layer
   */
  getLayer(id: string): AnimationLayer | null {
    return this.layers.find(l => l.id === id) || null;
  }
  
  /**
   * Update layer properties
   */
  updateLayer(id: string, updates: Partial<Omit<AnimationLayer, 'id' | 'animation'>>): boolean {
    const layer = this.layers.find(l => l.id === id);
    if (!layer) return false;
    
    Object.assign(layer, updates);
    return true;
  }
  
  /**
   * Get all visible animations
   */
  getActiveAnimations(): AnimationData[] {
    return this.layers
      .filter(l => l.visible && !l.locked)
      .map(l => l.animation);
  }
  
  /**
   * Clear all layers
   */
  clear(): void {
    this.layers = [];
  }
  
  /**
   * Resimulate physics by combining all active animation layers
   * This creates a new animation by replaying all active animations
   * and recalculating collisions between them
   */
  async resimulate(
    physicsSystem: PhysicsSystem,
    onProgress?: ResimulationCallback
  ): Promise<AnimationData | null> {
    const activeAnimations = this.getActiveAnimations();
    
    if (activeAnimations.length === 0) {
      onProgress?.({
        phase: 'error',
        progress: 0,
        message: 'No active animations to resimulate',
      });
      return null;
    }
    
    onProgress?.({
      phase: 'preparing',
      progress: 0,
      message: 'Preparing resimulation...',
    });
    
    // Find the maximum duration across all animations
    const maxDuration = Math.max(...activeAnimations.map(a => a.duration));
    
    // Find the common FPS (use the first animation's FPS)
    const fps = activeAnimations[0].fps;
    const frameInterval = 1000 / fps;
    const totalFrames = Math.ceil(maxDuration / frameInterval);
    
    // Prepare physics system
    const originalCircles = [...physicsSystem.circles];
    physicsSystem.circles = [];
    
    const newKeyframes: Keyframe[] = [];
    
    try {
      // Simulate each frame
      for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
        const time = frameIdx * frameInterval;
        
        // Get circles from all animations at this time
        const combinedCircles: Circle[] = [];
        const circleIdMap = new Map<string, number>(); // Map original circle ID + layer ID to new ID
        let nextCircleId = 1;
        
        for (let layerIdx = 0; layerIdx < activeAnimations.length; layerIdx++) {
          const animation = activeAnimations[layerIdx];
          const frame = this.getFrameAtTime(animation, time);
          
          if (frame) {
            for (const snapshot of frame) {
              const compositeKey = `${snapshot.id}-${layerIdx}`;
              
              if (!circleIdMap.has(compositeKey)) {
                circleIdMap.set(compositeKey, nextCircleId++);
              }
              
              const newId = circleIdMap.get(compositeKey)!;
              const circle = createCircle(snapshot.x, snapshot.y, snapshot.r, snapshot.color, snapshot.layerId);
              circle.id = newId;
              combinedCircles.push(circle);
            }
          }
        }
        
        // Set circles in physics system
        physicsSystem.circles = combinedCircles;
        
        // Run one physics step to handle collisions
        physicsSystem.update();
        
        // Capture the result
        const resultSnapshot: CircleSnapshot[] = physicsSystem.circles.map(c => ({
          id: c.id,
          x: c.x,
          y: c.y,
          r: c.r,
          color: c.color,
          layerId: c.layerId,
        }));
        
        newKeyframes.push({
          time,
          circles: resultSnapshot,
        });
        
        // Update progress
        const progress = Math.round(((frameIdx + 1) / totalFrames) * 100);
        onProgress?.({
          phase: 'simulating',
          progress,
          message: `Simulating frame ${frameIdx + 1}/${totalFrames}...`,
          currentFrame: frameIdx + 1,
          totalFrames,
        });
        
        // Yield to prevent UI blocking every 10 frames
        if (frameIdx % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      onProgress?.({
        phase: 'complete',
        progress: 100,
        message: 'Resimulation complete!',
        currentFrame: totalFrames,
        totalFrames,
      });
      
      // Create the new animation data
      const resimulatedAnimation: AnimationData = {
        version: 1,
        name: `Resimulated-${Date.now()}`,
        duration: maxDuration,
        keyframes: newKeyframes,
        fps,
      };
      
      return resimulatedAnimation;
      
    } catch (err) {
      console.error('Resimulation error:', err);
      onProgress?.({
        phase: 'error',
        progress: 0,
        message: `Resimulation failed: ${err}`,
      });
      return null;
    } finally {
      // Restore original circles
      physicsSystem.circles = originalCircles;
    }
  }
  
  /**
   * Get interpolated frame from an animation at a specific time
   */
  private getFrameAtTime(animation: AnimationData, time: number): CircleSnapshot[] | null {
    if (animation.keyframes.length === 0) return null;
    if (time > animation.duration) return null;
    
    // Find surrounding keyframes
    let prevIdx = 0;
    let nextIdx = 0;
    
    for (let i = 0; i < animation.keyframes.length; i++) {
      if (animation.keyframes[i].time <= time) {
        prevIdx = i;
      }
      if (animation.keyframes[i].time >= time) {
        nextIdx = i;
        break;
      }
    }
    
    // If same frame or at boundaries, return exact frame
    if (prevIdx === nextIdx) {
      return animation.keyframes[prevIdx].circles;
    }
    
    // Interpolate between frames
    const prevFrame = animation.keyframes[prevIdx];
    const nextFrame = animation.keyframes[nextIdx];
    const t = (time - prevFrame.time) / (nextFrame.time - prevFrame.time);
    
    // Build map of circles by ID for quick lookup
    const nextMap = new Map<number, CircleSnapshot>();
    for (const c of nextFrame.circles) {
      nextMap.set(c.id, c);
    }
    
    const interpolated: CircleSnapshot[] = [];
    
    for (const prev of prevFrame.circles) {
      const next = nextMap.get(prev.id);
      if (next) {
        // Interpolate position and size
        interpolated.push({
          id: prev.id,
          x: prev.x + (next.x - prev.x) * t,
          y: prev.y + (next.y - prev.y) * t,
          r: prev.r + (next.r - prev.r) * t,
          color: prev.color,
          layerId: prev.layerId,
        });
      } else {
        // Circle was removed, keep showing it until it's gone
        interpolated.push(prev);
      }
    }
    
    // Add any new circles that appeared in next frame
    for (const next of nextFrame.circles) {
      if (!interpolated.find(c => c.id === next.id)) {
        interpolated.push(next);
      }
    }
    
    return interpolated;
  }
  
  /**
   * Export all layers as a single file
   */
  exportLayers(): Blob {
    const data = {
      version: 1,
      layers: this.layers,
    };
    
    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: 'application/json' });
  }
  
  /**
   * Import layers from file data
   */
  importLayers(data: any): boolean {
    try {
      if (!data.layers || !Array.isArray(data.layers)) {
        console.error('Invalid layers file format');
        return false;
      }
      
      this.layers = data.layers;
      
      // Update nextId to avoid collisions
      const maxId = this.layers.reduce((max, layer) => {
        const match = layer.id.match(/anim-layer-(\d+)/);
        if (match) {
          return Math.max(max, parseInt(match[1]));
        }
        return max;
      }, 0);
      
      this.nextId = maxId + 1;
      
      return true;
    } catch (err) {
      console.error('Failed to import layers:', err);
      return false;
    }
  }
}
