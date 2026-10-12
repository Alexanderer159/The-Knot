import { useState, useCallback } from "react";

export type StatusType = "ok" | "help" | "critical" | null;

export interface ActivityItem {
  id: string;
  memberId: string;
  memberName: string;
  action: string;
  timestamp: string;
  type: "status" | "checkin" | "alert" | "inventory";
}

// Mock data (activity feed only, still not backed by a real table)
export const mockActivity: ActivityItem[] = [
  { id: "1", memberId: "1", memberName: "Carlos R.", action: "reported I´m Ok", timestamp: "14:32", type: "status" },
  { id: "2", memberId: "3", memberName: "Luis P.", action: "Needs Help - Blocked route", timestamp: "14:28", type: "alert" },
  { id: "3", memberId: "2", memberName: "Ana M.", action: "Updated medical inventory", timestamp: "14:15", type: "inventory" },
  { id: "4", memberId: "4", memberName: "María G.", action: "Point Beta Check In", timestamp: "14:05", type: "checkin" },
  { id: "5", memberId: "5", memberName: "Diego F.", action: "Warning: Water at 20%", timestamp: "13:50", type: "alert" },
];

export function useAppState() {
  const [userStatus, setUserStatus] = useState<StatusType>(null);
  const [activity, setActivity] = useState<ActivityItem[]>(mockActivity);

  const updateStatus = useCallback((status: StatusType) => {
    setUserStatus(status);
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      memberId: "1",
      memberName: "You",
      action: status === "ok" ? "reported I'm Ok" : status === "help" ? "Need Help" : "Critical State",
      timestamp: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
      type: "status",
    };
    setActivity((prev) => [newActivity, ...prev]);
  }, []);

  return { userStatus, updateStatus, activity };
}