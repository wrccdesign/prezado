import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Search, FileText, MessageSquare, Calculator, Stethoscope, LayoutDashboard,
  ArrowRight, Check, Star, Scale, ChevronRight, Menu, X
} from "lucide-react";

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

const features = [
  { icon: Search, title: "Análise Jurídica", desc: "Upload de documentos e textos jurídicos para análise estruturada com IA. Identifica riscos, fundamentação e prazos.", tag: "IA", href: "/" },
  { icon: Stethoscope, title: "Diagnóstico Jurídico", desc: "Descreva sua situação em linguagem simples e receba orientação jurídica acessível, com passos práticos.", tag: "Cidadão", href: "/diagnostico" },
  { icon: FileText, title: "Geração de Petições", desc: "25 tipos de petições trabalhistas, cíveis e mais. Geradas com IA e prontas para download em PDF e DOCX.", tag: "25 tipos", href: "/peticao" },
  { icon: MessageSquare, title: "Chat Jurídico", desc: "Converse com a IA sobre qualquer tema jurídico brasileiro. Respostas fundamentadas com legislação e jurisprudência.", tag: "Chat", href: "/chat" },
  { icon: Calculator, title: "Calculadoras", desc: "Calculadoras de rescisão trabalhista, pensão alimentícia, prazos processuais e correção monetária.", tag: "4 tipos", href: "/calculadoras" },
  { icon: LayoutDashboard, title: "Painel do Advogado", desc: "Dashboard completo com gestão de clientes, petições, modelos e configurações do escritório.", tag: "Pro", href: "/painel-advogado" },
];

const laws = ["CLT", "Código Civil", "CDC", "CPC", "Constituição Federal", "Código Penal"];

const steps = [
  { n: "01", title: "Descreva o caso", desc: "Escreva em linguagem simples ou faça upload de um documento jurídico." },
  { n: "02", title: "IA pesquisa a lei", desc: "Nossa IA analisa a legislação brasileira relevante ao seu caso." },
  { n: "03", title: "Receba a análise", desc: "Diagnóstico estruturado com direitos, prazos e passos práticos." },
  { n: "04", title: "Baixe o documento", desc: "Gere petições em PDF/DOCX prontas para protocolo." },
];

const testimonials = [
  { name: "Dra. Carolina Mendes", role: "Advogada Trabalhista, São Paulo", text: "O JurisAI reduziu o tempo de elaboração das minhas petições pela metade. A qualidade da análise é impressionante.", stars: 5 },
  { name: "Roberto Silva", role: "Cidadão, Belo Horizonte", text: "Nunca entendi meus direitos trabalhistas até usar o diagnóstico jurídico. Consegui resolver meu caso no Juizado Especial.", stars: 5 },
  { name: "Dr. Fernando Alves", role: "Advogado Cível, Rio de Janeiro", text: "O painel do advogado organiza tudo que preciso. Clientes, petições e modelos em um só lugar.", stars: 5 },
];

const plans = [
  { name: "Gratuito", price: "R$ 0", period: "/mês", desc: "Para conhecer a plataforma", features: ["Diagnóstico jurídico", "Chat jurídico limitado", "Calculadoras", "1 petição por mês"], cta: "Começar Grátis", highlight: false },
  { name: "Profissional", price: "R$ 49", period: "/mês", desc: "Para advogados autônomos", features: ["Tudo do Gratuito", "Petições ilimitadas", "Análise de documentos", "Painel do advogado", "Download PDF/DOCX"], cta: "Assinar Agora", highlight: true },
  { name: "Escritório", price: "R$ 149", period: "/mês", desc: "Para escritórios de advocacia", features: ["Tudo do Profissional", "Gestão de clientes", "Modelos de petição", "Logo personalizado", "Suporte prioritário"], cta: "Falar com Vendas", highlight: false },
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
      {/* ========== NAVBAR ========== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled ? "py-2" : "py-4"
        }`}
        style={{
          backgroundColor: "hsl(var(--navy) / 0.95)",
          backdropFilter: "blur(12px)",
          borderBottomColor: "hsl(var(--gold) / 0.15)",
        }}
      >
        <div className="container mx-auto flex items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-gold" />
            <span className="font-serif text-xl font-bold text-white">
              Juris<span className="text-gold">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {["funcionalidades", "como-funciona", "depoimentos", "planos"].map((s) => (
              <a
                key={s}
                href={`#${s}`}
                className="text-sm text-white/60 hover:text-gold transition-colors capitalize"
              >
                {s.replace("-", " ")}
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

          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden px-4 pb-4 pt-2 space-y-3" style={{ backgroundColor: "hsl(var(--navy))" }}>
            {["funcionalidades", "como-funciona", "depoimentos", "planos"].map((s) => (
              <a key={s} href={`#${s}`} className="block text-white/70 hover:text-gold py-1 capitalize" onClick={() => setMenuOpen(false)}>
                {s.replace("-", " ")}
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

      {/* ========== HERO ========== */}
      <section
        className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden"
        style={{ backgroundColor: "hsl(var(--navy))" }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--gold)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute top-1/2 right-0 w-[600px] h-[600px] -translate-y-1/2 translate-x-1/4 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(215 65% 30%), transparent 70%)" }}
        />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 mb-6">
                <span className="h-2 w-2 rounded-full bg-gold animate-pulse-dot" />
                <span className="text-sm text-gold font-medium">IA Jurídica Brasileira</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[62px] font-bold text-white leading-[1.1] mb-6">
                O Direito ao alcance de{" "}
                <em className="text-gold not-italic" style={{ textDecorationLine: "underline", textDecorationColor: "hsl(var(--gold) / 0.4)", textUnderlineOffset: "6px", textDecorationThickness: "3px" }}>
                  todos
                </em>
              </h1>

              <p className="text-lg text-white/60 max-w-[480px] mb-8 font-sans">
                Plataforma de inteligência artificial que democratiza o acesso ao direito brasileiro. Para advogados e cidadãos.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Button size="lg" className="bg-gold text-navy hover:bg-gold-light font-semibold text-base px-8" asChild>
                  <Link to="/auth">
                    Começar Grátis <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" className="bg-transparent border border-white/20 text-white hover:bg-white/10 text-base" asChild>
                  <a href="#funcionalidades">Ver Funcionalidades</a>
                </Button>
              </div>

              <div className="flex gap-8 text-sm">
                {[
                  { value: "25+", label: "Tipos de Petição" },
                  { value: "6", label: "Leis Integradas" },
                  { value: "100%", label: "Direito BR" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl font-bold text-gold">{s.value}</div>
                    <div className="text-white/40">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - floating card */}
            <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 delay-200 hidden lg:block">
              <div className="animate-float rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 max-w-md ml-auto shadow-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center">
                    <Scale className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">JurisAI</div>
                    <div className="text-white/40 text-xs">Plataforma ativa</div>
                  </div>
                  <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="space-y-3">
                  {[
                    { icon: Search, label: "Análise de Documentos", status: "Ativo" },
                    { icon: Stethoscope, label: "Diagnóstico Jurídico", status: "Ativo" },
                    { icon: FileText, label: "25 Tipos de Petição", status: "Ativo" },
                    { icon: MessageSquare, label: "Chat Jurídico IA", status: "Ativo" },
                    { icon: Calculator, label: "4 Calculadoras", status: "Ativo" },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                      <f.icon className="h-4 w-4 text-gold/70" />
                      <span className="text-white/80 text-sm flex-1">{f.label}</span>
                      <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">{f.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== LEGISLAÇÃO BAR ========== */}
      <section style={{ backgroundColor: "hsl(var(--navy-medium))" }} className="py-5 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 flex items-center gap-6 flex-wrap justify-center">
          <span className="text-xs text-white/30 uppercase tracking-wider font-semibold shrink-0">Legislação integrada</span>
          <div className="flex gap-6 flex-wrap justify-center">
            {laws.map((l) => (
              <span key={l} className="text-sm text-white/25 hover:text-gold transition-colors cursor-default">{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FUNCIONALIDADES ========== */}
      <section id="funcionalidades" className="py-20 md:py-28" style={{ backgroundColor: "hsl(var(--cream))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 text-center mb-14">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">Funcionalidades</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mt-3">
              Tudo que você precisa em uma plataforma
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Ferramentas de IA jurídica desenvolvidas especificamente para o direito brasileiro.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                data-reveal
                className={`opacity-0 translate-y-6 transition-all duration-500 group bg-white rounded-xl border border-border p-6 hover:-translate-y-1.5 hover:shadow-lg hover:border-gold/30 relative overflow-hidden`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gold scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                <div className="h-11 w-11 rounded-xl bg-navy/5 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-navy" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-serif font-bold text-navy text-lg">{f.title}</h3>
                  <span className="text-[10px] font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-full">{f.tag}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== COMO FUNCIONA ========== */}
      <section id="como-funciona" className="py-20 md:py-28" style={{ backgroundColor: "hsl(var(--navy))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 text-center mb-16">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">Como funciona</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mt-3">
              Simples como deve ser
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gold/20 hidden lg:block" />

            {steps.map((s, i) => (
              <div
                key={s.n}
                data-reveal
                className="opacity-0 translate-y-6 transition-all duration-500 text-center relative"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="h-20 w-20 rounded-full border-2 border-gold/30 flex items-center justify-center mx-auto mb-5 bg-navy-medium relative z-10">
                  <span className="text-gold font-serif text-xl font-bold">{s.n}</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-white/50 max-w-[220px] mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PARA QUEM ========== */}
      <section className="py-20 md:py-28" style={{ backgroundColor: "hsl(var(--cream))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 text-center mb-14">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">Para quem</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mt-3">
              Feito para quem precisa do Direito
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Advogados */}
            <div data-reveal className="opacity-0 translate-y-6 transition-all duration-500 rounded-2xl p-8 text-white" style={{ backgroundColor: "hsl(var(--navy))" }}>
              <div className="h-12 w-12 rounded-xl bg-gold/10 flex items-center justify-center mb-5">
                <LayoutDashboard className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-4">Advogados</h3>
              <ul className="space-y-3 mb-6">
                {[
                  "Geração automática de 25+ tipos de petição",
                  "Painel completo com gestão de clientes",
                  "Análise inteligente de documentos",
                  "Calculadoras trabalhistas integradas",
                  "Download em PDF e DOCX",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-white/70">
                    <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <Button className="bg-gold text-navy hover:bg-gold-light w-full font-semibold" asChild>
                <Link to="/auth">Entrar como Advogado <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>

            {/* Cidadãos */}
            <div data-reveal className="opacity-0 translate-y-6 transition-all duration-500 delay-100 rounded-2xl border border-border bg-white p-8">
              <div className="h-12 w-12 rounded-xl bg-gold/10 flex items-center justify-center mb-5">
                <Stethoscope className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-navy mb-4">Cidadãos</h3>
              <ul className="space-y-3 mb-6">
                {[
                  "Diagnóstico jurídico em linguagem simples",
                  "Entenda seus direitos sem jargão",
                  "Chat com IA para tirar dúvidas",
                  "Orientação sobre onde buscar ajuda",
                  "Geração de petições para Juizado Especial",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full border-navy/20 text-navy hover:bg-navy hover:text-white font-semibold" asChild>
                <Link to="/auth">Entrar como Cidadão <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== DEPOIMENTOS ========== */}
      <section id="depoimentos" className="py-20 md:py-28" style={{ backgroundColor: "hsl(var(--cream-dark))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 text-center mb-14">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">Depoimentos</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mt-3">
              O que dizem nossos usuários
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                data-reveal
                className="opacity-0 translate-y-6 transition-all duration-500 bg-white rounded-xl border border-border p-6 hover:-translate-y-1 hover:shadow-md"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-navy/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-navy">{t.name.charAt(0)}{t.name.split(" ").pop()?.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-navy">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PLANOS ========== */}
      <section id="planos" className="py-20 md:py-28" style={{ backgroundColor: "hsl(var(--cream))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 text-center mb-14">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">Planos</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mt-3">
              Escolha o plano ideal
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Comece gratuitamente e evolua conforme sua necessidade.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((p, i) => (
              <div
                key={p.name}
                data-reveal
                className={`opacity-0 translate-y-6 transition-all duration-500 rounded-2xl border p-7 relative ${
                  p.highlight
                    ? "border-gold bg-white shadow-lg scale-[1.02]"
                    : "border-border bg-white"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-navy text-xs font-bold px-4 py-1 rounded-full">
                    Mais popular
                  </div>
                )}
                <h3 className="font-serif text-xl font-bold text-navy">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{p.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-navy">{p.price}</span>
                  <span className="text-muted-foreground text-sm">{p.period}</span>
                </div>
                <ul className="space-y-2.5 mb-7">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-gold shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full font-semibold ${
                    p.highlight
                      ? "bg-gold text-navy hover:bg-gold-light"
                      : "bg-navy text-white hover:bg-navy-medium"
                  }`}
                  asChild
                >
                  <Link to="/auth">{p.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA FINAL ========== */}
      <section className="py-20 md:py-28 relative overflow-hidden" style={{ backgroundColor: "hsl(var(--navy))" }}>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(var(--gold)), transparent 70%)" }}
        />
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700">
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-5">
              O direito nunca foi tão{" "}
              <span className="text-gold">acessível</span>
            </h2>
            <p className="text-white/50 max-w-lg mx-auto mb-8 text-lg">
              Junte-se a milhares de advogados e cidadãos que já usam a JurisAI para democratizar o acesso ao direito.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-gold text-navy hover:bg-gold-light font-semibold text-base px-8" asChild>
                <Link to="/auth">Criar Conta Grátis <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-base" asChild>
                <a href="#funcionalidades">Conhecer a Plataforma</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="py-14 border-t" style={{ backgroundColor: "hsl(218 60% 5%)", borderColor: "hsl(var(--gold) / 0.1)" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <Scale className="h-5 w-5 text-gold" />
                <span className="font-serif text-lg font-bold text-white">Juris<span className="text-gold">AI</span></span>
              </Link>
              <p className="text-sm text-white/40 leading-relaxed">
                Plataforma de inteligência artificial jurídica desenvolvida para o direito brasileiro.
              </p>
            </div>

            {/* Plataforma */}
            <div>
              <h4 className="font-sans font-semibold text-white text-sm mb-4">Plataforma</h4>
              <ul className="space-y-2">
                {[
                  { label: "Análise Jurídica", href: "/auth" },
                  { label: "Diagnóstico", href: "/auth" },
                  { label: "Petições", href: "/auth" },
                  { label: "Chat Jurídico", href: "/auth" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link to={l.href} className="text-sm text-white/40 hover:text-gold transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recursos */}
            <div>
              <h4 className="font-sans font-semibold text-white text-sm mb-4">Recursos</h4>
              <ul className="space-y-2">
                {[
                  { label: "Calculadoras", href: "/auth" },
                  { label: "Painel do Advogado", href: "/auth" },
                  { label: "Modelos de Petição", href: "/auth" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link to={l.href} className="text-sm text-white/40 hover:text-gold transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="font-sans font-semibold text-white text-sm mb-4">Empresa</h4>
              <ul className="space-y-2">
                {["Sobre", "Contato", "Termos de Uso", "Política de Privacidade"].map((l) => (
                  <li key={l}>
                    <span className="text-sm text-white/40 hover:text-gold transition-colors cursor-default">{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t pt-5 flex flex-col items-center gap-2 text-center" style={{ borderColor: "hsl(var(--gold) / 0.1)" }}>
            <p className="text-xs text-white/30">© {new Date().getFullYear()} JurisAI. Todos os direitos reservados.</p>
            <div className="flex gap-4 text-xs text-white/30">
              <span className="hover:text-gold transition-colors cursor-default">LGPD</span>
              <span className="hover:text-gold transition-colors cursor-default">Privacidade</span>
              <span className="hover:text-gold transition-colors cursor-default">Termos</span>
            </div>
            <p className="text-xs text-white/25">
              Desenvolvido por{" "}
              <a
                href="https://www.wrcc.design"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold transition-colors underline underline-offset-2"
              >
                WRCC Design
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
