import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPaymentEnvironmentSafe } from "@/lib/stripe";

export type PlanId = "free" | "profissional" | "escritorio";
export type AccessType = "recurring" | "one_time" | "trial";

export interface Subscription {
  plan_id: PlanId;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  access_type: AccessType | null;
  access_expires_at: string | null;
}

const TIER_RANK: Record<string, number> = { escritorio: 2, profissional: 1, free: 0 };

function isDatedAccess(row: Subscription) {
  const type = row.access_type ?? "recurring";
  return type === "one_time" || type === "trial";
}

function isActiveRow(row: Subscription): boolean {
  if (row.plan_id === "free") return false;
  if (isDatedAccess(row)) {
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

  const { data: rows, isLoading } = useQuery({
    queryKey: ["subscription", user?.id, env],
    queryFn: async () => {
      if (!user) return [] as Subscription[];
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
        return [] as Subscription[];
      }
      return (data ?? []) as Subscription[];
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

  const all = rows ?? [];
  // A user can hold several rows (seeded free row, trial, monthly
  // subscription, annual upfront access). The highest active tier wins.
  const active = all
    .filter(isActiveRow)
    .sort((a, b) => (TIER_RANK[b.plan_id] ?? 0) - (TIER_RANK[a.plan_id] ?? 0));
  const raw = active[0] ?? all[0] ?? null;
  const hasAccess = active.length > 0;

  const planId: PlanId = hasAccess ? (active[0].plan_id as PlanId) : "free";

  const trialRow = all.find((r) => r.access_type === "trial") ?? null;
  const trialActive = !!trialRow && isActiveRow(trialRow);
  // Só é "trial puro" quando não há assinatura paga por trás.
  const paidActive = active.some((r) => r.access_type !== "trial");
  const trialEndsAt = trialActive ? trialRow!.access_expires_at : null;
  const trialDaysLeft = trialEndsAt
    ? Math.max(
        0,
        Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000),
      )
    : 0;

  return {
    subscription: raw,
    planId,
    isLoading,
    isPro: planId === "profissional" || planId === "escritorio",
    isEscritorio: planId === "escritorio",
    isTrial: trialActive && !paidActive,
    trialEndsAt,
    trialDaysLeft,
    hadTrial: !!trialRow,
  };
}
