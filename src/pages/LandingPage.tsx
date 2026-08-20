import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, ChevronRight, Menu, X } from "lucide-react";
import Logo from "@/components/Logo";
import { SEO } from "@/components/SEO";
import { CorrecaoCalc } from "@/components/calculators/CorrecaoCalc";

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
  { id: "fonte", label: "Fonte dos dados" },
  { id: "memoria", label: "Memória de cálculo" },
  { id: "planos", label: "Planos" },
];

const plans: { name: string; price: string; period: string; desc: string; features: string[]; cta: string; highlight: boolean; annualNote?: string }[] = [
  { name: "Gratuito", price: "R$ 0", period: "/mês", desc: "Para conhecer a plataforma", features: ["Calculadoras ilimitadas", "20 consultas processuais/mês", "10 mensagens de chat/mês", "1 diagnóstico jurídico/mês", "Petições não incluídas"], cta: "Começar Grátis", highlight: false },
  { name: "Profissional", price: "R$ 49", period: "/mês", desc: "Para advogados autônomos", annualNote: "ou R$ 409/ano à vista no Pix (R$ 34,08/mês, -30%)", features: ["Calculadoras ilimitadas", "400 consultas e 200 mensagens/mês", "60 petições e 60 diagnósticos/mês", "40 análises de documentos/mês", "Painel do advogado"], cta: "Assinar Agora", highlight: true },
  { name: "Escritório", price: "R$ 149", period: "/mês", desc: "Para escritórios de advocacia", annualNote: "ou R$ 1.249/ano à vista no Pix (R$ 104,08/mês, -30%)", features: ["Calculadoras ilimitadas", "1500 consultas e 800 mensagens/mês", "200 petições e 150 análises/mês", "Gestão de clientes e modelos", "Logo personalizado"], cta: "Falar com Vendas", highlight: false },
];

const tambem = [
  "Prazos processuais com feriados forenses e a contagem do art. 220 do CPC.",
  "Custas do TJSP com a UFESP vigente na data do recolhimento.",
  "Consulta processual e de andamentos.",
  "Petições e análise de documentos com IA.",
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const revealRef = useScrollReveal();

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

      {/* NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? "py-2" : "py-4"}`}
        style={{ backgroundColor: "hsl(var(--navy) / 0.95)", backdropFilter: "blur(12px)", borderBottomColor: "hsl(var(--gold) / 0.15)" }}
      >
        <div className="container mx-auto flex items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center">
            <Logo className="h-8" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {navSections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="text-sm text-white/60 hover:text-gold transition-colors">
                {s.label}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button className="bg-gold text-navy hover:bg-gold-light font-semibold" asChild>
              <Link to="/auth">Cadastrar</Link>
            </Button>
          </div>
          <button className="md:hidden text-white" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden px-4 pb-4 pt-2 space-y-3" style={{ backgroundColor: "hsl(var(--navy))" }}>
            {navSections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="block text-white/70 hover:text-gold py-1" onClick={() => setMenuOpen(false)}>
                {s.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <Button className="flex-1 bg-transparent border border-white/20 text-white hover:bg-white/10" asChild>
                <Link to="/auth">Entrar</Link>
              </Button>
              <Button className="flex-1 bg-gold text-navy hover:bg-gold-light" asChild>
                <Link to="/auth">Cadastrar</Link>
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative pt-28 pb-14 md:pt-36 md:pb-16 overflow-hidden" style={{ backgroundColor: "hsl(var(--navy))" }}>
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
            <p className="mt-4 text-sm text-white/50">Sem cadastro para calcular.</p>
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
              <CorrecaoCalc />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Outras calculadoras: <Link to="/calculadoras/prazo-processual" className="text-navy underline underline-offset-2 hover:text-gold">prazo processual</Link>,{" "}
              <Link to="/calculadoras/custas-tjsp" className="text-navy underline underline-offset-2 hover:text-gold">custas do TJSP</Link> e{" "}
              <Link to="/calculadoras" className="text-navy underline underline-offset-2 hover:text-gold">todas as demais</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* BLOCO 1 — DE ONDE VEM O NÚMERO */}
      <section id="fonte" className="py-20 md:py-24" style={{ backgroundColor: "hsl(var(--navy))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 max-w-3xl">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">De onde vem o número</span>
            <p className="text-lg text-white/70 mt-4 leading-relaxed">
              Todo cálculo é rastreável. Os índices vêm das séries oficiais do SGS/Banco Central — IPCA (433), INPC (188), IGP-M (189), Selic (4390) e Taxa Legal (29543) — sincronizadas diariamente. O resultado exibe a data da última sincronização, então você sabe exatamente qual dado foi usado.
            </p>
          </div>
        </div>
      </section>

      {/* BLOCO 2 — LEI 14.905/2024 */}
      <section className="py-20 md:py-24" style={{ backgroundColor: "hsl(var(--cream))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 max-w-3xl">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">Lei 14.905/2024</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mt-3 mb-4">A Lei 14.905/2024 já está aplicada</h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              O corte de 30/08/2024 está implementado, inclusive o mês de transição: regime anterior até 29/08 e Taxa Legal nos dias 30 e 31, pro rata die (Res. CMN 5.171/2024). Resultado negativo é desconsiderado (art. 406, §3º, do CC) e o índice contratual pode ser mantido quando for o caso (art. 389, parágrafo único, do CC).
            </p>
          </div>
        </div>
      </section>

      {/* BLOCO 3 — MEMÓRIA DE CÁLCULO */}
      <section id="memoria" className="py-20 md:py-24" style={{ backgroundColor: "hsl(var(--navy))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 max-w-3xl">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">Memória de cálculo</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mt-3 mb-4">A memória de cálculo é o produto</h2>
            <p className="text-lg text-white/70 leading-relaxed">
              Mês a mês: índice aplicado, variação, fator acumulado, saldo corrigido, juros do mês e acumulados, e o regime legal de cada período. Exporta em PDF ou Word, com fonte e base legal. É o documento que vai anexado à petição — não é só um número na tela.
            </p>
            <div className="pt-6">
              <Button size="lg" className="bg-gold text-navy hover:bg-gold-light font-semibold" asChild>
                <a href="#calcular">Calcular agora <ArrowRight className="ml-2 h-5 w-5" /></a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* BLOCO 4 — E TAMBÉM */}
      <section className="py-16" style={{ backgroundColor: "hsl(var(--navy-medium))", borderTop: "1px solid hsl(var(--gold) / 0.1)", borderBottom: "1px solid hsl(var(--gold) / 0.1)" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 max-w-3xl">
            <span className="text-sm text-white/40 uppercase tracking-wider font-semibold">E também</span>
            <ul className="mt-4 space-y-2">
              {tambem.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-white/60">
                  <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
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
              <strong className="font-medium text-white/50">Honorífico</strong> — Ferramentas de IA jurídica desenvolvidas especificamente para o direito brasileiro. Pagamentos processados com segurança pela Stripe.
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
