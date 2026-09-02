import { CalculatorLanding } from "@/components/calculators/CalculatorLanding";
import { DateCalc } from "@/components/calculators/DateCalc";

export default function OperacoesDatasLanding() {
  return (
    <CalculatorLanding
      title="Operações com Datas"
      description="Some ou subtraia dias corridos ou úteis, calcule a diferença entre duas datas e descubra informações úteis sobre qualquer data. Ideal para prazos internos e cálculos de prazo fora do processo."
      path="/calculadoras/operacoes-datas"
      seoTitle="Calculadora de Datas, Somar Dias Úteis e Diferença entre Datas"
      seoDescription="Some ou subtraia dias úteis e corridos, calcule a diferença entre duas datas e veja se a data cai em dia útil. Gratuito, sem cadastro."
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
      content={
        <>
          <h2 className="text-h3 text-navy">Para que serve no dia a dia</h2>
          <p>
            Serve para os prazos que não são processuais: vencimento contratual, contagem de
            carência, agenda interna do escritório, controle de diligências e conferência rápida do
            intervalo entre dois marcos temporais. Você escolhe se a contagem é em dias úteis ou
            corridos e o resultado sai imediatamente.
          </p>
          <h2 className="text-h3 text-navy">Quando usar a calculadora de prazo processual</h2>
          <p>
            Se o prazo corre dentro de um processo, use a{" "}
            <a href="/calculadoras/prazo-processual">calculadora de prazo processual</a>: ela
            considera feriados forenses, suspensões do tribunal, recesso de fim de ano e a
            diferença entre disponibilização no DJe e publicação, regras que esta ferramenta, mais
            simples, não aplica.
          </p>
        </>
      }
      faq={[
        {
          question: "Como somar dias úteis a uma data?",
          answer:
            "Informe a data inicial, a quantidade de dias e selecione a opção 'dias úteis'. Sábados, domingos e feriados nacionais são pulados na contagem.",
        },
        {
          question: "A ferramenta serve para prazo judicial?",
          answer:
            "Para prazos dentro de um processo, use a calculadora de prazo processual, que considera suspensões forenses, recesso e a regra de publicação do DJe. Esta é indicada para prazos contratuais e controles internos.",
        },
        {
          question: "Como calcular a diferença entre duas datas?",
          answer:
            "Escolha o modo de diferença, informe as duas datas e o resultado mostra o intervalo em dias corridos e em dias úteis.",
        },
      ]}
    >
      <DateCalc />
    </CalculatorLanding>
  );
}
