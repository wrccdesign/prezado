import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase, Users, Calendar, DollarSign, ChevronDown, ChevronUp, Info } from "lucide-react";
import { RescisaoCalc } from "@/components/calculators/RescisaoCalc";
import { PensaoCalc } from "@/components/calculators/PensaoCalc";
import { PrazoCalc } from "@/components/calculators/PrazoCalc";
import { AppFooter } from "@/components/AppFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CalculatorType = null | "rescisao" | "pensao" | "prazo" | "correcao";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

const mainCalculators = [
  { id: "rescisao" as const, title: "Rescisão Trabalhista", icon: Briefcase, emoji: "💼", desc: "Calcule verbas rescisórias: saldo de salário, férias, 13º, aviso prévio e FGTS." },
  { id: "pensao" as const, title: "Pensão Alimentícia", icon: Users, emoji: "👨‍👩‍👧", desc: "Estime o valor mensal de pensão alimentícia com base na renda." },
  { id: "correcao" as const, title: "Correção Monetária e Juros", icon: DollarSign, emoji: "💰", desc: "Atualize valores com índices de correção e juros." },
];

const calcComponents: Record<string, () => JSX.Element> = {
  rescisao: RescisaoCalc,
  pensao: PensaoCalc,
  prazo: PrazoCalc,
  correcao: CorrecaoCalc,
};

export default function Calculators() {
  const [active, setActive] = useState<CalculatorType>(null);
  const [prazoExpanded, setPrazoExpanded] = useState(false);

  const ActiveCalc = active ? calcComponents[active] : null;
  const activeInfo = active 
    ? [...mainCalculators, { id: "prazo" as const, title: "Prazo Processual", icon: Calendar, emoji: "📅", desc: "" }].find(c => c.id === active) 
    : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-6 sm:py-8 px-4 sm:px-6 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">Calculadoras Jurídicas</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Ferramentas de cálculo para auxiliar na prática jurídica.</p>
        </div>

        {!active && (
          <>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {mainCalculators.map(c => (
                <Card
                  key={c.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/40 group"
                  onClick={() => setActive(c.id)}
                >
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <c.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <CardTitle className="text-sm sm:text-base">{c.emoji} {c.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">{c.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Prazo Processual - Deprioritized / Collapsible */}
            <div className="border rounded-lg bg-muted/30">
              <button
                onClick={() => setPrazoExpanded(!prazoExpanded)}
                className="flex items-center gap-3 w-full p-4 text-left hover:bg-muted/50 transition-colors rounded-lg"
              >
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">📅 Prazo Processual</p>
                  <p className="text-xs text-muted-foreground/70">Calcule a data final de prazos em dias úteis ou corridos.</p>
                </div>
                {prazoExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {prazoExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-50 dark:bg-amber-950/20 p-3">
                    <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Os prazos processuais são exibidos automaticamente no sistema do tribunal após a intimação. 
                      Esta calculadora serve apenas como referência auxiliar.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActive("prazo")}
                    className="text-muted-foreground"
                  >
                    Abrir calculadora de prazo
                  </Button>
                </div>
              )}
            </div>
          </>
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
      <AppFooter />
    </div>
  );
}
