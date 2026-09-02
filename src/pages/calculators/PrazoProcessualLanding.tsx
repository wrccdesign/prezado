import { FAQ_PRAZO_PROCESSUAL } from "@/seo/faqData";
import { CalculatorLanding } from "@/components/calculators/CalculatorLanding";
import { PrazoCalc } from "@/components/calculators/PrazoCalc";

export default function PrazoProcessualLanding() {
  return (
    <CalculatorLanding
      title="Calculadora de Prazo Processual"
      description="Calcule prazos processuais em dias úteis ou corridos considerando feriados nacionais, estaduais e municipais, suspensões forenses, recesso de final de ano e a distinção entre disponibilização no DJe e publicação."
      path="/calculadoras/prazo-processual"
      seoTitle="Calcular Prazo Processual em Dias Úteis (CPC), Grátis"
      seoDescription="Calcule prazo processual em dias úteis com feriados, suspensões forenses e recesso. Considera disponibilização no DJe e publicação. Grátis, sem login."
      keywords={[
        "prazo processual",
        "dias úteis",
        "feriados judiciais",
        "recesso forense",
        "publicação DJe",
        "CPC art. 219",
      ]}
      features={[
        "Feriados nacionais, estaduais e municipais",
        "Suspensões forenses por tribunal",
        "Recesso forense 20/12 a 20/01",
        "Distinção disponibilização × publicação",
        "Exportação .ics para o calendário",
      ]}
      content={
        <>
          <h2 className="text-xl font-semibold">Quando o prazo começa a correr</h2>
          <p>
            A contagem só se inicia no primeiro dia útil seguinte à publicação. Quando a intimação é
            eletrônica pelo Diário de Justiça, a publicação é o dia útil seguinte à disponibilização
            (art. 224, §2º, do CPC) e o prazo começa no dia útil posterior a essa publicação. A
            calculadora aplica essa cadeia automaticamente quando você informa a data de
            disponibilização.
          </p>
          <h2 className="text-xl font-semibold">Dias úteis, dias corridos e suspensões</h2>
          <p>
            Prazos processuais civis correm em dias úteis (art. 219 do CPC); prazos materiais,
            penais e da maioria dos procedimentos trabalhistas correm em dias corridos. Além dos
            fins de semana, ficam de fora feriados nacionais, estaduais e municipais, o recesso de
            20/12 a 20/01 (art. 220) e as suspensões próprias de cada tribunal. O resultado lista
            todos os dias descartados, com o motivo de cada um.
          </p>
        </>
      }
      faq={FAQ_PRAZO_PROCESSUAL}

    >

      <PrazoCalc />
    </CalculatorLanding>
  );
}
