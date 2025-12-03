/**
 * PHASE 5: Token-Optimized Video Export
 * 
 * Extracts the massive video export function from App.tsx.
 */

import { useCallback } from 'react';
import { useVariableResolver } from '../../utils/variableResolver';
import { exportVideoHighQuality, downloadVideo, isVideoExportSupported } from '../../layers/VideoExporter';
import { CircleSnapshot } from '../../layers/AnimationRecorder';
import { PaintLayer } from '../../layers';

export function useVideoExport() {
  const { $get } = useVariableResolver();

  const exportAnimationVideo = useCallback(async () => {
    const animationRecorder = $get('animationRecorder') as any;
    const canvasRef = $get('canvasRef') as React.RefObject<HTMLCanvasElement>;
    const bgPalette = $get('bgPalette') as any[];
    const selectedBgSwatch = $get('selectedBgSwatch') as number;
    const layers = $get('layers') as any[];
    const render = $get('render') as () => void;
    const exportResolution = $get('exportResolution') as number;
    const exportCameraZoom = $get('exportCameraZoom') as number;
    const exportCameraPanX = $get('exportCameraPanX') as number;
    const exportCameraPanY = $get('exportCameraPanY') as number;
    const setIsExportingVideo = $get('setIsExportingVideo') as (val: boolean) => void;
    const setExportProgress = $get('setExportProgress') as (val: any) => void;
    const setIsPlayingAnimation = $get('setIsPlayingAnimation') as (val: boolean) => void;
    const setPlaybackCircles = $get('setPlaybackCircles') as (val: any) => void;
    
    if (!animationRecorder.hasAnimation()) return;
    if (!canvasRef.current) return;
    if (!isVideoExportSupported()) {
      alert('Video export is not supported in this browser');
      return;
    }
    
    const sourceCanvas = canvasRef.current;
    
    // Stop any playback
    if (animationRecorder.getIsPlaying()) {
      animationRecorder.stopPlayback();
      setIsPlayingAnimation(false);
      setPlaybackCircles(null);
    }
    
    setIsExportingVideo(true);
    setExportProgress({ phase: 'preparing', progress: 0, message: 'Preparing...' });
    
    // Get a snapshot of keyframes
    const keyframesSnapshot = animationRecorder.getKeyframes();
    console.log(`Exporting ${keyframesSnapshot.length} keyframes`);
    
    // Create offscreen canvas at target resolution
    const scale = exportResolution;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = sourceCanvas.width * scale;
    exportCanvas.height = sourceCanvas.height * scale;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) {
      setIsExportingVideo(false);
      return;
    }
    
    const duration = animationRecorder.getDuration();
    
    // Camera parameters
    const zoom = exportCameraZoom;
    const panX = exportCameraPanX * sourceCanvas.width / 100;
    const panY = exportCameraPanY * sourceCanvas.height / 100;
    const centerX = sourceCanvas.width / 2;
    const centerY = sourceCanvas.height / 2;
    
    // Helper function to interpolate frame from snapshot
    const getFrameFromSnapshot = (time: number): CircleSnapshot[] | null => {
      if (keyframesSnapshot.length === 0) return null;
      
      let prevIdx = 0;
      let nextIdx = 0;
      
      for (let i = 0; i < keyframesSnapshot.length; i++) {
        if (keyframesSnapshot[i].time <= time) {
          prevIdx = i;
        }
        if (keyframesSnapshot[i].time >= time) {
          nextIdx = i;
          break;
        }
      }
      
      if (prevIdx === nextIdx || nextIdx === 0) {
        return keyframesSnapshot[prevIdx].circles;
      }
      
      const prevFrame = keyframesSnapshot[prevIdx];
      const nextFrame = keyframesSnapshot[nextIdx];
      const t = (time - prevFrame.time) / (nextFrame.time - prevFrame.time);
      
      const nextMap = new Map<number, CircleSnapshot>();
      for (const c of nextFrame.circles) {
        nextMap.set(c.id, c);
      }
      
      const interpolated: CircleSnapshot[] = [];
      
      for (const prev of prevFrame.circles) {
        const next = nextMap.get(prev.id);
        if (next) {
          interpolated.push({
            id: prev.id,
            x: prev.x + (next.x - prev.x) * t,
            y: prev.y + (next.y - prev.y) * t,
            r: prev.r + (next.r - prev.r) * t,
            color: prev.color,
            layerId: prev.layerId,
          });
        } else {
          interpolated.push({ ...prev });
        }
      }
      
      for (const next of nextFrame.circles) {
        if (!interpolated.find(c => c.id === next.id)) {
          interpolated.push({ ...next });
        }
      }
      
      return interpolated;
    };
    
    // Render function for export
    const renderFrameForExport = (time: number) => {
      const frame = getFrameFromSnapshot(time);
      if (!frame) return;
      
      // Clear canvas with background
      const bg = bgPalette[selectedBgSwatch];
      ctx.fillStyle = `hsl(${bg.h}, ${bg.s}%, ${bg.l}%)`;
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      
      // Apply transforms
      ctx.save();
      ctx.scale(scale, scale);
      
      // Apply camera transform
      ctx.translate(centerX, centerY);
      ctx.scale(zoom, zoom);
      ctx.translate(-centerX - panX, -centerY - panY);
      
      // Render layers
      for (const layer of layers) {
        if (!layer.visible) continue;
        
        ctx.globalAlpha = layer.opacity;
        
        if (layer.type === 'paint') {
          const paintLayer = layer as PaintLayer;
          if (paintLayer.canvas) {
            ctx.drawImage(paintLayer.canvas, 0, 0);
          }
        } else if (layer.type === 'circles') {
          const layerCircles = frame.filter(c => c.layerId === layer.id);
          
          for (const c of layerCircles) {
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            ctx.fillStyle = c.color;
            ctx.fill();
          }
        }
        
        ctx.globalAlpha = 1;
      }
      
      ctx.restore();
    };
    
    const exportFps = 30;
    
    try {
      const blob = await exportVideoHighQuality(
        exportCanvas,
        renderFrameForExport,
        duration,
        { fps: exportFps, quality: 0.9 },
        setExportProgress
      );
      
      if (blob) {
        const resLabel = scale > 1 ? `_${exportCanvas.width}x${exportCanvas.height}` : '';
        const zoomLabel = zoom !== 1 ? `_${zoom}x` : '';
        const defaultName = `animation${resLabel}${zoomLabel}_${exportFps}fps`;
        const name = prompt('PNG Sequence filename:', defaultName) || defaultName;
        downloadVideo(blob, `${name}.zip`);
      }
    } catch (err) {
      console.error('Video export failed:', err);
      setExportProgress({ phase: 'error', progress: 0, message: 'Export failed' });
    }
    
    setIsExportingVideo(false);
    
    // Re-render current state
    render();
  }, [$get]);

  return { exportAnimationVideo };
}
