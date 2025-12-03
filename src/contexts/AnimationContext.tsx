import React, { createContext, useContext, useRef, useCallback, useMemo } from 'react';
import { AnimationRecorder, AnimationData, CircleSnapshot } from '../layers/AnimationRecorder';

/**
 * Animation Context - Manages animation recording and playback
 * Uses variable references to avoid token waste
 */

export interface AnimationState {
  recorder: AnimationRecorder;
  
  // Recording state
  isRecording: boolean;
  recordingDuration: number;
  recordingFrames: number;
  
  // Playback state
  isPlaying: boolean;
  playbackCircles: CircleSnapshot[] | null;
  
  // Animation data
  hasAnimation: boolean;
  animationDuration: number;
  
  // Settings
  smoothingStrength: number;
}

export interface AnimationContextValue {
  // State reference
  stateRef: React.MutableRefObject<AnimationState>;
  
  // Variable-style getters
  $getRecorder: () => AnimationRecorder;
  $getKeyframes: () => any[];
  $isRecording: () => boolean;
  $isPlaying: () => boolean;
  $hasAnimation: () => boolean;
  
  // Recording controls
  startRecording: () => void;
  stopRecording: () => void;
  continueRecording: () => void;
  
  // Playback controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  
  // Animation operations
  clearAnimation: () => void;
  applySmoothing: (strength?: number) => void;
  
  // Callbacks
  onRecordingUpdate?: (duration: number, frames: number) => void;
  onPlaybackFrame?: (circles: CircleSnapshot[]) => void;
}

const AnimationContext = createContext<AnimationContextValue | null>(null);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const stateRef = useRef<AnimationState>({
    recorder: new AnimationRecorder(30),
    isRecording: false,
    recordingDuration: 0,
    recordingFrames: 0,
    isPlaying: false,
    playbackCircles: null,
    hasAnimation: false,
    animationDuration: 0,
    smoothingStrength: 0.4,
  });
  
  // Getters (return references)
  const $getRecorder = useCallback(() => stateRef.current.recorder, []);
  const $getKeyframes = useCallback(() => stateRef.current.recorder.getKeyframes(), []);
  const $isRecording = useCallback(() => stateRef.current.isRecording, []);
  const $isPlaying = useCallback(() => stateRef.current.isPlaying, []);
  const $hasAnimation = useCallback(() => stateRef.current.hasAnimation, []);
  
  // Recording controls
  const startRecording = useCallback(() => {
    const recorder = stateRef.current.recorder;
    
    recorder.setRecordingCallback((duration, frames) => {
      stateRef.current.recordingDuration = duration;
      stateRef.current.recordingFrames = frames;
    });
    
    // Get circles from DataContext (would be wired up)
    // For now, assuming circles are available globally
    // recorder.startRecording(circles);
    
    stateRef.current.isRecording = true;
  }, []);
  
  const stopRecording = useCallback(() => {
    const recorder = stateRef.current.recorder;
    const data = recorder.stopRecording();
    
    stateRef.current.isRecording = false;
    
    // Stop playback if it was running during recording
    if (stateRef.current.isPlaying) {
      recorder.stopPlayback();
      stateRef.current.isPlaying = false;
      stateRef.current.playbackCircles = null;
    }
    
    if (data) {
      stateRef.current.animationDuration = data.duration;
      stateRef.current.hasAnimation = true;
    }
  }, []);
  
  const continueRecording = useCallback(() => {
    const recorder = stateRef.current.recorder;
    if (!recorder.hasAnimation()) return;
    
    // Start playback of existing animation
    play();
    
    // Then start recording on top of it
    recorder.setRecordingCallback((duration, frames) => {
      stateRef.current.recordingDuration = duration;
      stateRef.current.recordingFrames = frames;
    });
    
    // recorder.continueRecording(circles);
    stateRef.current.isRecording = true;
    
    console.log('Continue recording: playback + physics + new recording');
  }, []);
  
  // Playback controls
  const play = useCallback(() => {
    const recorder = stateRef.current.recorder;
    if (!recorder.hasAnimation()) return;
    
    stateRef.current.isPlaying = true;
    
    recorder.startPlayback(
      (circles) => {
        stateRef.current.playbackCircles = circles;
        // Callback to update live circles would go here
      },
      () => {
        stateRef.current.isPlaying = false;
        stateRef.current.playbackCircles = null;
      },
      true // loop
    );
  }, []);
  
  const pause = useCallback(() => {
    const recorder = stateRef.current.recorder;
    recorder.pausePlayback();
    stateRef.current.isPlaying = false;
  }, []);
  
  const stop = useCallback(() => {
    const recorder = stateRef.current.recorder;
    recorder.stopPlayback();
    stateRef.current.isPlaying = false;
    stateRef.current.playbackCircles = null;
  }, []);
  
  // Animation operations
  const clearAnimation = useCallback(() => {
    const recorder = stateRef.current.recorder;
    recorder.clear();
    stateRef.current.playbackCircles = null;
    stateRef.current.hasAnimation = false;
    stateRef.current.animationDuration = 0;
    stateRef.current.recordingDuration = 0;
    stateRef.current.recordingFrames = 0;
  }, []);
  
  const applySmoothing = useCallback((strength?: number) => {
    const recorder = stateRef.current.recorder;
    if (!recorder.hasAnimation()) return;
    
    // Stop playback if playing
    if (recorder.getIsPlaying()) {
      recorder.stopPlayback();
      stateRef.current.isPlaying = false;
      stateRef.current.playbackCircles = null;
    }
    
    const smoothStrength = strength ?? stateRef.current.smoothingStrength;
    recorder.applySmoothing(smoothStrength);
    
    console.log(`Applied smoothing with strength ${smoothStrength}`);
  }, []);
  
  const value = useMemo<AnimationContextValue>(() => ({
    stateRef,
    $getRecorder,
    $getKeyframes,
    $isRecording,
    $isPlaying,
    $hasAnimation,
    startRecording,
    stopRecording,
    continueRecording,
    play,
    pause,
    stop,
    clearAnimation,
    applySmoothing,
  }), [
    $getRecorder,
    $getKeyframes,
    $isRecording,
    $isPlaying,
    $hasAnimation,
    startRecording,
    stopRecording,
    continueRecording,
    play,
    pause,
    stop,
    clearAnimation,
    applySmoothing,
  ]);
  
  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimationContext(): AnimationContextValue {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimationContext must be used within AnimationProvider');
  }
  return context;
}

// Convenience hooks
export function useAnimationRecording() {
  const { startRecording, stopRecording, continueRecording, $isRecording } = useAnimationContext();
  
  return {
    isRecording: $isRecording,
    start: startRecording,
    stop: stopRecording,
    continue: continueRecording,
  };
}

export function useAnimationPlayback() {
  const { play, pause, stop, $isPlaying, $hasAnimation } = useAnimationContext();
  
  return {
    isPlaying: $isPlaying,
    hasAnimation: $hasAnimation,
    play,
    pause,
    stop,
  };
}
