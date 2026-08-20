import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Copy,
  ExternalLink,
  FileDown,
  FileText,
  Loader2,
  Scale,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { exportToPDF, exportToDOCX, slugify, type ExportSection } from "@/lib/exportDocument";
import { readFunctionError } from "@/lib/usageLimit";
import { notifyUsageConsumed } from "@/hooks/useUsage";
import { CorrecaoCalc } from "@/components/calculators/CorrecaoCalc";

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

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const hoje = () => new Date().toISOString().slice(0, 10);
const dataBR = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const RODAPE_PADRAO =
  "O Honorífico calcula e fundamenta o valor. A emissão e o pagamento da guia são feitos exclusivamente no portal oficial do tribunal, e o valor deve ser conferido no ato da emissão.";

export function CustasCalc() {
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [ato, setAto] = useState<AtoId | null>(null);
  const [valorBase, setValorBase] = useState("");
  const [dataAto, setDataAto] = useState(hoje());
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

  const calcular = async () => {
    if (!ato) return;
    if (atoInfo?.baseLabel && (!valorBase || parseFloat(valorBase) <= 0)) {
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
          valor_base: parseFloat(valorBase) || 0,
          data_ato: dataAto,
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
        r.valor_base ? `Base de cálculo: ${fmt(r.valor_base)}` : "",
        `Valor devido: ${fmt(r.valor_devido)}`,
        `Guia: ${r.tipo_guia}${r.codigo_receita ? ` — código de receita ${r.codigo_receita}` : ""}`,
      ]
        .filter(Boolean)
        .join("\n"),
    },
    {
      heading: "Memória de cálculo",
      body: r.memoria
        .map(l => `${l.rotulo}: ${l.detalhe}${l.valor != null ? ` — ${fmt(l.valor)}` : ""}`)
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
    const title = `Cálculo de Custas — ${result.tribunal}`;
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
        toast({ title: "Entre na sua conta para salvar", variant: "destructive" });
        return;
      }
      const { error } = await supabase.from("analyses").insert({
        user_id: userId,
        input_text: `Cálculo de custas — ${atoInfo?.titulo ?? result.tipo_ato} (${result.tribunal}) em ${dataBR(dataAto)}`,
        file_name: `custas-${result.tribunal.toLowerCase()}-${dataAto}`,
        result: result as unknown as Record<string, unknown>,
      });
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
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Selecione o ato processual. Nesta primeira versão as regras são do <strong>TJSP</strong>.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ATOS.map(a => (
            <Card
              key={a.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setAto(a.id);
                setEtapa(2);
              }}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  setAto(a.id);
                  setEtapa(2);
                }
              }}
              className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-md"
            >
              <CardContent className="pt-5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary shrink-0" />
                  <p className="font-medium text-sm">{a.titulo}</p>
                </div>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{RODAPE_PADRAO}</p>
      </div>
    );
  }

  // ---------------------------------------------------------------- etapa 2
  if (etapa === 2 && atoInfo) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="px-0" onClick={() => setEtapa(1)}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Trocar o ato
        </Button>

        <div>
          <p className="font-medium">{atoInfo.titulo}</p>
          <p className="text-xs text-muted-foreground">{atoInfo.desc}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {atoInfo.baseLabel && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>{atoInfo.baseLabel}</Label>
                <button
                  type="button"
                  className="text-xs text-primary underline underline-offset-2"
                  onClick={() => setCorrecaoAberta(true)}
                >
                  atualizar este valor
                </button>
              </div>
              <Input
                type="number"
                placeholder="10000"
                value={valorBase}
                onChange={e => setValorBase(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Data do ato</Label>
            <Input type="date" value={dataAto} onChange={e => setDataAto(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Define a regra vigente e a unidade fiscal do mês do recolhimento.
            </p>
          </div>

          {atoInfo.litisconsorcio && (
            <div className="space-y-2">
              <Label>Número de autores</Label>
              <Input
                type="number"
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
          <label className="flex items-start gap-3">
            <Checkbox checked={justicaGratuita} onCheckedChange={v => setJusticaGratuita(v === true)} />
            <span className="text-sm">
              Justiça gratuita
              <span className="block text-xs text-muted-foreground">
                Benefício deferido ou requerido nos termos do art. 98 do CPC.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <Checkbox checked={parteIsenta} onCheckedChange={v => setParteIsenta(v === true)} />
            <span className="text-sm">
              Parte isenta por qualidade
              <span className="block text-xs text-muted-foreground">
                União, Estado, Município, suas autarquias e fundações e o Ministério Público.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3">
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

        <Button onClick={calcular} disabled={loading} className="w-full sm:w-auto">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Calcular custas
        </Button>

        <Dialog open={correcaoAberta} onOpenChange={setCorrecaoAberta}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Atualizar o valor antes de calcular as custas</DialogTitle>
            </DialogHeader>
            <CorrecaoCalc
              usarValorLabel="Usar como base das custas"
              onUsarValor={v => {
                setValorBase(String(v));
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
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="px-0" onClick={() => setEtapa(2)}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Ajustar dados
        </Button>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Taxa judiciária devida — {result.tribunal}
            </p>
            <p className="text-3xl font-bold text-primary">{fmt(result.valor_devido)}</p>
            <p className="text-sm text-muted-foreground">
              {atoInfo?.titulo ?? result.tipo_ato} · ato em {dataBR(dataAto)} ·{" "}
              {result.unidade_fiscal.codigo} {result.unidade_fiscal.ano} ={" "}
              {fmt(result.unidade_fiscal.valor)}
            </p>
            {result.isento && result.motivo_isencao && (
              <p className="text-sm text-foreground pt-2">{result.motivo_isencao}</p>
            )}
            {result.piso_aplicado && (
              <p className="text-sm text-foreground pt-2">
                Piso legal aplicado: o percentual resultaria em {fmt(result.valor_bruto)}.
              </p>
            )}
            {result.teto_aplicado && (
              <p className="text-sm text-foreground pt-2">
                Teto legal aplicado: o percentual resultaria em {fmt(result.valor_bruto)}.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => exportar("pdf")}>
            <FileDown className="mr-1.5 h-4 w-4" /> Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportar("docx")}>
            <FileText className="mr-1.5 h-4 w-4" /> Exportar Word
          </Button>
          <Button variant="outline" size="sm" onClick={salvar} disabled={salvando}>
            {salvando && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Salvar cálculo
          </Button>
        </div>

        <Collapsible open={memoriaAberta} onOpenChange={setMemoriaAberta}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="px-0">
              <ChevronDown
                className={`mr-1.5 h-4 w-4 transition-transform ${memoriaAberta ? "rotate-180" : ""}`}
              />
              Memória de cálculo ({result.memoria.length} linhas)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Detalhe</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.memoria.map((l, i) => (
                    <TableRow key={`${l.rotulo}-${i}`}>
                      <TableCell className="font-medium whitespace-nowrap">{l.rotulo}</TableCell>
                      <TableCell className="text-xs">{l.detalhe}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {l.valor != null ? fmt(l.valor) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6 space-y-2">
            <p className="flex items-center gap-2 font-medium text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Atenção — outras guias
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {result.aviso_outras_guias.map(a => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Valor a recolher</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{fmt(result.valor_devido)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
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
                      size="sm"
                      onClick={() => copiar(result.codigo_receita!, "Código de receita copiado")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {result.url_emissao && (
              <Button asChild className="w-full sm:w-auto">
                <a href={result.url_emissao} target="_blank" rel="noopener noreferrer">
                  Emitir a guia no Portal de Custas do TJSP
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}

            <p className="text-xs text-muted-foreground">{result.aviso_emissao}</p>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardContent className="pt-6 space-y-2 text-xs text-muted-foreground">
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
              {dataBR(result.unidade_fiscal.vigencia_inicio)}, aplicada por ser a vigente no primeiro
              dia do mês do recolhimento ({dataBR(result.unidade_fiscal.referencia)}).
            </p>
            <p className="text-foreground">{result.rodape_legal || RODAPE_PADRAO}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
