import { Circle } from '../physics';
import { Layer, CircleLayer, PaintLayer } from './types';

// Project data structure for saving/loading
export interface ProjectData {
  version: number;
  name: string;
  savedAt: string;
  
  // Canvas settings
  aspectRatio: string;
  
  // All circles
  circles: SavedCircle[];
  
  // All layers (without canvas data for paint layers)
  layers: SavedLayer[];
  activeLayerId: string;
  
  // Physics settings
  physics: {
    gravityEnabled: boolean;
    gravityStrength: number;
    floorEnabled: boolean;
    floorY: number;
    wallsEnabled: boolean;
    damping: number;
  };
  
  // Other settings
  settings: {
    brushSize: number;
    stickyEnabled: boolean;
    stickyStrength: number;
    clumpEnabled: boolean;
    spreadEnabled: boolean;
  };
  
  // Color palette
  palette: { h: number; s: number; l: number }[];
  selectedSwatch: number;
}

// Simplified circle for JSON (no functions, no refs)
interface SavedCircle {
  id: number;
  x: number;
  y: number;
  r: number;
  color: string;
  vx: number;
  vy: number;
  mass: number;
  locked: boolean;
  layerId: string;
}

// Simplified layer for JSON
interface SavedLayer {
  id: string;
  name: string;
  type: 'circles' | 'paint';
  visible: boolean;
  locked: boolean;
  opacity: number;
}

const CURRENT_VERSION = 1;

// Convert runtime circles to saveable format
function circlesToSaved(circles: Circle[]): SavedCircle[] {
  return circles.map(c => ({
    id: c.id,
    x: c.x,
    y: c.y,
    r: c.r,
    color: c.color,
    vx: c.vx,
    vy: c.vy,
    mass: c.mass,
    locked: c.locked,
    layerId: c.layerId,
  }));
}

// Convert runtime layers to saveable format
function layersToSaved(layers: Layer[]): SavedLayer[] {
  return layers.map(l => ({
    id: l.id,
    name: l.name,
    type: l.type,
    visible: l.visible,
    locked: l.locked,
    opacity: l.opacity,
  }));
}

// Convert saved circles back to runtime format
function savedToCircles(saved: SavedCircle[]): Circle[] {
  return saved.map(s => ({
    id: s.id,
    x: s.x,
    y: s.y,
    r: s.r,
    color: s.color,
    vx: s.vx,
    vy: s.vy,
    mass: s.mass,
    locked: s.locked,
    isDragging: false,
    layerId: s.layerId,
  }));
}

// Save project to JSON file
export function saveProject(
  circles: Circle[],
  layers: Layer[],
  activeLayerId: string,
  aspectRatio: string,
  physics: ProjectData['physics'],
  settings: ProjectData['settings'],
  palette: ProjectData['palette'],
  selectedSwatch: number,
  projectName: string = 'untitled'
): void {
  const project: ProjectData = {
    version: CURRENT_VERSION,
    name: projectName,
    savedAt: new Date().toISOString(),
    aspectRatio,
    circles: circlesToSaved(circles),
    layers: layersToSaved(layers),
    activeLayerId,
    physics,
    settings,
    palette,
    selectedSwatch,
  };
  
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Load project from JSON file (returns promise)
export function loadProject(): Promise<ProjectData | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const data = JSON.parse(json) as ProjectData;
          
          // Validate version
          if (!data.version || data.version > CURRENT_VERSION) {
            alert('Unsupported project version');
            resolve(null);
            return;
          }
          
          resolve(data);
        } catch (err) {
          alert('Failed to parse project file');
          console.error(err);
          resolve(null);
        }
      };
      
      reader.onerror = () => {
        alert('Failed to read file');
        resolve(null);
      };
      
      reader.readAsText(file);
    };
    
    // Handle cancel
    input.oncancel = () => resolve(null);
    
    input.click();
  });
}

// Helper to restore circles from project data
export function restoreCircles(data: ProjectData): Circle[] {
  return savedToCircles(data.circles);
}

// Helper to check if project data is valid
export function isValidProject(data: unknown): data is ProjectData {
  if (!data || typeof data !== 'object') return false;
  const d = data as ProjectData;
  return (
    typeof d.version === 'number' &&
    Array.isArray(d.circles) &&
    Array.isArray(d.layers) &&
    typeof d.activeLayerId === 'string'
  );
}
