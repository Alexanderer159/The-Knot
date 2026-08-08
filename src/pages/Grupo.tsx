import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Shield, Heart, Compass, Radio, Package, HardHat, Users, UserPlus, Bell, Trash2, CheckCircle2, AlertTriangle, ShieldAlert, MapPin, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { roleLabels, roleDescriptions, type RoleType, type StatusType } from "@/lib/store";
import { useMembers } from "@/hooks/useMembers";
import { useSupplies } from "@/hooks/useSupplies";
import { useActivityLog } from "@/hooks/useActivityLog";
import { timeAgo } from "@/lib/timeAgo";
import { roleCategoryMap } from "@/lib/supplies";
import { useLocalUser } from "@/hooks/useLocalUser";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import RoleDetailSheet from "@/components/RoleDetailSheet";

const roleIcons: Record<RoleType, React.ElementType> = {
  vanguard: Shield,
  medic: Heart,
  navigator: Compass,
  comms: Radio,
  quartermaster: Package,
  builder: HardHat,
};

export default function Grupo() {
  const { user, addDependent, removeDependent, shareLocation } = useLocalUser();
  const { toast } = useToast();
  const { roster } = useMembers();
  const { entries: activity, hasMore } = useActivityLog(10);
  const navigate = useNavigate();
  const [sheetRole, setSheetRole] = useState<RoleType | null>(null);
  const { supplies } = useSupplies();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const relevantCategories = sheetRole ? roleCategoryMap[sheetRole] : [];
  const filteredSupplies = sheetRole ? supplies.filter((s) => relevantCategories.includes(s.category)) : [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [depName, setDepName] = useState("");
  const [depRelation, setDepRelation] = useState("Family member");
  const [depLocation, setDepLocation] = useState("");

  const dependents = user?.dependents ?? [];

  const handleAddDependent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depName.trim()) return;
    addDependent({
      name: depName.trim(),
      relation: depRelation,
      location: depLocation.trim() || "No location set",
      status: null,
    });
    toast({ title: "Node linked", description: `${depName.trim()} added as ${depRelation}` });
    setDepName("");
    setDepRelation("Family member");
    setDepLocation("");
    setDialogOpen(false);
  };

  const handleStatusClick = (status: StatusType) => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not available", description: "Your browser doesn't support location sharing.", variant: "destructive" });
      return;
    }
    setUpdatingStatus(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { error } = await shareLocation(pos.coords.latitude, pos.coords.longitude, status);
        setUpdatingStatus(false);
        if (error) {
          toast({ title: "Couldn't update status", description: error.message, variant: "destructive" });
        }
      },
      async (err) => {
        const { error } = await shareLocation(0, 0, status).catch(() => ({ error: err }));
        setUpdatingStatus(false);
        toast({ title: "Status updated without location", description: "Location access was denied or unavailable." });
      },
      { enableHighAccuracy: true, timeout: 60000 }
    );
  };

  const goToLocation = (e: React.MouseEvent, lat: number, lng: number) => {
    e.stopPropagation();
    navigate("/map", { state: { focusLat: lat, focusLng: lng } });
  };

  const sheetEntry = roster.find(r => r.role === sheetRole);

  useEffect(() => {
    const quickStatus = searchParams.get("quickstatus");
    if (quickStatus === "ok" || quickStatus === "help" || quickStatus === "critical") {
      handleStatusClick(quickStatus);
      // Clean the URL so refreshing doesn't re-trigger it
      setSearchParams({}, { replace: true });
    }
  }, []);

  return (
    <div className="space-y-5">

      {/* Status Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button size="xl" disabled={updatingStatus} className={cn("flex-col gap-1 bg-secondary/70 text-white/70", user?.status === "ok" && "text-safe")} onClick={() => handleStatusClick("ok")}>
          <CheckCircle2 className="h-6 w-6" />
          <span className="text-xs">I´M OK</span>
        </Button>
        <Button size="xl" disabled={updatingStatus} className={cn("flex-col gap-1 bg-secondary/70 text-white/70", user?.status === "help" && "text-warning")} onClick={() => handleStatusClick("help")}>
          <AlertTriangle className="h-6 w-6" />
          <span className="text-xs">HELP</span>
        </Button>
        <Button size="xl" disabled={updatingStatus} className={cn("flex-col gap-1 bg-secondary/70 text-white/70", user?.status === "critical" && "text-critical")} onClick={() => handleStatusClick("critical")}>
          <ShieldAlert className="h-6 w-6" />
          <span className="text-xs">CRITICAL</span>
        </Button>
      </div>

      {/* Members / Activity Accordion */}
      <Accordion type="single" collapsible defaultValue="members">
        <AccordionItem value="members" className="border-none">
          <AccordionTrigger className="hover:no-underline">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              KNOT MEMBERS
            </CardTitle>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {roster.map((entry) => {
                const Icon = roleIcons[entry.role];
                const isCurrentUser = user?.role === entry.role;
                const hasValidLocation = entry.filled && entry.latitude && entry.longitude && !(entry.latitude === 0 && entry.longitude === 0);

                return (
                  <Card key={entry.role} className={cn("relative transition-all", !entry.filled && "")}
                    onClick={() => setSheetRole(entry.role)}
                  >
                    <span className={cn("absolute top-2 right-2 h-2 w-2 rounded-full shrink-0",
                      entry.status === "ok" ? "bg-safe" :
                      entry.status === "help" ? "bg-warning animate-pulse-glow" :
                      entry.status === "critical" ? "bg-critical animate-pulse-glow" : ""
                    )} />

                    <CardContent className="flex items-center justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center">
                        <Icon className="text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">
                          {roleLabels[entry.role]}
                          {isCurrentUser && <span className="text-primary text-xs ml-2">(You)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.filled ? `${entry.displayName}` : "Role not filled"}
                        </p>
                        <p className="text-xs text-muted-foreground">{roleDescriptions[entry.role]}</p>
                      </div>

                      <div className="flex flex-col justify-center items-center gap-2">
                        {!entry.filled ? (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-4 w-4 shrink-0" />
                            No Location
                          </p>
                        ) : hasValidLocation ? (
                          <button
                            onClick={(e) => goToLocation(e, entry.latitude!, entry.longitude!)}
                            className="text-sm text-muted-foreground font-mono flex items-center gap-1 mt-0.5 hover:text-primary transition-colors"
                          >
                            <MapPin className="h-4 w-4 shrink-0 text-primary" />
                            {entry.latitude!.toFixed(4)}, {entry.longitude!.toFixed(4)}
                          </button>
                        ) : (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-4 w-4 shrink-0" />
                            Location unknown
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="activity" className="border-none">
          <AccordionTrigger className="hover:no-underline">
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              ACTIVITY FEED
            </CardTitle>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {activity.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No activity yet</p>
              )}
              {activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg bg-secondary/50 px-3 py-2.5">
                  <span className="mt-1 h-2 w-2 rounded-full shrink-0 bg-white/30" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{item.actor_name}</span>{" "}
                      <span className="text-muted-foreground">{item.action}</span>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono shrink-0">{timeAgo(item.created_at)}</span>
                </div>
              ))}
              {hasMore && (
                <Button onClick={() => navigate("/activity")} variant="ghost" size="sm" className="w-full mt-1 text-muted-foreground">
                  See more
                </Button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Family Nodes */}
      <Card className="tactical-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            FAMILY ({dependents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dependents.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">No linked family members</p>
          )}
          {dependents.map((dep) => (
            <div key={dep.id} className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold">
                {dep.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-heading font-semibold">{dep.name}</p>
                <p className="text-xs text-muted-foreground">{dep.relation} — {dep.location}</p>
              </div>
              <span className={cn("h-2.5 w-2.5 rounded-full", dep.status === "ok" ? "bg-safe" : "bg-muted-foreground")} />
              <button
                onClick={() => {
                  removeDependent(dep.id);
                  toast({ title: "Node removed", description: `${dep.name} was unlinked` });
                }}
                className="text-muted-foreground transition-all p-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <UserPlus className="h-4 w-4 mr-1" />Link</Button>
              </DialogTrigger>

              <DialogContent className="bg-card">
                <DialogHeader>
                  <DialogTitle>Link Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddDependent} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={depName} onChange={(e) => setDepName(e.target.value)} placeholder="Full Name" className="bg-secondary border-border" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship</Label>
                    <Select value={depRelation} onValueChange={setDepRelation}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Son/Daughter">Son/Daughter</SelectItem>
                        <SelectItem value="Partner">Partner</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Family member">Family member</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Usual Location</Label>
                    <Input value={depLocation} onChange={(e) => setDepLocation(e.target.value)} placeholder="Home, Work, School..." className="bg-secondary border-border" />
                  </div>
                  <Button type="submit" className="bg-primary w-full text-black font-bold">
                    <UserPlus className="h-4 w-4 mr-2" /> Link
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button size="sm" className="bg-critical/70 flex-1 text-white">
              <Bell className="h-4 w-4 mr-1" />
              Reunite Family
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Role Detail Sheet */}
      <RoleDetailSheet
        role={sheetRole}
        isCurrentUser={user?.role === sheetRole}
        userName={sheetEntry ? (user?.role === sheetRole ? user!.displayName : sheetEntry.displayName) : ""}
        avatar={sheetEntry?.avatarInitials}
        status={sheetEntry?.status}
        lastCheckIn={sheetEntry?.lastCheckIn ?? undefined}
        onClose={() => setSheetRole(null)}
      />
    </div>
  );
}