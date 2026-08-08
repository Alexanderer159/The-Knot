import { useState, useEffect, useRef } from "react";
import { useCompassHeading } from "@/hooks/useCompassHeading";
import { Compass as CompassIcon, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const EXIT_DURATION = 300;

function headingLabel(heading: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(heading / 45) % 8;
  return dirs[index];
}

export function Compass() {
  const { heading, supported, permissionNeeded, permissionGranted, error, requestPermission, recalibrateToNorth, resetCalibration } = useCompassHeading();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Tracks the accumulated rotation (can exceed 360 or go negative) so the
  // ring always takes the shortest visual path instead of snapping at the
  // 0/360 wrap-around point
  const [displayRotation, setDisplayRotation] = useState(0);
  const lastRawHeading = useRef<number | null>(null);

  useEffect(() => {
    if (heading === null) return;

    if (lastRawHeading.current === null) {
      lastRawHeading.current = heading;
      setDisplayRotation(-heading);
      return;
    }

    let delta = heading - lastRawHeading.current;
    // Normalize delta to the range (-180, 180], i.e. the shortest turn direction
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    lastRawHeading.current = heading;
    setDisplayRotation((prev) => prev - delta);
  }, [heading]);

  const openFullscreen = () => setMounted(true);

  const closeFullscreen = () => {
    setVisible(false);
    setTimeout(() => setMounted(false), EXIT_DURATION);
  };

  useEffect(() => {
    if (mounted) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [mounted]);

  if (!supported) {
    return (
      <Card className="tactical-border">
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          Compass not supported on this device/browser.
        </CardContent>
      </Card>
    );
  }

  if (permissionNeeded && !permissionGranted) {
    return (
      <Card className="tactical-border">
        <CardContent className="p-4 space-y-3 text-center">
          <CompassIcon className="h-8 w-8 text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            This device needs permission to access its compass sensor.
          </p>
          <Button onClick={requestPermission} className="w-full">
            Enable Compass
          </Button>
          {error && <p className="text-xs text-critical">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  const dialFace = (size: number) => (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full border-2 border-primary/40 flex items-center justify-center transition-transform duration-200 ease-linear"
        style={{ transform: `rotate(${displayRotation}deg)` }}
      >
        <span className="absolute top-2 text-critical font-bold text-sm">N</span>
        <span className="absolute bottom-2 text-muted-foreground text-sm">S</span>
        <span className="absolute left-2 text-muted-foreground text-sm">W</span>
        <span className="absolute right-2 text-muted-foreground text-sm">E</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Navigation
          className="text-primary"
          style={{ width: size * 0.35, height: size * 0.35, transform: "rotate(-45deg)" }}
          fill="currentColor"
        />
      </div>
    </div>
  );

  return (
    <>
      <Card onClick={openFullscreen} className="tactical-border cursor-pointer transition-colors hover:bg-secondary/30">
        <CardContent className="p-6 flex flex-col items-center gap-3">
          {dialFace(160)}
          <div className="text-center">
            <p className="text-3xl font-heading font-bold">
              {heading !== null ? `${Math.round(heading)}°` : "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              {heading !== null ? headingLabel(heading) : "Calibrating..."}
            </p>
          </div>
          <p className="text-xs text-foreground text-center max-w-xs">
            Tap to expand.
          </p>
        </CardContent>
      </Card>

      {mounted && (
        <div
          onClick={closeFullscreen}
          className={cn(
            "fixed inset-0 z-[1000] bg-card flex flex-col items-center justify-center gap-6 cursor-pointer transition-opacity duration-300 ease-in-out",
            visible ? "opacity-100" : "opacity-0"
          )}
        >
          <div
            className={cn(
              "transition-all duration-300 ease-out",
              visible ? "scale-100 opacity-100" : "scale-75 opacity-0"
            )}
          >
            {dialFace(280)}
          </div>

          <div
            className={cn(
              "text-center transition-all duration-300 delay-75 ease-out",
              visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            )}
          >
            <p className="text-5xl font-heading font-bold">
              {heading !== null ? `${Math.round(heading)}°` : "—"}
            </p>
            <p className="text-lg text-muted-foreground">
              {heading !== null ? headingLabel(heading) : "Calibrating..."}
            </p>
          </div>

          <p className="text-xs text-foreground text-center max-w-xs px-6">
            Points to magnetic north. Move away from metal objects or electronics for a better reading. Tap anywhere to close.
          </p>

          {/* Recalibration controls, stopPropagation so tapping these doesn't also close the overlay */}
          <div
            className={cn(
              "flex gap-2 transition-all duration-300 delay-150 ease-out",
              visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <Button onClick={recalibrateToNorth} variant="outline" size="sm">
              Set Current Direction as North
            </Button>
            <Button onClick={resetCalibration} variant="ghost" size="sm" className="text-muted-foreground">
              Reset
            </Button>
          </div>
        </div>
      )}
    </>
  );
}