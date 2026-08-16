import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase, Users, Calendar, DollarSign } from "lucide-react";
import { RescisaoCalc } from "@/components/calculators/RescisaoCalc";
import { PensaoCalc } from "@/components/calculators/PensaoCalc";
import { PrazoCalc } from "@/components/calculators/PrazoCalc";
import { CorrecaoCalc } from "@/components/calculators/CorrecaoCalc";
import { AppFooter } from "@/components/AppFooter";

type CalculatorType = null | "rescisao" | "pensao" | "prazo" | "correcao";

const mainCalculators = [
  { id: "rescisao" as const, title: "Rescisão Trabalhista", icon: Briefcase, desc: "Calcule verbas rescisórias: saldo de salário, férias, 13º, aviso prévio e FGTS." },
  { id: "pensao" as const, title: "Pensão Alimentícia", icon: Users, desc: "Estime o valor mensal de pensão alimentícia com base na renda." },
  { id: "correcao" as const, title: "Correção Monetária e Juros", icon: DollarSign, desc: "Atualize valores com índices oficiais do Banco Central e juros da Lei 14.905/2024." },
  { id: "prazo" as const, title: "Prazo Processual", icon: Calendar, desc: "Calcule prazos em dias úteis ou corridos com feriados oficiais e recesso forense." },
];

const calcComponents: Record<string, () => JSX.Element> = {
  rescisao: RescisaoCalc,
  pensao: PensaoCalc,
  prazo: PrazoCalc,
  correcao: CorrecaoCalc,
};

export default function Calculators() {
  const [active, setActive] = useState<CalculatorType>(null);

  const ActiveCalc = active ? calcComponents[active] : null;
  const activeInfo = active ? mainCalculators.find(c => c.id === active) : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <SEO title="Calculadoras Jurídicas — Prezado AI" description="Rescisão trabalhista, pensão alimentícia, correção monetária e prazos processuais. Ferramentas grátis do Prezado.ai." path="/calculadoras" />
      <main className="container py-6 sm:py-8 px-4 sm:px-6 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">Calculadoras Jurídicas</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Ferramentas de cálculo para auxiliar na prática jurídica.</p>
        </div>

        {!active && (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
        )}

        {active && activeInfo && (
          <div className="space-y-6">
            <Button variant="ghost" size="sm" onClick={() => setActive(null)}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar às calculadoras
            </Button>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {activeInfo.title}
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