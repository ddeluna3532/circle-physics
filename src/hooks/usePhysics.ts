import { useRef, useCallback, useEffect, useState } from "react";
import { PhysicsSystem, Circle, createCircle } from "../physics";

export function usePhysics() {
  const systemRef = useRef<PhysicsSystem>(new PhysicsSystem());
  const [circleCount, setCircleCount] = useState(0);

  // Force re-render when circles change
  const [, forceUpdate] = useState(0);

  const system = systemRef.current;

  const addCircle = useCallback(
    (x: number, y: number, r: number, color: string): boolean => {
      const circle = createCircle(x, y, r, color);
      const added = system.addCircle(circle);
      if (added) {
        setCircleCount(system.circles.length);
      }
      return added;
    },
    [system]
  );

  const clear = useCallback(() => {
    system.clear();
    setCircleCount(0);
  }, [system]);

  const getCircleAt = useCallback(
    (x: number, y: number) => system.getCircleAt(x, y),
    [system]
  );

  const removeCircle = useCallback(
    (id: number) => {
      system.removeCircle(id);
      setCircleCount(system.circles.length);
    },
    [system]
  );

  const setBounds = useCallback(
    (x: number, y: number, w: number, h: number) => {
      system.setBounds(x, y, w, h);
    },
    [system]
  );

  const setGravity = useCallback(
    (enabled: boolean) => {
      system.config.gravityEnabled = enabled;
      forceUpdate((n) => n + 1);
    },
    [system]
  );

  const setWalls = useCallback(
    (enabled: boolean) => {
      system.config.wallsEnabled = enabled;
      forceUpdate((n) => n + 1);
    },
    [system]
  );

  const setFloor = useCallback(
    (enabled: boolean, y?: number) => {
      system.config.floorEnabled = enabled;
      if (y !== undefined) system.config.floorY = y;
      forceUpdate((n) => n + 1);
    },
    [system]
  );

  return {
    system,
    circles: system.circles,
    circleCount,
    config: system.config,
    addCircle,
    removeCircle,
    clear,
    getCircleAt,
    setBounds,
    setGravity,
    setWalls,
    setFloor,
  };
}
