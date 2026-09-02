import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Copy,
  ExternalLink,
  FileDown,
  FileText,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { exportToPDF, exportToDOCX, slugify, type ExportSection } from "@/lib/exportDocument";
import { readFunctionError } from "@/lib/usageLimit";
import { notifyUsageConsumed } from "@/hooks/useUsage";
import { CorrecaoCalc } from "@/components/calculators/CorrecaoCalc";
import { StepIndicator } from "@/components/calculators/shared/StepIndicator";
import { CurrencyInput } from "@/components/calculators/shared/CurrencyInput";
import { ResultCard } from "@/components/calculators/shared/ResultCard";
import { MemoriaList } from "@/components/calculators/shared/MemoriaList";
import { useGuestExportGate } from "@/components/calculators/shared/GuestExportGate";
import {
  fmtBRL as fmt,
  centsToNumber,
  numberToCents,
  todayISO as hoje,
  formatDateBR as dataBR,
} from "@/lib/currency";

const ATOS = [
  {
    id: "distribuicao_acao",
    titulo: "Distribuir ação",
    desc: "Taxa judiciária inicial sobre o valor da causa.",
    baseLabel: "Valor da causa (R$)",
    litisconsorcio: true,
  },
  {
    id: "execucao_titulo_extrajudicial",
    titulo: "Distribuir execução de título extrajudicial",
    desc: "Execução fundada em título executivo extrajudicial.",
    baseLabel: "Valor da causa (R$)",
    litisconsorcio: true,
  },
  {
    id: "cumprimento_sentenca",
    titulo: "Instaurar cumprimento de sentença",
    desc: "Incide sobre o valor do crédito a satisfazer.",
    baseLabel: "Valor do crédito a satisfazer (R$)",
    litisconsorcio: false,
  },
  {
    id: "preparo_apelacao",
    titulo: "Preparo de apelação",
    desc: "Sobre a condenação líquida ou, na ausência de pedido condenatório, sobre o valor da causa atualizado.",
    baseLabel: "Valor da condenação ou da causa atualizado (R$)",
    litisconsorcio: false,
  },
  {
    id: "agravo_instrumento",
    titulo: "Agravo de instrumento",
    desc: "Valor fixo em UFESPs, independente do valor da causa.",
    baseLabel: null,
    litisconsorcio: false,
  },
] as const;

type AtoId = (typeof ATOS)[number]["id"];

interface LinhaMemoria {
  rotulo: string;
  detalhe: string;
  valor: number | null;
}

interface Resultado {
  tribunal: string;
  tipo_ato: string;
  valor_base: number;
  valor_devido: number;
  isento: boolean;
  motivo_isencao: string | null;
  regra_aplicada: {
    base_calculo: string;
    aliquota: number | null;
    valor_fixo_qtd: number | null;
    vigencia_inicio: string;
    vigencia_fim: string | null;
    fonte_normativa: string | null;
    observacoes: string | null;
  };
  unidade_fiscal: {
    codigo: string;
    ano: number;
    valor: number;
    vigencia_inicio: string;
    referencia: string;
    fonte_normativa: string | null;
  };
  valor_bruto: number;
  piso_reais: number | null;
  teto_reais: number | null;
  piso_aplicado: boolean;
  teto_aplicado: boolean;
  acrescimo_litisconsorcio: number;
  qtd_autores: number;
  memoria: LinhaMemoria[];
  tipo_guia: string;
  codigo_receita: string | null;
  url_emissao: string | null;
  fonte_normativa: string | null;
  base_legal: string[];
  aviso_outras_guias: string[];
  aviso_emissao: string;
  rodape_legal: string;
}

const RODAPE_PADRAO = "O Honorífico calcula e fundamenta o valor. A emissão e o pagamento da guia são feitos exclusivamente no portal oficial do tribunal, e o valor deve ser conferido no ato da emissão.";

const PASSOS = [
  { n: 1, label: "Ato" },
  { n: 2, label: "Dados" },
  { n: 3, label: "Resultado" },
] as const;


export function CustasCalc() {
  const { isAuthenticated, requireAccount } = useGuestExportGate();
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);

  const [ato, setAto] = useState<AtoId | null>(null);
  const [valorBase, setValorBase] = useState("");
  const [dataAto, setDataAto] = useState(hoje());
  const [dataRecolhimento, setDataRecolhimento] = useState("");
  const [qtdAutores, setQtdAutores] = useState("1");
  const [justicaGratuita, setJusticaGratuita] = useState(false);
  const [parteIsenta, setParteIsenta] = useState(false);
  const [naturezaIsenta, setNaturezaIsenta] = useState(false);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [result, setResult] = useState<Resultado | null>(null);
  const [memoriaAberta, setMemoriaAberta] = useState(false);
  const [correcaoAberta, setCorrecaoAberta] = useState(false);

  const atoInfo = ATOS.find(a => a.id === ato) ?? null;
  const valorBaseNum = centsToNumber(valorBase);
  const recolhimentoEfetivo = dataRecolhimento || dataAto;

  const calcular = async () => {
    if (!ato) return;
    if (atoInfo?.baseLabel && valorBaseNum <= 0) {
      toast({ title: "Informe o valor base", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("calcular-custas", {
        body: {
          tribunal: "TJSP",
          tipo_ato: ato,
          valor_base: valorBaseNum,
          data_ato: dataAto,
          data_recolhimento: recolhimentoEfetivo,
          qtd_autores: parseInt(qtdAutores) || 1,
          justica_gratuita: justicaGratuita,
          parte_isenta: parteIsenta,
          natureza_isenta: naturezaIsenta,
        },
      });
      if (error) {
        const info = await readFunctionError(error, "Falha ao calcular");
        toast({
          title: info.burstLimited
            ? "Muitas requisições"
            : info.limitReached
            ? "Limite mensal atingido"
            : "Erro no cálculo",
          description: info.message,
          variant: "destructive",
        });
        return;
      }
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setResult(data as Resultado);
      setEtapa(3);
      notifyUsageConsumed();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao calcular";
      toast({ title: "Erro no cálculo", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const buildSections = (r: Resultado): ExportSection[] => [
    {
      heading: "Resumo",
      body: [
        `Tribunal: ${r.tribunal}`,
        `Ato: ${atoInfo?.titulo ?? r.tipo_ato}`,
        `Data do ato: ${dataBR(dataAto)}`,
        `Data prevista do recolhimento: ${dataBR(recolhimentoEfetivo)}`,
        r.valor_base ? `Base de cálculo: ${fmt(r.valor_base)}` : "",
        `Valor devido: ${fmt(r.valor_devido)}`,
        `Guia: ${r.tipo_guia}${r.codigo_receita ? `, código de receita ${r.codigo_receita}` : ""}`,
      ]
        .filter(Boolean)
        .join("\n"),
    },
    {
      heading: "Memória de cálculo",
      body: r.memoria
        .map(l => `${l.rotulo}: ${l.detalhe}${l.valor != null ? `, ${fmt(l.valor)}` : ""}`)
        .join("\n"),
    },
    {
      heading: "Base legal",
      body: [r.fonte_normativa ?? "", ...r.base_legal].filter(Boolean).join("\n"),
    },
    {
      heading: "Outras guias",
      body: r.aviso_outras_guias.join("\n"),
    },
    {
      heading: "Observações",
      body: `${r.aviso_emissao}\n${r.rodape_legal || RODAPE_PADRAO}`,
    },
  ];

  const exportar = (tipo: "pdf" | "docx") => {
    if (!result) return;
    if (!isAuthenticated) {
      requireAccount(() => {}, "exportar a memória de cálculo");
      return;
    }
    const title = `Cálculo de Custas, ${result.tribunal}`;
    const filename = slugify(`custas-${result.tribunal}-${result.tipo_ato}-${dataAto}`);
    const sections = buildSections(result);
    if (tipo === "pdf") exportToPDF(title, sections, `${filename}.pdf`);
    else exportToDOCX(title, sections, `${filename}.docx`);
  };

  const salvar = async () => {
    if (!result) return;
    setSalvando(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        requireAccount(() => {}, "salvar no seu histórico");
        return;
      }
      const { error } = await supabase.from("calculos").insert([
        {
          user_id: userId,
          tipo: "custas",
          titulo: `Custas ${result.tribunal}, ${atoInfo?.titulo ?? result.tipo_ato} (${dataBR(dataAto)})`,
          inputs: {
            tribunal: result.tribunal,
            tipo_ato: result.tipo_ato,
            valor_base: result.valor_base,
            data_ato: dataAto,
            data_recolhimento: recolhimentoEfetivo,
            qtd_autores: result.qtd_autores,
            justica_gratuita: justicaGratuita,
            parte_isenta: parteIsenta,
            natureza_isenta: naturezaIsenta,
          },
          resultado: JSON.parse(JSON.stringify(result)),
        },
      ]);
      if (error) throw error;
      toast({ title: "Cálculo salvo no seu histórico" });
    } catch (e) {
      toast({
        title: "Não foi possível salvar",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const copiar = (texto: string, titulo: string) => {
    navigator.clipboard.writeText(texto);
    toast({ title: titulo });
  };

  // ---------------------------------------------------------------- etapa 1
  if (etapa === 1) {
    return (
      <div className="space-y-5">
        <StepIndicator steps={PASSOS} current={1} ariaLabel="Etapas do cálculo" />
        <p className="text-sm text-muted-foreground">
          Selecione o ato processual. Nesta primeira versão as regras são do <strong>TJSP</strong>.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ATOS.map(a => (
            <div
              key={a.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setAto(a.id);
                setEtapa(2);
              }}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setAto(a.id);
                  setEtapa(2);
                }
              }}
              className="h-full cursor-pointer transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="flex h-full min-h-[92px] flex-col gap-1.5 p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  
                  <p className="text-sm font-medium">{a.titulo}</p>
                </div>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{RODAPE_PADRAO}</p>
      </div>
    );
  }

  // ---------------------------------------------------------------- etapa 2
  if (etapa === 2 && atoInfo) {
    return (
      <div className="space-y-5">
        <StepIndicator steps={PASSOS} current={2} ariaLabel="Etapas do cálculo" />

        <Button variant="ghost" size="sm" className="h-11 px-0" onClick={() => setEtapa(1)}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Trocar o ato
        </Button>

        <div className="space-y-1">
          <p className="font-medium">{atoInfo.titulo}</p>
          <p className="text-xs text-muted-foreground">{atoInfo.desc}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {atoInfo.baseLabel && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="custas-base">{atoInfo.baseLabel}</Label>
                <button
                  type="button"
                  className="rounded-sm text-xs text-navy underline hover:text-gold underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => setCorrecaoAberta(true)}
                >
                  atualizar este valor
                </button>
              </div>
              <CurrencyInput
                id="custas-base"
                placeholder="10.000,00"
                value={valorBase}
                onChange={setValorBase}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="custas-data-ato">Data do ato</Label>
            <Input
              id="custas-data-ato"
              type="date"
              className="h-11"
              value={dataAto}
              onChange={e => setDataAto(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Define a regra (alíquota) vigente na época do ato.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custas-data-recolhimento">Data prevista do recolhimento</Label>
            <Input
              id="custas-data-recolhimento"
              type="date"
              className="h-11"
              value={recolhimentoEfetivo}
              onChange={e => setDataRecolhimento(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A alíquota vem da data do ato; a UFESP aplicada é a vigente no primeiro dia do mês do
              recolhimento. Por padrão, igual à data do ato.
            </p>
          </div>

          {atoInfo.litisconsorcio && (
            <div className="space-y-2">
              <Label htmlFor="custas-autores">Número de autores</Label>
              <Input
                id="custas-autores"
                type="number"
                inputMode="numeric"
                className="h-11"
                min={1}
                value={qtdAutores}
                onChange={e => setQtdAutores(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                No litisconsórcio ativo voluntário acrescentam-se 10 UFESPs a cada grupo de 10 autores
                (ou fração) que exceder.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Isenções</p>
          <label className="flex items-start gap-3 py-1">
            <Checkbox checked={justicaGratuita} onCheckedChange={v => setJusticaGratuita(v === true)} />
            <span className="text-sm">
              Justiça gratuita
              <span className="block text-xs text-muted-foreground">
                Benefício da justiça gratuita já deferido. Pedido ainda pendente de decisão não
                dispensa o recolhimento.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 py-1">
            <Checkbox checked={parteIsenta} onCheckedChange={v => setParteIsenta(v === true)} />
            <span className="text-sm">
              Parte isenta por qualidade
              <span className="block text-xs text-muted-foreground">
                União, Estado, Município, suas autarquias e fundações e o Ministério Público.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 py-1">
            <Checkbox checked={naturezaIsenta} onCheckedChange={v => setNaturezaIsenta(v === true)} />
            <span className="text-sm">
              Feito isento pela natureza
              <span className="block text-xs text-muted-foreground">
                Jurisdição de menores, acidentes do trabalho, alimentos até 2 salários mínimos e
                Juizados Especiais em 1ª instância.
              </span>
            </span>
          </label>
        </div>

        <Button onClick={calcular} disabled={loading} className="h-11 w-full sm:w-auto">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Calcular custas
        </Button>

        <Dialog open={correcaoAberta} onOpenChange={setCorrecaoAberta}>
          <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Atualizar o valor antes de calcular as custas</DialogTitle>
            </DialogHeader>
            <CorrecaoCalc
              usarValorLabel="Usar como base das custas"
              onUsarValor={v => {
                setValorBase(numberToCents(v));
                setCorrecaoAberta(false);
                toast({ title: "Valor atualizado aplicado como base de cálculo" });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ---------------------------------------------------------------- etapa 3
  if (etapa === 3 && result) {
    return (
      <div className="space-y-5">
        <StepIndicator steps={PASSOS} current={3} ariaLabel="Etapas do cálculo" />

        <Button variant="ghost" size="sm" className="h-11 px-0" onClick={() => setEtapa(2)}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Ajustar dados
        </Button>

        {/* valor + ações */}
        <ResultCard
          label={`Taxa judiciária devida, ${result.tribunal}`}
          value={fmt(result.valor_devido)}
          meta={
            <>
              {atoInfo?.titulo ?? result.tipo_ato} · ato em {dataBR(dataAto)} · recolhimento previsto
              em {dataBR(recolhimentoEfetivo)} · {result.unidade_fiscal.codigo}{" "}
              {result.unidade_fiscal.ano} = {fmt(result.unidade_fiscal.valor)}
            </>
          }
          notes={
            <>
              {result.isento && result.motivo_isencao && (
                <p className="pt-2 text-sm text-foreground">{result.motivo_isencao}</p>
              )}
              {result.piso_aplicado && (
                <p className="pt-2 text-sm text-foreground">
                  Piso legal aplicado: o percentual resultaria em {fmt(result.valor_bruto)}.
                </p>
              )}
              {!isAuthenticated && (
                <p className="pt-2 text-sm text-muted-foreground">
                  O cálculo e a memória são livres, sem conta. Para exportar em PDF/Word ou
                  salvar no histórico, crie sua conta grátis.
                </p>
              )}
              {result.teto_aplicado && (
                <p className="pt-2 text-sm text-foreground">
                  Teto legal aplicado: o percentual resultaria em {fmt(result.valor_bruto)}.
                </p>
              )}
            </>
          }
          actions={
            <>
              <Button
                variant="outline"
                className="h-11 w-full sm:w-auto"
                onClick={() => exportar("pdf")}
              >
                <FileDown className="mr-1.5 h-4 w-4" /> Exportar PDF
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full sm:w-auto"
                onClick={() => exportar("docx")}
              >
                <FileText className="mr-1.5 h-4 w-4" /> Exportar Word
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full sm:w-auto"
                onClick={salvar}
                disabled={salvando}
              >
                {salvando && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Salvar cálculo
              </Button>
            </>
          }
        />

        {/* memória colapsada */}
        <Collapsible open={memoriaAberta} onOpenChange={setMemoriaAberta}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-11 px-0">
              <ChevronDown
                className={`mr-1.5 h-4 w-4 transition-transform ${memoriaAberta ? "rotate-180" : ""}`}
              />
              Memória de cálculo ({result.memoria.length} linhas)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <MemoriaList items={result.memoria} />
          </CollapsibleContent>
        </Collapsible>

        {/* aviso de outras guias */}
        <div className="rounded-lg border border-cream-dark bg-white border-amber-500/40 bg-amber-500/5">
          <div className="space-y-2 p-5">
            <p className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Atenção, outras guias
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {result.aviso_outras_guias.map(a => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* emissão */}
        <div className="rounded-lg border border-cream-dark bg-white">
          <div className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Valor a recolher</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{fmt(result.valor_devido)}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Copiar valor"
                    className="h-11 w-11"
                    onClick={() => copiar(result.valor_devido.toFixed(2), "Valor copiado")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Guia e código de receita</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    {result.tipo_guia}
                    {result.codigo_receita ? ` · ${result.codigo_receita}` : ""}
                  </p>
                  {result.codigo_receita && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Copiar código de receita"
                      className="h-11 w-11"
                      onClick={() => copiar(result.codigo_receita!, "Código de receita copiado")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {result.url_emissao && (
              <Button asChild className="h-11 w-full sm:w-auto">
                <a href={result.url_emissao} target="_blank" rel="noopener noreferrer">
                  Emitir a guia no Portal de Custas do TJSP
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}

            <p className="text-xs text-muted-foreground">{result.aviso_emissao}</p>
          </div>
        </div>

        {/* base legal */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div>
            <strong className="text-foreground">Base legal:</strong>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {[result.fonte_normativa, ...result.base_legal]
                .filter((b, i, arr): b is string => Boolean(b) && arr.indexOf(b) === i)
                .map(b => (
                  <li key={b}>{b}</li>
                ))}
            </ul>
          </div>
          {result.regra_aplicada.observacoes && <p>{result.regra_aplicada.observacoes}</p>}
          <p>
            <strong className="text-foreground">Unidade fiscal:</strong>{" "}
            {result.unidade_fiscal.codigo} de {result.unidade_fiscal.ano} ={" "}
            {fmt(result.unidade_fiscal.valor)}, vigente desde{" "}
            {dataBR(result.unidade_fiscal.vigencia_inicio)}, aplicada por ser a vigente no primeiro dia
            do mês do recolhimento ({dataBR(result.unidade_fiscal.referencia)}).
          </p>
          <p className="text-foreground">{result.rodape_legal || RODAPE_PADRAO}</p>
        </div>
      </div>
    );
  }

  return null;
}
