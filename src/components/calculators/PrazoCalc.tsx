import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, AlertTriangle, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const PRAZOS_TIPO = [
  { id: "contestacao", label: "Contestação", dias: 15 },
  { id: "apelacao", label: "Recurso de Apelação", dias: 15 },
  { id: "embargos", label: "Embargos de Declaração", dias: 5 },
  { id: "agravo", label: "Agravo de Instrumento", dias: 15 },
  { id: "especial", label: "Recurso Especial/Extraordinário", dias: 15 },
  { id: "personalizado", label: "Prazo personalizado", dias: 0 },
];

const TRIBUNAIS = [
  { id: "tjsp", label: "TJSP" }, { id: "tjrj", label: "TJRJ" },
  { id: "stj", label: "STJ" }, { id: "stf", label: "STF" },
  { id: "trt", label: "TRT" }, { id: "outro", label: "Outro" },
];

function getFeriadosNacionais(ano: number): { date: Date; nome: string }[] {
  const fixos = [
    { m: 0, d: 1, nome: "Confraternização Universal" }, { m: 3, d: 21, nome: "Tiradentes" },
    { m: 4, d: 1, nome: "Dia do Trabalhador" }, { m: 8, d: 7, nome: "Independência do Brasil" },
    { m: 9, d: 12, nome: "Nossa Sra. Aparecida" }, { m: 10, d: 2, nome: "Finados" },
    { m: 10, d: 15, nome: "Proclamação da República" }, { m: 10, d: 20, nome: "Dia da Consciência Negra" },
    { m: 11, d: 25, nome: "Natal" },
  ];
  const a = ano % 19; const b = Math.floor(ano / 100); const c = ano % 100;
  const d = Math.floor(b / 4); const e = b % 4; const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3); const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4); const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  const pascoa = new Date(ano, mes, dia);
  const moveis = [
    { offset: -48, nome: "Segunda-feira de Carnaval" }, { offset: -47, nome: "Terça-feira de Carnaval" },
    { offset: -2, nome: "Sexta-feira Santa" }, { offset: 60, nome: "Corpus Christi" },
  ];
  const feriados = fixos.map(f => ({ date: new Date(ano, f.m, f.d), nome: f.nome }));
  moveis.forEach(mv => { const d = new Date(pascoa); d.setDate(d.getDate() + mv.offset); feriados.push({ date: d, nome: mv.nome }); });
  return feriados;
}

function isFeriado(date: Date, feriados: { date: Date; nome: string }[]): { is: boolean; nome?: string } {
  for (const f of feriados) {
    if (f.date.getFullYear() === date.getFullYear() && f.date.getMonth() === date.getMonth() && f.date.getDate() === date.getDate()) return { is: true, nome: f.nome };
  }
  return { is: false };
}

function isDiaUtil(date: Date, feriados: { date: Date; nome: string }[]): boolean {
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return false;
  return !isFeriado(date, feriados).is;
}

interface Resultado { dataVencimento: Date; diasRestantes: number; feriadosNoPeriodo: { date: Date; nome: string }[]; }

function gerarICS(dataIntimacao: Date, dataVencimento: Date, tipoPrazo: string, tribunal: string): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const toICSDate = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Prezado.ai//Prazo Processual//PT", "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${toICSDate(dataVencimento)}`,
    `DTEND;VALUE=DATE:${toICSDate(new Date(dataVencimento.getTime() + 86400000))}`,
    `DTSTAMP:${stamp}`, `UID:prezado-prazo-${stamp}@prezado.ai`,
    `SUMMARY:⚖️ Vencimento: ${tipoPrazo} (${tribunal})`,
    `DESCRIPTION:Prazo processual gerado pelo Prezado.ai.\\\\\\nIntimação: ${format(dataIntimacao, "dd/MM/yyyy")}\\\\\\\\nVencimento: ${format(dataVencimento, "dd/MM/yyyy")}\\\\\\\\nTribunal: ${tribunal}\\\\\\\\n\\\\\\\\nSempre confirme no sistema do tribunal.`,
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Prazo processual vence amanhã!", "END:VALARM",
    "BEGIN:VALARM", "TRIGGER:-P3D", "ACTION:DISPLAY", "DESCRIPTION:Prazo processual vence em 3 dias!", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export function PrazoCalc() {
  const [dataIntimacao, setDataIntimacao] = useState<Date>();
  const [tipoPrazo, setTipoPrazo] = useState("contestacao");
  const [diasPersonalizado, setDiasPersonalizado] = useState("");
  const [tribunal, setTribunal] = useState("tjsp");
  const [diasUteis, setDiasUteis] = useState(true);
  const [result, setResult] = useState<Resultado | null>(null);

  const prazoSelecionado = PRAZOS_TIPO.find(p => p.id === tipoPrazo);
  const diasPrazo = tipoPrazo === "personalizado" ? (parseInt(diasPersonalizado) || 0) : (prazoSelecionado?.dias || 0);

  const calcular = () => {
    if (!dataIntimacao || !diasPrazo) return;
    const anosRelevantes = new Set([dataIntimacao.getFullYear(), dataIntimacao.getFullYear() + 1]);
    const feriados = [...anosRelevantes].flatMap(a => getFeriadosNacionais(a));
    let date = new Date(dataIntimacao);
    date.setDate(date.getDate() + 1);
    if (diasUteis) { while (!isDiaUtil(date, feriados)) date.setDate(date.getDate() + 1); }
    const inicioContagem = new Date(date);
    if (diasUteis) {
      let counted = 0;
      while (counted < diasPrazo) { if (isDiaUtil(date, feriados)) counted++; if (counted < diasPrazo) date.setDate(date.getDate() + 1); }
    } else { date.setDate(date.getDate() + diasPrazo - 1); }
    if (diasUteis) { while (!isDiaUtil(date, feriados)) date.setDate(date.getDate() + 1); }
    const feriadosNoPeriodo = feriados.filter(f => f.date >= inicioContagem && f.date <= date && f.date.getDay() !== 0 && f.date.getDay() !== 6);
    setResult({ dataVencimento: date, diasRestantes: differenceInCalendarDays(date, new Date()), feriadosNoPeriodo });
  };

  const baixarICS = () => {
    if (!result || !dataIntimacao) return;
    const tribunalLabel = TRIBUNAIS.find(t => t.id === tribunal)?.label || tribunal;
    const prazoLabel = prazoSelecionado?.label || "Prazo personalizado";
    const ics = gerarICS(dataIntimacao, result.dataVencimento, prazoLabel, tribunalLabel);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `prazo-${format(result.dataVencimento, "yyyy-MM-dd")}.ics`; a.click(); URL.revokeObjectURL(url);
  };

  const corPrazo = result ? result.diasRestantes < 0 ? "text-destructive" : result.diasRestantes <= 3 ? "text-destructive" : result.diasRestantes <= 7 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400" : "";
  const bgPrazo = result ? result.diasRestantes < 0 ? "border-destructive/30 bg-destructive/5" : result.diasRestantes <= 3 ? "border-destructive/30 bg-destructive/5" : result.diasRestantes <= 7 ? "border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20" : "border-green-500/30 bg-green-50 dark:bg-green-950/20" : "";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Data da Intimação/Publicação</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataIntimacao && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataIntimacao ? format(dataIntimacao, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dataIntimacao}
                onSelect={setDataIntimacao}
                initialFocus
                className="p-3 pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>Tipo de Prazo</Label>
          <Select value={tipoPrazo} onValueChange={setTipoPrazo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRAZOS_TIPO.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                  {p.dias > 0 ? ` (${p.dias} dias)` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {tipoPrazo === "personalizado" && (
          <div className="space-y-2">
            <Label>Prazo em dias</Label>
            <Input
              type="number"
              min={1}
              placeholder="Ex: 10"
              value={diasPersonalizado}
              onChange={e => setDiasPersonalizado(e.target.value)}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Tribunal</Label>
          <Select value={tribunal} onValueChange={setTribunal}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRIBUNAIS.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Contar em dias úteis? (CPC art. 219)</Label>
          <div className="flex items-center gap-3 pt-1">
            <Switch checked={diasUteis} onCheckedChange={setDiasUteis} />
            <span className="text-sm text-muted-foreground">
              {diasUteis ? "Sim — dias úteis" : "Não — dias corridos"}
            </span>
          </div>
        </div>
      </div>

      <Button onClick={calcular} className="w-full sm:w-auto" disabled={!dataIntimacao || !diasPrazo}>Calcular Prazo</Button>

      {result && (
        <div className="space-y-4">
          <Card className={bgPrazo}>
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm text-muted-foreground">Data de vencimento do prazo:</p>
              <p className={cn("text-2xl font-bold capitalize", corPrazo)}>
                {format(result.dataVencimento, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <div className={cn("text-sm font-medium", corPrazo)}>
                {result.diasRestantes < 0 ? `⚠️ Prazo vencido há ${Math.abs(result.diasRestantes)} dia(s)!` : result.diasRestantes === 0 ? "⚠️ O prazo vence HOJE!" : `⏳ Faltam ${result.diasRestantes} dia(s) corridos para o vencimento`}
              </div>
              <Button variant="outline" size="sm" onClick={baixarICS} className="mt-2">
                <Download className="mr-1.5 h-4 w-4" />
                Adicionar ao calendário (.ics)
              </Button>
            </CardContent>
          </Card>

          {result.feriadosNoPeriodo.length > 0 && (
            <Card className="border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="pt-6">
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                  🗓️ Feriados nacionais no período do prazo:
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Feriado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.feriadosNoPeriodo.map((f, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {format(f.date, "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{f.nome}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card className="border-muted">
            <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">📖 Base Legal — CPC Art. 219 e 224</p>
              <p><strong>Art. 219:</strong> Na contagem de prazo em dias, computar-se-ão somente os dias úteis.</p>
              <p><strong>Art. 224 §1º:</strong> Exclui-se o dia do começo e inclui-se o do vencimento.</p>
              <p><strong>Art. 224 §2º:</strong> Prazos prorrogados até o primeiro dia útil seguinte quando o vencimento cair em dia sem expediente.</p>
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20 p-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">Sempre confirme os prazos no sistema do tribunal. Feriados locais e suspensões podem alterar o resultado.</p>
          </div>
        </div>
      )}
    </div>
  );
}
