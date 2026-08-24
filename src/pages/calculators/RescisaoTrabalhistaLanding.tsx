import { CalculatorLanding } from "@/components/calculators/CalculatorLanding";
import { RescisaoCalc } from "@/components/calculators/RescisaoCalc";

export default function RescisaoTrabalhistaLanding() {
  return (
    <CalculatorLanding
      title="Calculadora de Rescisão Trabalhista"
      description="Estime as verbas rescisórias a partir do salário, das datas de admissão e demissão e do tipo de rescisão: saldo de salário, aviso prévio proporcional, 13º e férias proporcionais, férias vencidas com 1/3, FGTS do mês e multa rescisória."
      path="/calculadoras/rescisao-trabalhista"
      seoTitle="Calcular Rescisão Trabalhista Online — Grátis"
      seoDescription="Calcule saldo de salário, aviso prévio, 13º e férias proporcionais, FGTS e multa rescisória para demissão sem justa causa, pedido de demissão ou acordo (art. 484-A da CLT). Grátis, sem login."
      keywords={[
        "rescisão trabalhista",
        "cálculo trabalhista",
        "aviso prévio",
        "FGTS",
        "verbas rescisórias",
        "acordo art. 484-A CLT",
      ]}
      features={[
        "Saldo de salário pelos dias trabalhados no mês da saída",
        "Aviso prévio proporcional (Lei 12.506/2011): 30 dias + 3 por ano completo, limitado a 90",
        "13º salário proporcional aos meses do ano",
        "Férias proporcionais e férias vencidas, ambas com 1/3 constitucional",
        "FGTS do mês da rescisão (8%) e multa de 40% (sem justa causa) ou 20% (acordo mútuo)",
        "Quatro tipos de rescisão: sem justa causa, pedido de demissão, justa causa e acordo mútuo",
      ]}
      content={
        <>
          <h2 className="text-xl font-semibold">O que muda em cada tipo de rescisão</h2>
          <p>
            Na <strong>dispensa sem justa causa</strong> o trabalhador recebe o conjunto completo:
            saldo de salário, aviso prévio indenizado proporcional, 13º proporcional, férias
            proporcionais e vencidas com 1/3, FGTS do mês e multa de 40% sobre o saldo do FGTS
            acrescido do depósito do mês.
          </p>
          <p>
            No <strong>pedido de demissão</strong> não há aviso prévio indenizado a favor do
            empregado nem multa do FGTS; permanecem o saldo de salário, o 13º proporcional e as
            férias proporcionais e vencidas com 1/3. Na <strong>dispensa por justa causa</strong>{" "}
            ficam apenas o saldo de salário e as férias vencidas com 1/3, quando existirem — 13º e
            férias proporcionais não são pagos.
          </p>

          <h2 className="text-xl font-semibold">Acordo mútuo (art. 484-A da CLT)</h2>
          <p>
            No distrato por acordo entre empregado e empregador, previsto no art. 484-A da CLT, o
            aviso prévio indenizado é pago pela metade e a multa do FGTS cai para 20%. As demais
            verbas — saldo de salário, 13º e férias proporcionais, férias vencidas e 1/3 — são
            devidas integralmente. A calculadora aplica essas reduções automaticamente ao selecionar
            o acordo mútuo.
          </p>

          <h2 className="text-xl font-semibold">Base de cálculo e aviso prévio proporcional</h2>
          <p>
            A remuneração usada como base soma o salário-base às horas extras habituais e às
            comissões informadas. O aviso prévio segue a Lei 12.506/2011: 30 dias, mais 3 dias por
            ano completo de serviço, até o limite de 90 dias. O resultado é uma estimativa a partir
            dos dados informados e não considera descontos de INSS, IRRF, faltas, adiantamentos ou
            verbas previstas em convenção coletiva.
          </p>
        </>
      }
      faq={[
        {
          question: "O cálculo substitui a homologação ou o TRCT?",
          answer:
            "Não. O resultado é uma estimativa de referência a partir dos dados informados. O termo de rescisão e os valores efetivamente devidos devem ser conferidos com o empregador e, quando for o caso, com o sindicato ou um advogado trabalhista.",
        },
        {
          question: "O que muda no acordo mútuo do art. 484-A da CLT?",
          answer:
            "O aviso prévio indenizado é pago pela metade e a multa do FGTS é de 20%, em vez dos 40% da dispensa sem justa causa. As demais verbas rescisórias continuam devidas integralmente.",
        },
        {
          question: "Como funciona o aviso prévio proporcional?",
          answer:
            "Pela Lei 12.506/2011 são 30 dias de aviso prévio, acrescidos de 3 dias por ano completo de serviço, com limite total de 90 dias. A calculadora aplica esse cálculo com base nas datas de admissão e demissão.",
        },
        {
          question: "O cálculo já desconta INSS e Imposto de Renda?",
          answer:
            "Não. A calculadora apresenta os valores brutos das verbas rescisórias. Descontos previdenciários, fiscais e outros ajustes (faltas, adiantamentos, previsões de convenção coletiva) não são considerados.",
        },
        {
          question: "Preciso de conta para calcular?",
          answer:
            "Não. O cálculo é livre e sem login. A conta gratuita só é necessária para exportar o resultado em PDF e salvar o histórico.",
        },
      ]}
    >
      <RescisaoCalc />
      <p className="mt-4 text-sm text-muted-foreground">
        Cálculo estimado para fins de referência. Consulte um advogado trabalhista para conferência
        dos valores.
      </p>
    </CalculatorLanding>
  );
}
