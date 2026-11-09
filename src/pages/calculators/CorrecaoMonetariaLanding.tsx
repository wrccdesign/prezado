import { Link } from "react-router-dom";
import { FAQ_CORRECAO_MONETARIA } from "@/seo/faqData";
import { CalculatorLanding } from "@/components/calculators/CalculatorLanding";
import { CorrecaoCalc } from "@/components/calculators/CorrecaoCalc";
import { CORRECAO_INDICES, correcaoPath } from "@/seo/correcaoIndices";

export default function CorrecaoMonetariaLanding() {
  return (
    <CalculatorLanding
      title="Calculadora de Correção Monetária e Juros"
      description="Atualize valores de condenação, dívidas e verbas com índices oficiais do Banco Central (IPCA, INPC, IGP-M, Selic e Taxa Legal) e juros conforme a Lei 14.905/2024."
      path="/calculadoras/correcao-monetaria-juros-lei-14905"
      seoTitle="Correção Monetária e Juros, Lei 14.905/2024 | Calculadora"
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
          <h2 className="text-h3 text-navy">De onde vem o número</h2>
          <p>
            Todo cálculo é rastreável. Os índices vêm das séries oficiais do SGS/Banco Central, IPCA (433),
            INPC (188), IGP-M (189), Selic (4390) e Taxa Legal (29543), sincronizadas diariamente. O resultado
            exibe a data da última sincronização, então você sabe exatamente qual dado foi usado.
          </p>
          <h2 className="text-h3 text-navy">A Lei 14.905/2024 já está aplicada</h2>
          <p>
            O corte de 30/08/2024 está implementado, inclusive o mês de transição: regime anterior até 29/08 e
            Taxa Legal nos dias 30 e 31, pro rata die (Res. CMN 5.171/2024). Resultado negativo é desconsiderado
            (art. 406, §3º, do CC) e o índice contratual pode ser mantido quando for o caso (art. 389, parágrafo
            único, do CC).
          </p>
          <h2 className="text-h3 text-navy">Base legal</h2>
          <div className="overflow-x-auto rounded-lg border border-cream-dark bg-white">
            <table className="w-full text-left text-sm tabular-nums" style={{ fontFamily: "\"Source Sans 3\", system-ui, sans-serif" }}>
              <thead>
                <tr className="border-b border-cream-dark font-sans font-medium text-navy">
                  <th className="p-3 font-medium">Parcela</th>
                  <th className="p-3 font-medium">Regra desde 30/08/2024</th>
                  <th className="p-3 font-medium">Fonte</th>
                </tr>
              </thead>
              <tbody className="font-sans text-navy/80">
                <tr className="border-b border-cream-dark">
                  <td className="p-3">Correção monetária</td>
                  <td className="p-3">IPCA, salvo índice convencionado ou previsto em lei</td>
                  <td className="p-3">CC, art. 389, parágrafo único</td>
                </tr>
                <tr className="border-b border-cream-dark">
                  <td className="p-3">Juros de mora</td>
                  <td className="p-3">Selic deduzido o IPCA (Taxa Legal)</td>
                  <td className="p-3">CC, art. 406, §1º</td>
                </tr>
                <tr className="border-b border-cream-dark">
                  <td className="p-3">Resultado negativo</td>
                  <td className="p-3">Juros zero no período</td>
                  <td className="p-3">CC, art. 406, §3º</td>
                </tr>
                <tr>
                  <td className="p-3">Metodologia da taxa</td>
                  <td className="p-3">Divulgada pelo Banco Central, série 29543</td>
                  <td className="p-3">Res. CMN 5.171/2024</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h2 className="text-h3 text-navy">Cálculo por índice</h2>
          <ul>
            {CORRECAO_INDICES.map((i) => (
              <li key={i.slug} className="border-t border-cream-dark py-3">
                <Link
                  to={correcaoPath(i.slug)}
                  className="text-navy underline underline-offset-4 hover:text-gold"
                >
                  {i.title}
                </Link>
              </li>
            ))}
          </ul>
        </>
      }
      faq={FAQ_CORRECAO_MONETARIA}
      respostaDireta={
        <>
          <p>
            Desde 30/08/2024, quando o contrato ou a sentença não fixam outro critério, a dívida civil é
            corrigida pelo IPCA e recebe juros de mora pela Taxa Legal, que é a Selic menos o IPCA.
          </p>
          <p>
            Se a Selic menos o IPCA der negativo no mês, os juros daquele mês são zero. Para o período
            anterior a 30/08/2024 vale o critério antigo, e a calculadora aplica os dois regimes no mesmo
            cálculo.
          </p>
        </>
      }

    >

      <CorrecaoCalc />
    </CalculatorLanding>
  );
}
