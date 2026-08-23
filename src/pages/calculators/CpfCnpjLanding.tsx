import { CalculatorLanding } from "@/components/calculators/CalculatorLanding";
import { CpfCnpjCalc } from "@/components/calculators/CpfCnpjCalc";

export default function CpfCnpjLanding() {
  return (
    <CalculatorLanding
      title="Validador de CPF e CNPJ"
      description="Verifique rapidamente se os dígitos verificadores de CPF ou CNPJ estão corretos. Ferramenta prática para advogados, escritórios e análise de documentos."
      path="/calculadoras/validador-cpf-cnpj"
      seoTitle="Validar CPF e CNPJ Online — Grátis e Sem Consulta na Receita"
      seoDescription="Confira em segundos se um CPF ou CNPJ tem dígitos verificadores válidos. Formatação automática, sem cadastro e sem enviar o número para a Receita Federal."
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
      content={
        <>
          <h2 className="text-xl font-semibold">O que a validação verifica</h2>
          <p>
            CPF e CNPJ terminam em dígitos verificadores calculados a partir dos números anteriores
            pelo algoritmo de módulo 11. A validação confirma se esses dígitos batem com o restante
            da sequência — é o mesmo teste que sistemas de tribunais e cartórios fazem antes de
            aceitar o documento em uma petição ou contrato.
          </p>
          <h2 className="text-xl font-semibold">O que ela não verifica</h2>
          <p>
            Um número matematicamente válido não significa que exista, esteja ativo ou pertença à
            pessoa indicada. A verificação de titularidade e situação cadastral só é possível nos
            portais oficiais da Receita Federal. Aqui o número é processado no seu navegador e não é
            enviado a nenhum órgão.
          </p>
        </>
      }
      faq={[
        {
          question: "Como saber se um CPF é válido?",
          answer:
            "Digite o número na calculadora: ela recalcula os dois dígitos verificadores pelo algoritmo de módulo 11 e indica na hora se a sequência é consistente. Sequências repetidas, como 111.111.111-11, são rejeitadas.",
        },
        {
          question: "A validação consulta a Receita Federal?",
          answer:
            "Não. A checagem é apenas matemática e nenhum dado é enviado a órgãos públicos, o que preserva o sigilo do documento do cliente.",
        },
        {
          question: "CPF válido significa CPF ativo?",
          answer:
            "Não. A validade dos dígitos não diz nada sobre a situação cadastral. Para saber se o CPF está regular, suspenso ou cancelado é preciso consultar o portal da Receita Federal.",
        },
      ]}
    >

    </CalculatorLanding>
  );
}
