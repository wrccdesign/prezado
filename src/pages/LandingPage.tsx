import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, FileDown } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { CorrecaoCalc } from "@/components/calculators/CorrecaoCalc";
import { savePeticaoPrefill } from "@/lib/peticaoPrefill";
import { FonteTable } from "@/components/FonteTable";

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

const memoriaSample = [
  { mes: "08/2024", indice: "IPCA", variacao: "-0,02%", fator: "1,012340", saldo: "R$ 10.123,40" },
  { mes: "09/2024", indice: "Taxa Legal", variacao: "0,10%", fator: "1,013452", saldo: "R$ 10.134,52" },
  { mes: "10/2024", indice: "Taxa Legal", variacao: "0,25%", fator: "1,015986", saldo: "R$ 10.159,86" },
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
    href: "/auth",
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


const plans: { name: string; price: string; period: string; desc: string; features: string[]; cta: string; highlight: boolean; annualNote?: string }[] = [
  { name: "Gratuito", price: "R$ 0", period: "/mês", desc: "Para conhecer a plataforma", features: ["Calculadoras ilimitadas", "20 consultas processuais/mês", "10 mensagens de chat/mês", "1 diagnóstico jurídico/mês", "Petições não incluídas"], cta: "Começar Grátis", highlight: false },
  { name: "Profissional", price: "R$ 49", period: "/mês", desc: "Para advogados autônomos", annualNote: "ou R$ 409/ano à vista no cartão (R$ 34,08/mês, -30%)", features: ["Calculadoras ilimitadas", "400 consultas e 200 mensagens/mês", "60 petições e 60 diagnósticos/mês", "40 análises de documentos/mês", "Painel do advogado"], cta: "Assinar Agora", highlight: true },
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
      <section className="bg-cream text-navy py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-7">
              <h1 className="text-display text-navy max-w-[14ch]">
                Precedente com fonte. Petição que você confere antes de protocolar.
              </h1>
              <p className="text-body-serif text-navy/80 max-w-[60ch] mt-6">
                Todo precedente vem do acervo do CNJ, com link para conferência. Quando não há decisão, a resposta diz isso.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = heroQuery.trim();
                  if (q) navigate(`/jurisprudencia?q=${encodeURIComponent(q)}`);
                }}
                className="mt-8 flex gap-2 max-w-[560px]"
              >
                <Input
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  placeholder="Descreva a situação ou cole o número CNJ"
                  aria-label="Buscar processo ou decisão"
                  className="h-12 bg-white text-navy border border-cream-dark rounded-md placeholder:text-navy/50 font-sans focus-visible:ring-gold flex-1"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 bg-gold text-navy hover:bg-gold-light font-medium rounded-md px-5"
                >
                  Buscar
                </Button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/jurisprudencia"
                  className="inline-flex items-center rounded-md border border-navy/25 px-3 py-1.5 text-sm text-navy/80 hover:border-navy hover:text-navy transition-colors"
                >
                  Consultar um processo
                </Link>
                <a
                  href="#calcular"
                  className="inline-flex items-center rounded-md border border-navy/25 px-3 py-1.5 text-sm text-navy/80 hover:border-navy hover:text-navy transition-colors"
                >
                  Calcular correção e juros
                </a>
                <Link
                  to="/diagnostico"
                  className="inline-flex items-center rounded-md border border-navy/25 px-3 py-1.5 text-sm text-navy/80 hover:border-navy hover:text-navy transition-colors"
                >
                  Descrever um caso
                </Link>
                <Link
                  to="/peticao"
                  className="inline-flex items-center rounded-md border border-navy/25 px-3 py-1.5 text-sm text-navy/80 hover:border-navy hover:text-navy transition-colors"
                >
                  Gerar uma petição
                </Link>
              </div>
              <p className="text-note text-navy/60 mt-5 max-w-[60ch]">
                Print de conversa, foto de documento ou PDF: lemos o texto e devolvemos a análise.
              </p>
              <p className="text-note text-navy/60 mt-2 max-w-[60ch]">
                Três buscas por dia sem conta, no acervo já indexado. A conta grátis libera a consulta ao vivo no CNJ e começa com 7 dias do plano Profissional, sem cartão.
              </p>

            </div>

            <div className="lg:col-span-5">
              <article
                className="bg-white text-navy border border-cream-dark rounded-lg overflow-hidden lg:-mr-6 p-6"
                style={{ borderTop: "3px solid hsl(var(--gold))" }}
              >
                <div className="flex items-start justify-between gap-4 font-sans font-medium text-sm">
                  <span>{heroDecision.tribunal}</span>
                  <span>{heroDecision.tipo}</span>
                </div>
                <p className="font-mono text-sm text-navy/70 mt-1">{heroDecision.numeroCnj}</p>
                <p className="font-serif text-base leading-relaxed mt-4 line-clamp-4">{heroDecision.ementa}</p>
                <p className="text-note text-navy/60 mt-3">{heroDecision.relatoria}</p>
                <div className="mt-5 pt-4 border-t border-cream-dark flex items-center justify-between text-sm">
                  <a
                    href={heroDecision.sourceUrl}
                    target="_blank"
                    rel="noopener"
                    className="font-medium underline underline-offset-4"
                  >
                    Ver fonte no CNJ
                  </a>
                  <span className="text-navy/60">Resultado de consulta real</span>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* DO FATO AO FUNDAMENTO */}
      <section id="recursos" className="bg-cream text-navy border-t border-cream-dark py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-h2 text-navy">Do fato ao fundamento</h2>
          <p className="text-navy/80 max-w-[60ch] mt-3">
            Quatro etapas, na ordem em que o trabalho acontece. Cada uma entrega um artefato que você aproveita na seguinte.
          </p>

          <ol className="grid gap-8 lg:grid-cols-4 mt-12">
            {etapas.map((e, i) => (
              <li key={e.title} className="border-t border-navy/15 pt-5">
                <span className="font-serif text-h3 text-gold">{i + 1}</span>
                <h3 className="text-h3 text-navy mt-2">{e.title}</h3>
                <p className="text-navy/70 text-sm mt-2">{e.body}</p>
                <Link
                  to={e.href}
                  className="block text-navy text-sm mt-3 underline underline-offset-4 hover:text-gold"
                >
                  {e.cta}
                </Link>
              </li>
            ))}
          </ol>

          <p className="text-navy/70 text-sm mt-10">
            O chat jurídico acompanha todas as etapas para dúvidas de legislação e jurisprudência.{" "}
            <Link to="/chat" className="text-navy underline underline-offset-4 hover:text-gold">Abrir o chat</Link>
          </p>
        </div>
      </section>

      {/* POR QUE A FONTE IMPORTA */}
      <section id="fonte" className="bg-cream text-navy border-t border-cream-dark py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <FonteTable
            title="Por que a fonte importa"
            intro="Uma resposta jurídica sem fonte é uma aposta. A diferença está em cinco pontos."
            linkLabel="Consultar processos"
            linkTo="/jurisprudencia"
          />
        </div>
      </section>


      {/* MEMÓRIA DE CÁLCULO */}
      <section id="memoria" className="bg-cream text-navy border-t border-cream-dark py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-h2">A memória de cálculo vai anexada à petição</h2>
          <p className="text-navy/80 max-w-[60ch] mt-3">
            Mês a mês, com o regime legal de cada período. É o documento que acompanha o pedido.
          </p>

          <div className="mt-10 bg-white rounded-lg border border-cream-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="font-medium text-navy/70">
                    {["Mês", "Índice", "Variação", "Fator acum.", "Saldo corrigido"].map((h) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div aria-hidden className="flex flex-wrap items-center gap-3 border-t border-cream-dark px-4 py-3 text-note text-navy/60">
              <span className="inline-flex items-center gap-2 rounded-md border border-cream-dark px-3 py-1.5 font-medium text-navy">
                <FileDown className="h-3.5 w-3.5" /> Exportar PDF
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-cream-dark px-3 py-1.5 font-medium text-navy">
                <FileDown className="h-3.5 w-3.5" /> Exportar Word
              </span>
              <span>Fonte e base legal impressas no rodapé do arquivo.</span>
            </div>
          </div>
        </div>
      </section>

      {/* CALCULADORA */}
      <section id="calcular" className="bg-cream text-navy border-t border-cream-dark py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-h2">Calcule agora, sem cadastro</h2>
          <p className="mt-3 text-sm text-navy/70 max-w-[60ch]">
            O cálculo e a memória de cálculo são livres, sem conta. Baixar em PDF ou Word exige conta grátis.
          </p>

          <div className="mt-8 bg-white rounded-lg border border-cream-dark p-6">
            <CorrecaoCalc
              usarValorLabel="Gerar petição com este valor"
              usarValorVariant="ghost"
              onUsarValor={(valor, meta) => {
                savePeticaoPrefill({ valor, ...(meta ?? {}) });
                navigate("/peticao");
              }}
            />
          </div>

          <p className="mt-4 text-sm text-navy/70">
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

      {/* PLANOS */}
      <section id="planos" className="bg-navy py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-h2 text-cream">A assinatura libera a IA</h2>
          <p className="text-cream/72 max-w-[60ch] mt-3">
            Petições, análise de documentos, diagnóstico e chat, com histórico salvo e volume de consulta processual. As calculadoras seguem livres em todos os planos.
          </p>
          <p className="text-note text-cream/50 mt-2">
            Conta nova começa com 7 dias no plano Profissional, sem cartão.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative bg-cream text-navy rounded-lg p-7 border ${p.highlight ? "border-gold shadow-[0_8px_24px_hsl(218_56%_10%/0.12)]" : "border-cream-dark"}`}
              >
                {p.highlight && (
                  <span className="absolute top-4 right-4 bg-gold text-navy text-xs font-medium rounded-md px-2 py-0.5">Mais popular</span>
                )}
                <h3 className="text-h3">{p.name}</h3>
                <p className="text-sm text-navy/70 mt-1 mb-4">{p.desc}</p>
                <div className="mb-2">
                  <span className="text-h2 tabular">{p.price}</span>
                  <span className="text-navy/70 text-sm">{p.period}</span>
                </div>
                <p className="mb-6 text-note text-navy/60 min-h-[1rem]">{p.annualNote ?? ""}</p>
                <ul className="space-y-2.5 mb-7">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-navy/80">
                      <Check className="h-4 w-4 text-gold shrink-0" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full font-medium rounded-md ${p.highlight ? "bg-gold text-navy hover:bg-gold-light" : "bg-navy text-cream hover:bg-navy-medium"}`} asChild>
                  <Link to="/planos">{p.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-navy border-t border-gold/12 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-h2 text-cream">Comece pelo caso que está na sua mesa agora.</h2>
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
