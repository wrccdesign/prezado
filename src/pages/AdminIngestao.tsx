import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, CheckCircle2, XCircle, AlertTriangle, Database, ArrowRight } from "lucide-react";

interface IngestResult {
  tribunal: string;
  query: string;
  ingested: number;
  skipped: number;
  errors: string[];
  total_hits: number;
  status: "pending" | "running" | "done" | "error";
  errorMessage?: string;
}

const TRIBUNAIS = [
  { group: "Superiores", items: ["STF", "STJ", "TST", "TSE", "STM"] },
  { group: "TRFs", items: ["TRF1", "TRF2", "TRF3", "TRF4", "TRF5", "TRF6"] },
  { group: "TJs", items: [
    "TJAC", "TJAL", "TJAM", "TJAP", "TJBA", "TJCE", "TJDFT", "TJES", "TJGO",
    "TJMA", "TJMG", "TJMS", "TJMT", "TJPA", "TJPB", "TJPE", "TJPI", "TJPR",
    "TJRJ", "TJRN", "TJRO", "TJRR", "TJRS", "TJSC", "TJSE", "TJSP", "TJTO",
  ]},
  { group: "TRTs", items: Array.from({ length: 24 }, (_, i) => `TRT${i + 1}`) },
  { group: "TREs", items: [
    "TRE-AC", "TRE-AL", "TRE-AM", "TRE-AP", "TRE-BA", "TRE-CE", "TRE-DF",
    "TRE-ES", "TRE-GO", "TRE-MA", "TRE-MG", "TRE-MS", "TRE-MT", "TRE-PA",
    "TRE-PB", "TRE-PE", "TRE-PI", "TRE-PR", "TRE-RJ", "TRE-RN", "TRE-RO",
    "TRE-RR", "TRE-RS", "TRE-SC", "TRE-SE", "TRE-SP", "TRE-TO",
  ]},
  { group: "Justiça Militar", items: ["TJMMG", "TJMRS", "TJMSP"] },
];

const QUERIES_SUGERIDAS = [
  "dano moral",
  "rescisão contratual",
  "pensão alimentícia",
  "horas extras",
  "responsabilidade civil",
  "consumidor",
  "acidente de trabalho",
  "despejo",
  "usucapião",
  "alimentos",
];

export default function AdminIngestao() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedTribunais, setSelectedTribunais] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [size, setSize] = useState("10");
  const [results, setResults] = useState<IngestResult[]>([]);
  const [running, setRunning] = useState(false);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const toggleTribunal = (t: string) => {
    setSelectedTribunais((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const selectGroup = (items: string[]) => {
    const allSelected = items.every((t) => selectedTribunais.includes(t));
    if (allSelected) {
      setSelectedTribunais((prev) => prev.filter((t) => !items.includes(t)));
    } else {
      setSelectedTribunais((prev) => [...new Set([...prev, ...items])]);
    }
  };

  const runIngestion = async () => {
    if (!query.trim() || selectedTribunais.length === 0) {
      toast({ title: "Preencha todos os campos", description: "Selecione pelo menos um tribunal e informe o termo de busca.", variant: "destructive" });
      return;
    }

    setRunning(true);
    const initialResults: IngestResult[] = selectedTribunais.map((t) => ({
      tribunal: t,
      query: query.trim(),
      ingested: 0,
      skipped: 0,
      errors: [],
      total_hits: 0,
      status: "pending",
    }));
    setResults(initialResults);

    for (let i = 0; i < selectedTribunais.length; i++) {
      const tribunal = selectedTribunais[i];
      
      setResults((prev) =>
        prev.map((r, idx) => idx === i ? { ...r, status: "running" } : r)
      );

      try {
        const { data, error } = await supabase.functions.invoke("ingest-datajud", {
          body: { tribunal, query: query.trim(), size: parseInt(size) },
        });

        if (error) throw error;

        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  status: "done",
                  ingested: data.ingested || 0,
                  skipped: data.skipped || 0,
                  errors: data.errors || [],
                  total_hits: data.total_hits || 0,
                }
              : r
          )
        );
      } catch (e) {
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? { ...r, status: "error", errorMessage: e instanceof Error ? e.message : "Erro desconhecido" }
              : r
          )
        );
      }
    }

    setRunning(false);
    toast({ title: "Ingestão concluída", description: `Processados ${selectedTribunais.length} tribunais.` });
  };

  const totalIngested = results.reduce((s, r) => s + r.ingested, 0);
  const totalSkipped = results.reduce((s, r) => s + r.skipped, 0);
  const totalErrors = results.reduce((s, r) => s + r.errors.length, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 container max-w-5xl py-6 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <Database className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ingestão DataJud</h1>
            <p className="text-sm text-muted-foreground">Importe decisões judiciais da API pública do CNJ</p>
          </div>
        </div>

        {/* Config Card */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Configuração</CardTitle>
            <CardDescription>Selecione tribunais, termo de busca e quantidade</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Query + Size */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="query">Termo de busca</Label>
                <Input
                  id="query"
                  placeholder="Ex: dano moral, rescisão contratual..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={running}
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUERIES_SUGERIDAS.map((q) => (
                    <Badge
                      key={q}
                      variant={query === q ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => !running && setQuery(q)}
                    >
                      {q}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Quantidade</Label>
                <Select value={size} onValueChange={setSize} disabled={running}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} resultados</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tribunais */}
            <div className="space-y-3">
              <Label>Tribunais ({selectedTribunais.length} selecionados)</Label>
              {TRIBUNAIS.map(({ group, items }) => {
                const allSelected = items.every((t) => selectedTribunais.includes(t));
                const someSelected = items.some((t) => selectedTribunais.includes(t));
                return (
                  <div key={group} className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => !running && selectGroup(items)}
                      disabled={running}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span className={`inline-block w-3 h-3 rounded-sm border ${allSelected ? "bg-primary border-primary" : someSelected ? "bg-primary/30 border-primary" : "border-muted-foreground/40"}`} />
                      {group}
                    </button>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((t) => (
                        <Badge
                          key={t}
                          variant={selectedTribunais.includes(t) ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => !running && toggleTribunal(t)}
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={runIngestion}
              disabled={running || !query.trim() || selectedTribunais.length === 0}
              className="w-full sm:w-auto"
              size="lg"
            >
              {running ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
              ) : (
                <><Play className="mr-2 h-4 w-4" /> Iniciar Ingestão</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Resultados</span>
                <div className="flex gap-3 text-sm font-normal">
                  <span className="text-green-600 dark:text-green-400">✓ {totalIngested} ingeridos</span>
                  <span className="text-muted-foreground">⊘ {totalSkipped} duplicados</span>
                  {totalErrors > 0 && <span className="text-destructive">✕ {totalErrors} erros</span>}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    r.status === "running"
                      ? "border-primary/40 bg-primary/5"
                      : r.status === "error"
                      ? "border-destructive/30 bg-destructive/5"
                      : r.status === "done"
                      ? "border-border"
                      : "border-border/50 opacity-60"
                  }`}
                >
                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {r.status === "pending" && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                    {r.status === "running" && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
                    {r.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />}
                    {r.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm">{r.tribunal}</span>
                      <span className="text-xs text-muted-foreground">"{r.query}"</span>
                    </div>
                    {r.status === "done" && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.ingested} novos • {r.skipped} existentes • {r.total_hits} encontrados no DataJud
                        {r.errors.length > 0 && ` • ${r.errors.length} erros`}
                      </p>
                    )}
                    {r.status === "error" && (
                      <p className="text-xs text-destructive mt-0.5">{r.errorMessage}</p>
                    )}
                    {r.errors.length > 0 && r.status === "done" && (
                      <div className="mt-1 space-y-0.5">
                        {r.errors.map((err, j) => (
                          <p key={j} className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            {err}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
