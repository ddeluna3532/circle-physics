import { Circle, FlowVector, PhysicsConfig } from "./types";

export class PhysicsSystem {
  circles: Circle[] = [];
  flowVectors: FlowVector[] = [];
  config: PhysicsConfig;
  bounds: { x: number; y: number; width: number; height: number };
  
  // Flow field settings
  flowStrength: number = 0.15;
  flowRadius: number = 100;

  constructor() {
    this.config = {
      gravityEnabled: false,
      gravityStrength: 0.5,
      floorEnabled: false,
      floorY: 500,
      wallsEnabled: true,
      damping: 0.94,
    };
    this.bounds = { x: 0, y: 0, width: 800, height: 600 };
  }

  setBounds(x: number, y: number, width: number, height: number) {
    this.bounds = { x, y, width, height };
  }

  // Flow vector methods
  addFlowVector(x: number, y: number, angle: number): void {
    this.flowVectors.push({
      id: Math.random(),
      x,
      y,
      angle,
    });
  }

  removeFlowVectorAt(x: number, y: number, eraseRadius: number = 80): boolean {
    for (let i = this.flowVectors.length - 1; i >= 0; i--) {
      const fv = this.flowVectors[i];
      const dx = x - fv.x;
      const dy = y - fv.y;
      if (dx * dx + dy * dy < eraseRadius * eraseRadius) {
        this.flowVectors.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  clearFlowField(): void {
    this.flowVectors = [];
  }

  applyFlowField(): void {
    for (const c of this.circles) {
      if (c.locked || c.isDragging) continue;
      
      for (const fv of this.flowVectors) {
        const dx = c.x - fv.x;
        const dy = c.y - fv.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.flowRadius) {
          const dirX = Math.cos(fv.angle);
          const dirY = Math.sin(fv.angle);
          c.vx += dirX * this.flowStrength;
          c.vy += dirY * this.flowStrength;
        }
      }
    }
  }

  addCircle(circle: Circle): boolean {
    // Check for overlaps with existing circles
    for (const other of this.circles) {
      const dx = circle.x - other.x;
      const dy = circle.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < circle.r + other.r) {
        return false; // Can't place here
      }
    }
    this.circles.push(circle);
    return true;
  }

  removeCircle(id: number): void {
    this.circles = this.circles.filter((c) => c.id !== id);
  }

  clear(): void {
    this.circles = [];
  }

  getCircleAt(x: number, y: number): Circle | null {
    // Search in reverse (top circles first)
    for (let i = this.circles.length - 1; i >= 0; i--) {
      const c = this.circles[i];
      const dx = x - c.x;
      const dy = y - c.y;
      if (dx * dx + dy * dy <= c.r * c.r) {
        return c;
      }
    }
    return null;
  }

  update(): void {
    this.applyGravity();
    this.handleOverlaps();
    this.updatePositions();
    this.handleBoundaries();
  }

  private applyGravity(): void {
    if (!this.config.gravityEnabled) return;

    for (const c of this.circles) {
      if (c.locked || c.isDragging) continue;
      // Smaller circles fall faster (less air resistance feel)
      const gravityAccel = (2.0 * this.config.gravityStrength) / Math.max(c.r, 1);
      c.vy += gravityAccel;
    }
  }

  private handleOverlaps(): void {
    for (let i = 0; i < this.circles.length; i++) {
      const a = this.circles[i];
      for (let j = i + 1; j < this.circles.length; j++) {
        const b = this.circles[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.01) dist = 0.01;

        const overlap = a.r + b.r - dist;
        if (overlap > 0.5) {
          const nx = dx / dist;
          const ny = dy / dist;
          const pushStrength = 0.5;
          const totalMass = a.mass + b.mass;

          if (!a.locked && !a.isDragging) {
            a.vx -= nx * overlap * pushStrength * (b.mass / totalMass);
            a.vy -= ny * overlap * pushStrength * (b.mass / totalMass);
          }
          if (!b.locked && !b.isDragging) {
            b.vx += nx * overlap * pushStrength * (a.mass / totalMass);
            b.vy += ny * overlap * pushStrength * (a.mass / totalMass);
          }
        }
      }
    }
  }

  private updatePositions(): void {
    for (const c of this.circles) {
      if (c.locked || c.isDragging) continue;

      c.vx *= this.config.damping;
      c.vy *= this.config.damping;

      c.x += c.vx;
      c.y += c.vy;
    }
  }

  private handleBoundaries(): void {
    const { x: bx, y: by, width, height } = this.bounds;
    const bounce = -0.6;

    for (const c of this.circles) {
      if (c.locked || c.isDragging) continue;

      // Floor
      if (this.config.floorEnabled && c.y + c.r > this.config.floorY) {
        c.y = this.config.floorY - c.r;
        if (c.vy > 0) c.vy *= bounce;
      }

      // Walls
      if (this.config.wallsEnabled) {
        if (c.x - c.r < bx) {
          c.x = bx + c.r;
          c.vx *= bounce;
        }
        if (c.x + c.r > bx + width) {
          c.x = bx + width - c.r;
          c.vx *= bounce;
        }
        if (c.y - c.r < by) {
          c.y = by + c.r;
          c.vy *= bounce;
        }
        if (c.y + c.r > by + height) {
          c.y = by + height - c.r;
          c.vy *= bounce;
        }
      }
    }
  }
}
