import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { User } from "lucide-react";
import type { StatusType } from "@/lib/store";
import { useSupplies } from "@/hooks/useSupplies";
import { cn } from "@/lib/utils";

export interface SheetMember {
  userId: string;
  displayName: string;
  status: StatusType | null;
  lastCheckIn: string | null;
}

interface Props {
  member: SheetMember | null;
  onClose: () => void;
}

export default function MemberDetailSheet({ member, onClose }: Props) {
  const { supplies } = useSupplies();

  // Keep the last member around so content doesn't vanish mid-close-animation
  const [displayMember, setDisplayMember] = useState<SheetMember | null>(member);
  useEffect(() => {
    if (member) setDisplayMember(member);
  }, [member]);

  if (!displayMember) return null;

  const memberSupplies = supplies.filter((s) => s.user_id === displayMember.userId);

  return (
    <Sheet open={!!member} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[80vh] bg-card border-t border-primary/20 z-[950]">
        <SheetHeader className="pb-3">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <User className="h-5 w-5 text-primary" />
            {displayMember.displayName}
          </SheetTitle>
        </SheetHeader>

        <div className="flex items-center pb-3">
          <div className="flex-1 min-w-0">
            {displayMember.lastCheckIn && (
              <p className="text-xs text-muted-foreground">
                Last check-in: {new Date(displayMember.lastCheckIn).toLocaleString([], { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
          <Button
            variant={displayMember.status === "ok" ? "safe" : displayMember.status === "help" ? "warning" : displayMember.status === "critical" ? "critical" : "outline"}
            size="sm"
            className="shrink-0"
          >
            <span className="text-sm text-white">
              {displayMember.status === "ok" ? "Ok" : displayMember.status === "help" ? "Help" : displayMember.status === "critical" ? "Critical" : "Offline"}
            </span>
          </Button>
        </div>

        <div className="space-y-1 max-h-[45vh] overflow-y-auto pr-1">
          <div className="flex items-center pb-2">
            <span className="text-sm tracking-widest text-center w-full">INVENTORY</span>
          </div>

          {memberSupplies.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No registered supplies.
            </p>
          )}

          {memberSupplies.map((item) => {
            const percent = item.need > 0 ? Math.round((item.have / item.need) * 100) : 0;
            const isComplete = item.have >= item.need;
            return (
              <div key={item.id} className="rounded-lg bg-secondary/50 px-3 py-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-heading font-semibold">{item.name}</span>
                  <span className={cn("text-xs font-mono", isComplete ? "text-primary" : "text-warning")}>
                    {item.have}/{item.need} {item.unit}
                  </span>
                </div>
                <Progress value={percent} className="h-1" />
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center pt-3">
          Manage supplies from the supplies tab.
        </p>
      </SheetContent>
    </Sheet>
  );
}