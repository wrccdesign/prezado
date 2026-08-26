import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, ChevronRight, FileDown } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { CorrecaoCalc } from "@/components/calculators/CorrecaoCalc";
import { savePeticaoPrefill } from "@/lib/peticaoPrefill";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-6");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    const children = el.querySelectorAll("[data-reveal]");
    children.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);
  return ref;
}

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
  const revealRef = useScrollReveal();
  const navigate = useNavigate();

  return (
    <div ref={revealRef} className="min-h-screen font-sans">
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
      <section className="relative pt-12 pb-14 md:pt-16 md:pb-16 overflow-hidden" style={{ backgroundColor: "hsl(var(--navy))" }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `linear-gradient(hsl(var(--gold)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold)) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 max-w-3xl">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-bold text-white leading-[1.1] mb-5">
              Do caso à petição, sem sair da{" "}
              <em className="text-gold" style={{ fontStyle: "italic" }}>fonte</em>.
            </h1>
            <p className="text-lg text-white/60 max-w-[680px] mb-8 font-sans leading-relaxed">
              Diagnóstico, consulta processual, análise de peças e petições. Todo precedente citado sai do acervo indexado do CNJ — quando não há decisão no banco, a resposta diz isso. Cálculos pelas séries do Banco Central, com memória de cálculo pronta para anexar.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-gold text-navy hover:bg-gold-light font-semibold text-base px-8" asChild>
                <Link to="/auth">Criar conta grátis <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" className="bg-transparent border border-white/20 text-white hover:bg-white/10 text-base" asChild>
                <a href="#calcular">Calcular sem cadastro</a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-white/50">Conta nova começa com 7 dias no plano Profissional, sem cartão.</p>
            <p className="mt-1 text-sm text-white/40">As calculadoras são livres, ilimitadas e não exigem conta.</p>
          </div>
        </div>
      </section>

      {/* DO FATO AO FUNDAMENTO */}
      <section id="recursos" className="py-20" style={{ backgroundColor: "hsl(var(--navy-medium))", borderBottom: "1px solid hsl(var(--gold) / 0.12)" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 max-w-2xl">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">Recursos</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mt-3">Do fato ao fundamento</h2>
            <p className="text-base text-white/60 mt-3 leading-relaxed">
              Quatro etapas, na ordem em que o trabalho acontece. Cada uma entrega um artefato que você aproveita na seguinte.
            </p>
          </div>

          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 mt-10 relative">
            <div aria-hidden className="hidden lg:block absolute left-0 right-0 top-[26px] h-px" style={{ backgroundColor: "hsl(var(--gold) / 0.25)" }} />
            <ol className="relative grid gap-8 lg:grid-cols-4 lg:gap-6">
              {etapas.map((e, i) => (
                <li key={e.title} className="relative pl-14 lg:flex lg:h-full lg:flex-col lg:pl-0">
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 lg:relative lg:mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-full font-serif text-lg font-bold text-gold"
                    style={{ backgroundColor: "hsl(var(--navy))", border: "1px solid hsl(var(--gold) / 0.4)" }}
                  >
                    {i + 1}
                  </span>
                  <Link to={e.href} className="group block lg:flex lg:h-full lg:flex-col">
                    <h3 className="font-serif text-xl font-bold text-white group-hover:text-gold transition-colors">{e.title}</h3>
                    <p className="mt-2 text-sm text-white/60 leading-relaxed">{e.body}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm text-gold/80 group-hover:text-gold transition-colors lg:mt-auto lg:pt-3">
                      {e.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 mt-10 rounded-xl border px-5 py-4 sm:px-6" style={{ borderColor: "hsl(var(--gold) / 0.3)", backgroundColor: "hsl(var(--gold) / 0.06)" }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span aria-hidden className="mt-0.5 h-6 w-px shrink-0 bg-gold/60 sm:h-10" />
                <div>
                  <p className="font-serif text-lg font-bold text-white">Chat jurídico, ao longo de todas as etapas</p>
                  <p className="text-sm text-white/60 mt-1">Tire dúvidas de legislação e jurisprudência em qualquer ponto do caminho.</p>
                </div>
              </div>
              <Link to="/chat" className="inline-flex items-center gap-1 text-sm font-semibold text-gold hover:text-gold-light transition-colors shrink-0">
                Abrir o chat <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MEMÓRIA DE CÁLCULO */}
      <section id="memoria" className="py-16" style={{ backgroundColor: "hsl(var(--navy))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 max-w-4xl">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">Memória de cálculo</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mt-3 mb-4">A memória de cálculo é o produto</h2>
            <p className="text-base text-white/70 leading-relaxed max-w-2xl">
              Mês a mês, com o regime legal de cada período — é o documento que vai anexado à petição.
            </p>

            <div className="mt-7 overflow-hidden rounded-xl border" style={{ borderColor: "hsl(var(--gold) / 0.25)", backgroundColor: "hsl(var(--navy-medium))" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-white/40">
                      {["Mês", "Índice", "Variação", "Fator acum.", "Saldo corrigido"].map((h) => (
                        <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-white/75">
                    {memoriaSample.map((l) => (
                      <tr key={l.mes} className="border-t" style={{ borderColor: "hsl(var(--gold) / 0.12)" }}>
                        <td className="whitespace-nowrap px-4 py-3">{l.mes}</td>
                        <td className="whitespace-nowrap px-4 py-3">{l.indice}</td>
                        <td className="whitespace-nowrap px-4 py-3">{l.variacao}</td>
                        <td className="whitespace-nowrap px-4 py-3">{l.fator}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-white">{l.saldo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                aria-hidden
                className="flex flex-wrap items-center gap-3 border-t px-4 py-3 text-xs text-white/50"
                style={{ borderColor: "hsl(var(--gold) / 0.12)" }}
              >
                <span className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-1.5 text-white/70">
                  <FileDown className="h-3.5 w-3.5" /> Exportar PDF
                </span>
                <span className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-1.5 text-white/70">
                  <FileDown className="h-3.5 w-3.5" /> Exportar Word
                </span>
                <span>Fonte e base legal impressas no rodapé do arquivo.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CALCULADORA */}
      <section id="calcular" className="py-12 md:py-16" style={{ backgroundColor: "hsl(var(--cream))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <span className="text-sm text-gold font-semibold uppercase tracking-wider">Correção monetária e juros</span>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-navy mt-2">Calcule agora, sem cadastro</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                O cálculo e a memória de cálculo são livres, sem conta. Baixar em PDF ou Word exige conta grátis.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-5 sm:p-7 shadow-sm">
              <CorrecaoCalc
                usarValorLabel="Gerar petição com este valor"
                usarValorVariant="ghost"
                onUsarValor={(valor, meta) => {
                  savePeticaoPrefill({ valor, ...(meta ?? {}) });
                  navigate("/peticao");
                }}
              />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Outras calculadoras: <Link to="/calculadoras/prazo-processual" className="text-navy underline underline-offset-2 hover:text-gold">prazo processual</Link>,{" "}
              <Link to="/calculadoras/custas-tjsp" className="text-navy underline underline-offset-2 hover:text-gold">custas do TJSP</Link> e{" "}
              <Link to="/calculadoras" className="text-navy underline underline-offset-2 hover:text-gold">todas as demais</Link>.
            </p>

            <div className="mt-6 flex flex-col gap-2 border-t border-navy/10 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-x-3 sm:text-sm">
              <span>Séries oficiais do SGS/Banco Central</span>
              <span aria-hidden className="hidden sm:inline text-navy/20">·</span>
              <span>Sincronizadas diariamente</span>
              <span aria-hidden className="hidden sm:inline text-navy/20">·</span>
              <span>Lei 14.905/2024 aplicada, inclusive o mês de transição</span>
              <Link
                to="/calculadoras/correcao-monetaria-juros-lei-14905"
                className="text-navy underline underline-offset-2 hover:text-gold sm:ml-auto"
              >
                Como calculamos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* POR QUE A FONTE IMPORTA */}
      <section id="fonte" className="py-16 md:py-20" style={{ backgroundColor: "hsl(var(--navy))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--gold))" }}>Verificabilidade</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mt-3" style={{ color: "hsl(var(--cream))" }}>Por que a fonte importa</h2>
            <p className="mt-3 text-base leading-relaxed" style={{ color: "hsl(var(--cream) / 0.65)" }}>
              Uma resposta jurídica sem fonte é uma aposta. Veja a diferença.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {/* Sem fonte */}
            <div className="rounded-2xl p-6 sm:p-7" style={{ backgroundColor: "hsl(218 30% 14%)", border: "1px solid hsl(0 60% 55% / 0.28)" }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "hsl(0 60% 55% / 0.12)" }}>
                  <AlertTriangle className="h-5 w-5" style={{ color: "hsl(0 65% 62%)" }} />
                </span>
                <h3 className="font-serif text-xl font-bold" style={{ color: "hsl(var(--cream) / 0.75)" }}>Sem fonte verificável</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: "hsl(var(--cream) / 0.5)" }}>
                Uma IA sem acesso aos dados oficiais do Judiciário pode responder com tribunal, número de processo e trecho de ementa que parecem plausíveis — mas não existem, ou não dizem o que a resposta afirma. Não há como conferir antes de usar em uma petição.
              </p>
              <div className="mt-5 rounded-xl px-4 py-3.5" style={{ backgroundColor: "hsl(218 30% 11%)", border: "1px dashed hsl(0 60% 55% / 0.3)" }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: "hsl(var(--cream) / 0.08)", color: "hsl(var(--cream) / 0.45)" }}>
                    Tribunal não informado
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: "hsl(0 60% 55% / 0.14)", color: "hsl(0 65% 68%)" }}>
                    <AlertTriangle className="h-3 w-3" /> Não verificável
                  </span>
                </div>
                <p className="mt-2.5 font-mono text-xs" style={{ color: "hsl(var(--cream) / 0.4)" }}>
                  0000000-00.0000.0.00.0000 — não verificável
                </p>
                <p className="mt-2 text-[11px]" style={{ color: "hsl(var(--cream) / 0.32)" }}>
                  Exemplo genérico e ilustrativo, sem referência a nenhuma ferramenta específica. O número acima é um placeholder e não corresponde a processo real.
                </p>
              </div>
            </div>

            {/* Com fonte */}
            <div className="rounded-2xl p-6 sm:p-7" style={{ backgroundColor: "hsl(218 50% 12%)", border: "1px solid hsl(var(--gold) / 0.35)" }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "hsl(var(--gold) / 0.14)" }}>
                  <ShieldCheck className="h-5 w-5" style={{ color: "hsl(var(--gold))" }} />
                </span>
                <h3 className="font-serif text-xl font-bold" style={{ color: "hsl(var(--cream))" }}>Com fonte verificável</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: "hsl(var(--cream) / 0.65)" }}>
                Toda decisão retornada pela busca do Honorífico traz tribunal, número do processo e link para conferência na fonte oficial do CNJ/DataJud, além do aviso quando o registro é apenas andamento processual, sem ementa disponível.
              </p>
              <div className="mt-5 rounded-xl px-4 py-3.5" style={{ backgroundColor: "hsl(218 55% 9%)", border: "1px solid hsl(var(--gold) / 0.18)" }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: "hsl(var(--gold) / 0.16)", color: "hsl(var(--gold))" }}>
                    Tribunal de origem
                  </span>
                  <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: "hsl(var(--cream) / 0.08)", color: "hsl(var(--cream) / 0.6)" }}>
                    Andamento processual
                  </span>
                </div>
                <p className="mt-2.5 text-xs" style={{ color: "hsl(var(--cream) / 0.55)" }}>
                  Nº CNJ do processo, com botão de copiar e link direto para a fonte oficial.
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold" style={{ border: "1px solid hsl(var(--gold) / 0.35)", color: "hsl(var(--gold))" }}>
                  Ver fonte <ExternalLink className="h-3 w-3" />
                </span>
                <p className="mt-2.5 text-[11px]" style={{ color: "hsl(var(--cream) / 0.35)" }}>
                  Estrutura ilustrativa da busca; os dados exibidos vêm sempre do registro oficial consultado.
                </p>
              </div>
              <Link to="/jurisprudencia" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold transition-colors" style={{ color: "hsl(var(--gold))" }}>
                Consultar processos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>



      {/* PLANOS */}
      <section id="planos" className="py-20 md:py-28 border-t border-navy/10" style={{ backgroundColor: "hsl(var(--cream))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 text-center mb-14">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">Planos</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mt-3">Calculadoras livres em todos os planos</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">A assinatura libera IA (petições, análise, diagnóstico e chat), histórico salvo e volume de consulta processual.</p>
            <p className="text-sm text-muted-foreground mt-2">Conta nova começa com 7 dias no plano Profissional, sem cartão.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((p, i) => (
              <div key={p.name} data-reveal className={`opacity-0 translate-y-6 transition-all duration-500 rounded-2xl border p-7 relative ${p.highlight ? "border-gold bg-white shadow-lg scale-[1.02]" : "border-border bg-white"}`} style={{ transitionDelay: `${i * 100}ms` }}>
                {p.highlight && (<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-navy text-xs font-bold px-4 py-1 rounded-full">Mais popular</div>)}
                <h3 className="font-serif text-xl font-bold text-navy">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{p.desc}</p>
                <div className="mb-2"><span className="text-4xl font-bold text-navy">{p.price}</span><span className="text-muted-foreground text-sm">{p.period}</span></div>
                <p className="mb-6 text-xs text-muted-foreground min-h-[1rem]">{p.annualNote ?? ""}</p>
                <ul className="space-y-2.5 mb-7">
                  {p.features.map((f) => (<li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-gold shrink-0" />{f}</li>))}
                </ul>
                <Button className={`w-full font-semibold ${p.highlight ? "bg-gold text-navy hover:bg-gold-light" : "bg-navy text-white hover:bg-navy-medium"}`} asChild>
                  <Link to="/planos">{p.cta} <ChevronRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 md:py-20" style={{ backgroundColor: "hsl(var(--navy))" }}>
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
              Comece pelo caso que está na sua mesa agora.
            </h2>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" className="bg-gold text-navy hover:bg-gold-light font-semibold text-base px-8" asChild>
                <Link to="/auth">Criar conta grátis <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" className="bg-transparent border border-white/20 text-white hover:bg-white/10 text-base" asChild>
                <Link to="/planos">Ver planos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
