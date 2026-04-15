import { useQuery } from "@tanstack/react-query";
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

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", user?.id, env],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan_id, status, current_period_end, cancel_at_period_end")
        .eq("user_id", user.id)
        .eq("environment", env)
        .in("status", ["active", "trialing"])
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        return null;
      }
      return data as Subscription | null;
    },
    enabled: !!user,
  });

  const planId: PlanId = (subscription?.plan_id as PlanId) || "free";

  return {
    subscription,
    planId,
    isLoading,
    isPro: planId === "profissional" || planId === "escritorio",
    isEscritorio: planId === "escritorio",
  };
}
