import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, AlertTriangle, FileDown } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type TipoDemissao = "sem_justa_causa" | "com_justa_causa" | "pedido_demissao" | "acordo_mutuo";

interface Verba { label: string; valor: number; }

export function RescisaoCalc() {
  const [salario, setSalario] = useState("");
  const [admissao, setAdmissao] = useState<Date>();
  const [demissao, setDemissao] = useState<Date>();
  const [tipo, setTipo] = useState<TipoDemissao>("sem_justa_causa");
  const [possuiFgts, setPossuiFgts] = useState(false);
  const [saldoFgts, setSaldoFgts] = useState("");
  const [horasExtras, setHorasExtras] = useState("");
  const [possuiComissoes, setPossuiComissoes] = useState(false);
  const [comissoes, setComissoes] = useState("");
  const [verbas, setVerbas] = useState<Verba[] | null>(null);

  const calcular = () => {
    const sal = parseFloat(salario) || 0;
    if (!sal || !admissao || !demissao) { toast.error("Preencha salário, data de admissão e demissão."); return; }
    if (demissao <= admissao) { toast.error("A data de demissão deve ser posterior à admissão."); return; }

    const he = parseFloat(horasExtras) || 0;
    const com = possuiComissoes ? (parseFloat(comissoes) || 0) : 0;
    const remuneracao = sal + he + com;
    const diffMs = demissao.getTime() - admissao.getTime();
    const totalDays = diffMs / (1000 * 60 * 60 * 24);
    const anosCompletos = Math.floor(totalDays / 365);
    const diasTrabMes = demissao.getDate();
    const saldoSalario = (remuneracao / 30) * diasTrabMes;

    let avisoPrevio = 0;
    if (tipo === "sem_justa_causa") { avisoPrevio = (remuneracao / 30) * Math.min(30 + anosCompletos * 3, 90); }
    else if (tipo === "acordo_mutuo") { avisoPrevio = ((remuneracao / 30) * Math.min(30 + anosCompletos * 3, 90)) / 2; }

    const meses13 = demissao.getMonth() + 1;
    let decimoTerceiro = tipo !== "com_justa_causa" ? (remuneracao / 12) * meses13 : 0;

    const totalMonths = Math.floor(totalDays / 30);
    const mesesFerias = totalMonths % 12;
    let feriasProporcionais = 0, tercoFeriasProporcionais = 0;
    if (tipo !== "com_justa_causa") { feriasProporcionais = (remuneracao / 12) * mesesFerias; tercoFeriasProporcionais = feriasProporcionais / 3; }

    const periodosCompletos = Math.floor(totalMonths / 12);
    let feriasVencidas = 0, tercoFeriasVencidas = 0;
    if (periodosCompletos >= 1) { feriasVencidas = remuneracao; tercoFeriasVencidas = remuneracao / 3; }

    const fgtsMes = remuneracao * 0.08;
    const fgts = possuiFgts ? (parseFloat(saldoFgts) || 0) : 0;
    let multaFgts = 0;
    if (tipo === "sem_justa_causa") multaFgts = (fgts + fgtsMes) * 0.4;
    else if (tipo === "acordo_mutuo") multaFgts = (fgts + fgtsMes) * 0.2;

    setVerbas([
      { label: "Saldo de Salário", valor: saldoSalario },
      { label: "Aviso Prévio Indenizado", valor: avisoPrevio },
      { label: "13º Salário Proporcional", valor: decimoTerceiro },
      { label: "Férias Proporcionais", valor: feriasProporcionais },
      { label: "1/3 Férias Proporcionais", valor: tercoFeriasProporcionais },
      { label: "Férias Vencidas", valor: feriasVencidas },
      { label: "1/3 Férias Vencidas", valor: tercoFeriasVencidas },
      { label: "FGTS do Mês da Rescisão", valor: fgtsMes },
      { label: "Multa FGTS", valor: multaFgts },
    ]);
  };

  const total = verbas ? verbas.reduce((a, b) => a + b.valor, 0) : 0;

  const gerarPDF = () => {
    if (!verbas) return;
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("Relatório de Rescisão Trabalhista — Prezado.ai", 14, 20);
    doc.setFontSize(10); doc.text(`Data: ${format(new Date(), "dd/MM/yyyy")}`, 14, 28);
    if (admissao) doc.text(`Admissão: ${format(admissao, "dd/MM/yyyy")}`, 14, 34);
    if (demissao) doc.text(`Demissão: ${format(demissao, "dd/MM/yyyy")}`, 14, 40);
    doc.text(`Tipo: ${tipo.replace(/_/g, " ")}`, 14, 46);

    let y = 56;
    doc.setFontSize(11); doc.text("Verba", 14, y); doc.text("Valor (R$)", 140, y);
    y += 2; doc.line(14, y, 196, y); y += 6;
    doc.setFontSize(10);
    verbas.forEach((v) => { doc.text(v.label, 14, y); doc.text(fmt(v.valor), 140, y); y += 7; });
    y += 2; doc.line(14, y, 196, y); y += 7;
    doc.setFontSize(12); doc.text("TOTAL ESTIMADO", 14, y); doc.text(fmt(total), 140, y);
    y += 14; doc.setFontSize(8); doc.text("Cálculo estimado. Consulte um advogado trabalhista para valores exatos.", 14, y);

    doc.save("rescisao-trabalhista-prezado.pdf");
    toast.success("PDF gerado com sucesso!");
  };

  const tipoLabels: Record<TipoDemissao, string> = {
    sem_justa_causa: "Sem justa causa", com_justa_causa: "Com justa causa",
    pedido_demissao: "Pedido de demissão", acordo_mutuo: "Acordo mútuo (art. 484-A CLT)",
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Salário Bruto Mensal (R$)</Label><Input type="number" placeholder="5000" value={salario} onChange={e => setSalario(e.target.value)} /></div>
        <div className="space-y-2">
          <Label>Tipo de Demissão</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as TipoDemissao)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(tipoLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Data de Admissão</Label>
          <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !admissao && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{admissao ? format(admissao, "dd/MM/yyyy") : "Selecione a data"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={admissao} onSelect={setAdmissao} initialFocus className="p-3 pointer-events-auto" locale={ptBR} /></PopoverContent></Popover>
        </div>
        <div className="space-y-2">
          <Label>Data de Demissão</Label>
          <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !demissao && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{demissao ? format(demissao, "dd/MM/yyyy") : "Selecione a data"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={demissao} onSelect={setDemissao} initialFocus className="p-3 pointer-events-auto" locale={ptBR} /></PopoverContent></Popover>
        </div>
        <div className="space-y-2"><Label>Média de Horas Extras Mensais (R$)</Label><Input type="number" placeholder="0" value={horasExtras} onChange={e => setHorasExtras(e.target.value)} /></div>
        <div className="space-y-4">
          <div className="flex items-center gap-3"><Switch checked={possuiComissoes} onCheckedChange={setPossuiComissoes} /><Label>Possui comissões?</Label></div>
          {possuiComissoes && (<div className="space-y-2"><Label>Média Mensal de Comissões (R$)</Label><Input type="number" placeholder="0" value={comissoes} onChange={e => setComissoes(e.target.value)} /></div>)}
        </div>
        <div className="space-y-4 sm:col-span-2">
          <div className="flex items-center gap-3"><Switch checked={possuiFgts} onCheckedChange={setPossuiFgts} /><Label>Possui saldo de FGTS?</Label></div>
          {possuiFgts && (<div className="space-y-2 max-w-xs"><Label>Saldo Estimado do FGTS (R$)</Label><Input type="number" placeholder="15000" value={saldoFgts} onChange={e => setSaldoFgts(e.target.value)} /></div>)}
        </div>
      </div>

      <Button onClick={calcular} className="w-full sm:w-auto">Calcular Rescisão</Button>

      {verbas && (
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <Table>
                <TableHeader><TableRow><TableHead>Verba</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                <TableBody>
                  {verbas.map((v) => (<TableRow key={v.label}><TableCell>{v.label}</TableCell><TableCell className="text-right font-medium">{fmt(v.valor)}</TableCell></TableRow>))}
                  <TableRow className="border-t-2"><TableCell className="text-base font-bold">Total Líquido Estimado</TableCell><TableCell className="text-right text-base font-bold text-primary">{fmt(total)}</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <Button onClick={gerarPDF} variant="outline" className="gap-2"><FileDown className="h-4 w-4" /> Gerar Relatório PDF</Button>
          </div>
          <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20 p-3 text-sm text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /><span>Cálculo estimado. Consulte um advogado trabalhista para valores exatos.</span>
          </div>
        </div>
      )}
    </div>
  );
}
