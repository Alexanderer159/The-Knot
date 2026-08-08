import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, Maximize2, MapPin, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMapMarkers, type MarkerCategory } from "@/hooks/useMapMarkers";
import { usePodLocations } from "@/hooks/useLocationSharing";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CachedMapTiles } from "@/components/CachedMapTiles";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const markerColors: Record<string, string> = {
  meeting: "#22c55e",
  danger: "#ef4444",
  resource: "#3b82f6",
  shelter: "#eab308",
};

const markerLabels: Record<MarkerCategory, string> = {
  meeting: "Meeting Point",
  danger: "Danger Zone",
  resource: "Resource",
  shelter: "Shelter",
};

const allCategories: MarkerCategory[] = ["meeting", "danger", "resource", "shelter"];

function poiIcon(type: string) {
  const color = markerColors[type] || "#9ca3af";
  return L.divIcon({
    className: "",
    html: `<div style="width: 16px; height: 16px; border-radius: 9999px; background: ${color}; ;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function memberIcon(status: string | null | undefined) {
  const color = status === "ok" ? "#22c55e" : status === "help" ? "#eab308" : status === "critical" ? "#ef4444" : "#9ca3af";
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 28px; height: 28px; border-radius: 9999px;
        background: ${color};
        display: flex; align-items: center; justify-content: center;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function pendingIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width: 18px; height: 18px; border-radius: 9999px; background: #fef400;"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  return null;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Listens for long-press (mobile) / right-click (desktop) on the map
function LongPressListener({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    contextmenu(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface Props {
  heightClass?: string;
  focusPoint?: { lat: number; lng: number } | null;
}

export default function AegisMap({ heightClass = "h-48", focusPoint }: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const { markers, addMarker, removeMarker } = useMapMarkers();
  const podMembers = usePodLocations();
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  const [pendingPoint, setPendingPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<MarkerCategory>("meeting");
  const [submitting, setSubmitting] = useState(false);

  // Marker deletion confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await removeMarker(deleteTarget.id);
    if (error) {
      toast({ title: "Couldn't delete point", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Point deleted", description: deleteTarget.name });
    }
    setDeleteTarget(null);
  };

  useEffect(() => {
    if (focusPoint) {
      setFullscreen(true);
    }
  }, [focusPoint]);

  const myLocation = (() => {
    if (!authUser) return null;
    const me = podMembers.find((m) => m.user_id === authUser.id);
    if (me?.latitude && me?.longitude && !(me.latitude === 0 && me.longitude === 0)) {
      return { lat: me.latitude, lng: me.longitude };
    }
    return null;
  })();

  const getCenter = (): [number, number] => {
    // Priority 1: explicit focus point (e.g. jumped here from a member's card)
    if (focusPoint) {
      return [focusPoint.lat, focusPoint.lng];
    }
    // Priority 2: your own shared location
    if (myLocation) {
      return [myLocation.lat, myLocation.lng];
    }
    // Priority 3: average of existing map markers
    if (markers.length > 0) {
      const avgLat = markers.reduce((s, m) => s + m.latitude, 0) / markers.length;
      const avgLng = markers.reduce((s, m) => s + m.longitude, 0) / markers.length;
      return [avgLat, avgLng];
    }
    // Priority 4: fallback to Madrid
    return [40.4168, -3.7038];
  };

  const handleConfirmAdd = async () => {
    if (!pendingPoint || !newName.trim()) return;
    setSubmitting(true);
    const { error } = await addMarker({
      name: newName.trim(),
      category: newCategory,
      latitude: pendingPoint.lat,
      longitude: pendingPoint.lng,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't add point", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Point added", description: newName.trim() });
    setPendingPoint(null);
    setNewName("");
    setNewCategory("meeting");
  };

  return (
    <>
      {/* Compact Preview */}
      <div onClick={() => setFullscreen(true)} className={cn("relative w-full rounded-lg overflow-hidden tactical-border cursor-pointer group", heightClass)}>
        <div className="pointer-events-none absolute inset-0 z-0">
          <MapContainer center={getCenter()} zoom={13} scrollWheelZoom={false} dragging={false} doubleClickZoom={false} zoomControl={false} touchZoom={false} attributionControl={false} className="w-full h-full">
            <RecenterMap center={getCenter()} />
            <CachedMapTiles url={TILE_URL} />

            {markers.map((marker) => (
              <Marker key={marker.id} position={[marker.latitude, marker.longitude]} icon={poiIcon(marker.category)} />
            ))}
            {podMembers.map((member) => (
              member.latitude && member.longitude && (
                <Marker key={member.id} position={[member.latitude, member.longitude]} icon={memberIcon(member.status)} />
              )
            ))}
          </MapContainer>
        </div>
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 rounded-full p-2">
            <Maximize2 className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-[1000] bg-background">
          <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 z-[1100] bg-card rounded-full p-2 shadow-lg text-primary hover:text-critical transition-all duration-300">
            <X className="h-5 w-5" />
          </button>

          {!pendingPoint && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1100] bg-card border border-border rounded-lg p-3 text-sm text-muted-foreground max-w-[220px] text-center">
              <span className="sm:hidden">Press and hold anywhere on the map to add a point</span>
              <span className="hidden sm:inline">Right click anywhere on the map to add a point</span>
            </div>
          )}

          <div className="w-full h-full">
            <MapContainer center={getCenter()} zoom={focusPoint ? 16 : 13} scrollWheelZoom={true} dragging={true} doubleClickZoom={true} zoomControl={true} touchZoom={true} attributionControl={true} className="w-full h-full">
              <InvalidateOnMount />
              <RecenterMap center={getCenter()} />
              <LongPressListener onPick={(lat, lng) => setPendingPoint({ lat, lng })} />
              <CachedMapTiles url={TILE_URL} />

              {markers.map((marker) => (
                <Marker key={marker.id} position={[marker.latitude, marker.longitude]} icon={poiIcon(marker.category)}>
                  <Popup>
                    <div className="flex gap-5 items-center">
                      <span className="font-bold">{marker.name}</span>
                      <button onClick={() => setDeleteTarget({ id: marker.id, name: marker.name })}>
                        <Trash2 className="text-critical w-5"/>
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {podMembers.map((member) => (
                member.latitude && member.longitude && (
                  <Marker key={member.id} position={[member.latitude, member.longitude]} icon={memberIcon(member.status)}>
                    <Popup>
                      <span style={{ fontWeight: 600 }}>{member.display_name}</span>
                    </Popup>
                  </Marker>
                )
              ))}

              {pendingPoint && (
                <Marker position={[pendingPoint.lat, pendingPoint.lng]} icon={pendingIcon()} />
              )}
            </MapContainer>
          </div>

          {pendingPoint && (
            <div className="absolute bottom-0 left-0 right-0 z-[1100] bg-card/60 backdrop-blur-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-heading font-semibold">
                <MapPin className="h-4 w-4 text-primary" />
                New Point
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {pendingPoint.lat.toFixed(5)}, {pendingPoint.lng.toFixed(5)}
              </p>
              <Input placeholder="Point name" value={newName} onChange={e => setNewName(e.target.value)} className="bg-secondary" autoFocus />
              <select value={newCategory} onChange={e => setNewCategory(e.target.value as MarkerCategory)} className="w-full rounded-md bg-secondary border border-border px-2 py-2 text-sm text-foreground">
                {allCategories.map(c => (
                  <option key={c} value={c}>{markerLabels[c]}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button onClick={handleConfirmAdd} size="sm" className="flex-1 text-black font-extrabold" disabled={submitting || !newName.trim()}>
                  {submitting ? "Adding..." : "Add Point"}
                </Button>
                <Button onClick={() => { setPendingPoint(null); setNewName(""); }} size="sm" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Marker Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-card z-[1200]">
          <DialogHeader>
            <DialogTitle>Delete this point?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground text-center">
            "{deleteTarget?.name}" will be removed from the map for everyone in your Knot. This can't be undone.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}