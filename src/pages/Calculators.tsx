import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Briefcase, Users, Calendar, DollarSign } from "lucide-react";

type CalculatorType = null | "rescisao" | "pensao" | "prazo" | "correcao";

const calculators = [
  { id: "rescisao" as const, title: "Rescisão Trabalhista", icon: Briefcase, emoji: "💼", desc: "Calcule verbas rescisórias: saldo de salário, férias, 13º, aviso prévio e FGTS." },
  { id: "pensao" as const, title: "Pensão Alimentícia", icon: Users, emoji: "👨‍👩‍👧", desc: "Estime o valor mensal de pensão alimentícia com base na renda." },
  { id: "prazo" as const, title: "Prazo Processual", icon: Calendar, emoji: "📅", desc: "Calcule a data final de prazos em dias úteis ou corridos." },
  { id: "correcao" as const, title: "Correção Monetária e Juros", icon: DollarSign, emoji: "💰", desc: "Atualize valores com índices de correção e juros." },
];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ── Rescisão Trabalhista ──
function RescisaoCalc() {
  const [salario, setSalario] = useState("");
  const [admissao, setAdmissao] = useState("");
  const [demissao, setDemissao] = useState("");
  const [tipo, setTipo] = useState("sem_justa_causa");
  const [saldoFgts, setSaldoFgts] = useState("");
  const [result, setResult] = useState<Record<string, number> | null>(null);

  const calcular = () => {
    const sal = parseFloat(salario) || 0;
    const dAdm = new Date(admissao);
    const dDem = new Date(demissao);
    if (!sal || isNaN(dAdm.getTime()) || isNaN(dDem.getTime())) return;

    const diffMs = dDem.getTime() - dAdm.getTime();
    const totalDays = diffMs / (1000 * 60 * 60 * 24);
    const totalMonths = totalDays / 30;
    const anos = totalDays / 365;

    const diasTrabMes = dDem.getDate();
    const saldoSalario = (sal / 30) * diasTrabMes;

    const mesesFerias = totalMonths % 12;
    const feriasProporcionais = (sal / 12) * mesesFerias;
    const tercoFerias = feriasProporcionais / 3;

    const meses13 = dDem.getMonth() + 1;
    const decimoTerceiro = (sal / 12) * meses13;

    let avisoPrevio = 0;
    let multaFgts = 0;
    const fgts = parseFloat(saldoFgts) || 0;

    if (tipo === "sem_justa_causa") {
      const diasAviso = Math.min(30 + Math.floor(anos) * 3, 90);
      avisoPrevio = (sal / 30) * diasAviso;
      multaFgts = fgts * 0.4;
    } else if (tipo === "pedido_demissao") {
      // sem aviso prévio indenizado nem multa FGTS
    } else if (tipo === "acordo") {
      const diasAviso = Math.min(30 + Math.floor(anos) * 3, 90);
      avisoPrevio = ((sal / 30) * diasAviso) / 2;
      multaFgts = fgts * 0.2;
    }

    setResult({ saldoSalario, feriasProporcionais, tercoFerias, decimoTerceiro, avisoPrevio, multaFgts });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Salário Bruto (R$)</Label>
          <Input type="number" placeholder="5000" value={salario} onChange={e => setSalario(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Tipo de Demissão</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sem_justa_causa">Sem justa causa</SelectItem>
              <SelectItem value="pedido_demissao">Pedido de demissão</SelectItem>
              <SelectItem value="acordo">Acordo (reforma trabalhista)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Data de Admissão</Label>
          <Input type="date" value={admissao} onChange={e => setAdmissao(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Data de Demissão</Label>
          <Input type="date" value={demissao} onChange={e => setDemissao(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Saldo FGTS (R$)</Label>
          <Input type="number" placeholder="15000" value={saldoFgts} onChange={e => setSaldoFgts(e.target.value)} />
        </div>
      </div>
      <Button onClick={calcular} className="w-full sm:w-auto">Calcular Rescisão</Button>

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 space-y-2 text-sm">
            <div className="flex justify-between"><span>Saldo de Salário</span><span className="font-semibold">{fmt(result.saldoSalario)}</span></div>
            <div className="flex justify-between"><span>Férias Proporcionais</span><span className="font-semibold">{fmt(result.feriasProporcionais)}</span></div>
            <div className="flex justify-between"><span>1/3 de Férias</span><span className="font-semibold">{fmt(result.tercoFerias)}</span></div>
            <div className="flex justify-between"><span>13º Proporcional</span><span className="font-semibold">{fmt(result.decimoTerceiro)}</span></div>
            <div className="flex justify-between"><span>Aviso Prévio Indenizado</span><span className="font-semibold">{fmt(result.avisoPrevio)}</span></div>
            <div className="flex justify-between"><span>Multa FGTS</span><span className="font-semibold">{fmt(result.multaFgts)}</span></div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total Estimado</span>
              <span className="text-primary">{fmt(Object.values(result).reduce((a, b) => a + b, 0))}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Pensão Alimentícia ──
function PensaoCalc() {
  const [renda, setRenda] = useState("");
  const [filhos, setFilhos] = useState("1");
  const [percentual, setPercentual] = useState("30");
  const [result, setResult] = useState<{ porFilho: number; total: number } | null>(null);

  const calcular = () => {
    const r = parseFloat(renda) || 0;
    const f = parseInt(filhos) || 1;
    const p = parseFloat(percentual) || 30;
    const total = r * (p / 100);
    setResult({ total, porFilho: total / f });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Renda Líquida do Alimentante (R$)</Label>
          <Input type="number" placeholder="5000" value={renda} onChange={e => setRenda(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Número de Filhos</Label>
          <Input type="number" min={1} placeholder="1" value={filhos} onChange={e => setFilhos(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Percentual (%)</Label>
          <Input type="number" min={1} max={100} placeholder="30" value={percentual} onChange={e => setPercentual(e.target.value)} />
        </div>
      </div>
      <Button onClick={calcular} className="w-full sm:w-auto">Calcular Pensão</Button>

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 space-y-2 text-sm">
            <div className="flex justify-between"><span>Valor Total da Pensão</span><span className="font-semibold">{fmt(result.total)}</span></div>
            <div className="flex justify-between"><span>Valor por Filho</span><span className="font-semibold">{fmt(result.porFilho)}</span></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Prazo Processual ──
function PrazoCalc() {
  const [dataInicial, setDataInicial] = useState("");
  const [dias, setDias] = useState("");
  const [tipoDias, setTipoDias] = useState("uteis");
  const [result, setResult] = useState<string | null>(null);

  const calcular = () => {
    const d = new Date(dataInicial);
    const n = parseInt(dias) || 0;
    if (isNaN(d.getTime()) || !n) return;

    // Start counting from the next day
    let date = new Date(d);
    date.setDate(date.getDate() + 1);

    if (tipoDias === "corridos") {
      date.setDate(date.getDate() + n - 1);
    } else {
      let counted = 0;
      while (counted < n) {
        const dow = date.getDay();
        if (dow !== 0 && dow !== 6) {
          counted++;
        }
        if (counted < n) date.setDate(date.getDate() + 1);
      }
    }

    setResult(date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Data da Intimação/Publicação</Label>
          <Input type="date" value={dataInicial} onChange={e => setDataInicial(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Prazo (dias)</Label>
          <Input type="number" min={1} placeholder="15" value={dias} onChange={e => setDias(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Tipo de Dias</Label>
          <Select value={tipoDias} onValueChange={setTipoDias}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="uteis">Dias Úteis</SelectItem>
              <SelectItem value="corridos">Dias Corridos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={calcular} className="w-full sm:w-auto">Calcular Prazo</Button>

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Data final do prazo:</p>
            <p className="text-lg font-semibold capitalize text-primary">{result}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Correção Monetária ──
function CorrecaoCalc() {
  const [valor, setValor] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [indice, setIndice] = useState("ipca");
  const [juros, setJuros] = useState("1");
  const [result, setResult] = useState<{ corrigido: number; jurosVal: number; total: number } | null>(null);

  const calcular = () => {
    const v = parseFloat(valor) || 0;
    const di = new Date(dataInicio);
    const df = new Date(dataFim);
    if (!v || isNaN(di.getTime()) || isNaN(df.getTime())) return;

    const meses = Math.max(0, (df.getFullYear() - di.getFullYear()) * 12 + (df.getMonth() - di.getMonth()));

    // Simplified monthly rates
    const taxas: Record<string, number> = { ipca: 0.004, inpc: 0.0038, selic: 0.0087 };
    const taxaMensal = taxas[indice] || 0.004;
    const corrigido = v * Math.pow(1 + taxaMensal, meses);
    const jurosMensal = (parseFloat(juros) || 1) / 100;
    const jurosVal = corrigido * jurosMensal * meses;

    setResult({ corrigido, jurosVal, total: corrigido + jurosVal });
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
              <SelectItem value="ipca">IPCA</SelectItem>
              <SelectItem value="inpc">INPC</SelectItem>
              <SelectItem value="selic">Selic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Data Inicial</Label>
          <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Data Final</Label>
          <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Taxa de Juros Mensal (%)</Label>
          <Input type="number" step="0.1" placeholder="1" value={juros} onChange={e => setJuros(e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">⚠️ Cálculo simplificado com taxas médias estimadas. Para valores oficiais, consulte o BACEN.</p>
      <Button onClick={calcular} className="w-full sm:w-auto">Calcular Correção</Button>

      {result && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 space-y-2 text-sm">
            <div className="flex justify-between"><span>Valor Corrigido</span><span className="font-semibold">{fmt(result.corrigido)}</span></div>
            <div className="flex justify-between"><span>Juros</span><span className="font-semibold">{fmt(result.jurosVal)}</span></div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span className="text-primary">{fmt(result.total)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const calcComponents: Record<string, () => JSX.Element> = {
  rescisao: RescisaoCalc,
  pensao: PensaoCalc,
  prazo: PrazoCalc,
  correcao: CorrecaoCalc,
};

export default function Calculators() {
  const [active, setActive] = useState<CalculatorType>(null);

  const ActiveCalc = active ? calcComponents[active] : null;
  const activeInfo = active ? calculators.find(c => c.id === active) : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Calculadoras Jurídicas</h1>
          <p className="text-muted-foreground mt-1">Ferramentas de cálculo para auxiliar na prática jurídica.</p>
        </div>

        {!active && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {calculators.map(c => (
              <Card
                key={c.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/40 group"
                onClick={() => setActive(c.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <c.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-base">{c.emoji} {c.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {active && activeInfo && (
          <div className="space-y-6">
            <Button variant="ghost" size="sm" onClick={() => setActive(null)}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar às calculadoras
            </Button>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {activeInfo.emoji} {activeInfo.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ActiveCalc && <ActiveCalc />}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
