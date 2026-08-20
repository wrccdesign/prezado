import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, ChevronDown, FileDown, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { exportToPDF, exportToDOCX, slugify, type ExportSection } from "@/lib/exportDocument";
import { readFunctionError } from "@/lib/usageLimit";
import { notifyUsageConsumed } from "@/hooks/useUsage";


interface LinhaMemoria {
  mes_ref: string;
  indice_utilizado: string;
  variacao_percentual: number;
  fator_do_mes: number;
  fator_acumulado: number;
  saldo_corrigido: number;
  juros_do_mes: number;
  juros_acumulados: number;
  regime: "pre_14905" | "transicao_14905" | "pos_14905";
}

interface Resultado {
  valor_original: number;
  valor_corrigido: number;
  juros: number;
  multa: number;
  honorarios: number;
  total: number;
  memoria: LinhaMemoria[];
  meses_faltantes: Array<{ mes_ref: string; indice: string }>;
  manter_indice_contratual?: boolean;
  fonte: string;
  ultima_sincronizacao: string | null;
  base_legal: string[];
}

const REGIME_LABEL: Record<LinhaMemoria["regime"], string> = {
  pre_14905: "regime anterior",
  transicao_14905: "transição (Lei 14.905/2024 em 30–31/08/2024)",
  pos_14905: "Lei 14.905/2024",
};


const INDICES = [
  { id: "ipca", label: "IPCA (IBGE)" },
  { id: "ipca_e", label: "IPCA-E (IBGE)" },
  { id: "inpc", label: "INPC (IBGE)" },
  { id: "igpm", label: "IGP-M (FGV)" },
  { id: "selic_mensal", label: "Selic acumulada no mês" },
  { id: "tr", label: "TR (Bacen)" },
  { id: "poupanca", label: "Rendimento da Poupança (Bacen)" },
  { id: "fixo", label: "Sem correção monetária" },
];


function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mesLabel(mesRef: string) {
  const [y, m] = mesRef.split("-");
  return `${m}/${y}`;
}

interface CorrecaoCalcProps {
  /** Quando informado, exibe um botão para devolver o total atualizado ao fluxo que abriu a calculadora. */
  onUsarValor?: (valor: number) => void;
  usarValorLabel?: string;
}

export function CorrecaoCalc({ onUsarValor, usarValorLabel = "Usar este valor" }: CorrecaoCalcProps = {}) {
  const [valor, setValor] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [indice, setIndice] = useState("ipca");
  const [proRata, setProRata] = useState(true);
  const [manterIndiceContratual, setManterIndiceContratual] = useState(false);
  const [regimeJuros, setRegimeJuros] = useState("legal_14905");
  const [tipoJuros, setTipoJuros] = useState("simples");
  const [taxaFixa, setTaxaFixa] = useState("1");
  const [usarDatasJuros, setUsarDatasJuros] = useState(false);
  const [jurosInicio, setJurosInicio] = useState("");
  const [jurosFim, setJurosFim] = useState("");
  const [multa, setMulta] = useState("");
  const [multaSobreJuros, setMultaSobreJuros] = useState(false);
  const [honorarios, setHonorarios] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Resultado | null>(null);
  const [memoriaAberta, setMemoriaAberta] = useState(false);


  const calcular = async () => {
    if (!valor || !dataInicial || !dataFinal) {
      toast({ title: "Preencha valor e datas", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("calcular-atualizacao", {
        body: {
          valor: parseFloat(valor),
          data_inicial: dataInicial,
          data_final: dataFinal,
          indice,
          pro_rata: proRata,
          manter_indice_contratual: manterIndiceContratual,
          regime_juros: regimeJuros,
          tipo_juros: tipoJuros,
          taxa_juros_mensal: parseFloat(taxaFixa) || 0,

          juros_data_inicial: usarDatasJuros && jurosInicio ? jurosInicio : null,
          juros_data_final: usarDatasJuros && jurosFim ? jurosFim : null,
          multa_percentual: parseFloat(multa) || 0,
          multa_incide_sobre_juros: multaSobreJuros,
          honorarios_percentual: parseFloat(honorarios) || 0,
        },
      });
      if (error) {
        const info = await readFunctionError(error, "Falha ao calcular");
        toast({
          title: info.burstLimited ? "Muitas requisições" : info.limitReached ? "Limite mensal atingido" : "Erro no cálculo",
          description: info.message,
          variant: "destructive",
        });
        return;
      }
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setResult(data as Resultado);
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
      heading: "Resumo do cálculo",
      body: [
        `Valor original: ${fmt(r.valor_original)}`,
        `Período: ${dataInicial} a ${dataFinal}`,
        `Índice de correção: ${INDICES.find(i => i.id === indice)?.label ?? indice}`,
        `Valor corrigido: ${fmt(r.valor_corrigido)}`,
        `Juros de mora: ${fmt(r.juros)}`,
        `Multa: ${fmt(r.multa)}`,
        `Honorários: ${fmt(r.honorarios)}`,
        `TOTAL: ${fmt(r.total)}`,
      ].join("\n"),
    },
    {
      heading: "Memória de cálculo (mês a mês)",
      body: r.memoria
        .map(
          l =>
            `${mesLabel(l.mes_ref)} | ${l.indice_utilizado.toUpperCase()} ${l.variacao_percentual.toFixed(2)}% | fator acum. ${l.fator_acumulado.toFixed(6)} | saldo ${fmt(l.saldo_corrigido)} | juros do mês ${fmt(l.juros_do_mes)} | juros acum. ${fmt(l.juros_acumulados)} | ${REGIME_LABEL[l.regime]}`,
        )
        .join("\n"),
    },
    {
      heading: "Fonte e base legal",
      body: `${r.fonte}\nÚltima sincronização dos índices: ${
        r.ultima_sincronizacao ? new Date(r.ultima_sincronizacao).toLocaleString("pt-BR") : "—"
      }\n${r.base_legal.join("\n")}`,
    },

  ];

  const exportar = (tipo: "pdf" | "docx") => {
    if (!result) return;
    const title = "Memória de Cálculo — Atualização Monetária";
    const filename = slugify(`memoria-calculo-${dataInicial}-${dataFinal}`);
    const sections = buildSections(result);
    if (tipo === "pdf") exportToPDF(title, sections, `${filename}.pdf`);
    else exportToDOCX(title, sections, `${filename}.docx`);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Valor Original (R$)</Label>
          <Input type="number" placeholder="10000" value={valor} onChange={e => setValor(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Índice de Correção</Label>
          <Select value={indice} onValueChange={setIndice}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {INDICES.map(i => <SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Data Inicial</Label>
          <Input type="date" value={dataInicial} onChange={e => setDataInicial(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Data Final</Label>
          <Input type="date" value={dataFinal} onChange={e => setDataFinal(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Regime de Juros de Mora</Label>
          <Select value={regimeJuros} onValueChange={setRegimeJuros}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="legal_14905">Juros legais (Lei 14.905/2024)</SelectItem>
              <SelectItem value="taxa_fixa">Taxa fixa mensal</SelectItem>
              <SelectItem value="nenhum">Sem juros</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {regimeJuros !== "nenhum" && (
          <div className="space-y-2">
            <Label>Tipo de juros</Label>
            <Select value={tipoJuros} onValueChange={setTipoJuros}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simples">Simples (sobre saldo corrigido)</SelectItem>
                <SelectItem value="compostos">Compostos (capitalizados mês a mês)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {regimeJuros === "taxa_fixa" && (

          <div className="space-y-2">
            <Label>Taxa de juros mensal (%)</Label>
            <Input type="number" step="0.1" value={taxaFixa} onChange={e => setTaxaFixa(e.target.value)} />
          </div>
        )}
        <div className="space-y-2">
          <Label>Cálculo pro rata die</Label>
          <div className="flex items-center gap-3 pt-1">
            <Switch checked={proRata} onCheckedChange={setProRata} />
            <span className="text-sm text-muted-foreground">
              {proRata ? "Proporcional nos meses parciais" : "Meses inteiros"}
            </span>
          </div>
        </div>
        {indice !== "ipca" && indice !== "fixo" && (
          <div className="space-y-2">
            <Label>Manter o índice escolhido após 30/08/2024</Label>
            <div className="flex items-center gap-3 pt-1">
              <Switch checked={manterIndiceContratual} onCheckedChange={setManterIndiceContratual} />
              <span className="text-sm text-muted-foreground">
                {manterIndiceContratual
                  ? "Índice contratual mantido (art. 389, § único, CC — norma supletiva)"
                  : "Substituir pelo IPCA a partir da vigência da Lei 14.905/2024"}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Multa (%)</Label>
          <Input type="number" step="0.1" placeholder="2" value={multa} onChange={e => setMulta(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>A multa incide também sobre os juros?</Label>
          <div className="flex items-center gap-3 pt-1">
            <Switch checked={multaSobreJuros} onCheckedChange={setMultaSobreJuros} />
            <span className="text-sm text-muted-foreground">{multaSobreJuros ? "Sim" : "Não"}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Honorários (%)</Label>
          <Input type="number" step="0.1" placeholder="10" value={honorarios} onChange={e => setHonorarios(e.target.value)} />
        </div>
      </div>

      <Collapsible open={usarDatasJuros} onOpenChange={setUsarDatasJuros}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="px-0">
            <ChevronDown className={`mr-1.5 h-4 w-4 transition-transform ${usarDatasJuros ? "rotate-180" : ""}`} />
            Definir período próprio para os juros (opcional)
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="grid gap-4 sm:grid-cols-2 pt-3">
          <div className="space-y-2">
            <Label>Início dos juros</Label>
            <Input type="date" value={jurosInicio} onChange={e => setJurosInicio(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Fim dos juros</Label>
            <Input type="date" value={jurosFim} onChange={e => setJurosFim(e.target.value)} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button onClick={calcular} disabled={loading} className="h-11 w-full sm:w-auto">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Calcular Atualização
      </Button>

      {result && (
        <div className="space-y-4">
          {result.meses_faltantes.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20 p-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <p className="font-medium">Índices ainda não divulgados para os meses abaixo — considerados como 0%:</p>
                <p className="mt-1">
                  {result.meses_faltantes.map(m => `${mesLabel(m.mes_ref)} (${m.indice.toUpperCase()})`).join(", ")}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Valor Corrigido", v: result.valor_corrigido },
              { label: "Juros", v: result.juros },
              { label: "Multa", v: result.multa },
              { label: "Honorários", v: result.honorarios },
            ].map(c => (
              <Card key={c.label}>
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-base font-semibold">{fmt(c.v)}</p>
                </CardContent>
              </Card>
            ))}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">TOTAL</p>
                <p className="text-base font-bold text-primary">{fmt(result.total)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportar("pdf")}>
              <FileDown className="mr-1.5 h-4 w-4" /> Exportar PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportar("docx")}>
              <FileText className="mr-1.5 h-4 w-4" /> Exportar Word
            </Button>
            {onUsarValor && (
              <Button size="sm" onClick={() => onUsarValor(result.total)}>
                {usarValorLabel} ({fmt(result.total)})
              </Button>
            )}
          </div>

          <Collapsible open={memoriaAberta} onOpenChange={setMemoriaAberta}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="px-0">
                <ChevronDown className={`mr-1.5 h-4 w-4 transition-transform ${memoriaAberta ? "rotate-180" : ""}`} />
                Memória de cálculo mês a mês ({result.memoria.length} meses)
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead>Índice</TableHead>
                      <TableHead className="text-right">Variação</TableHead>
                      <TableHead className="text-right">Fator acum.</TableHead>
                      <TableHead className="text-right">Saldo corrigido</TableHead>
                      <TableHead className="text-right">Juros do mês</TableHead>
                      <TableHead className="text-right">Juros acum.</TableHead>
                      <TableHead>Regime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.memoria.map(l => (
                      <TableRow key={l.mes_ref}>
                        <TableCell className="font-medium">{mesLabel(l.mes_ref)}</TableCell>
                        <TableCell className="uppercase text-xs">{l.indice_utilizado}</TableCell>
                        <TableCell className="text-right">{l.variacao_percentual.toFixed(2)}%</TableCell>
                        <TableCell className="text-right">{l.fator_acumulado.toFixed(6)}</TableCell>
                        <TableCell className="text-right">{fmt(l.saldo_corrigido)}</TableCell>
                        <TableCell className="text-right">{fmt(l.juros_do_mes)}</TableCell>
                        <TableCell className="text-right">{fmt(l.juros_acumulados)}</TableCell>
                        <TableCell className="text-xs">
                          {REGIME_LABEL[l.regime]}
                        </TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Card className="border-muted">
            <CardContent className="pt-6 space-y-1 text-xs text-muted-foreground">
              <p><strong className="text-foreground">Fonte:</strong> {result.fonte}</p>
              <p>
                <strong className="text-foreground">Última sincronização dos índices:</strong>{" "}
                {result.ultima_sincronizacao
                  ? new Date(result.ultima_sincronizacao).toLocaleString("pt-BR")
                  : "—"}
              </p>
              <div>
                <strong className="text-foreground">Base legal:</strong>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {result.base_legal.map(b => <li key={b}>{b}</li>)}
                </ul>
              </div>
              <p>
                Agosto/2024 é mês de transição, calculado pro rata die: regime anterior até 29/08 e
                Lei 14.905/2024 nos dias 30 e 31 (Res. CMN 5.171/2024). A partir daí a correção segue o
                {result.manter_indice_contratual
                  ? " índice contratual mantido"
                  : " IPCA (art. 389, parágrafo único, do CC)"} e os juros a Taxa Legal divulgada pelo
                Banco Central (art. 406, §1º, do CC), desconsiderando-se resultado negativo (art. 406, §3º).
              </p>

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
