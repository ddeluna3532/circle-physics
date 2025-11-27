export interface BrushSettings {
  size: number;
  opacity: number;
  flow: number;          // How much paint is deposited per stroke
  wetness: number;       // How much the paint spreads/bleeds
  bleedStrength: number; // How much colors blend into each other
}

export interface PaintParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: { r: number; g: number; b: number; a: number };
  life: number;
  maxLife: number;
  size: number;
}

export class WatercolorBrush {
  private particles: PaintParticle[] = [];
  private settings: BrushSettings;
  
  constructor() {
    this.settings = {
      size: 20,
      opacity: 0.6,
      flow: 0.3,
      wetness: 0.5,
      bleedStrength: 0.3,
    };
  }
  
  setSettings(settings: Partial<BrushSettings>) {
    this.settings = { ...this.settings, ...settings };
  }
  
  getSettings(): BrushSettings {
    return { ...this.settings };
  }
  
  // Parse HSL color to RGB
  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    return {
      r: Math.round(f(0) * 255),
      g: Math.round(f(8) * 255),
      b: Math.round(f(4) * 255),
    };
  }
  
  // Add paint stroke at position
  stroke(
    ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string, // HSL format
    pressure: number = 1
  ) {
    const { size, opacity, flow, wetness } = this.settings;
    
    // Parse HSL color
    const match = color.match(/hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
    if (!match) return;
    
    const rgb = this.hslToRgb(
      parseFloat(match[1]),
      parseFloat(match[2]),
      parseFloat(match[3])
    );
    
    const effectiveSize = size * pressure;
    const effectiveOpacity = opacity * flow * pressure;
    
    // Main brush dab with soft edges
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, effectiveSize);
    gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${effectiveOpacity})`);
    gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${effectiveOpacity * 0.5})`);
    gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, effectiveSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Add particles for bleeding/spreading effect
    if (wetness > 0) {
      const numParticles = Math.floor(wetness * 5);
      for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * effectiveSize * 0.5;
        this.particles.push({
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * wetness * 2,
          vy: (Math.random() - 0.5) * wetness * 2 + wetness * 0.5, // slight downward bias
          color: { ...rgb, a: effectiveOpacity * 0.3 },
          life: 1,
          maxLife: 30 + Math.random() * 30,
          size: effectiveSize * 0.2 * Math.random(),
        });
      }
    }
  }
  
  // Update and render bleeding particles
  updateBleed(ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D) {
    const { bleedStrength } = this.settings;
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      
      // Slow down
      p.vx *= 0.98;
      p.vy *= 0.98;
      
      // Age particle
      p.life -= 1 / p.maxLife;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      
      // Render particle
      const alpha = p.color.a * p.life * bleedStrength;
      ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Clear all particles
  clearParticles() {
    this.particles = [];
  }
  
  hasActiveParticles(): boolean {
    return this.particles.length > 0;
  }
}

// Interpolate between two points for smooth strokes
export function interpolateStroke(
  brush: WatercolorBrush,
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  spacing: number = 0.25
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(1, Math.floor(dist / (brush.getSettings().size * spacing)));
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + dx * t;
    const y = y1 + dy * t;
    brush.stroke(ctx, x, y, color);
  }
}
