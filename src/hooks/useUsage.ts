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
  /** Início do mês-calendário (America/Sao_Paulo). */
  period_start: string;
  /** Primeiro dia do mês seguinte — quando as cotas renovam. */
  renews_at: string;
  actions: UsageAction[];
}

export function useUsage() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["usage-summary", user?.id],
    enabled: !!user && !!session?.access_token,
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      // Evita chamar a função sem sessão válida (ex.: logo após logout).
      const { data: { session: current } } = await supabase.auth.getSession();
      if (!current?.access_token) return null;

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
