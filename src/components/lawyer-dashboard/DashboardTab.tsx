import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Search, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityData {
  date: string;
  petições: number;
  análises: number;
}

export function DashboardTab() {
  const { user } = useAuth();
  const [clientCount, setClientCount] = useState(0);
  const [petitionCount, setPetitionCount] = useState(0);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [recentPetitions, setRecentPetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    const monthStart = startOfMonth(new Date()).toISOString();
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

    const [clientsRes, petitionsRes, analysesRes, recentPetitionsRes, petitionsActivityRes, analysesActivityRes] =
      await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("petitions").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", monthStart),
        supabase.from("analyses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("petitions").select("id, petition_type, created_at, client_id, form_data").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("petitions").select("created_at").eq("user_id", user.id).gte("created_at", thirtyDaysAgo),
        supabase.from("analyses").select("created_at").eq("user_id", user.id).gte("created_at", thirtyDaysAgo),
      ]);

    setClientCount(clientsRes.count ?? 0);
    setPetitionCount(petitionsRes.count ?? 0);
    setAnalysisCount(analysesRes.count ?? 0);
    setRecentPetitions(recentPetitionsRes.data ?? []);

    // Build activity chart data
    const dayMap: Record<string, { petições: number; análises: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "dd/MM");
      dayMap[d] = { petições: 0, análises: 0 };
    }
    (petitionsActivityRes.data ?? []).forEach((p) => {
      const d = format(new Date(p.created_at), "dd/MM");
      if (dayMap[d]) dayMap[d].petições++;
    });
    (analysesActivityRes.data ?? []).forEach((a) => {
      const d = format(new Date(a.created_at), "dd/MM");
      if (dayMap[d]) dayMap[d].análises++;
    });
    setActivityData(Object.entries(dayMap).map(([date, v]) => ({ date, ...v })));
    setLoading(false);
  };

  const PETITION_LABELS: Record<string, string> = {
    trabalhista: "Trabalhista",
    civil: "Civil",
    criminal: "Criminal",
    familia: "Família",
    consumidor: "Consumidor",
    previdenciario: "Previdenciário",
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-pulse text-muted-foreground">Carregando dashboard...</div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Petições este Mês</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{petitionCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Análises Realizadas</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysisCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Atividade dos últimos 30 dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activityData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="petições" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="análises" fill="hsl(var(--accent))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Petitions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas Petições</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPetitions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma petição gerada ainda.</p>
          ) : (
            <div className="space-y-3">
              {recentPetitions.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{PETITION_LABELS[p.petition_type] || p.petition_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(p.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
