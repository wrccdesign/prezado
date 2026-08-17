import { CalculatorLanding } from "@/components/calculators/CalculatorLanding";
import { DateCalc } from "@/components/calculators/DateCalc";

export default function OperacoesDatasLanding() {
  return (
    <CalculatorLanding
      title="Operações com Datas"
      description="Some ou subtraia dias corridos ou úteis, calcule a diferença entre duas datas e descubra informações úteis sobre qualquer data. Ideal para prazos internos e cálculos de prazo fora do processo."
      path="/calculadoras/operacoes-datas"
      keywords={[
        "somar dias",
        "diferença entre datas",
        "dias úteis",
        "dias corridos",
        "calculadora de datas",
      ]}
      features={[
        "Soma/subtração em dias úteis ou corridos",
        "Diferença entre duas datas",
        "Identificação de dia útil ou fim de semana",
        "Interface simples e rápida",
        "Cópia do resultado",
      ]}
    >
      <DateCalc />
    </CalculatorLanding>
  );
}
