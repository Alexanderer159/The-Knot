import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, AlertTriangle, Droplets, Home, Share2, Users, Plus, Trash2, CheckCircle2, ShieldAlert, CompassIcon, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMapMarkers, type MarkerCategory } from "@/hooks/useMapMarkers";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { usePodLocations } from "@/hooks/useLocationSharing";
import { useLocalUser } from "@/hooks/useLocalUser";
import { useToast } from "@/hooks/use-toast";
import AegisMap from "@/components/AegisMap";
import type { StatusType } from "@/lib/store";
import { useOfflineMarkerSync } from "@/hooks/useOfflineMarkerSync";
import { Compass } from "@/components/Compass";

const markerIcons: Record<MarkerCategory, React.ElementType> = {
  meeting: MapPin,
  danger: AlertTriangle,
  resource: Droplets,
  shelter: Home,
};

const markerColors: Record<MarkerCategory, string> = {
  meeting: "text-primary",
  danger: "text-critical",
  resource: "text-blue-400",
  shelter: "text-warning",
};

const markerLabels: Record<MarkerCategory, string> = {
  meeting: "Meeting Point",
  danger: "Danger Zone",
  resource: "Resource",
  shelter: "Shelter",
};

const allCategories: MarkerCategory[] = ["meeting", "danger", "resource", "shelter"];

const statusColors: Record<string, string> = {
  ok: "bg-safe",
  help: "bg-warning animate-pulse-glow",
  critical: "bg-critical animate-pulse-glow",
};

export default function MapaPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const focusPoint = location.state?.focusLat && location.state?.focusLng ? { lat: location.state.focusLat, lng: location.state.focusLng } : null;
  const [showCompass, setShowCompass] = useState(false);

  const podMembers = usePodLocations();
  const { markers, addMarker, removeMarker } = useMapMarkers();
  const { user, shareLocation } = useLocalUser();
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<MarkerCategory>("meeting");
  const [newLat, setNewLat] = useState("");
  const [newLng, setNewLng] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<StatusType>("ok");
  const [locating, setLocating] = useState(false);
  const { enabled: offlineEnabled, enable: enableOffline, disable: disableOffline, syncing, progress } = useOfflineMarkerSync();
  const [offlineConfirmOpen, setOfflineConfirmOpen] = useState(false);

  // Marker deletion confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleOfflineToggle = (checked: boolean) => {
    if (checked) {
      enableOffline();
    } else {
      setOfflineConfirmOpen(true); // don't disable yet, confirm first
    }
  };

  const confirmDisableOffline = () => {
    disableOffline();
    setOfflineConfirmOpen(false);
  };

  const handleAdd = async () => {
    const lat = parseFloat(newLat);
    const lng = parseFloat(newLng);
    if (!newName.trim() || isNaN(lat) || isNaN(lng)) {
      toast({ title: "Missing info", description: "Name, latitude and longitude are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await addMarker({ name: newName.trim(), category: newCategory, latitude: lat, longitude: lng });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't add point", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Point added", description: newName.trim() });
    setNewName("");
    setNewLat("");
    setNewLng("");
    setShowAdd(false);
  };

  const requestDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setDeleteTarget({ id, name });
  };

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

  const goToLocation = (lat: number, lng: number) => {
    navigate("/map", { state: { focusLat: lat, focusLng: lng } });
  };

  const copyCoords = (e: React.MouseEvent, lat: number, lng: number) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    toast({ title: "Coordinates copied", description: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
  };

  const openShareDialog = () => {
    setShareStatus(user?.status ?? "ok");
    setShareOpen(true);
  };

  const confirmShare = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not available", description: "Your browser doesn't support location sharing.", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { error } = await shareLocation(pos.coords.latitude, pos.coords.longitude, shareStatus);
        setLocating(false);
        if (error) {
          toast({ title: "Couldn't share location", description: error.message, variant: "destructive" });
          return;
        }
        toast({ title: "Location shared", description: `Status: ${shareStatus.toUpperCase()}` });
        setShareOpen(false);
      },
      (err) => {
        setLocating(false);
        toast({ title: "Location access denied", description: err.message, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Live Pod Members */}
      
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              MEMBERS ONLINE ({podMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {podMembers.map((member) => {
              const hasValidLocation = member.latitude && member.longitude && !(member.latitude === 0 && member.longitude === 0);
              return (
                <div
                  key={member.id}
                  onClick={() => hasValidLocation && goToLocation(member.latitude!, member.longitude!)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2",
                    hasValidLocation && "cursor-pointer hover:bg-secondary/80 transition-colors"
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-xs font-bold text-primary">
                    {member.avatar_initials}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-heading font-semibold">{member.display_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {hasValidLocation ? (
                        <>
                          {member.latitude.toFixed(4)}, {member.longitude.toFixed(4)}
                          {member.location_updated_at && (
                            <> · {new Date(member.location_updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
                          )}
                        </>
                      ) : (
                        "Location unknown"
                      )}
                    </p>
                  </div>
                  {hasValidLocation && (
                    <button
                      onClick={(e) => copyCoords(e, member.latitude!, member.longitude!)}
                      className="h-7 w-7 rounded bg-secondary flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-primary transition-colors shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", statusColors[member.status || ""] || "bg-muted-foreground")} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      

      {/* Map Preview */}
      <AegisMap heightClass="h-60" focusPoint={focusPoint} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">OFFLINE MAPS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-sm">Auto-download around your points</span>
              <p className="text-xs text-muted-foreground">Keeps the map ready offline near every point you place</p>
            </div>
            <Switch checked={offlineEnabled} onCheckedChange={handleOfflineToggle} />
          </div>

          {offlineEnabled && syncing && (
            <div className="space-y-1">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: progress.total ? `${(progress.done / progress.total) * 100}%` : "0%" }} />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Syncing: {progress.done} / {progress.total} tiles
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={offlineConfirmOpen} onOpenChange={setOfflineConfirmOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Turn off offline maps?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This deletes all map data cached for your points. You'll need an internet connection to view the map again until you turn this back on.</p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setOfflineConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={confirmDisableOffline}>Turn Off & Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Marker Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-card">
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

      <div className={cn("grid transition-all duration-500 ease-in-out", showCompass ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0")}>
        <div className="overflow-hidden">
          <Compass />
        </div>
      </div>

      <Button onClick={() => setShowCompass(!showCompass)} className="w-full bg-card/70 text-primary ring-0">
        <CompassIcon className="h-4 w-4 mr-2" /> {showCompass ? "Hide Compass" : "Show Compass"}
      </Button>

      {/* Points of Interest */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">POINTS OF INTEREST</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {markers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">No points set yet</p>
          )}
          {markers.map((marker) => {
            const Icon = markerIcons[marker.category];
            return (
              <div
                key={marker.id}
                onClick={() => goToLocation(marker.latitude, marker.longitude)}
                className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5 cursor-pointer hover:bg-secondary/80 transition-colors"
              >
                <Icon className={cn("h-4 w-4", markerColors[marker.category])} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-heading font-semibold">{marker.name}</p>
                    <span className="text-[10px] text-muted-foreground">{markerLabels[marker.category]}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {marker.latitude.toFixed(3)}, {marker.longitude.toFixed(3)}
                  </p>
                </div>
                <button
                  onClick={(e) => copyCoords(e, marker.latitude, marker.longitude)}
                  className="h-7 w-7 rounded bg-secondary flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-primary transition-colors shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => requestDelete(e, marker.id, marker.name)}
                  className="h-7 w-7 rounded bg-secondary flex items-center justify-center hover:bg-critical/20 text-muted-foreground hover:text-critical transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}

          {showAdd ? (
            <div className="space-y-3 pt-5 border-t border-border">
              <Input placeholder="Point name" value={newName} onChange={e => setNewName(e.target.value)} className="bg-secondary" />
              <div className="flex flex-col gap-3">
                <select value={newCategory} onChange={e => setNewCategory(e.target.value as MarkerCategory)}
                 className="rounded-md bg-secondary px-2 py-2 text-sm text-foreground ">
                  {allCategories.map(c => (
                    <option key={c} value={c}>{markerLabels[c]}</option>
                  ))}
                </select>
                <Input placeholder="Latitude" value={newLat} onChange={e => setNewLat(e.target.value)} className="bg-secondary" />
                <Input placeholder="Longitude" value={newLng} onChange={e => setNewLng(e.target.value)} className="bg-secondary" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd}  className="flex-1 font-bold" disabled={submitting}>
                  <Plus className="h-4 w-4 mr-1" /> {submitting ? "Adding..." : "Add"}
                </Button>
                <Button onClick={() => setShowAdd(false)}  className="flex-1 bg-secondary text-white">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowAdd(true)} variant="outline" className="w-full mt-2">
              <Plus className="h-4 w-4 mr-2" /> Add point
            </Button>
          )}
        </CardContent>
      </Card>

      <Button onClick={openShareDialog} className="bg-primary w-full text-black font-bold" >
        <Share2 className="h-5 w-5 mr-2" />
        SHARE LOCATION
      </Button>

      {/* Share Location Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-sm bg-card">
          <DialogHeader>
            <DialogTitle>Confirm Your Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-foreground text-center">
              Your location will be shared with your Knot. Confirm your current status.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setShareStatus("ok")}
                className={cn("flex flex-col items-center gap-1 rounded-lg py-3 transition-colors",
                  shareStatus === "ok" ? "bg-safe/10" : "bg-secondary")}
              >
                <CheckCircle2 className={cn("h-5 w-5", shareStatus === "ok" ? "text-safe" : "text-muted-foreground")} />
                <span className="text-xs font-semibold">OK</span>
              </button>
              <button
                onClick={() => setShareStatus("help")}
                className={cn("flex flex-col items-center gap-1 rounded-lg py-3 transition-colors",
                  shareStatus === "help" ? " bg-warning/10" : " bg-secondary")}
              >
                <AlertTriangle className={cn("h-5 w-5", shareStatus === "help" ? "text-warning" : "text-muted-foreground")} />
                <span className="text-xs font-semibold">HELP</span>
              </button>
              <button
                onClick={() => setShareStatus("critical")}
                className={cn("flex flex-col items-center gap-1 rounded-lg py-3 transition-colors",
                  shareStatus === "critical" ? "bg-critical/10" : "bg-secondary")}
              >
                <ShieldAlert className={cn("h-5 w-5", shareStatus === "critical" ? "text-critical" : "text-muted-foreground")} />
                <span className="text-xs font-semibold">CRITICAL</span>
              </button>
            </div>
            <Button onClick={confirmShare} className="w-full font-bold" disabled={locating}>
              {locating ? "Getting location..." : "Confirm & Share"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}