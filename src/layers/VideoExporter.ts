// Video/Image sequence export functionality

export interface ExportOptions {
  fps: number;
  quality: number; // 0-1 for JPEG, ignored for PNG
  format: 'png' | 'jpeg';
}

export interface VideoExportProgress {
  phase: 'preparing' | 'rendering' | 'encoding' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
}

export type ProgressCallback = (progress: VideoExportProgress) => void;

// Always supported since we're using canvas
export function isVideoExportSupported(): boolean {
  return true;
}

// Download blob as file
export function downloadVideo(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Simple ZIP file creator for PNG sequence
class SimpleZip {
  private files: { name: string; data: Uint8Array }[] = [];
  
  addFile(name: string, data: Uint8Array): void {
    this.files.push({ name, data });
  }
  
  // Create a basic ZIP file structure
  generate(): Blob {
    const parts: Uint8Array[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;
    
    // Process each file
    for (const file of this.files) {
      const nameBytes = new TextEncoder().encode(file.name);
      
      // Local file header
      const localHeader = new Uint8Array(30 + nameBytes.length);
      const localView = new DataView(localHeader.buffer);
      
      localView.setUint32(0, 0x04034b50, true); // Local file header signature
      localView.setUint16(4, 20, true); // Version needed
      localView.setUint16(6, 0, true); // General purpose flag
      localView.setUint16(8, 0, true); // Compression method (0 = stored)
      localView.setUint16(10, 0, true); // File time
      localView.setUint16(12, 0, true); // File date
      localView.setUint32(14, this.crc32(file.data), true); // CRC-32
      localView.setUint32(18, file.data.length, true); // Compressed size
      localView.setUint32(22, file.data.length, true); // Uncompressed size
      localView.setUint16(26, nameBytes.length, true); // File name length
      localView.setUint16(28, 0, true); // Extra field length
      localHeader.set(nameBytes, 30);
      
      // Central directory entry
      const centralEntry = new Uint8Array(46 + nameBytes.length);
      const centralView = new DataView(centralEntry.buffer);
      
      centralView.setUint32(0, 0x02014b50, true); // Central directory signature
      centralView.setUint16(4, 20, true); // Version made by
      centralView.setUint16(6, 20, true); // Version needed
      centralView.setUint16(8, 0, true); // General purpose flag
      centralView.setUint16(10, 0, true); // Compression method
      centralView.setUint16(12, 0, true); // File time
      centralView.setUint16(14, 0, true); // File date
      centralView.setUint32(16, this.crc32(file.data), true); // CRC-32
      centralView.setUint32(20, file.data.length, true); // Compressed size
      centralView.setUint32(24, file.data.length, true); // Uncompressed size
      centralView.setUint16(28, nameBytes.length, true); // File name length
      centralView.setUint16(30, 0, true); // Extra field length
      centralView.setUint16(32, 0, true); // File comment length
      centralView.setUint16(34, 0, true); // Disk number start
      centralView.setUint16(36, 0, true); // Internal attributes
      centralView.setUint32(38, 0, true); // External attributes
      centralView.setUint32(42, offset, true); // Relative offset
      centralEntry.set(nameBytes, 46);
      
      parts.push(localHeader);
      parts.push(file.data);
      centralDirectory.push(centralEntry);
      
      offset += localHeader.length + file.data.length;
    }
    
    // Add central directory
    const centralDirOffset = offset;
    let centralDirSize = 0;
    for (const entry of centralDirectory) {
      parts.push(entry);
      centralDirSize += entry.length;
    }
    
    // End of central directory
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    endView.setUint32(0, 0x06054b50, true); // End signature
    endView.setUint16(4, 0, true); // Disk number
    endView.setUint16(6, 0, true); // Central directory disk
    endView.setUint16(8, this.files.length, true); // Entries on this disk
    endView.setUint16(10, this.files.length, true); // Total entries
    endView.setUint32(12, centralDirSize, true); // Central directory size
    endView.setUint32(16, centralDirOffset, true); // Central directory offset
    endView.setUint16(20, 0, true); // Comment length
    
    parts.push(endRecord);
    
    // Combine all parts
    const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
    const result = new Uint8Array(totalLength);
    let pos = 0;
    for (const part of parts) {
      result.set(part, pos);
      pos += part.length;
    }
    
    return new Blob([result], { type: 'application/zip' });
  }
  
  // CRC-32 calculation
  private crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    const table = this.getCrc32Table();
    
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
    }
    
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  
  private crc32Table: Uint32Array | null = null;
  
  private getCrc32Table(): Uint32Array {
    if (this.crc32Table) return this.crc32Table;
    
    this.crc32Table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      this.crc32Table[i] = c >>> 0;
    }
    return this.crc32Table;
  }
}

// Convert canvas to PNG Uint8Array
async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (blob) {
        const arrayBuffer = await blob.arrayBuffer();
        resolve(new Uint8Array(arrayBuffer));
      } else {
        resolve(new Uint8Array(0));
      }
    }, 'image/png');
  });
}

// Export as PNG image sequence (ZIP file)
// This is the recommended format for After Effects
export async function exportVideoHighQuality(
  canvas: HTMLCanvasElement,
  renderFrame: (time: number) => void,
  duration: number,
  options: Partial<ExportOptions> = {},
  onProgress?: ProgressCallback
): Promise<Blob | null> {
  const fps = options.fps || 30;
  const frameInterval = 1000 / fps;
  const totalFrames = Math.ceil(duration / frameInterval);
  
  onProgress?.({
    phase: 'preparing',
    progress: 0,
    message: 'Preparing PNG sequence export...',
  });
  
  const zip = new SimpleZip();
  
  try {
    for (let i = 0; i < totalFrames; i++) {
      const time = i * frameInterval;
      
      // Render the frame
      renderFrame(time);
      
      // Convert to PNG
      const pngData = await canvasToPngBytes(canvas);
      
      // Add to ZIP with padded frame number (After Effects friendly naming)
      const frameNum = String(i + 1).padStart(5, '0');
      zip.addFile(`frame_${frameNum}.png`, pngData);
      
      // Update progress
      const progress = Math.round(((i + 1) / totalFrames) * 95);
      onProgress?.({
        phase: 'rendering',
        progress,
        message: `Rendering frame ${i + 1}/${totalFrames}...`,
      });
      
      // Yield to prevent UI blocking
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    onProgress?.({
      phase: 'encoding',
      progress: 98,
      message: 'Creating ZIP archive...',
    });
    
    const blob = zip.generate();
    
    onProgress?.({
      phase: 'complete',
      progress: 100,
      message: 'Export complete!',
    });
    
    return blob;
    
  } catch (err) {
    console.error('PNG sequence export error:', err);
    onProgress?.({
      phase: 'error',
      progress: 0,
      message: `Export failed: ${err}`,
    });
    return null;
  }
}

// Export single frame as PNG
export async function exportSingleFrame(
  canvas: HTMLCanvasElement,
  renderFrame: (time: number) => void,
  time: number,
  filename: string
): Promise<void> {
  renderFrame(time);
  
  canvas.toBlob((blob) => {
    if (blob) {
      downloadVideo(blob, filename);
    }
  }, 'image/png');
}
