import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocalUser } from "@/hooks/useLocalUser";
import type { Tables, Enums } from "@/integrations/supabase/types";
import { enqueueAction } from "@/lib/syncQueue";

export type Supply = Tables<"supplies">;
export type SupplyCategory = Enums<"supply_category">;

const LOG_DEBOUNCE_MS = 2000;

function cacheKey(knotId: string) {
  return `cached-supplies-${knotId}`;
}

function loadCachedSupplies(knotId: string): Supply[] {
  try {
    const raw = localStorage.getItem(cacheKey(knotId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCachedSupplies(knotId: string, supplies: Supply[]) {
  try {
    localStorage.setItem(cacheKey(knotId), JSON.stringify(supplies));
  } catch {
    // storage full or unavailable, safe to ignore, this is just a cache
  }
}

export function useSupplies() {
  const { user } = useLocalUser();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Tracks accumulated "have" deltas per supply item, flushed to the
  // activity log as one entry after LOG_DEBOUNCE_MS of no further changes
  const pendingLogRef = useRef<Record<string, { timer: ReturnType<typeof setTimeout>; total: number }>>({});

  const fetchSupplies = useCallback(async (showLoading = false) => {
    if (!user?.knotId) {
      setSupplies([]);
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);

    try {
      const { data, error } = await supabase
        .from("supplies")
        .select("*")
        .eq("knot_id", user.knotId)
        .order("category", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (data) {
        setSupplies(data);
        saveCachedSupplies(user.knotId, data);
        setIsOffline(false);
      }
    } catch {
      // Network failed: fall back to the last known cached data
      setSupplies(loadCachedSupplies(user.knotId));
      setIsOffline(true);
    }

    if (showLoading) setLoading(false);
  }, [user?.knotId]);

  useEffect(() => {
    fetchSupplies(true);
  }, [fetchSupplies]);

  useEffect(() => {
    if (!user?.knotId) return;
    const channel = supabase
      .channel(`supplies-${user.knotId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "supplies", filter: `knot_id=eq.${user.knotId}` },
        () => fetchSupplies(false)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.knotId, fetchSupplies]);

  // Once the sync queue drains and we're back online, refetch so any
  // resolved temp IDs / queued changes are replaced with the real server state
  useEffect(() => {
    const handler = () => fetchSupplies(false);
    window.addEventListener("knot-sync-complete", handler);
    return () => window.removeEventListener("knot-sync-complete", handler);
  }, [fetchSupplies]);

  const flushHaveLog = useCallback(async (id: string) => {
    const pending = pendingLogRef.current[id];
    delete pendingLogRef.current[id];
    if (!pending || pending.total === 0) return;

    try {
      const { error } = await supabase.rpc("log_supply_have_change", { p_id: id, p_total_delta: pending.total });
      if (error) throw error;
    } catch {
      enqueueAction("log_supply_have_change", { id, totalDelta: pending.total });
    }
  }, []);

  const addSupply = useCallback(async (item: { name: string; category: SupplyCategory; need: number; unit: string }) => {
    if (!user?.knotId) return { error: new Error("No knot") };

    try {
      const { data, error } = await supabase
        .from("supplies")
        .insert({
          knot_id: user.knotId,
          name: item.name,
          category: item.category,
          need: item.need,
          unit: item.unit,
          have: 0,
          acquired: false,
        })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setSupplies((prev) => {
          const next = [...prev, data];
          saveCachedSupplies(user.knotId, next);
          return next;
        });
      }
      return { error: null };
    } catch {
      // Offline: create it locally with a temp ID so the UI works immediately,
      // and queue the real insert for when we're back online
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const optimistic: Supply = {
        id: tempId,
        knot_id: user.knotId,
        name: item.name,
        category: item.category,
        need: item.need,
        unit: item.unit,
        have: 0,
        acquired: false,
        created_at: new Date().toISOString(),
      } as Supply;

      setSupplies((prev) => {
        const next = [...prev, optimistic];
        saveCachedSupplies(user.knotId, next);
        return next;
      });

      enqueueAction("add_supply", {
        tempId,
        knotId: user.knotId,
        name: item.name,
        category: item.category,
        need: item.need,
        unit: item.unit,
      });
      return { error: null };
    }
  }, [user?.knotId]);

  const updateSupply = useCallback(async (id: string, changes: Partial<Pick<Supply, "have" | "need" | "acquired">>) => {
    setSupplies((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...changes } : s));
      if (user?.knotId) saveCachedSupplies(user.knotId, next);
      return next;
    });

    try {
      const { error } = await supabase.from("supplies").update(changes).eq("id", id);
      if (error) throw error;
      return { error: null };
    } catch {
      // Offline: keep the optimistic local/cached update, queue the real
      // write so it replays once connectivity returns
      enqueueAction("update_supply", { id, changes });
      return { error: null };
    }
  }, [user?.knotId]);

  const adjustHave = useCallback(async (id: string, delta: number) => {
    setSupplies((prev) => {
      const next = prev.map((s) =>
        s.id === id ? { ...s, have: Math.max(0, Math.min(s.need, s.have + delta)) } : s
      );
      if (user?.knotId) saveCachedSupplies(user.knotId, next);
      return next;
    });

    try {
      const { error } = await supabase.rpc("adjust_supply_have", { p_id: id, p_delta: delta });
      if (error) throw error;
    } catch {
      enqueueAction("adjust_supply_have", { id, delta });
    }

    // Debounce the activity log entry: accumulate this delta, restart the timer
    const existing = pendingLogRef.current[id];
    const total = (existing?.total ?? 0) + delta;
    if (existing?.timer) clearTimeout(existing.timer);

    pendingLogRef.current[id] = {
      total,
      timer: setTimeout(() => flushHaveLog(id), LOG_DEBOUNCE_MS),
    };

    return { error: null };
  }, [user?.knotId, flushHaveLog]);

  // Flush any pending logs immediately if the hook unmounts mid-debounce
  // (e.g. navigating away right after adjusting a quantity)
  useEffect(() => {
    return () => {
      Object.keys(pendingLogRef.current).forEach((id) => {
        const pending = pendingLogRef.current[id];
        clearTimeout(pending.timer);
        if (pending.total !== 0) {
          Promise.resolve(
            supabase.rpc("log_supply_have_change", { p_id: id, p_total_delta: pending.total })
          ).catch(() => {
            enqueueAction("log_supply_have_change", { id, totalDelta: pending.total });
          });
        }
      });
      pendingLogRef.current = {};
    };
  }, []);

  const removeSupply = useCallback(async (id: string) => {
    setSupplies((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (user?.knotId) saveCachedSupplies(user.knotId, next);
      return next;
    });

    try {
      const { error } = await supabase.from("supplies").delete().eq("id", id);
      if (error) throw error;
      return { error: null };
    } catch {
      enqueueAction("remove_supply", { id });
      return { error: null };
    }
  }, [user?.knotId]);

  return { supplies, loading, isOffline, addSupply, updateSupply, adjustHave, removeSupply, refetch: () => fetchSupplies(true) };
}