import { CalculatorLanding } from "@/components/calculators/CalculatorLanding";
import { CpfCnpjCalc } from "@/components/calculators/CpfCnpjCalc";

export default function CpfCnpjLanding() {
  return (
    <CalculatorLanding
      title="Validador de CPF e CNPJ"
      description="Verifique rapidamente se os dígitos verificadores de CPF ou CNPJ estão corretos. Ferramenta prática para advogados, escritórios e análise de documentos."
      path="/calculadoras/validador-cpf-cnpj"
      keywords={[
        "validar CPF",
        "validar CNPJ",
        "dígitos verificadores",
        "consulta CPF",
        "consulta CNPJ",
      ]}
      features={[
        "Algoritmo oficial de validação",
        "Formatação automática",
        "CPF e CNPJ no mesmo lugar",
        "Cópia rápida para a área de transferência",
        "Sem consulta à Receita Federal — privacidade garantida",
      ]}
    >
      <CpfCnpjCalc />
    </CalculatorLanding>
  );
}
