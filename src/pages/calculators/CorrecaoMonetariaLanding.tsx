import { CalculatorLanding } from "@/components/calculators/CalculatorLanding";
import { CorrecaoCalc } from "@/components/calculators/CorrecaoCalc";

export default function CorrecaoMonetariaLanding() {
  return (
    <CalculatorLanding
      title="Calculadora de Correção Monetária e Juros"
      description="Atualize valores de condenação, dívidas e verbas com índices oficiais do Banco Central (IPCA, INPC, IGP-M, Selic e Taxa Legal) e juros conforme a Lei 14.905/2024."
      path="/calculadoras/correcao-monetaria-juros-lei-14905"
      seoTitle="Correção Monetária e Juros — Lei 14.905/2024 | Calculadora"
      seoDescription="Atualize valores com IPCA, INPC, IGP-M, Selic e Taxa Legal direto do Banco Central e juros pela Lei 14.905/2024. Memória de cálculo mês a mês, grátis."

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
      content={
        <>
          <h2 className="text-xl font-semibold">De onde vem o número</h2>
          <p>
            Todo cálculo é rastreável. Os índices vêm das séries oficiais do SGS/Banco Central — IPCA (433),
            INPC (188), IGP-M (189), Selic (4390) e Taxa Legal (29543) — sincronizadas diariamente. O resultado
            exibe a data da última sincronização, então você sabe exatamente qual dado foi usado.
          </p>
          <h2 className="text-xl font-semibold">A Lei 14.905/2024 já está aplicada</h2>
          <p>
            O corte de 30/08/2024 está implementado, inclusive o mês de transição: regime anterior até 29/08 e
            Taxa Legal nos dias 30 e 31, pro rata die (Res. CMN 5.171/2024). Resultado negativo é desconsiderado
            (art. 406, §3º, do CC) e o índice contratual pode ser mantido quando for o caso (art. 389, parágrafo
            único, do CC).
          </p>
        </>
      }
      faq={[
        {
          question: "O que mudou com a Lei 14.905/2024?",
          answer:
            "Desde 30/08/2024, na ausência de índice convencionado, a correção monetária é feita pelo IPCA e os juros de mora correspondem à Selic menos o IPCA (Taxa Legal). Se o resultado dessa conta for negativo, considera-se juros zero (art. 406, §3º, do Código Civil).",
        },
        {
          question: "Qual índice usar para atualizar uma condenação?",
          answer:
            "Prevalece o índice fixado na sentença ou no contrato. Sem previsão, aplica-se o IPCA a partir de 30/08/2024 e, no período anterior, o índice usual do juízo (em geral a Tabela Prática ou o INPC). A calculadora aplica os dois regimes no mesmo cálculo.",
        },
        {
          question: "De onde vêm os índices?",
          answer:
            "Das séries oficiais do Sistema Gerenciador de Séries Temporais do Banco Central — IPCA, INPC, IGP-M, Selic e Taxa Legal — sincronizadas diariamente. O resultado informa a data da última sincronização.",
        },
        {
          question: "A calculadora é gratuita?",
          answer:
            "Sim, o cálculo e a memória mês a mês são gratuitos e não exigem login. A conta gratuita é necessária apenas para exportar em PDF ou Word e salvar o histórico.",
        },
      ]}
    >

      <CorrecaoCalc />
    </CalculatorLanding>
  );
}
