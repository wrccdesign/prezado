import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { FaqSection, buildFaqJsonLd } from "@/components/FaqSection";
import { FAQ_IA_JURIDICA } from "@/seo/faqData";
import { SITE_URL } from "@/seo/routeMeta";

const PATH = "/chatgpt-juridico";

const comparacao: { label: string; generalista: string; honorifico: string }[] = [
  {
    label: "Origem do precedente",
    generalista: "Gerado pelo modelo, sem registro oficial vinculado",
    honorifico: "Acervo do CNJ, com link para o tribunal de origem",
  },
  {
    label: "Quando não existe decisão",
    generalista: "Pode preencher o vazio com texto plausível",
    honorifico: "A resposta diz que não encontrou",
  },
  {
    label: "Conferência depois de gerar a peça",
    generalista: "Não há",
    honorifico: "Cada citação é conferida; o não localizado aparece marcado",
  },
  {
    label: "Cálculo de correção e juros",
    generalista: "Estimado pelo próprio modelo",
    honorifico: "Séries do Banco Central e Lei 14.905/2024, sem IA na conta",
  },
  {
    label: "Contagem de prazo",
    generalista: "Sem calendário forense",
    honorifico: "Dias úteis, feriados forenses e recesso do art. 220 do CPC",
  },
  {
    label: "Entrega",
    generalista: "Texto para copiar",
    honorifico: "Petição e memória de cálculo em PDF e Word",
  },
];

const etapas: { titulo: string; texto: string }[] = [
  {
    titulo: "Relate o caso em linguagem comum",
    texto:
      "O Diagnóstico organiza os fatos, aponta os pontos frágeis e indica o fundamento aplicável, sem prometer resultado de processo.",
  },
  {
    titulo: "Calcule o valor com série oficial",
    texto:
      "Correção monetária, juros, prazos e verbas rescisórias saem de rotinas determinísticas, com memória mês a mês.",
  },
  {
    titulo: "Busque o precedente no acervo",
    texto:
      "A Consulta processual devolve decisões reais, com número do processo, tribunal e link para conferir na fonte.",
  },
  {
    titulo: "Gere a petição e confira as citações",
    texto:
      "A Petição é redigida a partir do que você aprovou, e a verificação mostra quais citações foram localizadas no acervo.",
  },
];

export default function ChatgptJuridico() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "ChatGPT jurídico e IA para advogados", item: `${SITE_URL}${PATH}` },
      ],
    },
    buildFaqJsonLd(FAQ_IA_JURIDICA),
  ];

  return (
    <div className="min-h-screen font-sans bg-cream text-navy">
      <SEO
        title="ChatGPT jurídico e IA para advogados"
        description="O que muda entre uma IA generalista e uma IA jurídica que cita a fonte."
        path={PATH}
        jsonLd={jsonLd}
      />

      <AppHeader />

      <section className="bg-cream text-navy py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <h1 className="text-h1 max-w-[22ch]">
            ChatGPT jurídico: o que muda quando a IA precisa citar a fonte
          </h1>
          <p className="text-body-serif text-navy/80 max-w-[68ch] mt-6">
            Um modelo de linguagem prevê a próxima palavra. Ele não consulta um registro do
            Judiciário antes de escrever, então consegue produzir uma ementa bem redigida, com
            número de processo e data, para um julgado que nunca existiu.
          </p>
          <p className="text-body-serif text-navy/80 max-w-[68ch] mt-4">
            O problema não é o texto, é a assinatura. Quem protocola responde pelo conteúdo da peça,
            nos termos dos arts. 77, 80 e 489, §1º, do Código de Processo Civil. Por isso o
            Honorífico não entrega texto sem procedência: toda citação é conferida contra o acervo
            do CNJ antes de você protocolar, e o que não foi localizado aparece marcado como não
            localizado.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-start gap-5">
            <Button asChild size="lg" className="bg-gold text-navy hover:bg-gold-light">
              <Link to="/jurisprudencia">Consultar um processo</Link>
            </Button>
            <Link to="/calculadoras" className="text-navy/70 underline underline-offset-4 hover:text-navy mt-3 sm:mt-0">
              Usar as calculadoras, sem cadastro
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-cream text-navy border-t border-cream-dark py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-h2">IA generalista e IA jurídica, lado a lado</h2>
          <div className="overflow-x-auto mt-8">
            <table className="w-full text-sm text-left min-w-[640px]">
              <thead>
                <tr className="border-b border-cream-dark font-medium align-bottom">
                  <th scope="col" className="py-3 pr-4"></th>
                  <th scope="col" className="py-3 pr-4">IA generalista</th>
                  <th scope="col" className="py-3 pr-4">Honorífico</th>
                </tr>
              </thead>
              <tbody>
                {comparacao.map((r) => (
                  <tr key={r.label} className="border-b border-cream-dark">
                    <th scope="row" className="py-3 pr-4 font-medium align-top">{r.label}</th>
                    <td className="py-3 pr-4 align-top text-navy/70">{r.generalista}</td>
                    <td className="py-3 pr-4 align-top">{r.honorifico}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-note text-navy/60 mt-4">
            A coluna da IA generalista descreve a categoria de ferramenta, não uma auditoria de
            produto. Verifique as condições atuais em cada serviço.
          </p>
        </div>
      </section>

      <section className="bg-cream text-navy border-t border-cream-dark py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-h2">Como usar IA no caso sem assinar o que não dá para conferir</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-2 max-w-[68ch] md:max-w-none">
            {etapas.map((e, i) => (
              <li key={e.titulo} className="border-t border-cream-dark pt-4">
                <p className="text-note text-navy/60">{i + 1}</p>
                <h3 className="text-h3 mt-1">{e.titulo}</h3>
                <p className="text-body-serif text-navy/80 mt-2 max-w-[60ch]">{e.texto}</p>
              </li>
            ))}
          </ol>
          <p className="text-body-serif text-navy/80 max-w-[68ch] mt-8">
            O Chat jurídico acompanha o caso em todas as etapas, com as mesmas regras de citação.
          </p>
        </div>
      </section>

      <section className="bg-cream text-navy border-t border-cream-dark py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-[68ch]">
          <FaqSection items={FAQ_IA_JURIDICA} />
          <p className="text-body-serif text-navy/80 mt-10">
            Para ver o mesmo confronto com portais de jurisprudência e sistemas de gestão, veja o{" "}
            <Link to="/comparativo" className="underline underline-offset-4">
              comparativo de ferramentas
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-navy py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-h2 text-cream">Comece pelo caso que está na sua mesa agora.</h2>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-5">
            <Button asChild size="lg" className="bg-gold text-navy hover:bg-gold-light">
              <Link to="/auth">Criar conta grátis</Link>
            </Button>
            <Link to="/planos" className="text-cream/72 underline underline-offset-4 hover:text-cream">
              Ver planos
            </Link>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
