import { supabase } from "@/integrations/supabase/client";

export type QueuedActionType =
  | "update_status"
  | "share_location"
  | "update_name"
  | "add_supply"
  | "adjust_supply_have"
  | "log_supply_have_change"  // new
  | "update_supply"
  | "remove_supply"
  | "add_marker"
  | "remove_marker";

export interface QueuedAction {
  id: string;
  type: QueuedActionType;
  payload: any;
  createdAt: string;
}

const QUEUE_KEY = "sync-queue";

export function loadQueue(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedAction[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore, best-effort persistence
  }
}

export function enqueueAction(type: QueuedActionType, payload: any): QueuedAction {
  const action: QueuedAction = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
  };
  const queue = loadQueue();
  queue.push(action);
  saveQueue(queue);
  window.dispatchEvent(new CustomEvent("knot-queue-changed"));
  return action;
}

export function getQueueLength(): number {
  return loadQueue().length;
}

function resolveId(id: string, idMap: Record<string, string>): string {
  return idMap[id] ?? id;
}

async function executeAction(action: QueuedAction, idMap: Record<string, string>): Promise<{ newId?: string }> {
  const p = action.payload;

  switch (action.type) {
    case "update_status": {
      const { error } = await supabase
        .from("members")
        .update({ status: p.status, last_check_in: new Date().toISOString() })
        .eq("user_id", p.userId);
      if (error) throw error;
      return {};
    }

    case "share_location": {
      const { error } = await supabase
        .from("members")
        .update({
          latitude: p.lat,
          longitude: p.lng,
          location_updated_at: new Date().toISOString(),
          status: p.status,
          last_check_in: new Date().toISOString(),
        })
        .eq("user_id", p.userId);
      if (error) throw error;
      return {};
    }

    case "log_supply_have_change": {
  const id = resolveId(p.id, idMap);
  const { error } = await supabase.rpc("log_supply_have_change", { p_id: id, p_total_delta: p.totalDelta });
  if (error) throw error;
  return {};
}

    case "adjust_supply_have": {
      const id = resolveId(p.id, idMap);
      const { error } = await supabase.rpc("adjust_supply_have", { p_id: id, p_delta: p.delta });
      if (error) throw error;
      return {};
    }

    case "update_name": {
      const { error } = await supabase.from("members").update({ display_name: p.name }).eq("user_id", p.userId);
      if (error) throw error;
      return {};
    }

    case "add_supply": {
      const { data, error } = await supabase
        .from("supplies")
        .insert({ knot_id: p.knotId, name: p.name, category: p.category, need: p.need, unit: p.unit, have: 0, acquired: false })
        .select()
        .single();
      if (error) throw error;
      return { newId: data.id };
    }

    case "update_supply": {
      const id = resolveId(p.id, idMap);
      const { error } = await supabase.from("supplies").update(p.changes).eq("id", id);
      if (error) throw error;
      return {};
    }

    case "remove_supply": {
      const id = resolveId(p.id, idMap);
      const { error } = await supabase.from("supplies").delete().eq("id", id);
      if (error) throw error;
      return {};
    }

    case "add_marker": {
      const { data, error } = await supabase
        .from("map_markers")
        .insert({ knot_id: p.knotId, name: p.name, category: p.category, latitude: p.latitude, longitude: p.longitude, created_by: p.createdBy })
        .select()
        .single();
      if (error) throw error;
      return { newId: data.id };
    }

    case "remove_marker": {
      const id = resolveId(p.id, idMap);
      const { error } = await supabase.from("map_markers").delete().eq("id", id);
      if (error) throw error;
      return {};
    }

    default:
      return {};
  }
}

let processing = false;

export async function processQueue(): Promise<{ processed: number; remaining: number }> {
  if (processing) return { processed: 0, remaining: getQueueLength() };
  if (!navigator.onLine) return { processed: 0, remaining: getQueueLength() };

  processing = true;
  const idMap: Record<string, string> = {};
  let processed = 0;

  try {
    let queue = loadQueue();
    while (queue.length > 0) {
      const action = queue[0];

      // Rewrite any temp ID this action references, once its "add" has synced
      if (action.payload?.id && idMap[action.payload.id]) {
        action.payload.id = idMap[action.payload.id];
      }

      try {
        const result = await executeAction(action, idMap);
        if (result.newId && action.payload?.tempId) {
          idMap[action.payload.tempId] = result.newId;
        }
        queue = queue.slice(1);
        saveQueue(queue);
        processed++;
      } catch {
        // Offline again, or a real failure: stop here, keep the rest queued in order
        break;
      }
    }
  } finally {
    processing = false;
  }

  window.dispatchEvent(new CustomEvent("knot-queue-changed"));
  return { processed, remaining: getQueueLength() };
}