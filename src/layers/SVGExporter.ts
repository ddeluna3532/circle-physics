import { Circle } from '../physics';
import { Layer } from './types';

export interface SVGExportOptions {
  backgroundColor: string;
  stencilMargin: number; // margin between circles for stencil cutting
  includeStencilLayers: boolean; // whether to include stencil separation layers
}

const defaultOptions: SVGExportOptions = {
  backgroundColor: '#ebe0cc',
  stencilMargin: 10,
  includeStencilLayers: true,
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

// Separate circles into non-overlapping stencil layers
function computeStencilLayers(circles: Circle[], margin: number): Circle[][] {
  let circlesToProcess = [...circles];
  const stencilLayers: Circle[][] = [];
  
  while (circlesToProcess.length > 0) {
    const currentLayer: Circle[] = [];
    
    for (let i = circlesToProcess.length - 1; i >= 0; i--) {
      const candidate = circlesToProcess[i];
      let canPlace = true;
      
      for (const placed of currentLayer) {
        if (circlesOverlapWithMargin(candidate, placed, margin)) {
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
      break;
    }
  }
  
  return stencilLayers;
}

// Export circles as a multi-layered SVG
// Includes: background, artwork layer (all circles), and stencil layers (non-overlapping groups)
export function exportSVG(
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
  
  // Compute stencil layers
  const stencilLayers = opts.includeStencilLayers 
    ? computeStencilLayers(visibleCircles, opts.stencilMargin)
    : [];
  
  // Build SVG with Inkscape-compatible layer structure
  let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`;
  svg += `<svg\n`;
  svg += `  width="${width}"\n`;
  svg += `  height="${height}"\n`;
  svg += `  viewBox="0 0 ${width} ${height}"\n`;
  svg += `  xmlns="http://www.w3.org/2000/svg"\n`;
  svg += `  xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape">\n`;
  
  // Background layer
  svg += `  <g inkscape:groupmode="layer" inkscape:label="Background" id="layer-background">\n`;
  svg += `    <rect x="0" y="0" width="${width}" height="${height}" fill="${opts.backgroundColor}"/>\n`;
  svg += `  </g>\n`;
  
  // Full artwork layer (all circles grouped by their original layers)
  svg += `  <g inkscape:groupmode="layer" inkscape:label="Artwork" id="layer-artwork">\n`;
  
  for (const layer of layers) {
    if (layer.type !== 'circles' || !layer.visible) continue;
    
    const layerCircles = visibleCircles.filter(c => c.layerId === layer.id);
    if (layerCircles.length === 0) continue;
    
    // Sub-group for each app layer
    const opacityAttr = layer.opacity < 1 ? ` opacity="${layer.opacity.toFixed(3)}"` : '';
    svg += `    <g id="artwork-${layer.id}"${opacityAttr}>\n`;
    
    for (const c of layerCircles) {
      const hexColor = hslToHex(c.color);
      svg += `      <circle cx="${c.x.toFixed(2)}" cy="${c.y.toFixed(2)}" r="${c.r.toFixed(2)}" fill="${hexColor}"/>\n`;
    }
    
    svg += `    </g>\n`;
  }
  
  svg += `  </g>\n`;
  
  // Stencil layers (each is a separate layer with non-overlapping circles)
  if (stencilLayers.length > 0) {
    stencilLayers.forEach((stencilCircles, index) => {
      const layerNum = index + 1;
      svg += `  <g inkscape:groupmode="layer" inkscape:label="Stencil ${layerNum} (${stencilCircles.length} circles)" id="layer-stencil-${layerNum}" style="display:none">\n`;
      
      for (const c of stencilCircles) {
        const hexColor = hslToHex(c.color);
        svg += `    <circle cx="${c.x.toFixed(2)}" cy="${c.y.toFixed(2)}" r="${c.r.toFixed(2)}" fill="${hexColor}"/>\n`;
      }
      
      svg += `  </g>\n`;
    });
    
    console.log(`SVG includes ${stencilLayers.length} stencil layers:`);
    stencilLayers.forEach((layer, i) => {
      console.log(`  Stencil ${i + 1}: ${layer.length} circles`);
    });
  }
  
  svg += `</svg>\n`;
  
  // Download
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `circles-${Date.now()}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
  
  const stencilLayers = computeStencilLayers(visibleCircles, stencilMargin);
  
  return {
    layerCount: stencilLayers.length,
    circleCounts: stencilLayers.map(l => l.length),
  };
}
