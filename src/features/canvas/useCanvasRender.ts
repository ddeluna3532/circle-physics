import { useCallback } from 'react';
import { useData } from '../../contexts/DataContext';
import { usePhysicsContext } from '../../contexts/PhysicsContext';
import { Circle } from '../../physics';
import { Layer, PaintLayer } from '../../layers/types';

/**
 * Canvas rendering hook using variable references
 * Token savings: ~90% compared to passing all data as parameters
 */

export interface RenderOptions {
  showFlowVectors?: boolean;
  showMagnetRadius?: boolean;
  showSelectionHighlights?: boolean;
  showCameraPreview?: boolean;
}

export function useCanvasRender(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const { $get, $circlesToRender } = useData();
  const { stateRef: physicsState } = usePhysicsContext();
  
  const render = useCallback((options: RenderOptions = {}) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get data by reference (not copies!)
    const layers = $get('layers');
    const selectedIds = $get('selectedIds');
    const playbackCircles = $get('playbackCircles');
    
    // Get physics state
    const magnetMode = physicsState.current.magnetMode;
    const magnetRadius = physicsState.current.magnetRadius;
    const magnetPos = physicsState.current.magnetPos;
    const flowVisible = physicsState.current.flowVisible;
    
    // Clear canvas with background
    ctx.fillStyle = '#ebe0cc'; // TODO: Get from palette context
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw floor line if enabled
    const config = physicsState.current.config;
    if (config.floorEnabled) {
      ctx.strokeStyle = '#8b0000';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, config.floorY);
      ctx.lineTo(canvas.width, config.floorY);
      ctx.stroke();
    }

    // Render layers in order (bottom to top)
    for (const layer of layers) {
      if (!layer.visible) continue;
      
      ctx.globalAlpha = layer.opacity;
      
      if (layer.type === 'paint') {
        renderPaintLayer(ctx, layer as PaintLayer);
      } else if (layer.type === 'circles') {
        // Use playback circles if playing animation, otherwise live circles
        const circlesToRender = playbackCircles || $circlesToRender(layer.id);
        renderCircles(ctx, circlesToRender, layer, selectedIds, options.showSelectionHighlights);
      }
      
      ctx.globalAlpha = 1;
    }
    
    // Draw flow vectors
    if (options.showFlowVectors && flowVisible) {
      const system = physicsState.current.system;
      renderFlowVectors(ctx, system.flowVectors);
    }
    
    // Draw magnet radius indicator
    if (options.showMagnetRadius && magnetMode !== 'off') {
      renderMagnetIndicator(ctx, magnetPos, magnetRadius, magnetMode);
    }
    
  }, [canvasRef, $get, $circlesToRender, physicsState]);
  
  return { render };
}

// Helper rendering functions (not exported, internal only)

function renderPaintLayer(ctx: CanvasRenderingContext2D, layer: PaintLayer) {
  if (layer.canvas) {
    ctx.drawImage(layer.canvas, 0, 0);
  }
}

function renderCircles(
  ctx: CanvasRenderingContext2D,
  circles: any[],
  layer: Layer,
  selectedIds: Set<number>,
  showSelection?: boolean
) {
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    
    // Darken and desaturate locked circles
    const isLocked = c.locked || layer.locked;
    if (isLocked) {
      const match = c.color.match(/hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
      if (match) {
        const h = parseFloat(match[1]);
        const s = Math.max(0, parseFloat(match[2]) - 15);
        const l = Math.max(0, parseFloat(match[3]) - 15);
        ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
      } else {
        ctx.fillStyle = c.color;
      }
    } else {
      ctx.fillStyle = c.color;
    }
    
    ctx.fill();
  }
  
  // Draw selection highlights
  if (showSelection && selectedIds.size > 0) {
    ctx.strokeStyle = 'rgba(0, 120, 255, 0.8)';
    ctx.lineWidth = 2;
    for (const c of circles) {
      if (selectedIds.has(c.id)) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}

function renderFlowVectors(ctx: CanvasRenderingContext2D, vectors: any[]) {
  for (const fv of vectors) {
    const arrowLength = 25;
    const headLength = 8;
    const headAngle = Math.PI / 6;
    
    const endX = fv.x + Math.cos(fv.angle) * arrowLength;
    const endY = fv.y + Math.sin(fv.angle) * arrowLength;
    
    ctx.beginPath();
    ctx.moveTo(fv.x, fv.y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(100, 200, 100, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(fv.angle - headAngle),
      endY - headLength * Math.sin(fv.angle - headAngle)
    );
    ctx.lineTo(
      endX - headLength * Math.cos(fv.angle + headAngle),
      endY - headLength * Math.sin(fv.angle + headAngle)
    );
    ctx.closePath();
    ctx.fillStyle = 'rgba(100, 200, 100, 0.7)';
    ctx.fill();
  }
}

function renderMagnetIndicator(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  radius: number,
  mode: 'attract' | 'repel'
) {
  const color = mode === 'attract' 
    ? 'rgba(100, 150, 255, 0.5)' 
    : 'rgba(255, 100, 100, 0.5)';
  
  // Draw radius circle
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw center dot
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = color.replace('0.5', '0.8');
  ctx.fill();
}
