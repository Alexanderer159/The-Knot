import { createContext, useContext, ReactNode, useCallback, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { StatusType } from "@/lib/store";
import { enqueueAction } from "@/lib/syncQueue";

// Dependents remain local for now (per earlier decision: handle in backend later)
export interface Dependent {
  id: string;
  name: string;
  relation: string;
  location: string;
  status: StatusType;
}

interface LocalUser {
  displayName: string;
  knotId: string;
  status: StatusType;
  dependents: Dependent[];
}

interface LocalUserContextType {
  user: LocalUser | null;
  isSetup: boolean;
  loading: boolean;
  createKnot: (displayName: string, knotName?: string) => Promise<{ error: Error | null; code?: string }>;
  joinKnot: (code: string, displayName: string) => Promise<{ error: Error | null }>;
  updateStatus: (status: StatusType) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  addDependent: (dep: Omit<Dependent, "id">) => void;
  removeDependent: (id: string) => void;
  shareLocation: (lat: number, lng: number, status: StatusType) => Promise<{ error: Error | null }>;
  leaveKnot: () => Promise<{ error: Error | null }>;
  deleteKnot: () => Promise<{ error: Error | null }>;
}

const DEPENDENTS_KEY = "aegis-dependents"; // temporary, local-only until backed by Supabase
const CACHED_MEMBER_KEY = "cached-member"; // same key used by useAuth.ts's cacheMember()

// Patches the locally cached member record so the UI reflects an offline
// change immediately, even though the write itself is queued for later.
function patchCachedMember(changes: Record<string, any>) {
  try {
    const raw = localStorage.getItem(CACHED_MEMBER_KEY);
    if (!raw) return;
    const cached = JSON.parse(raw);
    localStorage.setItem(CACHED_MEMBER_KEY, JSON.stringify({ ...cached, ...changes }));
  } catch {
    // ignore, this is just a best-effort local reflection
  }
}

const LocalUserContext = createContext<LocalUserContextType | undefined>(undefined);

export function LocalUserProvider({ children }: { children: ReactNode }) {
  const { user: authUser, member, loading: authLoading, refetchMember } = useAuth();
  const [dependents, setDependents] = useState<Dependent[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DEPENDENTS_KEY);
      if (stored) setDependents(JSON.parse(stored));
    } catch {}
  }, []);

  const persistDependents = useCallback((deps: Dependent[]) => {
    setDependents(deps);
    localStorage.setItem(DEPENDENTS_KEY, JSON.stringify(deps));
  }, []);

  const user: LocalUser | null = member
    ? {
        displayName: member.display_name,
        knotId: member.knot_id,
        status: member.status as StatusType,
        dependents,
      }
    : null;

  const createKnot = useCallback(async (displayName: string, knotName?: string) => {
    const { data, error } = await supabase.rpc("create_knot", {
      p_display_name: displayName,
      p_knot_name: knotName,
    });
    if (!error) await refetchMember();
    return { error: error as Error | null, code: data?.code };
  }, [refetchMember]);

  const joinKnot = useCallback(async (code: string, displayName: string) => {
    const { error } = await supabase.rpc("join_knot", {
      p_code: code.toUpperCase(),
      p_display_name: displayName,
    });
    if (!error) await refetchMember();
    return { error: error as Error | null };
  }, [refetchMember]);

  // The database blocks the creator from leaving (they delete the Knot instead),
  // so an empty result here means that rule was hit
  const leaveKnot = useCallback(async () => {
    if (!authUser || !user) return { error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("members")
      .delete()
      .eq("user_id", authUser.id)
      .select();

    if (error) return { error: error as Error };
    if (!data || data.length === 0) {
      return { error: new Error("The creator can't leave the Knot. Delete it instead.") };
    }

    await refetchMember(); // member becomes null, isSetup flips false, Gate redirects to /setup
    return { error: null };
  }, [authUser, user, refetchMember]);

  // Only the creator passes the database policy, an empty result means someone else tried
  const deleteKnot = useCallback(async () => {
    if (!user) return { error: new Error("No knot to delete") };

    const { data, error } = await supabase
      .from("knots")
      .delete()
      .eq("id", user.knotId)
      .select();

    if (error) return { error: error as Error };
    if (!data || data.length === 0) {
      return { error: new Error("Only the creator can delete the Knot.") };
    }

    await refetchMember(); // your own member row is gone too (cascade), isSetup flips false
    return { error: null };
  }, [user, refetchMember]);

  const updateStatus = useCallback(async (status: StatusType) => {
    if (!authUser) return;
    try {
      const { error } = await supabase
        .from("members")
        .update({ status, last_check_in: new Date().toISOString() })
        .eq("user_id", authUser.id);
      if (error) throw error;
      await refetchMember();
    } catch {
      enqueueAction("update_status", { userId: authUser.id, status });
      patchCachedMember({ status, last_check_in: new Date().toISOString() });
      await refetchMember();
    }
  }, [authUser, refetchMember]);

  const shareLocation = useCallback(async (lat: number, lng: number, status: StatusType) => {
    if (!authUser) return { error: new Error("Not authenticated") };
    try {
      const { error } = await supabase
        .from("members")
        .update({ latitude: lat, longitude: lng, location_updated_at: new Date().toISOString(), status, last_check_in: new Date().toISOString() })
        .eq("user_id", authUser.id);
      if (error) throw error;
      await refetchMember();
      return { error: null };
    } catch {
      enqueueAction("share_location", { userId: authUser.id, lat, lng, status });
      patchCachedMember({
        latitude: lat,
        longitude: lng,
        location_updated_at: new Date().toISOString(),
        status,
        last_check_in: new Date().toISOString(),
      });
      await refetchMember();
      return { error: null };
    }
  }, [authUser, refetchMember]);

  const updateName = useCallback(async (name: string) => {
    if (!authUser) return;
    try {
      const { error } = await supabase.from("members").update({ display_name: name }).eq("user_id", authUser.id);
      if (error) throw error;
      await refetchMember();
    } catch {
      enqueueAction("update_name", { userId: authUser.id, name });
      patchCachedMember({ display_name: name });
      await refetchMember();
    }
  }, [authUser, refetchMember]);

  const addDependent = useCallback((dep: Omit<Dependent, "id">) => {
    persistDependents([...dependents, { ...dep, id: Date.now().toString() }]);
  }, [dependents, persistDependents]);

  const removeDependent = useCallback((id: string) => {
    persistDependents(dependents.filter(d => d.id !== id));
  }, [dependents, persistDependents]);

  return (
    <LocalUserContext.Provider value={{
      user,
      isSetup: !!user,
      loading: authLoading,
      createKnot,
      joinKnot,
      updateStatus,
      updateName,
      shareLocation,
      leaveKnot,
      deleteKnot,
      addDependent,
      removeDependent,
    }}>
      {children}
    </LocalUserContext.Provider>
  );
}

export function useLocalUser() {
  const ctx = useContext(LocalUserContext);
  if (!ctx) throw new Error("useLocalUser must be used within LocalUserProvider");
  return ctx;
}