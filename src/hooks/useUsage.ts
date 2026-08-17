import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UsageAction {
  action: string;
  label: string;
  used: number;
  limit: number;
}

export interface UsageSummaryData {
  plan: "free" | "profissional" | "escritorio";
  environment: "sandbox" | "live";
  resets_at: string;
  actions: UsageAction[];
}

export function useUsage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["usage-summary", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("usage-summary");
      if (error) throw new Error(error.message);
      return data as UsageSummaryData;
    },
  });

  // Páginas que consomem uso disparam este evento para atualizar os contadores.
  useEffect(() => {
    const handler = () => queryClient.invalidateQueries({ queryKey: ["usage-summary"] });
    window.addEventListener("refetch-usage", handler);
    return () => window.removeEventListener("refetch-usage", handler);
  }, [queryClient]);

  return query;
}

export function notifyUsageConsumed() {
  window.dispatchEvent(new Event("refetch-usage"));
}
