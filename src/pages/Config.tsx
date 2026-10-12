import { useState, useEffect } from "react";
import { User, LogOut, Copy, Check, DoorOpen, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useLocalUser } from "@/hooks/useLocalUser";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InstallAppCard } from "@/components/ui/InstallAppCard";

export default function Config() {
  const { user, updateName, leaveKnot, deleteKnot } = useLocalUser();
  const { user: authUser, signOut } = useAuth();
  const { toast } = useToast();

  const [nameInput, setNameInput] = useState(user?.displayName ?? "");
  const [knotCode, setKnotCode] = useState<string | null>(null);
  const [createdBy, setCreatedBy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user?.knotId) return;
    supabase
      .from("knots")
      .select("code, created_by")
      .eq("id", user.knotId)
      .single()
      .then(({ data }) => {
        if (data) {
          setKnotCode(data.code);
          setCreatedBy(data.created_by);
        }
      });
  }, [user?.knotId]);

  if (!user) return null;

  const isCreator = !!authUser?.id && createdBy === authUser.id;
  // Don't show either button until we know who created the Knot
  const creatorKnown = createdBy !== null;

  const handleNameBlur = () => {
    if (nameInput.trim() && nameInput !== user.displayName) {
      updateName(nameInput.trim());
    }
  };

  const copyCode = () => {
    if (!knotCode) return;
    navigator.clipboard.writeText(knotCode);
    setCopied(true);
    toast({ title: "Code copied" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    setLeaving(true);
    const { error } = await leaveKnot();
    setLeaving(false);
    if (error) {
      toast({ title: "Couldn't leave Knot", description: error.message, variant: "destructive" });
      setLeaveDialogOpen(false);
      return;
    }
    toast({ title: "You left the Knot" });
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await deleteKnot();
    setDeleting(false);
    if (error) {
      toast({ title: "Couldn't delete Knot", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Knot deleted" });
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="space-y-5">

        <InstallAppCard />

        {/* Profile */}
        <Card >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 px-2 py-2">
              <User className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm flex-1">Operator Name</span>
              <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} onBlur={handleNameBlur} className="w-36 h-8 text-xs bg-secondary text-right" />
            </div>
          </CardContent>
        </Card>

        {/* Knot Code */}
        <Card >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Knot Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-2">
              <span className="text-lg font-mono font-bold tracking-widest flex-1">
                {knotCode ?? "···"}
              </span>
              <Button variant="outline" size="sm" onClick={copyCode} disabled={!knotCode}>
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-foreground px-2">Share this code so others can join your Knot.</p>
          </CardContent>
        </Card>

        {/* Leave Knot (everyone except the creator) */}
        {creatorKnown && !isCreator && (
          <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full text-critical border-0">
                <DoorOpen className="h-4 w-4 mr-2" /> LEAVE KNOT
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm bg-card">
              <DialogHeader>
                <DialogTitle>Leave this Knot?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-foreground">
                You'll lose access to this Knot's map and members, and the other members will no longer see your supplies. Your supplies stay with you. You can join another Knot afterward.
              </p>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setLeaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleLeave} disabled={leaving}>
                  {leaving ? "Leaving..." : "Leave Knot"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Knot (creator only) */}
        {creatorKnown && isCreator && (
          <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteConfirmInput(""); }}>
            <DialogTrigger asChild>
              <Button className="w-full text-critical bg-secondary">
                <Trash2 className="h-4 w-4 mr-2" /> DELETE KNOT
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Delete this Knot permanently?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                This deletes the Knot, its members list and its map points for everyone. Members keep their accounts and their own supplies, and can join or create another Knot, but this specific Knot cannot be recovered.
              </p>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Type the Knot code <span className="font-mono font-bold text-foreground">{knotCode}</span> to confirm.
                </p>
                <Input value={deleteConfirmInput} onChange={(e) => setDeleteConfirmInput(e.target.value.toUpperCase())} placeholder={knotCode ?? ""} 
                className="bg-secondary font-mono tracking-widest"/>
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 "
                  onClick={handleDelete}
                  disabled={deleting || deleteConfirmInput !== knotCode}
                >
                  {deleting ? "Deleting..." : "Delete Knot"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Button variant="outline" className="w-full border-0 text-warning" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" /> SIGN OUT
        </Button>


      </div>
      <p className="text-center text-muted-foreground text-sm p-0 pt-5 m-0">v 0.65</p>
      <p className="text-center text-muted-foreground text-xs p-0 m-0">Alexanderer159</p>
    </>
  );
}