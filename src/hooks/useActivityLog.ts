import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocalUser } from "@/hooks/useLocalUser";
import type { Tables } from "@/integrations/supabase/types";

export type ActivityLogEntry = Tables<"activity_log">;

function cacheKey(knotId: string) {
  return `cached-activity-${knotId}`;
}

function loadCached(knotId: string): ActivityLogEntry[] {
  try {
    const raw = localStorage.getItem(cacheKey(knotId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCached(knotId: string, entries: ActivityLogEntry[]) {
  try {
    localStorage.setItem(cacheKey(knotId), JSON.stringify(entries));
  } catch {
    // ignore, this is just a cache
  }
}

export function useActivityLog(limit = 10) {
  const { user } = useLocalUser();
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const fetchEntries = useCallback(async (showLoading = false) => {
    if (!user?.knotId) {
      setEntries([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);

    try {
      const { data, error, count } = await supabase
        .from("activity_log")
        .select("*", { count: "exact" })
        .eq("knot_id", user.knotId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (data) {
        setEntries(data);
        setTotalCount(count ?? data.length);
        saveCached(user.knotId, data);
        setIsOffline(false);
      }
    } catch {
      setEntries(loadCached(user.knotId));
      setIsOffline(true);
    }

    if (showLoading) setLoading(false);
  }, [user?.knotId, limit]);

  useEffect(() => {
    fetchEntries(true);
  }, [fetchEntries]);

  useEffect(() => {
    if (!user?.knotId) return;
    const channel = supabase
      .channel(`activity-${user.knotId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_log", filter: `knot_id=eq.${user.knotId}` },
        () => fetchEntries(false)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.knotId, fetchEntries]);

  useEffect(() => {
    const handler = () => fetchEntries(false);
    window.addEventListener("knot-sync-complete", handler);
    return () => window.removeEventListener("knot-sync-complete", handler);
  }, [fetchEntries]);

  return { entries, totalCount, hasMore: totalCount > limit, loading, isOffline, refetch: () => fetchEntries(true) };
}