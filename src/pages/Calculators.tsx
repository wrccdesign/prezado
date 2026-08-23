import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase, Users, Calendar, DollarSign, ShieldCheck, CalendarClock, Scale } from "lucide-react";
import { RescisaoCalc } from "@/components/calculators/RescisaoCalc";
import { PensaoCalc } from "@/components/calculators/PensaoCalc";
import { PrazoCalc } from "@/components/calculators/PrazoCalc";
import { CorrecaoCalc } from "@/components/calculators/CorrecaoCalc";
import { CpfCnpjCalc } from "@/components/calculators/CpfCnpjCalc";
import { DateCalc } from "@/components/calculators/DateCalc";
import { CustasCalc } from "@/components/calculators/CustasCalc";
import { AppFooter } from "@/components/AppFooter";

type CalculatorType = null | "rescisao" | "pensao" | "prazo" | "correcao" | "cpfcnpj" | "datas" | "custas";

const mainCalculators = [
  { id: "rescisao" as const, title: "Rescisão Trabalhista", icon: Briefcase, desc: "Calcule verbas rescisórias: saldo de salário, férias, 13º, aviso prévio e FGTS." },
  { id: "pensao" as const, title: "Pensão Alimentícia", icon: Users, desc: "Estime o valor mensal de pensão alimentícia com base na renda." },
  { id: "correcao" as const, title: "Correção Monetária e Juros", icon: DollarSign, desc: "Atualize valores com índices oficiais do Banco Central e juros da Lei 14.905/2024." },
  { id: "prazo" as const, title: "Prazo Processual", icon: Calendar, desc: "Calcule prazos em dias úteis ou corridos com feriados oficiais e recesso forense." },
  { id: "custas" as const, title: "Custas Processuais (TJSP)", icon: Scale, desc: "Calcule a taxa judiciária do TJSP com UFESP, piso, teto e isenções, com base legal." },
  { id: "cpfcnpj" as const, title: "Validador CPF/CNPJ", icon: ShieldCheck, desc: "Verifique a validade dos dígitos verificadores de CPF e CNPJ." },
  { id: "datas" as const, title: "Operações com Datas", icon: CalendarClock, desc: "Some dias, calcule diferenças e obtenha informações sobre datas." },
];

const calcComponents: Record<string, () => JSX.Element> = {
  rescisao: RescisaoCalc,
  pensao: PensaoCalc,
  prazo: PrazoCalc,
  correcao: CorrecaoCalc,
  cpfcnpj: CpfCnpjCalc,
  datas: DateCalc,
  custas: CustasCalc,
};


export default function Calculators() {
  const [active, setActive] = useState<CalculatorType>(null);

  const ActiveCalc = active ? calcComponents[active] : null;
  const activeInfo = active ? mainCalculators.find(c => c.id === active) : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <SEO title="Calculadoras Jurídicas — Honorífico" description="Sete ferramentas grátis do Honorífico: custas processuais do TJSP, correção monetária e juros (Lei 14.905/2024), prazos processuais, rescisão trabalhista, pensão alimentícia, validador de CPF/CNPJ e operações com datas." path="/calculadoras" />
      <main className="container py-6 sm:py-8 px-4 sm:px-6 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">Calculadoras Jurídicas</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Ferramentas de cálculo para auxiliar na prática jurídica.</p>
        </div>

        {!active && (
          <>
          <h2 className="text-lg sm:text-xl font-semibold font-serif text-foreground">Escolha uma calculadora</h2>
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
                  <CardTitle className="text-sm sm:text-base">{c.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">{c.desc}</p>
                </CardContent>
              </Card>
            ))}
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
                <h2 className="flex items-center gap-2 text-xl font-semibold leading-none tracking-tight">
                  {activeInfo.title}
                </h2>
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