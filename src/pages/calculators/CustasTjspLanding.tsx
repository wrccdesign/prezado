import { CalculatorLanding } from "@/components/calculators/CalculatorLanding";
import { CustasCalc } from "@/components/calculators/CustasCalc";

export default function CustasTjspLanding() {
  return (
    <CalculatorLanding
      title="Calculadora de Custas Processuais do TJSP"
      description="Calcule a taxa judiciária do TJSP com a regra vigente na data do ato, a UFESP correta, piso de 5 e teto de 3.000 UFESPs, isenções e litisconsórcio — com memória de cálculo e base legal."
      path="/calculadoras/custas-tjsp"
      seoTitle="Calcular Custas Processuais TJSP — Taxa Judiciária e UFESP"
      seoDescription="Calcule a taxa judiciária do TJSP pela Lei 11.608/2003: 1,5% sobre o valor da causa, UFESP vigente, piso de 5 e teto de 3.000 UFESPs, isenções e memória de cálculo."

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
      content={
        <>
          <h2 className="text-xl font-semibold">Como o TJSP calcula a taxa judiciária</h2>
          <p>
            A taxa judiciária estadual é regida pela Lei estadual 11.608/2003. Na distribuição da ação
            e na execução de título extrajudicial ela incide sobre o valor da causa; no cumprimento de
            sentença, sobre o valor do crédito a satisfazer; no preparo de apelação, sobre a
            condenação líquida ou, se não houver pedido condenatório, sobre o valor da causa
            atualizado. O agravo de instrumento tem valor fixo em UFESPs.
          </p>
          <p>
            Em qualquer hipótese o resultado nunca é inferior a 5 UFESPs nem superior a 3.000 UFESPs.
            A UFESP considerada é a vigente no primeiro dia do mês em que o recolhimento é feito — por
            isso a data do ato altera o valor devido na virada do ano.
          </p>

          <h2 className="text-xl font-semibold">Litisconsórcio ativo</h2>
          <p>
            No litisconsórcio ativo voluntário acrescentam-se 10 UFESPs a cada grupo de 10 autores, ou
            fração, que exceder o primeiro grupo. A calculadora aplica esse acréscimo automaticamente
            quando o ato admite a regra.
          </p>

          <h2 className="text-xl font-semibold">Isenções mais comuns</h2>
          <p>
            Estão dispensados do recolhimento os beneficiários da justiça gratuita (art. 98 do CPC), a
            União, os Estados, os Municípios, suas autarquias e fundações e o Ministério Público, além
            dos feitos isentos pela natureza — jurisdição de menores, acidentes do trabalho, alimentos
            até dois salários mínimos e os Juizados Especiais em primeiro grau. Marcada a isenção, o
            resultado sai zerado e com o fundamento indicado.
          </p>

          <h2 className="text-xl font-semibold">A guia é sempre emitida no portal do tribunal</h2>
          <p>
            O recolhimento em São Paulo é feito por DARE-SP, com código de receita próprio da taxa
            judiciária. O Honorífico calcula o valor, mostra a memória e a base legal e leva você até o
            Portal de Custas do TJSP — a emissão, o vencimento e o pagamento da guia acontecem
            exclusivamente lá, e o valor deve ser conferido no ato da emissão.
          </p>
          <p>
            A taxa judiciária não é a única despesa do processo: diligência de oficial de justiça,
            porte de remessa e retorno, despesas postais e honorários periciais são recolhidos em
            guias próprias e não entram neste cálculo.
          </p>
        </>
      }
      faq={[
        {
          question: "Qual o percentual das custas iniciais no TJSP?",
          answer:
            "A taxa judiciária é de 1,5% sobre o valor da causa para atos praticados a partir de 03/01/2024; antes dessa data o percentual era de 1%. A calculadora aplica a regra vigente na data do ato informado.",
        },
        {
          question: "Existe valor mínimo e máximo?",
          answer:
            "Sim. O recolhimento nunca é inferior a 5 UFESPs nem superior a 3.000 UFESPs, considerando a UFESP vigente no primeiro dia do mês do recolhimento.",
        },
        {
          question: "Como se calcula o preparo da apelação?",
          answer:
            "Incide sobre o valor da condenação líquida; não havendo pedido condenatório, sobre o valor da causa atualizado. Os mesmos piso e teto em UFESPs se aplicam.",
        },
        {
          question: "Quem é isento das custas do TJSP?",
          answer:
            "Beneficiários da justiça gratuita (art. 98 do CPC), União, Estados, Municípios, suas autarquias e fundações e o Ministério Público, além de feitos isentos pela natureza, como acidentes do trabalho, alimentos até dois salários mínimos e Juizados Especiais em primeiro grau.",
        },
        {
          question: "A calculadora emite a guia DARE-SP?",
          answer:
            "Não. Ela apresenta o valor, a memória de cálculo e a base legal; a emissão e o pagamento da guia são feitos exclusivamente no Portal de Custas do TJSP, onde o valor deve ser conferido.",
        },
      ]}
    >

      <CustasCalc />
    </CalculatorLanding>
  );
}
