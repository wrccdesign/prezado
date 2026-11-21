import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { exportToPDF, urlConferencia, type ExportSection } from "@/lib/exportDocument";
import { track } from "@/lib/track";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGuestExportGate } from "@/components/calculators/shared/GuestExportGate";
import { UsarNaPeticaoButton } from "@/components/calculators/shared/UsarNaPeticaoButton";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

import { calcularRescisao, type ResultadoRescisao, type TipoDemissao } from "@/lib/rescisao";

const TIPO_LABEL: Record<TipoDemissao, string> = {
  sem_justa_causa: "dispensa sem justa causa",
  com_justa_causa: "dispensa por justa causa",
  pedido_demissao: "pedido de demissão",
  acordo_mutuo: "acordo mútuo (art. 484-A da CLT)",
};


const TIPOS: TipoDemissao[] = ["sem_justa_causa", "com_justa_causa", "pedido_demissao", "acordo_mutuo"];
const num = (v: string | null) => (v && /^\d+(\.\d+)?$/.test(v) ? v : "");
function isoParaData(v: string | null): Date | undefined {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function RescisaoCalc() {
  const { requireAccount } = useGuestExportGate("rescisao");
  const [sp] = useSearchParams();
  const [salario, setSalario] = useState(num(sp.get("salario")));
  const [admissao, setAdmissao] = useState<Date | undefined>(isoParaData(sp.get("admissao")));
  const [demissao, setDemissao] = useState<Date | undefined>(isoParaData(sp.get("demissao")));
  const [tipo, setTipo] = useState<TipoDemissao>(
    TIPOS.includes(sp.get("tipo") as TipoDemissao) ? (sp.get("tipo") as TipoDemissao) : "sem_justa_causa",
  );
  const [possuiFgts, setPossuiFgts] = useState(!!num(sp.get("fgts")));
  const [saldoFgts, setSaldoFgts] = useState(num(sp.get("fgts")));
  const [horasExtras, setHorasExtras] = useState(num(sp.get("horas_extras")));
  const [possuiComissoes, setPossuiComissoes] = useState(!!num(sp.get("comissoes")));
  const [comissoes, setComissoes] = useState(num(sp.get("comissoes")));
  const [periodosVencidos, setPeriodosVencidos] = useState(num(sp.get("ferias_vencidas")) || "0");
  const autoCalcFeito = useRef(false);
  const [res, setRes] = useState<ResultadoRescisao | null>(null);

  const calcular = () => {
    const sal = parseFloat(salario) || 0;
    if (!sal || !admissao || !demissao) { toast.error("Preencha salário, data de admissão e demissão."); return; }
    if (demissao <= admissao) { toast.error("A data de demissão deve ser posterior à admissão."); return; }
    const he = parseFloat(horasExtras) || 0;
    const com = possuiComissoes ? (parseFloat(comissoes) || 0) : 0;
    setRes(calcularRescisao({
      remuneracao: sal + he + com,
      admissao, demissao, tipo,
      saldoFgts: possuiFgts && saldoFgts !== "" ? (parseFloat(saldoFgts) || 0) : null,
      periodosVencidosNaoGozados: parseInt(periodosVencidos, 10) || 0,
    }));
    track("calc_completed", { calculadora: "rescisao" });
  };

  // Link de conferência (PDF): calcula sozinho ao abrir já preenchido.
  useEffect(() => {
    if (autoCalcFeito.current) return;
    autoCalcFeito.current = true;
    if (sp.get("ref") === "pdf") track("verify_link_opened", { calculadora: "rescisao" });
    if (salario && admissao && demissao) calcular();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iso = (d?: Date) => (d ? format(d, "yyyy-MM-dd") : "");
  const paramsCalculo = (): Record<string, string> => {
    const p: Record<string, string> = { salario, admissao: iso(admissao), demissao: iso(demissao), tipo };
    if (possuiFgts && saldoFgts) p.fgts = saldoFgts;
    if (horasExtras) p.horas_extras = horasExtras;
    if (possuiComissoes && comissoes) p.comissoes = comissoes;
    if (periodosVencidos && periodosVencidos !== "0") p.ferias_vencidas = periodosVencidos;
    return p;
  };

  const verbas = res?.verbas ?? null;
  const total = res?.totalBruto ?? 0;

  const gerarPDF = () => {
    if (!verbas || !res) return;
    const sections: ExportSection[] = [
      {
        heading: "Dados informados",
        body: [
          admissao ? `Admissão: ${format(admissao, "dd/MM/yyyy")}` : "",
          demissao ? `Demissão: ${format(demissao, "dd/MM/yyyy")}` : "",
          `Tipo: ${TIPO_LABEL[tipo]}`,
        ].filter(Boolean).join("\n"),
      },
      { heading: "Verbas rescisórias", body: verbas.map((v) => `${v.label}: ${fmt(v.valor)}\n  ${v.formula}`).join("\n") },
      { heading: "Total bruto estimado", body: fmt(total) },
      { heading: "Depósitos na conta do FGTS", body: res.fgts.map((v) => `${v.label}: ${fmt(v.valor)}`).join("\n") },
      { heading: "Observação", body: "Valores brutos, sem desconto de INSS e IRRF. Cálculo estimado." },
    ];
    void exportToPDF("Memória de cálculo, rescisão trabalhista", sections, "rescisao-trabalhista-honorifico.pdf", {
      verificacao: {
        url: urlConferencia(window.location.pathname, paramsCalculo()),
        geradoEm: new Date().toISOString(),
        fonte: "as regras da CLT (arts. 477 a 487) e da Lei 8.036/1990 usadas na calculadora",
      },
    });
    track("export_pdf", { calculadora: "rescisao", formato: "pdf", logado: true });
    toast.success("PDF gerado com sucesso!");
  };

  const tipoLabels: Record<TipoDemissao, string> = {
    sem_justa_causa: "Sem justa causa", com_justa_causa: "Com justa causa",
    pedido_demissao: "Pedido de demissão", acordo_mutuo: "Acordo mútuo (art. 484-A CLT)",
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="rescisao-salario">Salário Bruto Mensal (R$)</Label><Input id="rescisao-salario" className="h-11" type="number" inputMode="decimal" placeholder="5000" value={salario} onChange={e => setSalario(e.target.value)} /></div>
        <div className="space-y-2">
          <Label htmlFor="rescisao-tipo">Tipo de demissão</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as TipoDemissao)}>
            <SelectTrigger id="rescisao-tipo"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(tipoLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rescisao-admissao">Data de admissão</Label>
          <Input id="rescisao-admissao" className="h-11" type="date" min="1970-01-01" max={format(new Date(), "yyyy-MM-dd")} value={admissao ? format(admissao, "yyyy-MM-dd") : ""} onChange={e => setAdmissao(e.target.value ? new Date(`${e.target.value}T12:00:00`) : undefined)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rescisao-demissao">Data de saída</Label>
          <Input id="rescisao-demissao" className="h-11" type="date" min="1970-01-01" value={demissao ? format(demissao, "yyyy-MM-dd") : ""} onChange={e => setDemissao(e.target.value ? new Date(`${e.target.value}T12:00:00`) : undefined)} />
        </div>
        <div className="space-y-2"><Label htmlFor="rescisao-horas-extras">Média de Horas Extras Mensais (R$)</Label><Input id="rescisao-horas-extras" className="h-11" type="number" inputMode="decimal" placeholder="0" value={horasExtras} onChange={e => setHorasExtras(e.target.value)} /></div>
        <div className="space-y-4">
          <div className="flex items-center gap-3"><Switch id="rescisao-comissoes" checked={possuiComissoes} onCheckedChange={setPossuiComissoes} /><Label htmlFor="rescisao-comissoes">Possui comissões?</Label></div>
          {possuiComissoes && (<div className="space-y-2"><Label htmlFor="rescisao-comissoes-valor">Média Mensal de Comissões (R$)</Label><Input id="rescisao-comissoes-valor" className="h-11" type="number" inputMode="decimal" placeholder="0" value={comissoes} onChange={e => setComissoes(e.target.value)} /></div>)}
        </div>
        <div className="space-y-2"><Label htmlFor="rescisao-ferias-vencidas">Períodos de férias vencidas não gozadas</Label><Input id="rescisao-ferias-vencidas" className="h-11" type="number" inputMode="numeric" min={0} max={5} value={periodosVencidos} onChange={e => setPeriodosVencidos(e.target.value)} /></div>
        <div className="space-y-4 sm:col-span-2">
          <div className="flex items-center gap-3"><Switch id="rescisao-fgts" checked={possuiFgts} onCheckedChange={setPossuiFgts} /><Label htmlFor="rescisao-fgts">Possui saldo de FGTS?</Label></div>
          {possuiFgts && (<div className="space-y-2 max-w-xs"><Label htmlFor="rescisao-fgts-saldo">Saldo Estimado do FGTS (R$)</Label><Input id="rescisao-fgts-saldo" className="h-11" type="number" inputMode="decimal" placeholder="15000" value={saldoFgts} onChange={e => setSaldoFgts(e.target.value)} /></div>)}
        </div>
      </div>

      <Button onClick={calcular} className="h-11 w-full sm:w-auto">Calcular Rescisão</Button>

      {verbas && (
        <div className="space-y-4">
          <div className="rounded-lg border border-cream-dark bg-white">
            <div className="p-5">
              <Table>
                <TableHeader><TableRow><TableHead>Verba</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                <TableBody>
                  {verbas.map((v) => (<TableRow key={v.label}><TableCell><div>{v.label}</div><div className="text-note text-navy/60">{v.formula}</div></TableCell><TableCell className="text-right font-medium tabular align-top">{fmt(v.valor)}</TableCell></TableRow>))}
                  <TableRow className="border-t-2"><TableCell className="text-base ">Total bruto estimado</TableCell><TableCell className="text-right text-base text-navy tabular">{fmt(total)}</TableCell></TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="rounded-lg border border-cream-dark bg-white">
            <div className="p-5 space-y-2">
              <h3 className="text-h3 text-navy">Depósitos na conta do FGTS</h3>
              <p className="text-note text-navy/60">Não entram no total acima: são depositados na conta vinculada do trabalhador.</p>
              <Table>
                <TableBody>
                  {res!.fgts.map((v) => (<TableRow key={v.label}><TableCell><div>{v.label}</div><div className="text-note text-navy/60">{v.formula}</div></TableCell><TableCell className="text-right font-medium tabular align-top">{fmt(v.valor)}</TableCell></TableRow>))}
                </TableBody>
              </Table>
              {res!.saldoFgtsEstimado && (<p className="text-note text-navy/70">Saldo do FGTS estimado pelos meses trabalhados. Informe o saldo real do extrato para um valor mais preciso.</p>)}
            </div>
          </div>
          <p className="text-note text-navy/60">Valores brutos, sem desconto de INSS e IRRF. Aviso prévio projetado até {format(res!.dataProjetada, "dd/MM/yyyy")} (art. 487, § 1º, da CLT).</p>
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <Button onClick={() => requireAccount(gerarPDF, "baixar o relatório em PDF")} variant="outline" className="gap-2">Gerar Relatório PDF</Button>
            <UsarNaPeticaoButton
              size="default"
              label={`Gerar petição com estas verbas (${fmt(total)})`}
              payload={{
                valor: total,
                tipoAcao: "Reclamação trabalhista",
                varaJuizo: "Trabalho",
                origem: "calculadora de rescisão trabalhista",
                fatos: [
                  `Contrato de trabalho de ${admissao ? format(admissao, "dd/MM/yyyy") : ""} a ${demissao ? format(demissao, "dd/MM/yyyy") : ""}.`,
                  `Modalidade de rescisão: ${TIPO_LABEL[tipo]}.`,
                  `Salário informado: ${fmt(parseFloat(salario) || 0)}.`,
                  `Verbas apuradas: ${verbas.map(v => `${v.label} ${fmt(v.valor)}`).join(", ")}.`,
                ].join(" "),
                pedidos: `Pagamento das verbas rescisórias no total estimado de ${fmt(total)}, conforme demonstrativo em anexo: ${verbas
                  .map(v => `${v.label} ${fmt(v.valor)}`)
                  .join(", ")}.`,
              }}
            />
          </div>
          <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-50  p-3 text-sm text-yellow-800 ">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /><span>Cálculo estimado. Consulte um advogado trabalhista para valores exatos.</span>
          </div>
        </div>
      )}
    </div>
  );
}
