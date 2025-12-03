interface ExportingIndicatorProps {
  resolution: number;
  progress: number;
}

export function ExportingIndicator({ resolution, progress }: ExportingIndicatorProps) {
  return (
    <div className="exporting-indicator">
      ?? Exporting {resolution}x... {progress}%
    </div>
  );
}
