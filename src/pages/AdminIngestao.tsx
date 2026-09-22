import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
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
import { Loader2, Play, CheckCircle2, XCircle, AlertTriangle, Database, ArrowRight, Copy, Wallet } from "lucide-react";

const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asaas-webhook`;

const ASAAS_EVENTOS = [
  "PAYMENT_RECEIVED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "SUBSCRIPTION_INACTIVATED",
  "SUBSCRIPTION_DELETED",
];

interface AiUsageRow {
  dia: string;
  function_name: string;
  chamadas: number;
  falhas: number;
  input_tokens: number;
  output_tokens: number;
  reasoning_tokens: number;
  custo_usd: number;
  sem_preco: number;
}

interface ModelPriceRow {
  model: string;
  input_usd_per_mtok: number;
  output_usd_per_mtok: number;
}

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
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const { toast } = useToast();
  const [selectedTribunais, setSelectedTribunais] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [size, setSize] = useState("10");
  const [results, setResults] = useState<IngestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const [usage, setUsage] = useState<AiUsageRow[]>([]);
  const [prices, setPrices] = useState<ModelPriceRow[]>([]);
  const [usdBrl, setUsdBrl] = useState("5.40");
  const [savingPrices, setSavingPrices] = useState(false);
  const allowed = !!user && isAdmin;

  useEffect(() => {
    if (!allowed) return;
    supabase
      .from("cron_ingest_log")
      .select("executed_at")
      .gt("total_ingested", 0)
      .order("executed_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(async ({ data }) => {
        if (data?.executed_at) {
          setLastSuccess(data.executed_at as string);
          return;
        }
        const { data: dec } = await supabase
          .from("decisions")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setLastSuccess((dec?.created_at as string) ?? null);
      });
  }, [allowed]);

  useEffect(() => {
    if (!allowed) return;
    supabase.rpc("ai_usage_summary", { p_days: 30 }).then(({ data }) => {
      setUsage((data ?? []) as unknown as AiUsageRow[]);
    });
    supabase
      .from("ai_model_prices")
      .select("model, input_usd_per_mtok, output_usd_per_mtok")
      .order("model")
      .then(({ data }) => setPrices((data ?? []) as unknown as ModelPriceRow[]));
    supabase
      .from("ai_settings")
      .select("value")
      .eq("key", "usd_brl")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setUsdBrl(String(data.value));
      });
  }, [allowed]);


  if (authLoading || roleLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const daysSinceSuccess = lastSuccess
    ? Math.floor((Date.now() - new Date(lastSuccess).getTime()) / 86400000)
    : null;
  const ingestStale = daysSinceSuccess === null || daysSinceSuccess > 7;

  const cotacao = Number(usdBrl.replace(",", ".")) || 0;
  const fmtUsd = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "USD", minimumFractionDigits: 4 });
  const fmtBrl = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const usageTotals = usage.reduce(
    (acc, r) => ({
      chamadas: acc.chamadas + Number(r.chamadas),
      falhas: acc.falhas + Number(r.falhas),
      entrada: acc.entrada + Number(r.input_tokens),
      saida: acc.saida + Number(r.output_tokens),
      raciocinio: acc.raciocinio + Number(r.reasoning_tokens),
      custo: acc.custo + Number(r.custo_usd),
      semPreco: acc.semPreco + Number(r.sem_preco),
    }),
    { chamadas: 0, falhas: 0, entrada: 0, saida: 0, raciocinio: 0, custo: 0, semPreco: 0 },
  );

  type FuncRow = {
    function_name: string;
    chamadas: number;
    falhas: number;
    entrada: number;
    saida: number;
    raciocinio: number;
    custo: number;
  };
  const usagePorFuncao = Object.values(
    usage.reduce<Record<string, FuncRow>>((acc, r) => {
      const cur = acc[r.function_name] ?? {
        function_name: r.function_name,
        chamadas: 0, falhas: 0, entrada: 0, saida: 0, raciocinio: 0, custo: 0,
      };
      cur.chamadas += Number(r.chamadas);
      cur.falhas += Number(r.falhas);
      cur.entrada += Number(r.input_tokens);
      cur.saida += Number(r.output_tokens);
      cur.raciocinio += Number(r.reasoning_tokens);
      cur.custo += Number(r.custo_usd);
      acc[r.function_name] = cur;
      return acc;
    }, {}),
  ).sort((a, b) => b.custo - a.custo);

  const updatePrice = (model: string, field: "input_usd_per_mtok" | "output_usd_per_mtok", value: string) => {
    setPrices((prev) =>
      prev.map((p) => (p.model === model ? { ...p, [field]: Number(value.replace(",", ".")) } : p)),
    );
  };

  const savePrices = async () => {
    setSavingPrices(true);
    const { error } = await supabase.from("ai_model_prices").upsert(
      prices.map((p) => ({
        model: p.model,
        input_usd_per_mtok: p.input_usd_per_mtok,
        output_usd_per_mtok: p.output_usd_per_mtok,
      })),
      { onConflict: "model" },
    );
    const { error: settingError } = await supabase
      .from("ai_settings")
      .upsert({ key: "usd_brl", value: String(cotacao) }, { onConflict: "key" });
    setSavingPrices(false);
    if (error || settingError) {
      toast({ title: "Não foi possível salvar", variant: "destructive" });
      return;
    }
    toast({ title: "Preços atualizados" });
  };

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL);
      toast({ title: "Endereço copiado" });
    } catch {
      toast({ title: "Não foi possível copiar", description: "Copie manualmente.", variant: "destructive" });
    }
  };

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

        {/* Alerta de pipeline parado */}
        <div
          className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
            ingestStale
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-border bg-muted/40 text-muted-foreground"
          }`}
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">
              {lastSuccess
                ? `Última ingestão bem-sucedida: ${new Date(lastSuccess).toLocaleDateString("pt-BR")}`
                : "Nenhuma ingestão bem-sucedida registrada"}
            </p>
            {ingestStale && (
              <p className="mt-0.5">
                {daysSinceSuccess !== null
                  ? `Há ${daysSinceSuccess} dias sem ingestão — verifique os logs do cron.`
                  : "Verifique os logs do cron de ingestão."}
              </p>
            )}
          </div>
        </div>

        {/* Card de configuração do Asaas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Configuração do Asaas
            </CardTitle>
            <CardDescription>
              Cadastre o aviso automático no painel do Asaas. Sem ele, o plano não é ativado sozinho quando o pagamento cai.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Endereço do aviso (cole no campo URL)</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md border bg-muted/40 px-3 py-2 text-sm">{WEBHOOK_URL}</code>
                <Button variant="outline" size="sm" onClick={copyWebhookUrl} aria-label="Copiar endereço do aviso">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Token de autenticação</Label>
              <p className="text-sm text-muted-foreground">
                O Asaas envia o token no cabeçalho <code className="rounded bg-muted/40 px-1 py-0.5">asaas-access-token</code>.
                Em produção use o token ao vivo e, no ambiente de testes, o token de teste. Use os mesmos valores salvos com segurança no projeto.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Eventos a marcar no painel do Asaas</Label>
              <div className="flex flex-wrap gap-1.5">
                {ASAAS_EVENTOS.map((ev) => (
                  <Badge key={ev} variant="outline" className="font-mono text-xs">{ev}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Passo a passo</Label>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>No painel do Asaas, abra Integrações e depois Webhook para cobranças.</li>
                <li>Informe a URL acima e o token (produção usa o token ao vivo, testes usam o de teste).</li>
                <li>Marque todos os eventos listados acima e salve.</li>
                <li>Faça o mesmo no ambiente de testes do Asaas e valide um pagamento de teste antes de ligar em produção.</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Consumo de IA */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Consumo de IA, últimos 30 dias</CardTitle>
            <CardDescription>
              Custo estimado a partir dos tokens. A fatura oficial é a do Google.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Chamadas</p>
                <p className="tabular-nums">{usageTotals.chamadas}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Falhas</p>
                <p className="tabular-nums">{usageTotals.falhas}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tokens</p>
                <p className="tabular-nums">{usageTotals.tokens.toLocaleString("pt-BR")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Custo estimado</p>
                <p className="tabular-nums">
                  {usageTotals.custo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
            </div>

            {usagePorFuncao.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma chamada registrada no período.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3">Função</th>
                      <th className="py-2 pr-3">Chamadas</th>
                      <th className="py-2 pr-3">Falhas</th>
                      <th className="py-2 pr-3">Tokens</th>
                      <th className="py-2">Custo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usagePorFuncao.map((row) => (
                      <tr key={row.function_name} className="border-b last:border-0">
                        <td className="py-2 pr-3">{row.function_name}</td>
                        <td className="py-2 pr-3 tabular-nums">{row.chamadas}</td>
                        <td className="py-2 pr-3 tabular-nums">{row.falhas}</td>
                        <td className="py-2 pr-3 tabular-nums">{row.tokens.toLocaleString("pt-BR")}</td>
                        <td className="py-2 tabular-nums">
                          {row.custo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

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
                      <p className="text-base leading-relaxed text-destructive mt-0.5">{r.errorMessage}</p>
                    )}
                    {r.errors.length > 0 && r.status === "done" && (
                      <div className="mt-1 space-y-0.5">
                        {r.errors.map((err, j) => (
                          <p key={j} className="text-base leading-relaxed text-amber-600 dark:text-amber-400 flex items-start gap-1">
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
