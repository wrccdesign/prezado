import { CalculatorLanding } from "@/components/calculators/CalculatorLanding";
import { PensaoCalc } from "@/components/calculators/PensaoCalc";

export default function PensaoAlimenticiaLanding() {
  return (
    <CalculatorLanding
      title="Calculadora de Pensão Alimentícia"
      description="Estime uma faixa de referência de pensão alimentícia a partir da renda líquida do alimentante, do número de filhos, do padrão de vida, da moradia e de outras obrigações alimentares já existentes."
      path="/calculadoras/pensao-alimenticia"
      seoTitle="Calcular Pensão Alimentícia — Faixa de Referência Grátis"
      seoDescription="Estime a faixa de pensão alimentícia pelo binômio necessidade x possibilidade (art. 1.694 do Código Civil), considerando renda, número de filhos, moradia e padrão de vida. Grátis, sem login."
      keywords={[
        "pensão alimentícia",
        "cálculo de pensão",
        "binômio necessidade possibilidade",
        "art 1694 CC",
      ]}
      features={[
        "Faixa mínima, sugerida e máxima em percentual da renda líquida",
        "Percentuais ajustados conforme o número de filhos",
        "Ajuste pelo padrão de vida informado",
        "Ajuste quando os filhos moram, integral ou parcialmente, com o alimentante",
        "Ajuste quando já existem outras obrigações alimentares",
        "Valor correspondente por filho, além do valor total",
      ]}
      content={
        <>
          <h2 className="text-xl font-semibold">O resultado é referência, não decisão judicial</h2>
          <p>
            A calculadora não fixa pensão. Quem define o valor é o juiz, caso a caso, com base no
            binômio necessidade × possibilidade do art. 1.694 do Código Civil: de um lado, o que o
            alimentando precisa para viver de modo compatível com sua condição; de outro, o que o
            alimentante pode pagar sem comprometer o próprio sustento.
          </p>

          <h2 className="text-xl font-semibold">Como a faixa é montada</h2>
          <p>
            O cálculo parte de faixas percentuais da renda líquida observadas na prática — em torno
            de 15% a 30% para um filho, com percentuais totais maiores conforme aumenta o número de
            filhos — e devolve três valores: mínimo, sugerido e máximo. Sobre essa base são
            aplicados ajustes: padrão de vida informado, filhos que residem com o alimentante
            (integral ou parcialmente) e existência de outras obrigações alimentares.
          </p>
          <p>
            O resultado também é apresentado por filho, o que ajuda a dimensionar propostas em
            acordos. Nenhum percentual aqui é vinculante: acordos homologados e sentenças podem
            adotar valores diferentes, inclusive em salários mínimos ou em valor fixo.
          </p>

          <h2 className="text-xl font-semibold">Para que serve na prática</h2>
          <p>
            A faixa serve para orientar conversas iniciais, propostas de acordo e a preparação de
            uma ação de alimentos, mostrando uma ordem de grandeza compatível com a renda informada.
            Despesas específicas — escola, plano de saúde, tratamentos — costumam ser tratadas à
            parte e não estão embutidas no percentual.
          </p>
        </>
      }
      faq={[
        {
          question: "O valor calculado é o que o juiz vai fixar?",
          answer:
            "Não. É um valor de referência. A fixação cabe ao juiz, que decide com base nas necessidades do alimentando e nas possibilidades do alimentante, conforme o art. 1.694 do Código Civil.",
        },
        {
          question: "Como funciona se os filhos moram comigo?",
          answer:
            "Quando os filhos residem com o alimentante, integral ou parcialmente, a calculadora reduz os percentuais da faixa, porque parte do custeio já é feito diretamente por quem paga a pensão.",
        },
        {
          question: "E se eu já pago outra pensão?",
          answer:
            "Ao indicar outras obrigações alimentares já existentes, a faixa é reduzida, refletindo o comprometimento prévio da renda do alimentante.",
        },
        {
          question: "O percentual incide sobre a renda bruta ou líquida?",
          answer:
            "A calculadora usa a renda líquida informada. Em processos judiciais, a base de incidência é definida na decisão ou no acordo e pode variar.",
        },
        {
          question: "Preciso de conta para calcular?",
          answer:
            "Não. O cálculo é livre e sem login. A conta gratuita só é necessária para exportar o resultado em PDF e salvar o histórico.",
        },
      ]}
    >
      <PensaoCalc />
    </CalculatorLanding>
  );
}
