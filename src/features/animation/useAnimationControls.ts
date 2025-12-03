/**
 * PHASE 5: Token-Optimized Animation Controls
 * 
 * Extracts animation recording/playback control functions from App.tsx.
 */

import { useCallback } from 'react';
import { useVariableResolver } from '../../utils/variableResolver';
import { AnimationData, saveAnimation, loadAnimationFile } from '../../layers/AnimationRecorder';

export function useAnimationControls() {
  const { $get } = useVariableResolver();

  const startRecording = useCallback(() => {
    const animationRecorder = $get('animationRecorder') as any;
    const system = $get('system') as any;
    const setIsRecording = $get('setIsRecording') as (val: boolean) => void;
    const setRecordingDuration = $get('setRecordingDuration') as (val: number) => void;
    const setRecordingFrames = $get('setRecordingFrames') as (val: number) => void;
    const setPhysicsPaused = $get('setPhysicsPaused') as (val: boolean) => void;
    
    animationRecorder.setRecordingCallback((duration: number, frames: number) => {
      setRecordingDuration(duration);
      setRecordingFrames(frames);
    });
    animationRecorder.startRecording(system.circles);
    setIsRecording(true);
    setPhysicsPaused(false); // Ensure physics is running
  }, [$get]);

  const stopRecording = useCallback(() => {
    const animationRecorder = $get('animationRecorder') as any;
    const setIsRecording = $get('setIsRecording') as (val: boolean) => void;
    const setAnimationDuration = $get('setAnimationDuration') as (val: number) => void;
    const setHasAnimation = $get('setHasAnimation') as (val: boolean) => void;
    
    const data = animationRecorder.stopRecording();
    setIsRecording(false);
    if (data) {
      setAnimationDuration(data.duration);
      setHasAnimation(true);
    }
  }, [$get]);

  const playAnimation = useCallback(() => {
    const animationRecorder = $get('animationRecorder') as any;
    const setPhysicsPaused = $get('setPhysicsPaused') as (val: boolean) => void;
    const setIsPlayingAnimation = $get('setIsPlayingAnimation') as (val: boolean) => void;
    const setPlaybackCircles = $get('setPlaybackCircles') as (val: any) => void;
    
    if (!animationRecorder.hasAnimation()) return;
    
    setPhysicsPaused(true); // Pause physics during playback
    setIsPlayingAnimation(true);
    
    animationRecorder.startPlayback(
      (circles: any) => {
        setPlaybackCircles(circles);
      },
      () => {
        setIsPlayingAnimation(false);
        setPlaybackCircles(null);
      },
      true // loop
    );
  }, [$get]);

  const stopAnimation = useCallback(() => {
    const animationRecorder = $get('animationRecorder') as any;
    const setIsPlayingAnimation = $get('setIsPlayingAnimation') as (val: boolean) => void;
    const setPlaybackCircles = $get('setPlaybackCircles') as (val: any) => void;
    
    animationRecorder.stopPlayback();
    setIsPlayingAnimation(false);
    setPlaybackCircles(null);
  }, [$get]);

  const saveCurrentAnimation = useCallback(() => {
    const animationRecorder = $get('animationRecorder') as any;
    
    if (!animationRecorder.hasAnimation()) {
      console.log('No animation to save');
      return;
    }
    
    const animData: AnimationData = {
      version: 1,
      name: `animation-${Date.now()}`,
      duration: animationRecorder.getDuration(),
      keyframes: animationRecorder.getKeyframes(),
      fps: animationRecorder.getFPS(),
    };
    
    const name = prompt('Animation name:', animData.name) || animData.name;
    saveAnimation({ ...animData, name }, name);
  }, [$get]);

  const loadAnimation = useCallback(async () => {
    const animationRecorder = $get('animationRecorder') as any;
    const setAnimationDuration = $get('setAnimationDuration') as (val: number) => void;
    const setHasAnimation = $get('setHasAnimation') as (val: boolean) => void;
    
    const data = await loadAnimationFile();
    if (data) {
      animationRecorder.loadAnimation(data);
      setAnimationDuration(data.duration);
      setHasAnimation(true);
      console.log(`Loaded animation: ${data.name}`);
    }
  }, [$get]);

  const clearAnimation = useCallback(() => {
    const animationRecorder = $get('animationRecorder') as any;
    const setHasAnimation = $get('setHasAnimation') as (val: boolean) => void;
    const setAnimationDuration = $get('setAnimationDuration') as (val: number) => void;
    const setRecordingDuration = $get('setRecordingDuration') as (val: number) => void;
    const setRecordingFrames = $get('setRecordingFrames') as (val: number) => void;
    const setPlaybackCircles = $get('setPlaybackCircles') as (val: any) => void;
    
    animationRecorder.clear();
    setHasAnimation(false);
    setAnimationDuration(0);
    setRecordingDuration(0);
    setRecordingFrames(0);
    setPlaybackCircles(null);
  }, [$get]);

  const applyAnimationSmoothing = useCallback(() => {
    const animationRecorder = $get('animationRecorder') as any;
    const smoothingStrength = $get('smoothingStrength') as number;
    const setIsPlayingAnimation = $get('setIsPlayingAnimation') as (val: boolean) => void;
    const setPlaybackCircles = $get('setPlaybackCircles') as (val: any) => void;
    
    if (!animationRecorder.hasAnimation()) return;
    
    // Stop playback if playing
    if (animationRecorder.getIsPlaying()) {
      animationRecorder.stopPlayback();
      setIsPlayingAnimation(false);
      setPlaybackCircles(null);
    }
    
    animationRecorder.applySmoothing(smoothingStrength);
    console.log(`Applied smoothing with strength ${smoothingStrength}`);
  }, [$get]);

  return {
    startRecording,
    stopRecording,
    playAnimation,
    stopAnimation,
    saveCurrentAnimation,
    loadAnimation,
    clearAnimation,
    applyAnimationSmoothing,
  };
}
