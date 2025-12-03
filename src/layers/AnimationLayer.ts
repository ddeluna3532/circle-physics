// Animation Layer System - Store and recalculate animations with physics

import { AnimationData, Keyframe, CircleSnapshot } from './AnimationRecorder';
import { PhysicsSystem, Circle, createCircle } from '../physics';

export interface AnimationLayer {
  id: string;
  name: string;
  animation: AnimationData | null;
  visible: boolean;
  opacity: number; // 0-1, now affects visual opacity in recalculation
  locked: boolean;
}

export class AnimationLayerManager {
  private layers: AnimationLayer[] = [];
  private nextId: number = 1;
  private activeLayerId: string | null = null;
  
  // Recalculated animation result
  private recalculatedAnimation: AnimationData | null = null;
  
  // Playback state (for recalculated animation)
  private isPlaying: boolean = false;
  private playbackTime: number = 0;
  private playbackStartTime: number = 0;
  private playbackLoop: boolean = true;
  private animationFrame: number | null = null;
  
  // Callbacks
  private onPlaybackFrame: ((circles: CircleSnapshot[]) => void) | null = null;
  private onPlaybackEnd: (() => void) | null = null;

  constructor() {
    // Start with one default layer
    this.addLayer('Animation 1');
  }

  // Add a new animation layer
  addLayer(name?: string): AnimationLayer {
    const id = `anim-layer-${this.nextId++}`;
    const layer: AnimationLayer = {
      id,
      name: name || `Animation ${this.nextId - 1}`,
      animation: null,
      visible: true,
      opacity: 1,
      locked: false,
    };
    
    this.layers.push(layer);
    if (!this.activeLayerId) {
      this.activeLayerId = id;
    }
    
    return layer;
  }

  // Remove a layer
  removeLayer(id: string): void {
    const index = this.layers.findIndex(l => l.id === id);
    if (index === -1) return;
    
    this.layers.splice(index, 1);
    
    // Update active layer if needed
    if (this.activeLayerId === id) {
      this.activeLayerId = this.layers.length > 0 ? this.layers[0].id : null;
    }
  }

  // Get all layers
  getLayers(): AnimationLayer[] {
    return [...this.layers];
  }

  // Get a specific layer
  getLayer(id: string): AnimationLayer | null {
    return this.layers.find(l => l.id === id) || null;
  }

  // Get active layer
  getActiveLayer(): AnimationLayer | null {
    if (!this.activeLayerId) return null;
    return this.getLayer(this.activeLayerId);
  }

  // Set active layer
  setActiveLayer(id: string): void {
    if (this.layers.find(l => l.id === id)) {
      this.activeLayerId = id;
    }
  }

  // Update layer properties
  updateLayer(id: string, updates: Partial<AnimationLayer>): void {
    const layer = this.getLayer(id);
    if (!layer) return;
    
    Object.assign(layer, updates);
  }

  // Toggle layer visibility
  toggleVisibility(id: string): void {
    const layer = this.getLayer(id);
    if (layer) {
      layer.visible = !layer.visible;
    }
  }

  // Toggle layer lock
  toggleLock(id: string): void {
    const layer = this.getLayer(id);
    if (layer) {
      layer.locked = !layer.locked;
    }
  }

  // Move layer up/down in order
  moveLayer(id: string, direction: 'up' | 'down'): void {
    const index = this.layers.findIndex(l => l.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= this.layers.length) return;
    
    const [layer] = this.layers.splice(index, 1);
    this.layers.splice(newIndex, 0, layer);
  }

  // Load animation into a layer
  loadAnimationToLayer(layerId: string, animation: AnimationData): void {
    const layer = this.getLayer(layerId);
    if (layer && !layer.locked) {
      layer.animation = animation;
    }
  }

  // Clear animation from a layer
  clearLayerAnimation(layerId: string): void {
    const layer = this.getLayer(layerId);
    if (layer && !layer.locked) {
      layer.animation = null;
    }
  }

  // Get the maximum duration across all visible layers
  getMaxDuration(): number {
    let maxDuration = 0;
    for (const layer of this.layers) {
      if (layer.visible && layer.animation) {
        maxDuration = Math.max(maxDuration, layer.animation.duration);
      }
    }
    return maxDuration;
  }

  // Check if any layer has animation
  hasAnimations(): boolean {
    return this.layers.some(l => l.animation !== null);
  }

  // Get interpolated frame from an animation at given time
  private getInterpolatedFrame(animation: AnimationData, time: number): CircleSnapshot[] | null {
    const keyframes = animation.keyframes;
    if (keyframes.length === 0) return null;
    
    // Clamp time to animation duration
    time = Math.min(time, animation.duration);
    
    // Find surrounding keyframes
    let prevIdx = 0;
    let nextIdx = 0;
    
    for (let i = 0; i < keyframes.length; i++) {
      if (keyframes[i].time <= time) {
        prevIdx = i;
      }
      if (keyframes[i].time >= time) {
        nextIdx = i;
        break;
      }
    }
    
    // If same frame or at boundaries, return exact frame
    if (prevIdx === nextIdx) {
      return keyframes[prevIdx].circles;
    }
    
    // Interpolate between frames
    const prevFrame = keyframes[prevIdx];
    const nextFrame = keyframes[nextIdx];
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
        interpolated.push({
          id: prev.id,
          x: prev.x + (next.x - prev.x) * t,
          y: prev.y + (next.y - prev.y) * t,
          r: prev.r + (next.r - prev.r) * t,
          color: prev.color,
          layerId: prev.layerId,
        });
      } else {
        interpolated.push({ ...prev });
      }
    }
    
    // Add any new circles
    for (const next of nextFrame.circles) {
      if (!interpolated.find(c => c.id === next.id)) {
        interpolated.push({ ...next });
      }
    }
    
    return interpolated;
  }

  // Recalculate animations with proper physics simulation
  recalculateWithPhysics(
    physicsConfig: {
      gravityEnabled: boolean;
      gravityStrength: number;
      floorEnabled: boolean;
      floorY: number;
      wallsEnabled: boolean;
      damping: number;
      collisionIterations: number;
      restitution: number;
    },
    bounds: { x: number; y: number; width: number; height: number },
    fps: number = 30,
    onProgress?: (progress: number) => void
  ): AnimationData | null {
    const visibleLayers = this.layers.filter(l => l.visible && l.animation);
    if (visibleLayers.length === 0) {
      console.log('No visible animations to recalculate');
      return null;
    }

    console.log(`Recalculating ${visibleLayers.length} animation layers with physics...`);

    // Get initial state from all layers at time 0
    const initialCircles = new Map<number, CircleSnapshot>();
    
    for (const layer of visibleLayers) {
      if (!layer.animation) continue;
      const frame = this.getInterpolatedFrame(layer.animation, 0);
      if (!frame) continue;
      
      for (const circle of frame) {
        // Use first occurrence of each circle ID
        if (!initialCircles.has(circle.id)) {
          initialCircles.set(circle.id, circle);
        }
      }
    }

    if (initialCircles.size === 0) {
      console.log('No circles found in initial frames');
      return null;
    }

    // Create physics system
    const physicsSystem = new PhysicsSystem();
    physicsSystem.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    physicsSystem.config = { ...physicsConfig };
    physicsSystem.collisionIterations = physicsConfig.collisionIterations;
    physicsSystem.restitution = physicsConfig.restitution;

    // Initialize circles from initial state
    for (const snapshot of initialCircles.values()) {
      const circle = createCircle(
        snapshot.x,
        snapshot.y,
        snapshot.r,
        snapshot.color,
        snapshot.layerId
      );
      circle.id = snapshot.id;
      // Don't check overlaps for initial placement
      physicsSystem.circles.push(circle);
    }

    console.log(`Starting simulation with ${physicsSystem.circles.length} circles`);

    // Run simulation and capture frames
    const duration = this.getMaxDuration();
    const frameInterval = 1000 / fps;
    const totalFrames = Math.ceil(duration / frameInterval);
    const keyframes: Keyframe[] = [];

    for (let frame = 0; frame <= totalFrames; frame++) {
      const time = frame * frameInterval;
      
      // Update progress
      if (onProgress && frame % 10 === 0) {
        onProgress((frame / totalFrames) * 100);
      }

      // Capture current state
      const circles: CircleSnapshot[] = physicsSystem.circles.map(c => ({
        id: c.id,
        x: c.x,
        y: c.y,
        r: c.r,
        color: c.color,
        layerId: c.layerId,
      }));

      keyframes.push({ time, circles });

      // Step physics forward
      physicsSystem.update();
    }

    if (onProgress) onProgress(100);

    this.recalculatedAnimation = {
      version: 1,
      name: `recalculated-${Date.now()}`,
      duration,
      keyframes,
      fps,
    };

    console.log(`Recalculation complete: ${keyframes.length} frames`);
    return this.recalculatedAnimation;
  }

  // Get the recalculated animation
  getRecalculatedAnimation(): AnimationData | null {
    return this.recalculatedAnimation;
  }

  // Clear recalculated animation
  clearRecalculated(): void {
    this.recalculatedAnimation = null;
  }

  // Start playback of recalculated animation
  startPlayback(
    onFrame: (circles: CircleSnapshot[]) => void,
    onEnd?: () => void,
    loop: boolean = true
  ): void {
    if (!this.recalculatedAnimation) {
      console.log('No recalculated animation to play');
      return;
    }
    
    this.isPlaying = true;
    this.playbackLoop = loop;
    this.playbackTime = 0;
    this.playbackStartTime = performance.now();
    this.onPlaybackFrame = onFrame;
    this.onPlaybackEnd = onEnd || null;
    
    this.playbackTick();
    console.log('Playback started');
  }

  private playbackTick = (): void => {
    if (!this.isPlaying || !this.recalculatedAnimation) return;
    
    const elapsed = performance.now() - this.playbackStartTime;
    const duration = this.recalculatedAnimation.duration;
    
    let currentTime = elapsed;
    
    // Handle looping or end
    if (currentTime >= duration) {
      if (this.playbackLoop) {
        this.playbackStartTime = performance.now();
        currentTime = 0;
      } else {
        this.stopPlayback();
        if (this.onPlaybackEnd) this.onPlaybackEnd();
        return;
      }
    }
    
    // Get frame
    const frame = this.getInterpolatedFrame(this.recalculatedAnimation, currentTime);
    if (frame && this.onPlaybackFrame) {
      this.onPlaybackFrame(frame);
    }
    
    this.animationFrame = requestAnimationFrame(this.playbackTick);
  };

  // Stop playback
  stopPlayback(): void {
    this.isPlaying = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    console.log('Playback stopped');
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // Clear all layers
  clearAll(): void {
    this.stopPlayback();
    this.layers = [];
    this.activeLayerId = null;
    this.nextId = 1;
    this.recalculatedAnimation = null;
    this.addLayer('Animation 1');
  }
}
