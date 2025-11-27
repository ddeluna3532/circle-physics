export type LayerType = 'circles' | 'paint';

export interface BaseLayer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface CircleLayer extends BaseLayer {
  type: 'circles';
}

export interface PaintLayer extends BaseLayer {
  type: 'paint';
  canvas: OffscreenCanvas | null;
  ctx: OffscreenCanvasRenderingContext2D | null;
}

export type Layer = CircleLayer | PaintLayer;

let layerIdCounter = 0;

export function createCircleLayer(name?: string): CircleLayer {
  return {
    id: `layer-${++layerIdCounter}`,
    name: name || `Circle Layer ${layerIdCounter}`,
    type: 'circles',
    visible: true,
    locked: false,
    opacity: 1,
  };
}

export function createPaintLayer(width: number, height: number, name?: string): PaintLayer {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  return {
    id: `layer-${++layerIdCounter}`,
    name: name || `Paint Layer ${layerIdCounter}`,
    type: 'paint',
    visible: true,
    locked: false,
    opacity: 1,
    canvas,
    ctx,
  };
}

export function resizePaintLayer(layer: PaintLayer, width: number, height: number): void {
  if (!layer.canvas || !layer.ctx) return;
  
  // Save current content
  const imageData = layer.ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
  
  // Resize
  layer.canvas.width = width;
  layer.canvas.height = height;
  
  // Restore content (will be clipped if smaller)
  layer.ctx.putImageData(imageData, 0, 0);
}
