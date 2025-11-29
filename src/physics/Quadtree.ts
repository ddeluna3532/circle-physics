import { Circle } from './types';

interface Rect {
  x: number;      // center x
  y: number;      // center y
  hw: number;     // half width
  hh: number;     // half height
}

export class Quadtree {
  private boundary: Rect;
  private capacity: number;
  private circles: Circle[] = [];
  private divided: boolean = false;
  
  private northeast: Quadtree | null = null;
  private northwest: Quadtree | null = null;
  private southeast: Quadtree | null = null;
  private southwest: Quadtree | null = null;
  
  constructor(boundary: Rect, capacity: number = 8) {
    this.boundary = boundary;
    this.capacity = capacity;
  }
  
  // Check if a circle intersects this quadrant
  private intersects(c: Circle): boolean {
    const { x, y, hw, hh } = this.boundary;
    // Circle-rectangle intersection
    const closestX = Math.max(x - hw, Math.min(c.x, x + hw));
    const closestY = Math.max(y - hh, Math.min(c.y, y + hh));
    const dx = c.x - closestX;
    const dy = c.y - closestY;
    return dx * dx + dy * dy <= c.r * c.r;
  }
  
  // Check if a point is within this quadrant
  private contains(px: number, py: number): boolean {
    const { x, y, hw, hh } = this.boundary;
    return px >= x - hw && px <= x + hw && py >= y - hh && py <= y + hh;
  }
  
  // Subdivide into 4 quadrants
  private subdivide(): void {
    const { x, y, hw, hh } = this.boundary;
    const qhw = hw / 2;
    const qhh = hh / 2;
    
    this.northeast = new Quadtree({ x: x + qhw, y: y - qhh, hw: qhw, hh: qhh }, this.capacity);
    this.northwest = new Quadtree({ x: x - qhw, y: y - qhh, hw: qhw, hh: qhh }, this.capacity);
    this.southeast = new Quadtree({ x: x + qhw, y: y + qhh, hw: qhw, hh: qhh }, this.capacity);
    this.southwest = new Quadtree({ x: x - qhw, y: y + qhh, hw: qhw, hh: qhh }, this.capacity);
    
    this.divided = true;
    
    // Re-insert existing circles into children
    for (const c of this.circles) {
      this.insertIntoChildren(c);
    }
    this.circles = [];
  }
  
  private insertIntoChildren(c: Circle): void {
    if (this.northeast!.intersects(c)) this.northeast!.insert(c);
    if (this.northwest!.intersects(c)) this.northwest!.insert(c);
    if (this.southeast!.intersects(c)) this.southeast!.insert(c);
    if (this.southwest!.intersects(c)) this.southwest!.insert(c);
  }
  
  // Insert a circle into the quadtree
  insert(c: Circle): void {
    // Ignore if circle doesn't intersect this quadrant
    if (!this.intersects(c)) return;
    
    if (!this.divided) {
      if (this.circles.length < this.capacity) {
        this.circles.push(c);
        return;
      }
      this.subdivide();
    }
    
    this.insertIntoChildren(c);
  }
  
  // Query all circles that could potentially collide with the given circle
  query(c: Circle, found: Set<Circle> = new Set()): Set<Circle> {
    if (!this.intersects(c)) return found;
    
    for (const other of this.circles) {
      if (other !== c) {
        found.add(other);
      }
    }
    
    if (this.divided) {
      this.northeast!.query(c, found);
      this.northwest!.query(c, found);
      this.southeast!.query(c, found);
      this.southwest!.query(c, found);
    }
    
    return found;
  }
  
  // Clear the quadtree
  clear(): void {
    this.circles = [];
    this.divided = false;
    this.northeast = null;
    this.northwest = null;
    this.southeast = null;
    this.southwest = null;
  }
  
  // Build quadtree from array of circles
  static build(circles: Circle[], bounds: { x: number; y: number; width: number; height: number }): Quadtree {
    const boundary: Rect = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
      hw: bounds.width / 2,
      hh: bounds.height / 2,
    };
    
    const tree = new Quadtree(boundary);
    for (const c of circles) {
      tree.insert(c);
    }
    return tree;
  }
}
