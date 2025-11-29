import { Circle } from '../physics';

// A snapshot of circle states at a point in time
export interface Keyframe {
  time: number; // ms from start
  circles: CircleSnapshot[];
}

export interface CircleSnapshot {
  id: number;
  x: number;
  y: number;
  r: number;
  color: string;
  layerId: string;
}

export interface AnimationData {
  version: number;
  name: string;
  duration: number; // total duration in ms
  keyframes: Keyframe[];
  fps: number;
}

const CURRENT_VERSION = 1;

export class AnimationRecorder {
  private keyframes: Keyframe[] = [];
  private startTime: number = 0;
  private isRecording: boolean = false;
  private recordInterval: number | null = null;
  private fps: number = 30;
  
  // Playback state
  private isPlaying: boolean = false;
  private playbackTime: number = 0;
  private playbackStartTime: number = 0;
  private playbackLoop: boolean = true;
  private animationFrame: number | null = null;
  
  // Callbacks
  private onPlaybackFrame: ((circles: CircleSnapshot[]) => void) | null = null;
  private onPlaybackEnd: (() => void) | null = null;
  private onRecordingUpdate: ((duration: number, frameCount: number) => void) | null = null;

  constructor(fps: number = 30) {
    this.fps = fps;
  }

  setFPS(fps: number): void {
    this.fps = Math.max(1, Math.min(60, fps));
  }

  getFPS(): number {
    return this.fps;
  }

  // Start recording
  startRecording(circles: Circle[]): void {
    this.keyframes = [];
    this.startTime = performance.now();
    this.isRecording = true;
    
    // Capture first frame immediately
    this.captureFrame(circles);
    
    // Set up interval for capturing frames
    const intervalMs = 1000 / this.fps;
    this.recordInterval = window.setInterval(() => {
      // Note: circles array is captured by reference, will get current state
    }, intervalMs);
    
    console.log(`Recording started at ${this.fps} FPS`);
  }

  // Capture a frame (called from animation loop)
  captureFrame(circles: Circle[]): void {
    if (!this.isRecording) return;
    
    const time = performance.now() - this.startTime;
    
    // Only capture if enough time has passed since last frame
    const lastFrame = this.keyframes[this.keyframes.length - 1];
    const minInterval = 1000 / this.fps;
    if (lastFrame && time - lastFrame.time < minInterval * 0.9) {
      return;
    }
    
    const snapshot: CircleSnapshot[] = circles.map(c => ({
      id: c.id,
      x: c.x,
      y: c.y,
      r: c.r,
      color: c.color,
      layerId: c.layerId,
    }));
    
    this.keyframes.push({ time, circles: snapshot });
    
    if (this.onRecordingUpdate) {
      this.onRecordingUpdate(time, this.keyframes.length);
    }
  }

  // Stop recording
  stopRecording(): AnimationData | null {
    if (!this.isRecording) return null;
    
    this.isRecording = false;
    if (this.recordInterval) {
      clearInterval(this.recordInterval);
      this.recordInterval = null;
    }
    
    if (this.keyframes.length === 0) {
      console.log('No frames recorded');
      return null;
    }
    
    const duration = this.keyframes[this.keyframes.length - 1].time;
    console.log(`Recording stopped: ${this.keyframes.length} frames, ${(duration / 1000).toFixed(2)}s`);
    
    return {
      version: CURRENT_VERSION,
      name: `animation-${Date.now()}`,
      duration,
      keyframes: this.keyframes,
      fps: this.fps,
    };
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  getRecordingDuration(): number {
    if (!this.isRecording || this.keyframes.length === 0) return 0;
    return this.keyframes[this.keyframes.length - 1].time;
  }

  getFrameCount(): number {
    return this.keyframes.length;
  }

  // Load animation data
  loadAnimation(data: AnimationData): void {
    // Deep copy keyframes to avoid reference issues
    this.keyframes = JSON.parse(JSON.stringify(data.keyframes));
    this.fps = data.fps || 30;
    console.log(`Animation loaded: ${this.keyframes.length} frames, ${(data.duration / 1000).toFixed(2)}s`);
  }

  // Start playback
  startPlayback(
    onFrame: (circles: CircleSnapshot[]) => void,
    onEnd?: () => void,
    loop: boolean = true
  ): void {
    if (this.keyframes.length === 0) {
      console.log('No animation to play');
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
    if (!this.isPlaying) return;
    
    const elapsed = performance.now() - this.playbackStartTime;
    const duration = this.keyframes[this.keyframes.length - 1].time;
    
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
    
    // Find the two keyframes to interpolate between
    const frame = this.getInterpolatedFrame(currentTime);
    if (frame && this.onPlaybackFrame) {
      this.onPlaybackFrame(frame);
    }
    
    this.animationFrame = requestAnimationFrame(this.playbackTick);
  };

  // Get interpolated frame at given time
  private getInterpolatedFrame(time: number): CircleSnapshot[] | null {
    if (this.keyframes.length === 0) return null;
    
    // Find surrounding keyframes
    let prevIdx = 0;
    let nextIdx = 0;
    
    for (let i = 0; i < this.keyframes.length; i++) {
      if (this.keyframes[i].time <= time) {
        prevIdx = i;
      }
      if (this.keyframes[i].time >= time) {
        nextIdx = i;
        break;
      }
    }
    
    // If same frame or at boundaries, return exact frame
    if (prevIdx === nextIdx || nextIdx === 0) {
      return this.keyframes[prevIdx].circles;
    }
    
    // Interpolate between frames
    const prevFrame = this.keyframes[prevIdx];
    const nextFrame = this.keyframes[nextIdx];
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
          color: prev.color, // Don't interpolate color
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

  // Stop playback
  stopPlayback(): void {
    this.isPlaying = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    console.log('Playback stopped');
  }

  // Pause playback
  pausePlayback(): void {
    if (!this.isPlaying) return;
    this.playbackTime = performance.now() - this.playbackStartTime;
    this.stopPlayback();
  }

  // Resume playback
  resumePlayback(): void {
    if (this.isPlaying || this.keyframes.length === 0) return;
    this.isPlaying = true;
    this.playbackStartTime = performance.now() - this.playbackTime;
    this.playbackTick();
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // Get frame at specific time (for scrubbing)
  getFrameAtTime(time: number): CircleSnapshot[] | null {
    return this.getInterpolatedFrame(time);
  }

  getDuration(): number {
    if (this.keyframes.length === 0) return 0;
    return this.keyframes[this.keyframes.length - 1].time;
  }

  // Set callback for recording updates
  setRecordingCallback(callback: (duration: number, frameCount: number) => void): void {
    this.onRecordingUpdate = callback;
  }

  // Clear animation data
  clear(): void {
    this.stopPlayback();
    this.keyframes = [];
  }

  hasAnimation(): boolean {
    return this.keyframes.length > 0;
  }

  // Apply smoothing to recorded animation
  // strength: 0-1, higher = more smoothing (0.3-0.5 recommended)
  applySmoothing(strength: number = 0.4): void {
    if (this.keyframes.length < 3) return;
    
    const smoothedKeyframes = smoothKeyframes(this.keyframes, strength);
    this.keyframes = smoothedKeyframes;
    
    console.log(`Applied smoothing (strength: ${strength}) to ${this.keyframes.length} frames`);
  }

  // Get the raw keyframes (for external processing)
  getKeyframes(): Keyframe[] {
    // Return deep copy to avoid reference issues
    return JSON.parse(JSON.stringify(this.keyframes));
  }

  // Set keyframes (for applying processed data)
  setKeyframes(keyframes: Keyframe[]): void {
    this.keyframes = keyframes;
  }
}

// Smooth keyframes using exponential moving average
export function smoothKeyframes(keyframes: Keyframe[], strength: number = 0.4): Keyframe[] {
  if (keyframes.length < 3) return JSON.parse(JSON.stringify(keyframes));
  
  // Clamp strength
  strength = Math.max(0, Math.min(1, strength));
  const alpha = 1 - strength; // Lower alpha = more smoothing
  
  // Deep copy keyframes to avoid mutation issues
  const result: Keyframe[] = JSON.parse(JSON.stringify(keyframes));
  
  // Build a map of circle trajectories
  const trajectories = new Map<number, { 
    x: number[]; 
    y: number[]; 
    r: number[];
    frameIndices: number[];
  }>();
  
  // Collect all positions for each circle
  for (let i = 0; i < result.length; i++) {
    for (const circle of result[i].circles) {
      if (!trajectories.has(circle.id)) {
        trajectories.set(circle.id, { x: [], y: [], r: [], frameIndices: [] });
      }
      const traj = trajectories.get(circle.id)!;
      traj.x.push(circle.x);
      traj.y.push(circle.y);
      traj.r.push(circle.r);
      traj.frameIndices.push(i);
    }
  }
  
  // Apply bidirectional exponential smoothing to each trajectory
  for (const [_id, traj] of trajectories) {
    if (traj.x.length < 3) continue;
    
    // Bidirectional smoothing for zero-lag filtering
    traj.x = exponentialSmoothBidirectional(traj.x, alpha);
    traj.y = exponentialSmoothBidirectional(traj.y, alpha);
    traj.r = exponentialSmoothBidirectional(traj.r, alpha);
  }
  
  // Apply smoothed values back to keyframes
  for (let frameIdx = 0; frameIdx < result.length; frameIdx++) {
    for (const circle of result[frameIdx].circles) {
      const traj = trajectories.get(circle.id);
      if (!traj) continue;
      
      // Find which index in trajectory corresponds to this frame
      const trajIdx = traj.frameIndices.indexOf(frameIdx);
      if (trajIdx === -1) continue;
      
      circle.x = traj.x[trajIdx];
      circle.y = traj.y[trajIdx];
      circle.r = Math.max(5, traj.r[trajIdx]);
    }
  }
  
  return result;
}

// Simple exponential smoothing (forward pass)
function exponentialSmooth(values: number[], alpha: number): number[] {
  if (values.length === 0) return [];
  
  const result = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(alpha * values[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

// Bidirectional exponential smoothing for zero-lag filtering
function exponentialSmoothBidirectional(values: number[], alpha: number): number[] {
  if (values.length < 2) return values;
  
  // Forward pass
  const forward = exponentialSmooth(values, alpha);
  
  // Backward pass
  const reversed = [...values].reverse();
  const backwardReversed = exponentialSmooth(reversed, alpha);
  const backward = backwardReversed.reverse();
  
  // Average forward and backward
  return forward.map((v, i) => (v + backward[i]) / 2);
}

// Apply smoothing to AnimationData
export function smoothAnimationData(data: AnimationData, strength: number = 0.4): AnimationData {
  return {
    ...data,
    keyframes: smoothKeyframes(data.keyframes, strength),
  };
}

// Save animation to file
export function saveAnimation(data: AnimationData, name?: string): void {
  const json = JSON.stringify(data);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name || data.name}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Load animation from file
export function loadAnimationFile(): Promise<AnimationData | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as AnimationData;
          if (data.keyframes && data.duration !== undefined) {
            resolve(data);
          } else {
            console.error('Invalid animation file');
            resolve(null);
          }
        } catch (err) {
          console.error('Failed to parse animation file:', err);
          resolve(null);
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  });
}
