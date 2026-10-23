import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, Check, FileDown, FileSignature, MessageSquareText, Scale } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { CorrecaoCalc } from "@/components/calculators/CorrecaoCalc";
import { savePeticaoPrefill } from "@/lib/peticaoPrefill";
import { FonteTable } from "@/components/FonteTable";
import { HeroConsole } from "@/components/landing/HeroConsole";
import { WAGNER_FULL_NAME } from "@/pages/Sobre";
import antonioPhoto from "@/assets/equipe/antonio-paulo-da-costa-carvalho.webp";
import wagnerPhoto from "@/assets/equipe/wagner-rosati.webp";

// Registro real da tabela `decisions`, id 2247d42f-1f63-44e9-b884-eda515070ff6
const heroDecision = {
  tribunal: "TJPR, 1ª Turma Recursal",
  tipo: "Acórdão",
  numeroCnj: "0035130-32.2024.8.16.0182",
  ementa:
    "Direito civil e do consumidor. Recurso inominado. Rescisão contratual. Contrato de licença de software. Vício na prestação de serviço evidenciada. Dever de informação. Cláusula penal afastada. Provimento.",
  relatoria: "Relatora Vanessa Bassani. Julgado em 28/03/2026.",
  sourceUrl:
    "https://portal.tjpr.jus.br/jurisprudencia/j/2100000036785951/Ac%C3%B3rd%C3%A3o-0035130-32.2024.8.16.0182",
};

// Linhas reais geradas pela calculadora: R$ 10.000,00 de 15/01/2024 a 30/09/2026, IPCA (SGS 433)
// e juros pela Taxa Legal (SGS 29543) a partir da Lei 14.905/2024.
const memoriaSample = [
  { mes: "08/2024", indice: "IPCA", variacao: "-0,02%", fator: "1,028528", saldo: "R$ 10.285,28", juros: "R$ 100,23" },
  { mes: "09/2024", indice: "IPCA", variacao: "0,44%", fator: "1,033053", saldo: "R$ 10.330,53", juros: "R$ 69,86" },
  { mes: "10/2024", indice: "IPCA", variacao: "0,56%", fator: "1,038838", saldo: "R$ 10.388,38", juros: "R$ 73,16" },
];

const etapas = [
  {
    title: "Diagnóstico",
    body: "Descreva o caso em linguagem comum e receba o enquadramento jurídico, em texto sem jargão.",
    cta: "Fazer um diagnóstico",
    href: "/diagnostico",
  },
  {
    title: "Análise de documentos",
    body: "Cole a petição ou a decisão e veja pontos fracos, riscos processuais e a fundamentação que faltou.",
    cta: "Analisar um documento",
    href: "/analise",
  },
  {
    title: "Consulta processual",
    body: "Consulte andamentos e decisões por tribunal, com o número CNJ.",
    cta: "Consultar processos",
    href: "/jurisprudencia",
  },
  {
    title: "Petição",
    body: "Informe fatos e pedidos; a peça sai montada, com a fundamentação inferida a partir do que você descreveu.",
    cta: "Gerar uma petição",
    href: "/peticao",
  },
];

const heroShortcuts = [
  {
    label: "Consultar um processo",
    href: "/jurisprudencia",
    icon: Scale,
  },
  {
    label: "Calcular correção e juros",
    href: "#calcular",
    icon: Calculator,
  },
  {
    label: "Descrever um caso",
    href: "/diagnostico",
    icon: MessageSquareText,
  },
  {
    label: "Gerar uma petição",
    href: "/peticao",
    icon: FileSignature,
  },
];


const plans: { name: string; price: string; period: string; desc: string; features: string[]; cta: string; highlight: boolean; annualNote?: string; limitationNote?: string }[] = [
  { name: "Gratuito", price: "R$ 0", period: "/mês", desc: "Para conhecer a plataforma", features: ["Calculadoras ilimitadas", "20 consultas processuais/mês", "10 mensagens de chat/mês", "1 diagnóstico jurídico/mês"], limitationNote: "Petições não estão incluídas neste plano.", cta: "Começar grátis", highlight: false },
  { name: "Profissional", price: "R$ 49", period: "/mês", desc: "Para advogados autônomos", annualNote: "ou R$ 409/ano à vista no cartão (R$ 34,08/mês, -30%)", features: ["Calculadoras ilimitadas", "400 consultas e 200 mensagens/mês", "60 petições e 60 diagnósticos/mês", "40 análises de documentos/mês", "Painel do advogado"], cta: "Assinar", highlight: true },
  { name: "Escritório", price: "R$ 149", period: "/mês", desc: "Para escritórios de advocacia", annualNote: "ou R$ 1.249/ano à vista no cartão (R$ 104,08/mês, -30%)", features: ["Calculadoras ilimitadas", "1500 consultas e 800 mensagens/mês", "200 petições e 150 análises/mês", "300 leituras/OCR de documentos/mês", "Gestão de clientes e modelos"], cta: "Assinar Escritório", highlight: false },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState("");

  return (
    <div className="min-h-screen font-sans">
      <SEO
        title="Honorífico — do caso à petição, com fonte rastreável"
        description="Plataforma jurídica para o advogado autônomo: diagnóstico, consulta processual no acervo do CNJ, análise de peças e petições. Cálculos pelas séries do Banco Central, com memória de cálculo em PDF ou Word."
        path="/"
        image="/og/home.jpg"
        imageAlt="Honorífico — cálculos e prazos jurídicos com fonte oficial"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Honorífico",
          applicationCategory: "LegalService",
          operatingSystem: "Web",
          url: "https://honorifico.com.br/",
          offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
        }}
      />

      <AppHeader />

      {/* HERO */}
      <section className="bg-cream text-navy py-12 md:py-20 lg:py-24 border-b border-cream-dark">
        <div className="container max-w-[1120px] mx-auto px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <h1 className="text-display-hero text-navy max-w-[18ch]">
                Do fato ao fundamento,<br className="hidden md:block" /> com a fonte oficial<br className="hidden md:block" /> e o cálculo em anexo.
              </h1>
              <p className="text-body-serif text-navy/75 max-w-[52ch] mt-7">
                Precedente real do acervo do CNJ, com link para o tribunal. Quando a decisão não existe, a resposta diz que não encontrou.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = heroQuery.trim();
                  if (q) navigate(`/jurisprudencia?q=${encodeURIComponent(q)}`);
                }}
                className="mt-9 flex max-w-[580px] items-stretch rounded border border-navy/30 bg-white focus-within:border-navy transition-colors duration-150"
              >
                <Input
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="Descreva a situação ou cole o número CNJ"
                  aria-label="Buscar processo ou decisão"
                  className="h-14 flex-1 border-0 bg-transparent rounded-none px-4 text-base text-navy placeholder:text-navy/45 font-sans focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="m-1.5 h-auto bg-gold text-navy hover:bg-gold-light font-medium rounded px-6"
                >
                  Buscar
                </Button>
              </form>
              <p className="text-note text-navy/55 mt-6 mb-2">Ou comece por</p>
              <div className="flex max-w-[600px] flex-wrap gap-2">
                {heroShortcuts.map(({ label, href }) => {
                  const chip =
                    "inline-flex items-center rounded border border-navy/20 bg-cream px-3 py-1.5 text-sm font-medium text-navy/85 transition-colors duration-150 hover:border-navy hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream";
                  return href.startsWith("#") ? (
                    <a key={href} href={href} className={chip}>{label}</a>
                  ) : (
                    <Link key={href} to={href} className={chip}>{label}</Link>
                  );
                })}
              </div>
              <p className="text-note text-navy/60 mt-8 max-w-[60ch] border-t border-cream-dark pt-4">
                Três buscas por dia sem conta. A conta grátis começa com 7 dias do plano Profissional, sem cartão.
              </p>

            </div>

            <div className="lg:col-span-5 lg:pl-4">
              <HeroConsole />
            </div>
          </div>
        </div>
      </section>

      {/* DO FATO AO FUNDAMENTO */}
      <section id="recursos" className="bg-cream text-navy py-14 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid gap-4 md:grid-cols-12 md:items-end">
            <h2 className="text-h2 text-navy md:col-span-5">Do fato ao fundamento</h2>
            <p className="text-body-serif text-navy/75 max-w-[52ch] md:col-span-7">
              Quatro etapas, na ordem em que o trabalho acontece. Cada etapa entrega algo que você usa na seguinte.
            </p>
          </div>

          <ol className="grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4 mt-12">
            {etapas.map((e, i) => (
              <li key={e.title} className="relative border-t border-navy/25 pt-6">
                <span className="font-serif text-5xl leading-none text-navy/15 tabular">0{i + 1}</span>
                <h3 className="text-h3 text-navy mt-5">{e.title}</h3>
                <p className="text-navy/70 text-reading mt-3 md:min-h-[5.5rem]">{e.body}</p>
                <Link
                  to={e.href}
                  className="inline-block text-navy text-sm font-medium mt-5 border-b border-navy/30 hover:border-gold hover:text-gold transition-colors"
                >
                  {e.cta}
                </Link>
              </li>
            ))}
          </ol>

          <p className="border-t border-navy/15 pt-5 text-navy/70 text-reading mt-12">
            O chat jurídico acompanha todas as etapas para dúvidas de legislação e jurisprudência.{" "}
            <Link to="/chat" className="text-navy underline underline-offset-4 hover:text-gold">Abrir o chat</Link>
          </p>
        </div>
      </section>

      {/* POR QUE A FONTE IMPORTA */}
      <section id="fonte" className="bg-cream text-navy py-14 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <FonteTable
            title="Por que a fonte importa"
            intro="Uma resposta jurídica sem fonte é uma aposta. A diferença está em cinco pontos."
            linkLabel="Consultar processos"
            linkTo="/jurisprudencia"
          />
        </div>
      </section>


      {/* MEMÓRIA DE CÁLCULO E CALCULADORA */}
      <section id="calcular" className="bg-cream text-navy py-14 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid gap-4 md:grid-cols-12 md:items-end">
            <h2 className="text-h2 md:col-span-7">Calcule e leve a memória para a petição</h2>
            <p className="text-body-serif text-navy/75 max-w-[48ch] md:col-span-5">
              Confira o resultado mês a mês, com o regime legal de cada período, e faça seu cálculo sem cadastro.
            </p>
          </div>

          <div id="memoria" className="mt-10 bg-white rounded-lg border border-cream-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-base">
                <thead>
                  <tr className="font-medium text-navy/70 bg-cream-dark/45 text-note">
                    {["Mês", "Índice", "Variação", "Fator acum.", "Saldo corrigido", "Juros do mês (Taxa Legal)"].map((h) => (
                      <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {memoriaSample.map((l) => (
                    <tr key={l.mes} className="border-t border-cream-dark">
                      <td className="whitespace-nowrap px-4 py-3 tabular">{l.mes}</td>
                      <td className="whitespace-nowrap px-4 py-3">{l.indice}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular">{l.variacao}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular">{l.fator}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular">{l.saldo}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular">{l.juros}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-cream-dark px-4 py-3 text-note text-navy/60">
              <span aria-label="Exportar memória de cálculo em PDF" className="inline-flex items-center gap-2 rounded-md border border-cream-dark px-3 py-1.5 font-medium text-navy">
                <FileDown className="h-3.5 w-3.5" aria-hidden="true" /> Exportar PDF
              </span>
              <span aria-label="Exportar memória de cálculo em Word" className="inline-flex items-center gap-2 rounded-md border border-cream-dark px-3 py-1.5 font-medium text-navy">
                <FileDown className="h-3.5 w-3.5" aria-hidden="true" /> Exportar Word
              </span>
              <span>Fonte e base legal impressas no rodapé do arquivo.</span>
            </div>
          </div>

          <div className="mt-12 border-t border-cream-dark pt-10">
            <p className="text-reading text-navy/70 max-w-[60ch]">
              O cálculo e a memória de cálculo são livres, sem conta. Baixar em PDF ou Word exige conta grátis.
            </p>
          </div>

          <div className="mt-6 bg-white rounded-lg border border-navy/20 p-5 sm:p-8">
            <CorrecaoCalc
              usarValorLabel="Gerar petição com este valor"
              usarValorVariant="ghost"
              onUsarValor={(valor, meta) => {
                savePeticaoPrefill({ valor, ...(meta ?? {}) });
                navigate("/peticao");
              }}
            />
          </div>

          <p className="mt-4 text-reading text-navy/70">
            Outras calculadoras:{" "}
            <Link to="/calculadoras/prazo-processual" className="text-navy underline underline-offset-4 hover:text-gold">prazo processual</Link>,{" "}
            <Link to="/calculadoras/custas-tjsp" className="text-navy underline underline-offset-4 hover:text-gold">custas do TJSP</Link> e{" "}
            <Link to="/calculadoras" className="text-navy underline underline-offset-4 hover:text-gold">todas as demais</Link>.
          </p>

          <ul className="mt-6 border-t border-cream-dark pt-4 text-note text-navy/60 sm:flex sm:flex-wrap sm:items-center">
            <li className="sm:after:content-[',\u00a0']">Séries oficiais do SGS/Banco Central</li>
            <li className="sm:after:content-[',\u00a0']">Sincronizadas diariamente</li>
            <li>Lei 14.905/2024 aplicada, inclusive o mês de transição</li>
            <li className="mt-2 sm:mt-0 sm:ml-auto">
              <Link to="/calculadoras/correcao-monetaria-juros-lei-14905" className="text-navy underline underline-offset-4 hover:text-gold">
                Como calculamos
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-cream text-navy py-14 md:py-20">
        <div className="container max-w-[1120px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-center border-t border-cream-dark pt-8">
            <div className="flex gap-4 shrink-0">
              <img src={wagnerPhoto} alt="Wagner Rosati" width={96} height={120} loading="lazy" className="aspect-[4/5] w-24 rounded-lg object-cover object-[center_30%]" />
              <img src={antonioPhoto} alt="Antônio Paulo da Costa Carvalho" width={96} height={120} loading="lazy" className="aspect-[4/5] w-24 rounded-lg object-cover object-[center_30%]" />
            </div>
            <div>
              <h2 className="text-h2 text-navy">Quem faz o Honorífico</h2>
              <p className="text-reading text-navy/70 max-w-[60ch] mt-3">Criado por {WAGNER_FULL_NAME}, com o conteúdo jurídico acompanhado por Antônio Paulo da Costa Carvalho, advogado (OAB/SP 29.106) e Juiz de Direito aposentado.</p>
              <Link to="/sobre" className="inline-block mt-4 text-navy underline underline-offset-4 hover:text-gold">Conhecer a equipe</Link>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="bg-navy py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid gap-4 md:grid-cols-12 md:items-end">
            <h2 className="text-h2 text-cream md:col-span-5">A assinatura libera a IA</h2>
            <div className="md:col-span-7">
              <p className="text-body-serif text-cream/72 max-w-[52ch]">
                Petições, análise de documentos, diagnóstico e chat, com histórico salvo e volume de consulta processual. As calculadoras seguem livres em todos os planos.
              </p>
              <p className="text-note text-cream/50 mt-2">Conta nova começa com 7 dias no plano Profissional, sem cartão.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px mt-12 overflow-hidden rounded-lg border border-cream/15 bg-cream/15">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative p-7 md:p-8 ${p.highlight ? "bg-cream text-navy" : "bg-navy-medium text-cream"}`}
              >
                {p.highlight && (
                  <span className="absolute top-4 right-4 bg-gold text-navy text-xs font-medium rounded-md px-2 py-0.5">Mais popular</span>
                )}
                <h3 className="text-h3">{p.name}</h3>
                <p className={`text-reading mt-1 mb-4 ${p.highlight ? "text-navy/70" : "text-cream/50"}`}>{p.desc}</p>
                <div className="mb-2">
                  <span className="text-h2 tabular">{p.price}</span>
                  <span className={`text-note ${p.highlight ? "text-navy/70" : "text-cream/50"}`}>{p.period}</span>
                </div>
                <p className={`mb-6 text-note min-h-[3rem] ${p.highlight ? "text-navy/60" : "text-cream/50"}`}>{p.annualNote ?? ""}</p>
                <ul className="space-y-3 mb-7">
                  {p.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-reading ${p.highlight ? "text-navy/80" : "text-cream/72"}`}>
                      <Check className="h-4 w-4 text-gold shrink-0" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                {p.limitationNote && (
                  <p className={`mb-7 text-note ${p.highlight ? "text-navy/60" : "text-cream/50"}`}>{p.limitationNote}</p>
                )}
                <Button className={`w-full font-medium rounded-md ${p.highlight ? "bg-gold text-navy hover:bg-gold-light" : "border border-cream/25 bg-transparent text-cream hover:bg-cream/10"}`} asChild>
                  <Link to="/planos">{p.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-navy border-t border-cream/15 py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-h2 text-cream">Comece pelo caso que está na sua mesa agora.</h2>
          <p className="mt-3 text-reading text-cream/72">7 dias no plano Profissional, sem cartão.</p>
          <div className="mt-8 flex flex-wrap gap-6 justify-center items-center">
            <Button size="lg" className="bg-gold text-navy hover:bg-gold-light font-medium rounded-md" asChild>
              <Link to="/auth">Criar conta grátis</Link>
            </Button>
            <Link to="/planos" className="text-cream underline underline-offset-4 hover:text-gold">
              Ver planos
            </Link>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
