import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { RescisaoCalc } from "@/components/calculators/RescisaoCalc";
import { PensaoCalc } from "@/components/calculators/PensaoCalc";
import { PrazoCalc } from "@/components/calculators/PrazoCalc";
import { CorrecaoCalc } from "@/components/calculators/CorrecaoCalc";
import { CpfCnpjCalc } from "@/components/calculators/CpfCnpjCalc";
import { DateCalc } from "@/components/calculators/DateCalc";
import { CustasCalc } from "@/components/calculators/CustasCalc";
import { AppFooter } from "@/components/AppFooter";
import { Briefcase, HeartHandshake, TrendingUp, CalendarClock, Scale, ShieldCheck, CalendarDays } from "lucide-react";

type CalculatorType = null | "rescisao" | "pensao" | "prazo" | "correcao" | "cpfcnpj" | "datas" | "custas";

const mainCalculators = [
  { id: "rescisao" as const, title: "Rescisão trabalhista", desc: "Verbas rescisórias: saldo de salário, férias, 13º, aviso prévio e FGTS.", icon: Briefcase },
  { id: "pensao" as const, title: "Pensão alimentícia", desc: "Estimativa do valor mensal com base na renda informada.", icon: HeartHandshake },
  { id: "correcao" as const, title: "Correção monetária e juros", desc: "Atualização por índices oficiais do Banco Central e juros da Lei 14.905/2024.", icon: TrendingUp },
  { id: "prazo" as const, title: "Prazo processual", desc: "Contagem em dias úteis ou corridos, com feriados oficiais e recesso forense.", icon: CalendarClock },
  { id: "custas" as const, title: "Custas processuais no TJSP", desc: "Taxa judiciária com UFESP, piso, teto e isenções, com base legal.", icon: Scale },
  { id: "cpfcnpj" as const, title: "Validador de CPF e CNPJ", desc: "Conferência dos dígitos verificadores, sem consulta à Receita Federal.", icon: ShieldCheck },
  { id: "datas" as const, title: "Operações com datas", desc: "Soma de dias, diferença entre datas e informações sobre a data escolhida.", icon: CalendarDays },
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
    <div className="min-h-screen bg-cream text-navy">
      <AppHeader />
      <SEO title="Calculadoras Jurídicas | Honorífico" description="Sete ferramentas grátis do Honorífico: custas processuais do TJSP, correção monetária e juros (Lei 14.905/2024), prazos processuais, rescisão trabalhista, pensão alimentícia, validador de CPF/CNPJ e operações com datas." path="/calculadoras" />
      <main className="container px-4 py-12 sm:px-6 md:py-16">
        <div className="max-w-[60ch] space-y-4">
          <h1 className="text-h1 text-navy">Calculadoras jurídicas</h1>
          <p className="text-body-serif text-navy/80">
            O cálculo é livre, sem conta. Todo resultado vem com memória de cálculo ou com a lista
            dos dias descartados, para conferência e anexo ao processo.
          </p>
        </div>

        {!active && (
          <section className="mt-10">
            <h2 className="text-h2 text-navy">Escolha uma calculadora</h2>
            <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mainCalculators.map(c => {
                const Icon = c.icon;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setActive(c.id)}
                      className="flex h-full w-full flex-col items-start rounded-lg border border-cream-dark bg-white p-5 text-left transition-colors hover:border-gold/60"
                    >
                      <span className="inline-flex items-center justify-center rounded-md bg-cream p-2.5 text-gold">
                        <Icon className="h-6 w-6" strokeWidth={1.5} />
                      </span>
                      <span className="mt-4 text-h3 text-navy">{c.title}</span>
                      <span className="mt-1 text-sm leading-relaxed text-navy/70">{c.desc}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {active && activeInfo && (
          <div className="mt-10 space-y-6">
            <Button variant="ghost" size="sm" onClick={() => setActive(null)}>
              Voltar às calculadoras
            </Button>
            <section className="rounded-lg border border-cream-dark bg-white p-5 sm:p-6">
              <h2 className="text-h3 text-navy">{activeInfo.title}</h2>
              <div className="mt-5">{ActiveCalc && <ActiveCalc />}</div>
            </section>
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
