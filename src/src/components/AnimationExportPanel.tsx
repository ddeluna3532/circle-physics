/**
 * Animation Export Panel
 * Complete UI for exporting animations with motion blur
 * 
 * READY TO USE - No modifications needed
 */

import React, { useState } from 'react';

export interface ExportOptions {
  format: 'png' | 'jpeg';
  fps: number;
  quality: number;
  motionBlur: boolean;
  motionBlurSamples: number;
  shutterAngle: number;
  resolution: number;
}

interface AnimationExportPanelProps {
  hasAnimation: boolean;
  isExporting: boolean;
  exportProgress: { progress: number; message: string } | null;
  onExport: (options: ExportOptions) => void;
}

export function AnimationExportPanel({
  hasAnimation,
  isExporting,
  exportProgress,
  onExport,
}: AnimationExportPanelProps) {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [fps, setFps] = useState(30);
  const [quality, setQuality] = useState(0.95);
  const [motionBlur, setMotionBlur] = useState(false);
  const [motionBlurSamples, setMotionBlurSamples] = useState(8);
  const [shutterAngle, setShutterAngle] = useState(180);
  const [resolution, setResolution] = useState(1);

  const handleExport = () => {
    onExport({
      format,
      fps,
      quality,
      motionBlur,
      motionBlurSamples,
      shutterAngle,
      resolution,
    });
  };

  const estimatedRenderTime = () => {
    const baseTime = 0.1;
    const multiplier = motionBlur ? motionBlurSamples : 1;
    const resMultiplier = resolution * resolution;
    return (baseTime * multiplier * resMultiplier).toFixed(1);
  };

  return (
    <div className="export-panel">
      <h2>Export Animation</h2>

      {!hasAnimation && (
        <div className="warning-box">
          <p>⚠️ No animation recorded. Record an animation first.</p>
        </div>
      )}

      <div className="control-group">
        <label>Format</label>
        <div className="button-row">
          <button
            onClick={() => setFormat('png')}
            className={format === 'png' ? 'active' : ''}
            disabled={isExporting}
          >
            PNG (Lossless)
          </button>
          <button
            onClick={() => setFormat('jpeg')}
            className={format === 'jpeg' ? 'active' : ''}
            disabled={isExporting}
          >
            JPEG
          </button>
        </div>
      </div>

      <div className="control-group">
        <label>FPS: {fps}</label>
        <input
          type="range"
          min="15"
          max="60"
          step="15"
          value={fps}
          onChange={(e) => setFps(Number(e.target.value))}
          disabled={isExporting}
        />
        <div className="hint">15, 30, or 60 fps</div>
      </div>

      {format === 'jpeg' && (
        <div className="control-group">
          <label>Quality: {(quality * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.05"
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            disabled={isExporting}
          />
        </div>
      )}

      <div className="control-group">
        <label>Resolution</label>
        <div className="button-row">
          <button
            onClick={() => setResolution(1)}
            className={resolution === 1 ? 'active' : ''}
            disabled={isExporting}
          >
            1x
          </button>
          <button
            onClick={() => setResolution(2)}
            className={resolution === 2 ? 'active' : ''}
            disabled={isExporting}
          >
            2x
          </button>
          <button
            onClick={() => setResolution(4)}
            className={resolution === 4 ? 'active' : ''}
            disabled={isExporting}
          >
            4x
          </button>
        </div>
        <div className="hint">Higher = better quality, slower export</div>
      </div>

      <h3>Motion Blur</h3>

      <div className="control-group">
        <button
          onClick={() => setMotionBlur(!motionBlur)}
          className={motionBlur ? 'active' : ''}
          disabled={isExporting}
        >
          Motion Blur {motionBlur ? 'ON' : 'OFF'}
        </button>
        <div className="hint">
          {motionBlur
            ? 'Adds cinematic blur to moving objects'
            : 'No motion blur (sharper, faster export)'}
        </div>
      </div>

      {motionBlur && (
        <>
          <div className="control-group">
            <label>Samples: {motionBlurSamples}</label>
            <input
              type="range"
              min="2"
              max="32"
              step="1"
              value={motionBlurSamples}
              onChange={(e) => setMotionBlurSamples(Number(e.target.value))}
              disabled={isExporting}
            />
            <div className="hint">
              More samples = smoother blur, slower export
              <br />
              Recommended: 5-8 samples
            </div>
          </div>

          <div className="control-group">
            <label>Shutter Angle: {shutterAngle}°</label>
            <input
              type="range"
              min="45"
              max="360"
              step="45"
              value={shutterAngle}
              onChange={(e) => setShutterAngle(Number(e.target.value))}
              disabled={isExporting}
            />
            <div className="hint">
              180° = Standard cinematic blur
              <br />
              360° = Maximum blur
            </div>
          </div>

          <div className="info-box">
            <strong>Estimated render time:</strong>
            <br />
            ~{estimatedRenderTime()}s per frame
            <br />
            ({motionBlurSamples}x slower than no blur)
          </div>
        </>
      )}

      <div className="control-group">
        <button
          onClick={handleExport}
          disabled={!hasAnimation || isExporting}
          className="primary large"
        >
          {isExporting ? 'Exporting...' : `Export ${format.toUpperCase()} Sequence`}
        </button>
      </div>

      {isExporting && exportProgress && (
        <div className="progress-box">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${exportProgress.progress}%` }}
            />
          </div>
          <p>{exportProgress.message}</p>
          <p>{exportProgress.progress.toFixed(0)}% complete</p>
        </div>
      )}

      <div className="tips-box">
        <h4>💡 Tips</h4>
        <ul>
          <li>PNG format is lossless (best for editing)</li>
          <li>JPEG is smaller but lossy (good for web)</li>
          <li>Motion blur adds realistic movement</li>
          <li>5-8 samples is the sweet spot for quality/speed</li>
          <li>Use 180° shutter angle for cinematic look</li>
          <li>Higher resolution = sharper, but 4x slower</li>
        </ul>
      </div>
    </div>
  );
}
