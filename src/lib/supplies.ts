import type { Enums } from "@/integrations/supabase/types";

export type SupplyCategory = Enums<"supply_category">;

export const categoryColors: Record<string, string> = {
  Water: "border-blue-500/40 border-2 text-blue-400 font-semibold bg-secondary",
  Food: "border-amber-500/40 border-2 text-amber-400 font-semibold bg-secondary",
  Medicine: "border-red-500/20 border-2 text-red-400 font-semibold bg-secondary",
  Energy: "border-yellow-500/20 border-2 text-yellow-400 font-semibold bg-secondary",
  Tools: "border-primary/20 border-2 text-primary font-semibold bg-secondary",
  Communications: "border-purple-500/20 border-2 text-purple-400 font-semibold bg-secondary",
};