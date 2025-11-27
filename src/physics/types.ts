export interface Circle {
  id: number;
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  mass: number;
  color: string;
  isDragging: boolean;
  locked: boolean;
  layerId: string;
}

export interface FlowVector {
  id: number;
  x: number;
  y: number;
  angle: number; // radians
}

export interface PhysicsConfig {
  gravityEnabled: boolean;
  gravityStrength: number;
  floorEnabled: boolean;
  floorY: number;
  wallsEnabled: boolean;
  damping: number;
}

export function createCircle(
  x: number,
  y: number,
  r: number,
  color: string,
  layerId: string = ''
): Circle {
  return {
    id: Math.random(),
    x,
    y,
    r,
    vx: 0,
    vy: 0,
    mass: r * r,
    color,
    isDragging: false,
    locked: false,
    layerId,
  };
}

export function circleContains(c: Circle, px: number, py: number): boolean {
  const dx = px - c.x;
  const dy = py - c.y;
  return dx * dx + dy * dy <= c.r * c.r;
}
