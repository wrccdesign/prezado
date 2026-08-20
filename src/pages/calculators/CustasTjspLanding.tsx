import { CalculatorLanding } from "@/components/calculators/CalculatorLanding";
import { CustasCalc } from "@/components/calculators/CustasCalc";

export default function CustasTjspLanding() {
  return (
    <CalculatorLanding
      title="Calculadora de Custas Processuais do TJSP"
      description="Calcule a taxa judiciária do TJSP com a regra vigente na data do ato, a UFESP correta, piso de 5 e teto de 3.000 UFESPs, isenções e litisconsórcio — com memória de cálculo e base legal."
      path="/calculadoras/custas-tjsp"
      keywords={[
        "custas processuais TJSP",
        "taxa judiciária",
        "UFESP",
        "DARE-SP",
        "preparo de apelação",
        "Lei 11.608/2003",
      ]}
      features={[
        "Regra vigente na data do ato (1% até 02/01/2024, 1,5% depois)",
        "UFESP do primeiro dia do mês do recolhimento",
        "Piso de 5 e teto de 3.000 UFESPs",
        "Isenções legais fundamentadas",
        "Memória de cálculo exportável em PDF e Word",
      ]}
    >
      <CustasCalc />
    </CalculatorLanding>
  );
}
