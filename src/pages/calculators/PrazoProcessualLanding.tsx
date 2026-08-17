import { CalculatorLanding } from "@/components/calculators/CalculatorLanding";
import { PrazoCalc } from "@/components/calculators/PrazoCalc";

export default function PrazoProcessualLanding() {
  return (
    <CalculatorLanding
      title="Calculadora de Prazo Processual"
      description="Calcule prazos processuais em dias úteis ou corridos considerando feriados nacionais, estaduais e municipais, suspensões forenses, recesso de final de ano e a distinção entre disponibilização no DJe e publicação."
      path="/calculadoras/prazo-processual"
      keywords={[
        "prazo processual",
        "dias úteis",
        "feriados judiciais",
        "recesso forense",
        "publicação DJe",
        "CPC art. 219",
      ]}
      features={[
        "Feriados nacionais, estaduais e municipais",
        "Suspensões forenses por tribunal",
        "Recesso forense 20/12 a 20/01",
        "Distinção disponibilização × publicação",
        "Exportação .ics para o calendário",
      ]}
    >
      <PrazoCalc />
    </CalculatorLanding>
  );
}
