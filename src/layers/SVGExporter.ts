import { Circle } from '../physics';
import { Layer, PaintLayer } from './types';

export interface SVGExportOptions {
  backgroundColor: string;
  stencilMargin: number; // margin between circles for stencil cutting
}

const defaultOptions: SVGExportOptions = {
  backgroundColor: '#ebe0cc',
  stencilMargin: 10,
};

// Convert HSL color string to hex
function hslToHex(hslString: string): string {
  const match = hslString.match(/hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
  if (!match) return '#000000';
  
  const h = parseFloat(match[1]);
  const s = parseFloat(match[2]) / 100;
  const l = parseFloat(match[3]) / 100;
  
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  
  const r = Math.round(f(0) * 255);
  const g = Math.round(f(8) * 255);
  const b = Math.round(f(4) * 255);
  
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Check if a circle intersects the canvas bounds
function circleIntersectsCanvas(c: Circle, width: number, height: number): boolean {
  const left = c.x - c.r;
  const right = c.x + c.r;
  const top = c.y - c.r;
  const bottom = c.y + c.r;
  return !(right < 0 || left > width || bottom < 0 || top > height);
}

// Check if two circles overlap with a margin
function circlesOverlapWithMargin(a: Circle, b: Circle, margin: number): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = a.r + b.r + margin;
  return dist < minDist;
}

// Generate SVG content for a set of circles
function generateSVGContent(
  circles: Circle[],
  width: number,
  height: number,
  layers: Layer[],
  options: SVGExportOptions
): string {
  let svg = `<?xml version="1.0" standalone="no"?>\n`;
  svg += `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" version="1.1">\n`;
  svg += `  <rect x="0" y="0" width="${width}" height="${height}" fill="${options.backgroundColor}"/>\n`;
  
  // Group circles by layer and render in layer order
  for (const layer of layers) {
    if (layer.type !== 'circles' || !layer.visible) continue;
    
    const layerCircles = circles.filter(c => c.layerId === layer.id);
    
    if (layerCircles.length === 0) continue;
    
    // Add layer group with opacity
    if (layer.opacity < 1) {
      svg += `  <g opacity="${layer.opacity.toFixed(3)}">\n`;
    }
    
    for (const c of layerCircles) {
      if (!circleIntersectsCanvas(c, width, height)) continue;
      
      const hexColor = hslToHex(c.color);
      svg += `    <circle cx="${c.x.toFixed(2)}" cy="${c.y.toFixed(2)}" r="${c.r.toFixed(2)}" fill="${hexColor}" stroke="none"/>\n`;
    }
    
    if (layer.opacity < 1) {
      svg += `  </g>\n`;
    }
  }
  
  svg += `</svg>\n`;
  return svg;
}

// Generate SVG for a single stencil layer
function generateStencilLayerSVG(
  circles: Circle[],
  width: number,
  height: number,
  options: SVGExportOptions
): string {
  let svg = `<?xml version="1.0" standalone="no"?>\n`;
  svg += `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" version="1.1">\n`;
  svg += `  <rect x="0" y="0" width="${width}" height="${height}" fill="${options.backgroundColor}"/>\n`;
  
  for (const c of circles) {
    const hexColor = hslToHex(c.color);
    svg += `  <circle cx="${c.x.toFixed(2)}" cy="${c.y.toFixed(2)}" r="${c.r.toFixed(2)}" fill="${hexColor}" stroke="none"/>\n`;
  }
  
  svg += `</svg>\n`;
  return svg;
}

// Export all circles as a single SVG
export function exportSingleSVG(
  circles: Circle[],
  width: number,
  height: number,
  layers: Layer[],
  options: Partial<SVGExportOptions> = {}
): void {
  const opts = { ...defaultOptions, ...options };
  
  // Filter to only visible circles on visible layers
  const visibleCircles = circles.filter(c => {
    const layer = layers.find(l => l.id === c.layerId);
    return layer?.visible && circleIntersectsCanvas(c, width, height);
  });
  
  const svgContent = generateSVGContent(visibleCircles, width, height, layers, opts);
  
  // Create blob and download
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `circles-export-${Date.now()}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export circles as stencil layers (non-overlapping groups with margin)
export function exportStencils(
  circles: Circle[],
  width: number,
  height: number,
  layers: Layer[],
  options: Partial<SVGExportOptions> = {}
): void {
  const opts = { ...defaultOptions, ...options };
  
  // Filter to only visible circles on visible layers that intersect canvas
  const visibleCircles = circles.filter(c => {
    const layer = layers.find(l => l.id === c.layerId);
    return layer?.visible && circleIntersectsCanvas(c, width, height);
  });
  
  if (visibleCircles.length === 0) {
    alert('No circles to export!');
    return;
  }
  
  // Clone circles to process (we'll remove them as we assign to layers)
  let circlesToProcess = [...visibleCircles];
  const stencilLayers: Circle[][] = [];
  
  // Greedy algorithm: assign circles to layers where they don't overlap
  while (circlesToProcess.length > 0) {
    const currentLayer: Circle[] = [];
    
    // Process from end to beginning (so we can splice efficiently)
    for (let i = circlesToProcess.length - 1; i >= 0; i--) {
      const candidate = circlesToProcess[i];
      
      // Check if this circle overlaps with any already placed in current layer
      let canPlace = true;
      for (const placed of currentLayer) {
        if (circlesOverlapWithMargin(candidate, placed, opts.stencilMargin)) {
          canPlace = false;
          break;
        }
      }
      
      if (canPlace) {
        currentLayer.push(candidate);
        circlesToProcess.splice(i, 1);
      }
    }
    
    if (currentLayer.length > 0) {
      stencilLayers.push(currentLayer);
    } else {
      // Safety break - shouldn't happen but prevents infinite loop
      break;
    }
  }
  
  // Create a zip-like download with multiple files
  // For simplicity, we'll download each layer separately with a small delay
  // Or create a combined info file
  
  const timestamp = Date.now();
  
  // Download each layer
  stencilLayers.forEach((layer, index) => {
    const svgContent = generateStencilLayerSVG(layer, width, height, opts);
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stencil-layer-${index + 1}-of-${stencilLayers.length}-${timestamp}.svg`;
    document.body.appendChild(link);
    
    // Stagger downloads slightly to avoid browser blocking
    setTimeout(() => {
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, index * 200);
  });
  
  // Show info about export
  console.log(`Exported ${stencilLayers.length} stencil layers:`);
  stencilLayers.forEach((layer, i) => {
    console.log(`  Layer ${i + 1}: ${layer.length} circles`);
  });
}

// Get info about stencil layers without exporting (for UI preview)
export function getStencilLayerInfo(
  circles: Circle[],
  width: number,
  height: number,
  layers: Layer[],
  stencilMargin: number = 10
): { layerCount: number; circleCounts: number[] } {
  const visibleCircles = circles.filter(c => {
    const layer = layers.find(l => l.id === c.layerId);
    return layer?.visible && circleIntersectsCanvas(c, width, height);
  });
  
  let circlesToProcess = [...visibleCircles];
  const circleCounts: number[] = [];
  
  while (circlesToProcess.length > 0) {
    const currentLayer: Circle[] = [];
    
    for (let i = circlesToProcess.length - 1; i >= 0; i--) {
      const candidate = circlesToProcess[i];
      let canPlace = true;
      
      for (const placed of currentLayer) {
        if (circlesOverlapWithMargin(candidate, placed, stencilMargin)) {
          canPlace = false;
          break;
        }
      }
      
      if (canPlace) {
        currentLayer.push(candidate);
        circlesToProcess.splice(i, 1);
      }
    }
    
    if (currentLayer.length > 0) {
      circleCounts.push(currentLayer.length);
    } else {
      break;
    }
  }
  
  return {
    layerCount: circleCounts.length,
    circleCounts,
  };
}
