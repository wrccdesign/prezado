import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPaddleEnvironment } from "@/lib/paddle";

export type PlanId = "free" | "profissional" | "escritorio";

export interface Subscription {
  plan_id: PlanId;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const env = getPaddleEnvironment();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", user?.id, env],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan_id, status, current_period_end, cancel_at_period_end")
        .eq("user_id", user.id)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        return null;
      }
      return data as Subscription | null;
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

  // Access is granted while status is active/trialing/past_due, OR canceled
  // with a future period end (grace period).
  const raw = subscription;
  const hasAccess = !!raw && raw.plan_id !== "free" && (
    (["active", "trialing", "past_due"].includes(raw.status) &&
      (!raw.current_period_end || new Date(raw.current_period_end) > new Date())) ||
    (raw.status === "canceled" && raw.current_period_end && new Date(raw.current_period_end) > new Date())
  );

  const planId: PlanId = hasAccess ? (raw!.plan_id as PlanId) : "free";

  return {
    subscription: raw,
    planId,
    isLoading,
    isPro: planId === "profissional" || planId === "escritorio",
    isEscritorio: planId === "escritorio",
  };
}
