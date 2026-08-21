import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, ChevronRight, FileDown, Menu, X } from "lucide-react";
import Logo from "@/components/Logo";
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

const navSections = [
  { id: "calcular", label: "Calcular" },
  { id: "recursos", label: "Recursos" },
  { id: "memoria", label: "Memória de cálculo" },
  { id: "planos", label: "Planos" },
];

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
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const revealRef = useScrollReveal();
  const navigate = useNavigate();


  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div ref={revealRef} className="min-h-screen font-sans">
      <SEO
        title="Cálculos e prazos jurídicos com fonte oficial — Honorífico"
        description="Correção monetária pelas séries do Banco Central, prazos com feriados forenses e custas do TJSP. Memória de cálculo em PDF ou Word, com base legal citada."
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

      {/* NAVBAR: mesmo cabeçalho do resto do site, logado ou não */}
      <AppHeader />

      {/* HERO */}
      <section className="relative pt-12 pb-14 md:pt-16 md:pb-16 overflow-hidden" style={{ backgroundColor: "hsl(var(--navy))" }}>

        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `linear-gradient(hsl(var(--gold)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold)) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 max-w-3xl">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-bold text-white leading-[1.1] mb-5">
              Cálculos e prazos com fonte oficial, prontos para{" "}
              <em className="text-gold" style={{ fontStyle: "italic" }}>anexar</em>.
            </h1>
            <p className="text-lg text-white/60 max-w-[620px] mb-8 font-sans leading-relaxed">
              Correção monetária pelas séries do Banco Central, prazos com feriados forenses e custas do TJSP. Cada resultado sai com memória de cálculo em PDF ou Word, com a base legal citada.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-gold text-navy hover:bg-gold-light font-semibold text-base px-8" asChild>
                <a href="#calcular">Calcular agora <ArrowRight className="ml-2 h-5 w-5" /></a>
              </Button>
              <Button size="lg" className="bg-transparent border border-white/20 text-white hover:bg-white/10 text-base" asChild>
                <Link to="/planos">Ver planos</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-white/50">Sem cadastro para calcular. Petições, análise e diagnóstico na conta.</p>
            <p className="mt-1 text-sm text-white/40">Conta nova começa com 7 dias no plano Profissional, sem cartão.</p>

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

            {/* FAIXA DE PROVA */}
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

      {/* DO FATO AO FUNDAMENTO */}
      <section id="recursos" className="py-20" style={{ backgroundColor: "hsl(var(--navy-medium))", borderTop: "1px solid hsl(var(--gold) / 0.12)", borderBottom: "1px solid hsl(var(--gold) / 0.12)" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 max-w-2xl">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">Recursos</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mt-3">Do fato ao fundamento</h2>
            <p className="text-base text-white/60 mt-3 leading-relaxed">
              A sequência do trabalho, na conta: o caso chega, você entende o que é, lê o que há nos autos e monta a peça.
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

          {/* TRILHO DO CHAT — atravessa as quatro etapas */}
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


      {/* PLANOS */}
      <section id="planos" className="py-20 md:py-28" style={{ backgroundColor: "hsl(var(--cream))" }}>
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
              Cálculos e prazos com fonte oficial, prontos para anexar.
            </h2>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" className="bg-gold text-navy hover:bg-gold-light font-semibold text-base px-8" asChild>
                <a href="#calcular">Calcular agora <ArrowRight className="ml-2 h-5 w-5" /></a>
              </Button>
              <Button size="lg" className="bg-transparent border border-white/20 text-white hover:bg-white/10 text-base" asChild>
                <Link to="/planos">Ver planos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-14 border-t" style={{ backgroundColor: "hsl(218 60% 5%)", borderColor: "hsl(var(--gold) / 0.1)" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <Link to="/" className="flex items-center mb-4">
                <Logo className="h-7" />
              </Link>
              <p className="text-sm text-white/40 leading-relaxed">Cálculos e prazos jurídicos com fonte oficial, com memória de cálculo em PDF e Word.</p>
            </div>
            <div>
              <h4 className="font-sans font-semibold text-white text-sm mb-4">Calculadoras</h4>
              <ul className="space-y-2">
                {[
                  { label: "Correção monetária e juros", href: "/calculadoras/correcao-monetaria-juros-lei-14905" },
                  { label: "Prazo processual", href: "/calculadoras/prazo-processual" },
                  { label: "Custas do TJSP", href: "/calculadoras/custas-tjsp" },
                  { label: "Operações com datas", href: "/calculadoras/operacoes-datas" },
                  { label: "Validador CPF/CNPJ", href: "/calculadoras/validador-cpf-cnpj" },
                ].map((l) => (
                  <li key={l.label}><Link to={l.href} className="text-sm text-white/40 hover:text-gold transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-sans font-semibold text-white text-sm mb-4">Plataforma</h4>
              <ul className="space-y-2">
                {[
                  { label: "Consulta processual", href: "/jurisprudencia" },
                  { label: "Modelos de minutas", href: "/modelos-de-minutas" },
                  { label: "Petições", href: "/auth" },
                  { label: "Análise de documentos", href: "/auth" },
                  { label: "Chat jurídico", href: "/auth" },
                ].map((l) => (
                  <li key={l.label}><Link to={l.href} className="text-sm text-white/40 hover:text-gold transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-sans font-semibold text-white text-sm mb-4">Empresa</h4>
              <ul className="space-y-2">
                {[
                  { label: "Planos e Preços", href: "/planos" },
                  { label: "Contato", href: "mailto:wrccdesign@gmail.com" },
                  { label: "Termos de Uso", href: "/termos" },
                  { label: "Política de Privacidade", href: "/privacidade" },
                  { label: "Política de Reembolso", href: "/reembolso" },
                ].map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("mailto:") ? (
                      <a href={l.href} className="text-sm text-white/40 hover:text-gold transition-colors">
                        {l.label}
                      </a>
                    ) : (
                      <Link to={l.href} className="text-sm text-white/40 hover:text-gold transition-colors">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t pt-5 flex flex-col items-center gap-2 text-center" style={{ borderColor: "hsl(var(--gold) / 0.1)" }}>
            <p className="text-xs text-white/30">© {new Date().getFullYear()} Honorífico. Todos os direitos reservados.</p>
            <p className="text-xs text-white/30 max-w-2xl leading-relaxed">
              <strong className="font-medium text-white/50">Honorífico</strong> — Cálculos e prazos jurídicos com fonte oficial, com memória de cálculo em PDF e Word. Pagamentos processados com segurança pela Stripe.
            </p>
            <div className="flex gap-4 text-xs text-white/30">
              <Link to="/privacidade" className="hover:text-gold transition-colors">LGPD</Link>
              <Link to="/privacidade" className="hover:text-gold transition-colors">Privacidade</Link>
              <Link to="/termos" className="hover:text-gold transition-colors">Termos</Link>
              <Link to="/reembolso" className="hover:text-gold transition-colors">Reembolso</Link>
            </div>
            <p className="text-xs text-white/25">
              Desenvolvido por{" "}
              <a href="https://www.wrcc.design" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors underline underline-offset-2">WRCC Design</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
