import { Circle, FlowVector, PhysicsConfig } from "./types";
import { Quadtree } from "./Quadtree";

export class PhysicsSystem {
  circles: Circle[] = [];
  flowVectors: FlowVector[] = [];
  config: PhysicsConfig;
  bounds: { x: number; y: number; width: number; height: number };
  
  // Flow field settings
  flowStrength: number = 0.15;
  flowRadius: number = 100;
  
  // Collision settings
  collisionIterations: number = 3;      // More iterations = more accurate
  useQuadtree: boolean = true;          // Use spatial partitioning
  restitution: number = 0.6;            // Bounciness (0 = no bounce, 1 = perfect bounce)
  positionCorrection: number = 0.8;     // How much to correct overlaps (0-1)
  slop: number = 0.1;                   // Allowed penetration before correction
  
  // Callback to check if a circle should be affected by physics
  isAffected: (c: Circle) => boolean = (c) => !c.locked && !c.isDragging;

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
  
  setAffectedCheck(fn: (c: Circle) => boolean): void {
    this.isAffected = fn;
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
      if (!this.isAffected(c)) continue;
      
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
    const startTime = performance.now();
    const maxTime = 16; // Max 16ms per physics update (target 60fps)
    
    this.applyGravity();
    
    // Run collision detection multiple times for accuracy, but respect time budget
    for (let iter = 0; iter < this.collisionIterations; iter++) {
      // Check time budget before each iteration
      if (performance.now() - startTime > maxTime) {
        break;
      }
      
      if (this.useQuadtree && this.circles.length > 50) {
        this.handleOverlapsQuadtree();
      } else {
        this.handleOverlapsBruteForce();
      }
    }
    
    this.updatePositions();
    this.handleBoundaries();
  }

  private applyGravity(): void {
    if (!this.config.gravityEnabled) return;

    for (const c of this.circles) {
      if (!this.isAffected(c)) continue;
      // Smaller circles fall faster (less air resistance feel)
      const gravityAccel = (2.0 * this.config.gravityStrength) / Math.max(c.r, 1);
      c.vy += gravityAccel;
    }
  }

  // Resolve collision between two circles
  private resolveCollision(a: Circle, b: Circle, aAffected: boolean, bAffected: boolean): void {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.001) dist = 0.001; // Prevent division by zero
    
    const overlap = a.r + b.r - dist;
    if (overlap <= 0) return; // No collision
    
    // Collision normal (from a to b)
    const nx = dx / dist;
    const ny = dy / dist;
    
    // Inverse masses (0 if not affected = infinite mass)
    const invMassA = aAffected ? 1 / a.mass : 0;
    const invMassB = bAffected ? 1 / b.mass : 0;
    const totalInvMass = invMassA + invMassB;
    
    if (totalInvMass === 0) return; // Both immovable
    
    // Position correction - directly separate circles
    const correctionMag = Math.max(overlap - this.slop, 0) * this.positionCorrection / totalInvMass;
    const correctionX = nx * correctionMag;
    const correctionY = ny * correctionMag;
    
    if (aAffected) {
      a.x -= correctionX * invMassA;
      a.y -= correctionY * invMassA;
    }
    if (bAffected) {
      b.x += correctionX * invMassB;
      b.y += correctionY * invMassB;
    }
    
    // Relative velocity
    const relVx = b.vx - a.vx;
    const relVy = b.vy - a.vy;
    
    // Relative velocity along collision normal
    const relVelNormal = relVx * nx + relVy * ny;
    
    // Don't resolve if velocities are separating
    if (relVelNormal > 0) return;
    
    // Impulse magnitude
    const impulseMag = -(1 + this.restitution) * relVelNormal / totalInvMass;
    
    // Apply impulse
    const impulseX = nx * impulseMag;
    const impulseY = ny * impulseMag;
    
    if (aAffected) {
      a.vx -= impulseX * invMassA;
      a.vy -= impulseY * invMassA;
    }
    if (bAffected) {
      b.vx += impulseX * invMassB;
      b.vy += impulseY * invMassB;
    }
  }

  // O(n²) collision detection - used for small numbers of circles
  private handleOverlapsBruteForce(): void {
    for (let i = 0; i < this.circles.length; i++) {
      const a = this.circles[i];
      const aAffected = this.isAffected(a);
      
      for (let j = i + 1; j < this.circles.length; j++) {
        const b = this.circles[j];
        const bAffected = this.isAffected(b);
        
        // Skip if neither can be affected
        if (!aAffected && !bAffected) continue;
        
        // Quick distance check before full collision
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDist = a.r + b.r;
        
        // Skip if definitely not colliding (square distance check)
        if (dx * dx + dy * dy > minDist * minDist) continue;
        
        this.resolveCollision(a, b, aAffected, bAffected);
      }
    }
  }

  // O(n log n) collision detection using quadtree
  private handleOverlapsQuadtree(): void {
    // Build quadtree
    const tree = Quadtree.build(this.circles, this.bounds);
    
    // Track checked pairs to avoid double-checking
    const checked = new Set<string>();
    
    for (const a of this.circles) {
      const aAffected = this.isAffected(a);
      
      // Query potential collisions
      const candidates = tree.query(a);
      
      for (const b of candidates) {
        const bAffected = this.isAffected(b);
        
        // Skip if neither can be affected
        if (!aAffected && !bAffected) continue;
        
        // Create unique pair key (smaller id first)
        const pairKey = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
        if (checked.has(pairKey)) continue;
        checked.add(pairKey);
        
        // Quick distance check
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDist = a.r + b.r;
        
        if (dx * dx + dy * dy > minDist * minDist) continue;
        
        this.resolveCollision(a, b, aAffected, bAffected);
      }
    }
  }

  private updatePositions(): void {
    for (const c of this.circles) {
      if (!this.isAffected(c)) continue;

      c.vx *= this.config.damping;
      c.vy *= this.config.damping;

      c.x += c.vx;
      c.y += c.vy;
    }
  }

  private handleBoundaries(): void {
    const { x: bx, y: by, width, height } = this.bounds;

    for (const c of this.circles) {
      if (!this.isAffected(c)) continue;

      // Floor
      if (this.config.floorEnabled && c.y + c.r > this.config.floorY) {
        c.y = this.config.floorY - c.r;
        if (c.vy > 0) c.vy *= -this.restitution;
      }

      // Walls
      if (this.config.wallsEnabled) {
        if (c.x - c.r < bx) {
          c.x = bx + c.r;
          if (c.vx < 0) c.vx *= -this.restitution;
        }
        if (c.x + c.r > bx + width) {
          c.x = bx + width - c.r;
          if (c.vx > 0) c.vx *= -this.restitution;
        }
        if (c.y - c.r < by) {
          c.y = by + c.r;
          if (c.vy < 0) c.vy *= -this.restitution;
        }
        if (c.y + c.r > by + height) {
          c.y = by + height - c.r;
          if (c.vy > 0) c.vy *= -this.restitution;
        }
      }
    }
  }
}
