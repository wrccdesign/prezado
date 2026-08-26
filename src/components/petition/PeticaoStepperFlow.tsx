import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PetitionResult } from "@/components/PetitionResult";
import { notifyUsageConsumed } from "@/hooks/useUsage";
import { ArrowLeft, ArrowRight, ExternalLink, FileSignature, Loader2, Plus, X } from "lucide-react";

interface Norma {
  codigo: string;
  tipoNorma: string;
  numero: string;
  ano: string;
  ementa: string;
  dataPublicacao: string;
  url: string;
}

interface Precedent {
  id: string;
  tribunal: string | null;
  numero_processo: string | null;
  comarca: string | null;
  data_decisao: string | null;
  ementa: string | null;
}

const STEPS = [
  { n: 1, label: "Caso" },
  { n: 2, label: "Enquadramento" },
  { n: 3, label: "Fundamentação" },
  { n: 4, label: "Precedentes" },
  { n: 5, label: "Petição" },
] as const;

interface PeticaoStepperFlowProps {
  tipoAcaoOptions: readonly string[];
  varaJuizoOptions: readonly string[];
  initial?: { tipoAcao?: string; varaJuizo?: string; fatos?: string; pedidos?: string };
}

const paymentEnvHeader = {
  "x-payment-env": import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN?.startsWith("test_") ? "sandbox" : "live",
};

export function PeticaoStepperFlow({ tipoAcaoOptions, varaJuizoOptions, initial }: PeticaoStepperFlowProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [tipoAcao, setTipoAcao] = useState(initial?.tipoAcao ?? "");
  const [varaJuizo, setVaraJuizo] = useState(initial?.varaJuizo ?? "");
  const [fatos, setFatos] = useState(initial?.fatos ?? "");
  const [pedidos, setPedidos] = useState(initial?.pedidos ?? "");

  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");

  const [normas, setNormas] = useState<Norma[]>([]);
  const [normasSelecionadas, setNormasSelecionadas] = useState<Set<number>>(new Set());

  const [precedents, setPrecedents] = useState<Precedent[]>([]);
  const [precedentesSelecionados, setPrecedentesSelecionados] = useState<Set<string>>(new Set());

  const [generatedText, setGeneratedText] = useState<string | null>(null);

  const handleError = (err: any, fallbackTitle: string) => {
    const is429 = err?.context?.status === 429 || err?.status === 429 || /limite/i.test(err?.message ?? "");
    toast({
      title: is429 ? "Limite atingido" : fallbackTitle,
      description: err?.message || "Tente novamente mais tarde.",
      variant: "destructive",
      action: is429 ? (
        <Button variant="outline" size="sm" onClick={() => navigate("/planos")}>Ver planos</Button>
      ) : undefined,
    });
  };

  const callStage = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("generate-petition", {
      body,
      headers: paymentEnvHeader,
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const goEnquadramento = async () => {
    if (!tipoAcao || !fatos.trim() || !pedidos.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha tipo de ação, fatos e pedido principal.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await callStage({ stage: "enquadramento", tipo_acao: tipoAcao, fatos: fatos.trim(), pedidos: pedidos.trim() });
      setKeywords(Array.isArray(data?.keywords) ? data.keywords : []);
      setStep(2);
    } catch (err) {
      handleError(err, "Erro ao identificar o enquadramento");
    } finally {
      setLoading(false);
    }
  };

  const goFundamentacao = async () => {
    setLoading(true);
    try {
      const data = await callStage({ stage: "fundamentacao", keywords });
      const list: Norma[] = Array.isArray(data?.normas) ? data.normas : [];
      setNormas(list);
      setNormasSelecionadas(new Set(list.map((_, i) => i)));
      setStep(3);
    } catch (err) {
      handleError(err, "Erro ao buscar a legislação");
    } finally {
      setLoading(false);
    }
  };

  const goPrecedentes = async () => {
    setLoading(true);
    try {
      const data = await callStage({ stage: "precedentes", tipo_acao: tipoAcao, fatos: fatos.trim() });
      const list: Precedent[] = Array.isArray(data?.precedents) ? data.precedents : [];
      setPrecedents(list);
      setPrecedentesSelecionados(new Set(list.map((p) => p.id)));
      setStep(4);
    } catch (err) {
      handleError(err, "Erro ao buscar precedentes");
    } finally {
      setLoading(false);
    }
  };

  const goFinal = async () => {
    setLoading(true);
    try {
      const data = await callStage({
        stage: "final",
        tipo_acao: tipoAcao,
        vara_juizo: varaJuizo,
        fatos: fatos.trim(),
        pedidos: pedidos.trim(),
        approved_keywords: keywords,
        approved_normas: normas.filter((_, i) => normasSelecionadas.has(i)),
        approved_precedent_ids: precedents.filter((p) => precedentesSelecionados.has(p.id)).map((p) => p.id),
      });
      setGeneratedText(data.generated_text);
      notifyUsageConsumed();
      setStep(5);
      toast({ title: "Petição gerada com sucesso!" });
    } catch (err) {
      handleError(err, "Erro ao gerar petição");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setGeneratedText(null);
    setKeywords([]);
    setNormas([]);
    setNormasSelecionadas(new Set());
    setPrecedents([]);
    setPrecedentesSelecionados(new Set());
    setStep(1);
  };

  if (generatedText) {
    return <PetitionResult text={generatedText} petitionType={tipoAcao} onNewPetition={reset} />;
  }

  return (
    <div className="space-y-6">
      {/* Indicador de progresso — mesmo padrão da seção "Do fato ao fundamento" */}
      <ol className="relative grid grid-cols-5 gap-2">
        <div
          aria-hidden
          className="absolute left-0 right-0 top-[22px] hidden h-px sm:block"
          style={{ backgroundColor: "hsl(var(--gold) / 0.3)" }}
        />
        {STEPS.map((s) => {
          const active = step === s.n;
          const done = step > s.n;
          return (
            <li key={s.n} className="relative flex flex-col items-center text-center">
              <span
                aria-current={active ? "step" : undefined}
                className="flex h-11 w-11 items-center justify-center rounded-full font-serif text-base font-bold"
                style={{
                  backgroundColor: active || done ? "hsl(var(--navy))" : "hsl(var(--cream))",
                  color: active || done ? "hsl(var(--gold))" : "hsl(var(--muted-foreground))",
                  border: `1px solid hsl(var(--gold) / ${active || done ? 0.6 : 0.25})`,
                }}
              >
                {s.n}
              </span>
              <span className={`mt-2 text-[11px] sm:text-xs ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Etapa 1 — Caso */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Caso</CardTitle>
            <CardDescription>
              Preencha os fatos e pedidos. Nas próximas etapas você revisa o enquadramento, a legislação e os precedentes antes de gerar a peça.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Ação *</Label>
                <Select value={tipoAcao} onValueChange={setTipoAcao} disabled={loading}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo de ação" /></SelectTrigger>
                  <SelectContent>
                    {tipoAcaoOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vara / Juízo *</Label>
                <Select value={varaJuizo} onValueChange={setVaraJuizo} disabled={loading}>
                  <SelectTrigger><SelectValue placeholder="Selecione a vara" /></SelectTrigger>
                  <SelectContent>
                    {varaJuizoOptions.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descreva o que aconteceu *</Label>
              <Textarea
                placeholder="Descreva os fatos relevantes do caso em ordem cronológica..."
                value={fatos}
                onChange={(e) => setFatos(e.target.value)}
                disabled={loading}
                className="min-h-[180px]"
              />
            </div>

            <div className="space-y-2">
              <Label>O que seu cliente quer? *</Label>
              <Textarea
                placeholder="Ex: Indenização por danos morais no valor de R$ 20.000,00..."
                value={pedidos}
                onChange={(e) => setPedidos(e.target.value)}
                disabled={loading}
                className="min-h-[120px]"
              />
            </div>

            <Button className="w-full" size="lg" onClick={goEnquadramento} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
              {loading ? "Analisando..." : "Continuar para o enquadramento"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Etapa 2 — Enquadramento */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enquadramento</CardTitle>
            <CardDescription>Termos jurídicos identificados no caso. Remova o que não se aplica e adicione o que faltou.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {keywords.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum termo identificado. Adicione manualmente abaixo.</p>
              )}
              {keywords.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
                  style={{ borderColor: "hsl(var(--gold) / 0.4)", backgroundColor: "hsl(var(--gold) / 0.08)" }}
                >
                  {k}
                  <button
                    type="button"
                    aria-label={`Remover ${k}`}
                    onClick={() => setKeywords((prev) => prev.filter((x) => x !== k))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Adicionar termo (ex.: dano moral)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = newKeyword.trim();
                    if (v && !keywords.includes(v)) setKeywords((prev) => [...prev, v]);
                    setNewKeyword("");
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const v = newKeyword.trim();
                  if (v && !keywords.includes(v)) setKeywords((prev) => [...prev, v]);
                  setNewKeyword("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button className="flex-1" onClick={goFundamentacao} disabled={loading || keywords.length === 0}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                Buscar legislação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapa 3 — Fundamentação */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fundamentação legal</CardTitle>
            <CardDescription>Marque as normas que devem entrar na peça. As desmarcadas não vão para a geração.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {normas.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma norma retornada para estes termos. Você pode seguir sem legislação anexada.</p>
            )}
            <ul className="space-y-3">
              {normas.map((n, i) => (
                <li key={`${n.tipoNorma}-${n.numero}-${n.ano}-${i}`} className="flex gap-3 rounded-lg border p-3">
                  <Checkbox
                    id={`norma-${i}`}
                    checked={normasSelecionadas.has(i)}
                    onCheckedChange={(c) =>
                      setNormasSelecionadas((prev) => {
                        const next = new Set(prev);
                        if (c) next.add(i); else next.delete(i);
                        return next;
                      })
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <Label htmlFor={`norma-${i}`} className="cursor-pointer font-medium">
                      {[n.tipoNorma, n.numero && `nº ${n.numero}`, n.ano && `/${n.ano}`].filter(Boolean).join(" ")}
                    </Label>
                    <p className="mt-1 text-sm text-muted-foreground">{n.ementa}</p>
                    {n.url && (
                      <a href={n.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        Ver a norma na fonte <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button className="flex-1" onClick={goPrecedentes} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                Buscar precedentes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapa 4 — Precedentes */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Precedentes</CardTitle>
            <CardDescription>Decisões encontradas no acervo indexado. Marque as que devem sustentar a peça.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {precedents.length === 0 ? (
              <div className="rounded-lg border p-4" style={{ borderColor: "hsl(var(--gold) / 0.4)", backgroundColor: "hsl(var(--gold) / 0.06)" }}>
                <p className="text-sm text-foreground">
                  Não encontramos decisões no nosso banco para este caso. A petição será fundamentada apenas na legislação
                  aprovada — a IA nunca inventa um precedente para preencher esta etapa.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {precedents.map((p) => (
                  <li key={p.id} className="flex gap-3 rounded-lg border p-3">
                    <Checkbox
                      id={`prec-${p.id}`}
                      checked={precedentesSelecionados.has(p.id)}
                      onCheckedChange={(c) =>
                        setPrecedentesSelecionados((prev) => {
                          const next = new Set(prev);
                          if (c) next.add(p.id); else next.delete(p.id);
                          return next;
                        })
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <Label htmlFor={`prec-${p.id}`} className="cursor-pointer font-medium">
                        {[p.tribunal, p.numero_processo].filter(Boolean).join(" · ") || "Decisão"}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {[p.comarca, p.data_decisao].filter(Boolean).join(" · ")}
                      </p>
                      {p.ementa && <p className="mt-1 line-clamp-4 text-sm text-muted-foreground">{p.ementa}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button className="flex-1" size="lg" onClick={goFinal} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileSignature className="mr-2 h-5 w-5" />}
                {loading ? "Gerando Petição..." : "Gerar Petição"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              As etapas de revisão não consomem sua cota de petições — só a geração final consome.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
