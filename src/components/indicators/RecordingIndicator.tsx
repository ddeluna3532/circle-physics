interface RecordingIndicatorProps {
  duration: number;
}

export function RecordingIndicator({ duration }: RecordingIndicatorProps) {
  return (
    <div className="recording-indicator">
      REC {(duration / 1000).toFixed(1)}s
    </div>
  );
}
