import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { AnalysisResult } from "@/components/AnalysisResult";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ChevronLeft, Scale, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AnalysisRecord } from "@/types/analysis";
import type { Json } from "@/integrations/supabase/types";

export default function History() {
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AnalysisRecord | null>(null);

  const fetchAnalyses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível carregar o histórico.", variant: "destructive" });
    } else {
      setAnalyses(
        (data || []).map((d) => ({
          ...d,
          result: d.result as unknown as AnalysisRecord["result"],
        }))
      );
    }
    setLoading(false);
  };

  const deleteAnalysis = async (id: string) => {
    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
    } else {
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Análise excluída" });
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  if (selected) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container max-w-3xl py-8">
          <Button variant="ghost" onClick={() => setSelected(null)} className="mb-4">
            <ChevronLeft className="mr-1.5 h-4 w-4" />
            Voltar ao Histórico
          </Button>
          <div className="mb-4 text-sm text-muted-foreground">
            {format(new Date(selected.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
            {selected.file_name && (
              <span className="ml-3 inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {selected.file_name}
              </span>
            )}
          </div>
          <AnalysisResult result={selected.result} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-8">
        <h2 className="mb-6 text-2xl font-bold text-foreground">Histórico de Análises</h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Scale className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium text-foreground">Nenhuma análise ainda</p>
              <p className="text-sm text-muted-foreground">Suas análises aparecerão aqui após a primeira consulta.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {analyses.map((a) => (
              <Card
                key={a.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setSelected(a)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        {a.result.tipo_de_causa}
                      </Badge>
                      {a.result.urgencia && (
                        <Badge className="bg-destructive text-destructive-foreground text-xs">Urgente</Badge>
                      )}
                    </div>
                    <p className="truncate text-sm text-foreground">{a.result.resumo}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(a.created_at), "dd/MM/yyyy HH:mm")}
                      {a.file_name && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {a.file_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAnalysis(a.id);
                    }}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
