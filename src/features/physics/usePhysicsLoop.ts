import { useEffect } from 'react';
import { PhysicsSystem } from '../../physics';
import { AnimationRecorder } from '../../layers/AnimationRecorder';
import { useMagnet } from './forces/useMagnet';
import { useNBody } from './forces/useNBody';
import { useSticky } from './forces/useSticky';

interface PhysicsLoopProps {
  system: PhysicsSystem;
  render: () => void;
  applyScaling: () => void;
  applyRandomScaling: () => void;
  autoSpawn: () => void;
  autoSpawnRandom: () => void;
  physicsPaused: boolean;
  isPlayingAnimation: boolean;
  isRecording: boolean;
  animationRecorder: AnimationRecorder;
}

export function usePhysicsLoop(props: PhysicsLoopProps) {
  // Get token-optimized force hooks
  const applyMagnet = useMagnet();
  const applyNBodyForce = useNBody();
  const applyStickyForce = useSticky();
  
  useEffect(() => {
    let lastTime = performance.now();
    let slowFrameCount = 0;
    let animationFrameId: number;

    const loop = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      
      // Performance monitoring
      if (delta > 100) {
        slowFrameCount++;
        if (slowFrameCount > 5) {
          console.warn('Performance critical - consider pausing physics');
          slowFrameCount = 0;
        }
      } else {
        slowFrameCount = Math.max(0, slowFrameCount - 1);
      }

      // Only run physics if not paused and not playing animation
      if (!props.physicsPaused && !props.isPlayingAnimation) {
        applyMagnet();
        applyNBodyForce();
        applyStickyForce();
        props.applyScaling();
        props.applyRandomScaling();
        props.autoSpawn();
        props.autoSpawnRandom();
        props.system.applyFlowField();
        props.system.update();
      }
      
      // Capture frame if recording
      if (props.isRecording) {
        props.animationRecorder.captureFrame(props.system.circles);
      }
      
      props.render();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    props.system,
    props.render,
    applyMagnet,
    applyNBodyForce,
    applyStickyForce,
    props.applyScaling,
    props.applyRandomScaling,
    props.autoSpawn,
    props.autoSpawnRandom,
    props.physicsPaused,
    props.isRecording,
    props.isPlayingAnimation,
    props.animationRecorder,
  ]);
}
