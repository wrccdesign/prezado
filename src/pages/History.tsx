import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { AnalysisResult } from "@/components/AnalysisResult";
import { PetitionResult } from "@/components/PetitionResult";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ChevronLeft, Scale, Clock, FileText, FileSignature, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AnalysisRecord, PetitionRecord, PetitionFormData } from "@/types/analysis";

export default function History() {
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [petitions, setPetitions] = useState<PetitionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);
  const [selectedPetition, setSelectedPetition] = useState<PetitionRecord | null>(null);

  const fetchData = async () => {
    setLoading(true);
    
    const [analysesRes, petitionsRes] = await Promise.all([
      supabase.from("analyses").select("*").order("created_at", { ascending: false }),
      supabase.from("petitions").select("*").order("created_at", { ascending: false }),
    ]);

    if (analysesRes.error) {
      toast({ title: "Erro", description: "Não foi possível carregar as análises.", variant: "destructive" });
    } else {
      setAnalyses(
        (analysesRes.data || []).map((d) => ({
          ...d,
          result: d.result as unknown as AnalysisRecord["result"],
        }))
      );
    }

    if (petitionsRes.error) {
      toast({ title: "Erro", description: "Não foi possível carregar as petições.", variant: "destructive" });
    } else {
      setPetitions(
        (petitionsRes.data || []).map((d) => ({
          ...d,
          form_data: d.form_data as unknown as PetitionFormData,
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

  const deletePetition = async (id: string) => {
    const { error } = await supabase.from("petitions").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
    } else {
      setPetitions((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Petição excluída" });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Detail view for selected analysis
  if (selectedAnalysis) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <LegalDisclaimer />
        <main className="container max-w-3xl py-8">
          <Button variant="ghost" onClick={() => setSelectedAnalysis(null)} className="mb-4">
            <ChevronLeft className="mr-1.5 h-4 w-4" />
            Voltar ao Histórico
          </Button>
          <div className="mb-4 text-sm text-muted-foreground">
            {format(new Date(selectedAnalysis.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
            {selectedAnalysis.file_name && (
              <span className="ml-3 inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {selectedAnalysis.file_name}
              </span>
            )}
          </div>
          <AnalysisResult result={selectedAnalysis.result} />
        </main>
      </div>
    );
  }

  // Detail view for selected petition
  if (selectedPetition) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <LegalDisclaimer />
        <main className="container max-w-3xl py-8">
          <Button variant="ghost" onClick={() => setSelectedPetition(null)} className="mb-4">
            <ChevronLeft className="mr-1.5 h-4 w-4" />
            Voltar ao Histórico
          </Button>
          <div className="mb-4 text-sm text-muted-foreground">
            {format(new Date(selectedPetition.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
            <span className="ml-3">
              <Badge variant="secondary">{selectedPetition.petition_type}</Badge>
            </span>
          </div>
          <div className="mb-4 p-4 rounded-lg bg-muted/50 text-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Partes:</span>
            </div>
            <p><strong>Autor:</strong> {selectedPetition.form_data.autor}</p>
            <p><strong>Réu:</strong> {selectedPetition.form_data.reu}</p>
          </div>
          <PetitionResult 
            text={selectedPetition.generated_text} 
            onNewPetition={() => setSelectedPetition(null)} 
          />
        </main>
      </div>
    );
  }

  const petitionTypeLabels: Record<string, string> = {
    inicial: "Petição Inicial",
    contestacao: "Contestação",
    recurso: "Recurso",
    agravo: "Agravo",
    mandado_seguranca: "Mandado de Segurança",
    habeas_corpus: "Habeas Corpus",
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-8">
        <h2 className="mb-6 text-2xl font-bold text-foreground">Histórico</h2>

        <Tabs defaultValue="analyses" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="analyses" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Análises ({analyses.length})
            </TabsTrigger>
            <TabsTrigger value="petitions" className="flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              Petições ({petitions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyses">
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
                    onClick={() => setSelectedAnalysis(a)}
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
          </TabsContent>

          <TabsContent value="petitions">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : petitions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <FileSignature className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-lg font-medium text-foreground">Nenhuma petição ainda</p>
                  <p className="text-sm text-muted-foreground">Suas petições geradas aparecerão aqui.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {petitions.map((p) => (
                  <Card
                    key={p.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => setSelectedPetition(p)}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            {petitionTypeLabels[p.petition_type] || p.petition_type}
                          </Badge>
                        </div>
                        <p className="truncate text-sm text-foreground">
                          {p.form_data.autor} vs {p.form_data.reu}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(p.created_at), "dd/MM/yyyy HH:mm")}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePetition(p.id);
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
