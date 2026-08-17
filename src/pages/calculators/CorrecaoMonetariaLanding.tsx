import { CalculatorLanding } from "@/components/calculators/CalculatorLanding";
import { CorrecaoCalc } from "@/components/calculators/CorrecaoCalc";

export default function CorrecaoMonetariaLanding() {
  return (
    <CalculatorLanding
      title="Calculadora de Correção Monetária e Juros"
      description="Atualize valores de condenação, dívidas e verbas com índices oficiais do Banco Central (IPCA, INPC, IGP-M, Selic e Taxa Legal) e juros conforme a Lei 14.905/2024."
      path="/calculadoras/correcao-monetaria-juros-lei-14905"
      keywords={[
        "correção monetária",
        "juros de mora",
        "Lei 14.905/2024",
        "IPCA",
        "Taxa Legal",
        "atualização de dívidas",
      ]}
      features={[
        "Índices oficiais do Banco Central",
        "Regime dual: até e a partir de 30/08/2024",
        "Memória de cálculo mês a mês",
        "Exportação em PDF e Word",
        "Pró-rata, multa e honorários",
      ]}
    >
      <CorrecaoCalc />
    </CalculatorLanding>
  );
}
