// useCompassHeading.ts

import { useState, useEffect, useCallback, useRef } from "react";

const OFFSET_KEY = "compass-calibration-offset";

interface CompassState {
  heading: number | null;
  rawHeading: number | null;
  supported: boolean;
  permissionNeeded: boolean;
  permissionGranted: boolean;
  error: string | null;
}

function isIOSPermissionAPI(): boolean {
  return typeof (DeviceOrientationEvent as any)?.requestPermission === "function";
}

function loadOffset(): number {
  try {
    const stored = localStorage.getItem(OFFSET_KEY);
    return stored ? parseFloat(stored) : 0;
  } catch {
    return 0;
  }
}

function saveOffset(offset: number) {
  try {
    localStorage.setItem(OFFSET_KEY, offset.toString());
  } catch {
    // ignore
  }
}

export function useCompassHeading() {
  const [state, setState] = useState<CompassState>({
    heading: null,
    rawHeading: null,
    supported: typeof window !== "undefined" && "DeviceOrientationEvent" in window,
    permissionNeeded: isIOSPermissionAPI(),
    permissionGranted: !isIOSPermissionAPI(),
    error: null,
  });

  const offsetRef = useRef(loadOffset());

  const applyOffset = useCallback((raw: number) => {
    return ((raw - offsetRef.current) % 360 + 360) % 360;
  }, []);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const iosHeading = (event as any).webkitCompassHeading;
    if (typeof iosHeading === "number") {
      setState((prev) => ({ ...prev, rawHeading: iosHeading, heading: applyOffset(iosHeading) }));
      return;
    }

    if (event.alpha !== null) {
      const raw = 360 - event.alpha;
      setState((prev) => ({ ...prev, rawHeading: raw, heading: applyOffset(raw) }));
    }
  }, [applyOffset]);

  const requestPermission = useCallback(async () => {
    if (!isIOSPermissionAPI()) {
      setState((prev) => ({ ...prev, permissionGranted: true }));
      return true;
    }
    try {
      const result = await (DeviceOrientationEvent as any).requestPermission();
      const granted = result === "granted";
      setState((prev) => ({ ...prev, permissionGranted: granted, error: granted ? null : "Permission denied" }));
      return granted;
    } catch {
      setState((prev) => ({ ...prev, error: "Could not request compass permission" }));
      return false;
    }
  }, []);

  // Call this once the user has physically pointed the phone at true north
  const recalibrateToNorth = useCallback(() => {
    if (state.rawHeading === null) return;
    offsetRef.current = state.rawHeading;
    saveOffset(state.rawHeading);
    setState((prev) => ({ ...prev, heading: 0 }));
  }, [state.rawHeading]);

  // Clears any manual correction, back to raw sensor readings
  const resetCalibration = useCallback(() => {
    offsetRef.current = 0;
    saveOffset(0);
    setState((prev) => ({ ...prev, heading: prev.rawHeading !== null ? applyOffset(prev.rawHeading) : null }));
  }, [applyOffset]);

  useEffect(() => {
    if (!state.supported || !state.permissionGranted) return;
    const eventName = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
    window.addEventListener(eventName, handleOrientation as EventListener);
    return () => {
      window.removeEventListener(eventName, handleOrientation as EventListener);
    };
  }, [state.supported, state.permissionGranted, handleOrientation]);

  return { ...state, requestPermission, recalibrateToNorth, resetCalibration };
}