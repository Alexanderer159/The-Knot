import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Users, KeyRound, Plus, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalUser } from "@/hooks/useLocalUser";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function KnotSetup() {
  const { isSetup, createKnot, joinKnot } = useLocalUser();
  const { isAuthenticated, signOut } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [submitting, setSubmitting] = useState(false);

  // Create knot state
  const [createName, setCreateName] = useState("");
  const [knotName, setKnotName] = useState("");

  // Join knot state
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // Not authenticated at all, back to login
  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  // Once a members row exists (knot created or joined), leave this page
  if (isSetup) return <Navigate to="/" replace />;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setSubmitting(true);
    const { error, code } = await createKnot(createName.trim(), knotName.trim() || undefined);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error creating Knot", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Knot created", description: `Code: ${code}. Share it with your group.` });
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim() || !joinCode.trim()) return;
    setSubmitting(true);
    const { error } = await joinKnot(joinCode.trim(), joinName.trim());
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't join Knot", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Joined the Knot" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">

      <img className="max-w-52" src="/LOGO.png" />

      {mode === "choose" && (
        <Card className="w-full max-w-sm tactical-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-lg">Initial Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => setMode("create")} className="w-full text-black font-bold" size="lg">
              <Plus className="h-5 w-5 mr-2" /> CREATE A KNOT
            </Button>
            <Button onClick={() => setMode("join")} variant="outline" className="w-full" size="lg">
              <KeyRound className="h-5 w-5 mr-2" /> JOIN WITH CODE
            </Button>
            <Button onClick={signOut} variant="ghost" className="w-full text-muted-foreground" size="sm">
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </CardContent>
        </Card>
      )}

      {mode === "create" && (
        <Card className="w-full max-w-sm tactical-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-lg flex items-center justify-center gap-2">
              CREATE KNOT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Your Name</Label>
                <Input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Full Name" required className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Knot's Name (optional)</Label>
                <Input value={knotName} onChange={e => setKnotName(e.target.value)} placeholder="The crew" className="bg-secondary border-border" />
              </div>
              <Button type="submit" className="w-full text-black font-bold" size="lg" disabled={submitting}>
                <Users /> {submitting ? "Creating..." : "CREATE KNOT"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("choose")}>
                Go Back
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {mode === "join" && (
        <Card className="w-full max-w-sm tactical-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-lg flex items-center justify-center gap-2">
              JOIN A KNOT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Label>Your Name</Label>
                <Input value={joinName} onChange={e => setJoinName(e.target.value)} placeholder="Full Name" required className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>Knot's Code</Label>
                <Input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="X7K2P9" required maxLength={6} className="bg-secondary border-border font-mono tracking-widest" />
              </div>
              <Button type="submit" className="w-full text-black font-bold" size="lg" disabled={submitting}>
                <KeyRound />{submitting ? "Joining..." : "JOIN"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("choose")}>
                Go Back
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}