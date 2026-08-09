import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useLocalUser } from "./useLocalUser";
import { Tables } from "@/integrations/supabase/types";

type Member = Tables<"members">;

function initialsFrom(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function useLocationSharing(enabled = true) {
  const { user } = useAuth();
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !user || !navigator.geolocation) return;

    const updateLocation = (pos: GeolocationPosition) => {
      supabase
        .from("members")
        .update({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location_updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .then();
    };

    watchIdRef.current = navigator.geolocation.watchPosition(updateLocation, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 15000,
    });

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [enabled, user]);
}

export function usePodLocations() {
  const { user } = useLocalUser();
  const [members, setMembers] = useState<Member[]>([]);

  const fetchLocations = useCallback(() => {
    if (!user?.knotId) {
      setMembers([]);
      return;
    }
    supabase
      .from("members")
      .select("*")
      .eq("knot_id", user.knotId)
      .not("latitude", "is", null)
      .then(({ data }) => {
        if (data) {
          const withInitials = data.map((m) => ({
            ...m,
            avatar_initials: m.avatar_initials || initialsFrom(m.display_name),
          }));
          setMembers(withInitials);
        }
      });
  }, [user?.knotId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    if (!user?.knotId) return;
    const channel = supabase
      .channel(`pod-locations-${user.knotId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members", filter: `knot_id=eq.${user.knotId}` },
        () => fetchLocations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.knotId, fetchLocations]);

  return members;
}