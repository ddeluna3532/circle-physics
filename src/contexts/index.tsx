export { DataProvider, useData, useCircles, useLayers as useLayersData, useSelection } from './DataContext';
export { PhysicsProvider, usePhysicsContext, useMagnet, useNBody, useSticky } from './PhysicsContext';
export { AnimationProvider, useAnimationContext, useAnimationRecording, useAnimationPlayback } from './AnimationContext';

export type { DataContextValue, DataRegistry } from './DataContext';
export type { PhysicsContextValue, PhysicsState } from './PhysicsContext';
export type { AnimationContextValue, AnimationState } from './AnimationContext';

// Combined provider for convenience
import React from 'react';
import { DataProvider } from './DataContext';
import { PhysicsProvider } from './PhysicsContext';
import { AnimationProvider } from './AnimationContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <PhysicsProvider>
        <AnimationProvider>
          {children}
        </AnimationProvider>
      </PhysicsProvider>
    </DataProvider>
  );
}
