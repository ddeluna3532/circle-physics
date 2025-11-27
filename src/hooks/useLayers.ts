import { useState, useCallback, useRef } from 'react';
import { 
  Layer, 
  CircleLayer, 
  PaintLayer, 
  createCircleLayer, 
  createPaintLayer,
  resizePaintLayer 
} from '../layers';
import { WatercolorBrush } from '../layers/WatercolorBrush';

export function useLayers(initialWidth: number = 800, initialHeight: number = 600) {
  const [layers, setLayers] = useState<Layer[]>(() => [createCircleLayer('Default')]);
  const [activeLayerId, setActiveLayerId] = useState<string>(layers[0]?.id || '');
  const [, forceUpdate] = useState(0);
  
  const brushRef = useRef(new WatercolorBrush());
  const canvasSizeRef = useRef({ width: initialWidth, height: initialHeight });
  
  const getActiveLayer = useCallback((): Layer | undefined => {
    return layers.find(l => l.id === activeLayerId);
  }, [layers, activeLayerId]);
  
  const addCircleLayer = useCallback((name?: string): CircleLayer => {
    const layer = createCircleLayer(name);
    setLayers(prev => [...prev, layer]);
    setActiveLayerId(layer.id);
    return layer;
  }, []);
  
  const addPaintLayer = useCallback((name?: string): PaintLayer => {
    const { width, height } = canvasSizeRef.current;
    const layer = createPaintLayer(width, height, name);
    setLayers(prev => [...prev, layer]);
    setActiveLayerId(layer.id);
    return layer;
  }, []);
  
  const removeLayer = useCallback((id: string) => {
    setLayers(prev => {
      const newLayers = prev.filter(l => l.id !== id);
      // If we removed the active layer, select another
      if (id === activeLayerId && newLayers.length > 0) {
        setActiveLayerId(newLayers[newLayers.length - 1].id);
      }
      return newLayers;
    });
  }, [activeLayerId]);
  
  const updateLayer = useCallback((id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(l => 
      l.id === id ? { ...l, ...updates } as Layer : l
    ));
    forceUpdate(n => n + 1);
  }, []);
  
  const toggleVisibility = useCallback((id: string) => {
    setLayers(prev => prev.map(l => 
      l.id === id ? { ...l, visible: !l.visible } as Layer : l
    ));
  }, []);
  
  const toggleLock = useCallback((id: string) => {
    setLayers(prev => prev.map(l => 
      l.id === id ? { ...l, locked: !l.locked } as Layer : l
    ));
  }, []);
  
  const moveLayer = useCallback((id: string, direction: 'up' | 'down') => {
    setLayers(prev => {
      const index = prev.findIndex(l => l.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index + 1 : index - 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newLayers = [...prev];
      [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
      return newLayers;
    });
  }, []);
  
  const resizeAllPaintLayers = useCallback((width: number, height: number) => {
    canvasSizeRef.current = { width, height };
    setLayers(prev => prev.map(l => {
      if (l.type === 'paint') {
        resizePaintLayer(l as PaintLayer, width, height);
      }
      return l;
    }));
  }, []);
  
  const clearPaintLayer = useCallback((id: string) => {
    const layer = layers.find(l => l.id === id);
    if (layer?.type === 'paint') {
      const paintLayer = layer as PaintLayer;
      if (paintLayer.ctx && paintLayer.canvas) {
        paintLayer.ctx.clearRect(0, 0, paintLayer.canvas.width, paintLayer.canvas.height);
        forceUpdate(n => n + 1);
      }
    }
  }, [layers]);
  
  const getCircleLayers = useCallback((): CircleLayer[] => {
    return layers.filter(l => l.type === 'circles') as CircleLayer[];
  }, [layers]);
  
  const getPaintLayers = useCallback((): PaintLayer[] => {
    return layers.filter(l => l.type === 'paint') as PaintLayer[];
  }, [layers]);
  
  const isLayerAffectedByForces = useCallback((layerId: string): boolean => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return false;
    return layer.visible && !layer.locked;
  }, [layers]);
  
  // Restore layers from saved project data
  const restoreLayers = useCallback((savedLayers: Array<{
    id: string;
    name: string;
    type: 'circles' | 'paint';
    visible: boolean;
    locked: boolean;
    opacity: number;
  }>, newActiveLayerId: string) => {
    const { width, height } = canvasSizeRef.current;
    
    const restoredLayers: Layer[] = savedLayers.map(saved => {
      if (saved.type === 'circles') {
        return {
          id: saved.id,
          name: saved.name,
          type: 'circles' as const,
          visible: saved.visible,
          locked: saved.locked,
          opacity: saved.opacity,
        };
      } else {
        // Create new paint layer (we don't save paint data in JSON)
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        return {
          id: saved.id,
          name: saved.name,
          type: 'paint' as const,
          visible: saved.visible,
          locked: saved.locked,
          opacity: saved.opacity,
          canvas,
          ctx,
        } as PaintLayer;
      }
    });
    
    setLayers(restoredLayers);
    setActiveLayerId(newActiveLayerId);
  }, []);
  
  return {
    layers,
    setLayers,
    activeLayerId,
    setActiveLayerId,
    getActiveLayer,
    addCircleLayer,
    addPaintLayer,
    removeLayer,
    updateLayer,
    toggleVisibility,
    toggleLock,
    moveLayer,
    resizeAllPaintLayers,
    clearPaintLayer,
    getCircleLayers,
    getPaintLayers,
    isLayerAffectedByForces,
    restoreLayers,
    brush: brushRef.current,
  };
}
