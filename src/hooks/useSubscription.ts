import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPaymentEnvironmentSafe } from "@/lib/stripe";

export type PlanId = "free" | "profissional" | "escritorio";

export interface Subscription {
  plan_id: PlanId;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  access_type: "recurring" | "one_time" | null;
  access_expires_at: string | null;
}

const TIER_RANK: Record<string, number> = { escritorio: 2, profissional: 1, free: 0 };

function isActiveRow(row: Subscription): boolean {
  if (row.plan_id === "free") return false;
  if ((row.access_type ?? "recurring") === "one_time") {
    return !!row.access_expires_at && new Date(row.access_expires_at) > new Date();
  }
  const notExpired = !row.current_period_end || new Date(row.current_period_end) > new Date();
  if (["active", "trialing", "past_due"].includes(row.status)) return notExpired;
  return row.status === "canceled" && !!row.current_period_end &&
    new Date(row.current_period_end) > new Date();
}

export function useSubscription() {
  const { user } = useAuth();
  const env = getPaymentEnvironmentSafe();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", user?.id, env],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select(
          "plan_id, status, current_period_end, cancel_at_period_end, access_type, access_expires_at",
        )
        .eq("user_id", user.id)
        .eq("environment", env)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching subscription:", error);
        return null;
      }
      const rows = (data ?? []) as Subscription[];
      // A user can hold several rows (seeded free row, monthly subscription,
      // annual upfront access). The highest active tier wins.
      const active = rows
        .filter(isActiveRow)
        .sort((a, b) => (TIER_RANK[b.plan_id] ?? 0) - (TIER_RANK[a.plan_id] ?? 0));
      return active[0] ?? rows[0] ?? null;
    },
    enabled: !!user,
  });

  // After checkout success, /planos dispatches this event a few times
  // to bridge the webhook delay.
  useEffect(() => {
    const handler = () => queryClient.invalidateQueries({ queryKey: ["subscription"] });
    window.addEventListener("refetch-subscription", handler);
    return () => window.removeEventListener("refetch-subscription", handler);
  }, [queryClient]);

  const raw = subscription;
  const hasAccess = !!raw && isActiveRow(raw);

  const planId: PlanId = hasAccess ? (raw!.plan_id as PlanId) : "free";


  return {
    subscription: raw,
    planId,
    isLoading,
    isPro: planId === "profissional" || planId === "escritorio",
    isEscritorio: planId === "escritorio",
  };
}
