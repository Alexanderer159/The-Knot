import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocalUser } from "@/hooks/useLocalUser";
import type { ActivityLogEntry } from "@/hooks/useActivityLog";

const MAX_ENTRIES = 2000; // generous safety cap, far beyond realistic usage

export function useActivityHistory() {
  const { user } = useLocalUser();
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user?.knotId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .eq("knot_id", user.knotId)
      .order("created_at", { ascending: false })
      .limit(MAX_ENTRIES);

    if (!error && data) {
      setEntries(data);
    }
    setLoading(false);
  }, [user?.knotId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { entries, loading, refetch: fetchAll };
}