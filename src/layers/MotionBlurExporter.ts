// Motion Blur Exporter
// Handles motion blur rendering with configurable samples

export interface MotionBlurSettings {
  enabled: boolean;
  samples: number; // 1-32 samples
  shutterAngle: number; // 0-360 degrees (180 is standard cinematic)
}

export const DEFAULT_MOTION_BLUR_SETTINGS: MotionBlurSettings = {
  enabled: false,
  samples: 5,
  shutterAngle: 180,
};

export class MotionBlurExporter {
  private settings: MotionBlurSettings;
  
  constructor(settings?: Partial<MotionBlurSettings>) {
    this.settings = { ...DEFAULT_MOTION_BLUR_SETTINGS, ...settings };
  }
  
  getSettings(): MotionBlurSettings {
    return { ...this.settings };
  }
  
  updateSettings(settings: Partial<MotionBlurSettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    // Clamp samples between 1 and 32
    this.settings.samples = Math.max(1, Math.min(32, this.settings.samples));
    
    // Clamp shutter angle between 0 and 360
    this.settings.shutterAngle = Math.max(0, Math.min(360, this.settings.shutterAngle));
  }
  
  /**
   * Render a frame with motion blur
   * @param canvas - Canvas to render to
   * @param renderFrame - Function that renders a frame at a specific time
   * @param centerTime - Center time of the frame (ms)
   * @param frameInterval - Time between frames (ms)
   */
  async renderFrame(
    canvas: HTMLCanvasElement,
    renderFrame: (time: number) => void,
    centerTime: number,
    frameInterval: number
  ): Promise<void> {
    if (!this.settings.enabled || this.settings.samples <= 1) {
      // No motion blur, just render normally
      renderFrame(centerTime);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Calculate time window for motion blur
    // shutterAngle of 180 degrees = 50% of frame time (standard cinematic)
    // shutterAngle of 360 degrees = 100% of frame time (maximum blur)
    const shutterFraction = this.settings.shutterAngle / 360;
    const timeWindow = frameInterval * shutterFraction;
    
    // Create accumulation buffer
    const width = canvas.width;
    const height = canvas.height;
    const accumBuffer = new Float32Array(width * height * 4); // RGBA
    
    // Render and accumulate sub-frames
    for (let i = 0; i < this.settings.samples; i++) {
      // Distribute samples evenly across the time window
      // Center the samples around centerTime
      const t = (i / (this.settings.samples - 1)) - 0.5; // -0.5 to 0.5
      const sampleTime = centerTime + (t * timeWindow);
      
      // Render this sub-frame
      renderFrame(sampleTime);
      
      // Get pixel data
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;
      
      // Accumulate into buffer
      for (let j = 0; j < pixels.length; j++) {
        accumBuffer[j] += pixels[j];
      }
    }
    
    // Average the accumulated samples
    const imageData = ctx.createImageData(width, height);
    for (let i = 0; i < accumBuffer.length; i++) {
      imageData.data[i] = Math.round(accumBuffer[i] / this.settings.samples);
    }
    
    // Put the blurred frame back
    ctx.putImageData(imageData, 0, 0);
  }
  
  /**
   * Calculate estimated render time multiplier
   * @returns multiplier (e.g., 5 samples = 5x render time)
   */
  getTimeMultiplier(): number {
    return this.settings.enabled ? this.settings.samples : 1;
  }
}
