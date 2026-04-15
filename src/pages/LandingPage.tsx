import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Search, FileText, MessageSquare, Calculator, Stethoscope, LayoutDashboard,
  ArrowRight, Check, Scale, ChevronRight, Menu, X, MapPin, Database, Users
} from "lucide-react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";

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
  { icon: Search, title: "Busca de Jurisprudência", desc: "Pesquisa semântica em 27 tribunais brasileiros. Encontra decisões pelo conceito jurídico, inclusive de comarcas do interior que outros serviços não cobrem.", tag: "IA", href: "/jurisprudencia" },
  { icon: Stethoscope, title: "Diagnóstico Jurídico", desc: "Descreva sua situação em linguagem simples e receba orientação jurídica acessível, com passos práticos.", tag: "Cidadão", href: "/diagnostico" },
  { icon: FileText, title: "Geração de Petições", desc: "Descreva os fatos e a IA gera a petição com fundamentação jurídica completa. Pronta para download em PDF e DOCX.", tag: "IA", href: "/peticao" },
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

const plans = [
  { name: "Gratuito", price: "R$ 0", period: "/mês", desc: "Para conhecer a plataforma", features: ["Diagnóstico jurídico", "Chat jurídico limitado", "Calculadoras", "1 petição por mês"], cta: "Começar Grátis", highlight: false },
  { name: "Profissional", price: "R$ 49", period: "/mês", desc: "Para advogados autônomos", features: ["Tudo do Gratuito", "Petições ilimitadas", "Análise de documentos", "Painel do advogado", "Download PDF/DOCX"], cta: "Assinar Agora", highlight: true },
  { name: "Escritório", price: "R$ 149", period: "/mês", desc: "Para escritórios de advocacia", features: ["Tudo do Profissional", "Gestão de clientes", "Modelos de petição", "Logo personalizado", "Suporte prioritário"], cta: "Falar com Vendas", highlight: false },
];

const tjs = [
  "TJSP","TJRJ","TJMG","TJRS","TJPR",
  "TJSC","TJBA","TJPE","TJGO","TJMA",
  "TJPA","TJAM","TJMT","TJMS","TJAL",
  "TJSE","TJRN","TJPB","TJPI","TJES",
  "TJTO","TJRO","TJAC","TJAP","TJRR",
  "TJDF","TJCE",
];

type LiveResult = {
  tj: string;
  resultado: string;
  interior: boolean;
  ementa: string;
  orgao: string;
  comarca: string;
  data: string;
};

const FALLBACK_RESULTS: LiveResult[] = [
  { tj: "TJBA", resultado: "PROCEDENTE", interior: true, ementa: "Apelação Cível — Empréstimo consignado fraudulento. Falha na segurança do sistema financeiro. Dano moral configurado. Repetição em dobro.", orgao: "2ª Câmara Cível", comarca: "Vitória da Conquista", data: "Mar 2025" },
  { tj: "TJPA", resultado: "PROCEDENTE", interior: true, ementa: "Recurso de Apelação — Onerosidade excessiva em contrato bancário. Ausência de assinatura a rogo. Sentença mantida.", orgao: "3ª Turma Cível", comarca: "Santarém", data: "Fev 2025" },
  { tj: "TJMA", resultado: "PROVIDO", interior: false, ementa: "Apelação — Desconto indevido em benefício previdenciário. Falha na prestação de serviço. Indenização por dano extrapatrimonial.", orgao: "1ª Câmara Direito Privado", comarca: "Imperatriz", data: "Jan 2025" },
];

const LIVE_QUERIES = [
  "dano moral consumidor",
  "responsabilidade civil banco",
  "rescisão contratual indenização",
  "plano saúde negativa cobertura",
  "acidente trânsito indenização",
  "servidor público concurso direito",
  "locação despejo inadimplência",
  "aposentadoria INSS benefício",
];

function useLiveResults() {
  const [results, setResults] = useState<LiveResult[]>(FALLBACK_RESULTS);
  const [activeQuery, setActiveQuery] = useState("responsabilidade banco fraude consignado");

  useEffect(() => {
    const query = LIVE_QUERIES[Math.floor(Math.random() * LIVE_QUERIES.length)];
    setActiveQuery(query);

    supabase
      .from("decisions")
      .select("tribunal, resultado, comarca, orgao_julgador, ementa, data_decisao")
      .ilike("ementa", `%${query.split(" ")[0]}%`)
      .not("ementa", "is", null)
      .not("tribunal", "is", null)
      .order("data_decisao", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (!data || data.length < 2) return;
        const mapped: LiveResult[] = data.map((d) => ({
          tj: d.tribunal,
          resultado: d.resultado || "PROCEDENTE",
          interior: !!(d.comarca && !["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Porto Alegre", "Curitiba", "Salvador", "Fortaleza", "Recife", "Manaus", "Belém"].includes(d.comarca)),
          ementa: d.ementa?.slice(0, 160) || "",
          orgao: d.orgao_julgador || "",
          comarca: d.comarca || "",
          data: d.data_decisao ? new Date(d.data_decisao).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }) : "",
        }));
        setResults(mapped);
      });
  }, []);

  return { results, activeQuery };
}

function TJCounter() {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const target = 5000;
        const duration = 1500;
        const increment = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) { current = target; clearInterval(timer); }
          setCount(Math.floor(current));
        }, 16);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mt-5 rounded-xl border border-gold/20 bg-white/5 p-4 flex items-center justify-between">
      <div>
        <div className="text-3xl font-bold font-serif text-gold">
          {count.toLocaleString("pt-BR")}+
        </div>
        <div className="text-xs text-white/40 mt-1">decisões indexadas</div>
      </div>
      <div className="text-xs text-right text-gold">
        Crescendo<br />diariamente
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const revealRef = useScrollReveal();
  const { results: liveResults, activeQuery } = useLiveResults();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div ref={revealRef} className="min-h-screen font-sans">
      {/* NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? "py-2" : "py-4"}`}
        style={{ backgroundColor: "hsl(var(--navy) / 0.95)", backdropFilter: "blur(12px)", borderBottomColor: "hsl(var(--gold) / 0.15)" }}
      >
        <div className="container mx-auto flex items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Prezado.ai" className="h-8" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {["funcionalidades", "jurisprudencia", "como-funciona", "planos"].map((s) => (
              <a key={s} href={`#${s}`} className="text-sm text-white/60 hover:text-gold transition-colors capitalize">
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
            {["funcionalidades", "jurisprudencia", "como-funciona", "planos"].map((s) => (
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

      {/* HERO */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden" style={{ backgroundColor: "hsl(var(--navy))" }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `linear-gradient(hsl(var(--gold)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold)) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] -translate-y-1/2 translate-x-1/4 rounded-full opacity-20" style={{ background: "radial-gradient(circle, hsl(215 65% 30%), transparent 70%)" }} />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 mb-6">
                <span className="h-2 w-2 rounded-full bg-gold animate-pulse-dot" />
                <span className="text-sm text-gold font-medium">IA Jurídica Brasileira</span>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[62px] font-bold text-white leading-[1.1] mb-6">
                O direito que<br />a justiça{" "}
                <em className="text-gold" style={{ fontStyle: "italic" }}>merece</em>
                <br />ao seu alcance
              </h1>
              <p className="text-lg text-white/60 max-w-[480px] mb-8 font-sans">
                Encontre jurisprudência de qualquer tribunal do Brasil — inclusive do interior — com busca semântica que entende o direito, não só palavras.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Button size="lg" className="bg-gold text-navy hover:bg-gold-light font-semibold text-base px-8" asChild>
                  <Link to="/auth">Começar Gratuitamente <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button size="lg" className="bg-transparent border border-white/20 text-white hover:bg-white/10 text-base" asChild>
                  <a href="#funcionalidades">Ver Funcionalidades</a>
                </Button>
              </div>
              <div className="flex gap-8 text-sm">
                {[{ value: "27", label: "Tribunais cobertos" }, { value: "5k+", label: "Decisões indexadas" }, { value: "100%", label: "Dados públicos oficiais" }].map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl font-bold text-gold">{s.value}</div>
                    <div className="text-white/40">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock busca ao vivo */}
            <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 delay-200 hidden lg:block">
              <div className="animate-float rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 max-w-lg ml-auto shadow-2xl">
                <div className="text-xs text-white/30 uppercase tracking-widest mb-4">Busca Semântica — Ao Vivo</div>
                <div className="flex items-center gap-3 rounded-lg bg-black/30 border border-white/10 px-4 py-3 mb-4">
                  <Search className="h-4 w-4 text-gold/60 shrink-0" />
                  <span className="font-mono text-sm text-white/70">{activeQuery}</span>
                  <span className="ml-auto h-4 w-0.5 bg-gold animate-pulse" />
                </div>
                <div className="space-y-3">
                  {liveResults.map((r, i) => (
                    <div key={i} className="rounded-lg border border-white/8 bg-white/5 p-4 hover:border-gold/30 transition-colors">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-gold/30 text-gold bg-gold/10">{r.tj}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-400/30 text-emerald-400 bg-emerald-400/10">{r.resultado}</span>
                        {r.interior && <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-blue-400/30 text-blue-400 bg-blue-400/10">INTERIOR</span>}
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed mb-2 line-clamp-2">{r.ementa}</p>
                      <div className="flex items-center justify-between text-[10px] text-white/30 font-mono">
                        <span>{r.orgao} · {r.comarca}</span>
                        <span>{r.data}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS BAND */}
      <div style={{ backgroundColor: "hsl(var(--navy-medium))", borderBottom: "1px solid hsl(var(--gold) / 0.1)" }} className="py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            <div className="text-center py-2 sm:py-0 sm:px-6">
              <div className="text-gold font-semibold text-sm mb-1">Busca Semântica</div>
              <div className="text-white/40 text-xs">Encontra pelo conceito jurídico, não pela palavra exata</div>
            </div>
            <div className="text-center py-2 sm:py-0 sm:px-6">
              <div className="text-gold font-semibold text-sm mb-1">Interior Coberto</div>
              <div className="text-white/40 text-xs">Decisões de comarcas que o JusBrasil não indexa</div>
            </div>
            <div className="text-center py-2 sm:py-0 sm:px-6">
              <div className="text-gold font-semibold text-sm mb-1">Dados Oficiais</div>
              <div className="text-white/40 text-xs">CNJ, DataJud e portais dos próprios tribunais</div>
            </div>
          </div>
        </div>
      </div>

      {/* LEGISLAÇÃO BAR */}
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

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-20 md:py-28" style={{ backgroundColor: "hsl(var(--cream))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 text-center mb-14">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">Funcionalidades</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mt-3">Tudo que você precisa em uma plataforma</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Ferramentas de IA jurídica desenvolvidas especificamente para o direito brasileiro.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={f.title} data-reveal className="opacity-0 translate-y-6 transition-all duration-500 group bg-white rounded-xl border border-border p-6 hover:-translate-y-1.5 hover:shadow-lg hover:border-gold/30 relative overflow-hidden" style={{ transitionDelay: `${i * 100}ms` }}>
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

      {/* JURISPRUDÊNCIA */}
      <section id="jurisprudencia" className="py-20 md:py-28" style={{ backgroundColor: "hsl(var(--navy))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 mb-14">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">Cobertura Nacional</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mt-3">
              Jurisprudência do{" "}
              <em className="text-gold" style={{ fontStyle: "italic" }}>Brasil inteiro</em>
              {" "}— inclusive do interior
            </h2>
            <p className="text-white/50 mt-3 max-w-xl">
              A maioria das plataformas cobre apenas os grandes tribunais. O Prezado vai além: indexa decisões de comarcas do interior que nenhum outro serviço alcança.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 space-y-6">
              {[
                { n: "1", icon: Database, title: "Fonte oficial CNJ / DataJud", desc: "Todos os tribunais são obrigados por lei a reportar ao CNJ. Cobertura garantida e atualizada diariamente." },
                { n: "2", icon: MapPin, title: "Portais dos próprios tribunais", desc: "Scraping direto nos sistemas e-SAJ, PJe e portais próprios para capturar ementas e texto integral das decisões." },
                { n: "3", icon: Users, title: "Crowdsourcing verificado", desc: "Advogados contribuem com decisões raras do interior. Cada upload é validado pela IA antes de publicar." },
              ].map((item) => (
                <div key={item.n} className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full border border-gold/30 bg-gold/10 flex items-center justify-center shrink-0 text-gold text-sm font-bold font-serif">
                    {item.n}
                  </div>
                  <div>
                    <div className="font-semibold text-white mb-1">{item.title}</div>
                    <div className="text-sm text-white/50 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
              <div className="pt-4">
                <Button size="lg" className="bg-gold text-navy hover:bg-gold-light font-semibold" asChild>
                  <Link to="/jurisprudencia">Buscar Jurisprudência <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
            <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 delay-200 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-xs text-white/30 uppercase tracking-widest mb-4">27 Tribunais de Justiça</div>
              <div className="grid grid-cols-5 gap-2">
                {tjs.map((tj) => (
                  <div key={tj} className="rounded-lg border border-gold/20 bg-gold/5 px-2 py-2 text-center text-xs font-mono font-semibold text-gold hover:bg-gold/15 transition-colors">
                    {tj}
                  </div>
                ))}
              </div>
              <TJCounter />
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-20 md:py-28" style={{ backgroundColor: "hsl(var(--cream))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 text-center mb-16">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">Como funciona</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mt-3">Simples como deve ser</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div className="absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gold/20 hidden lg:block" />
            {steps.map((s, i) => (
              <div key={s.n} data-reveal className="opacity-0 translate-y-6 transition-all duration-500 text-center relative" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="h-20 w-20 rounded-full border-2 border-gold/30 flex items-center justify-center mx-auto mb-5 relative z-10" style={{ backgroundColor: "hsl(var(--cream))" }}>
                  <span className="text-gold font-serif text-xl font-bold">{s.n}</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-navy mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground max-w-[220px] mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARA QUEM */}
      <section className="py-20 md:py-28" style={{ backgroundColor: "hsl(var(--navy))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 text-center mb-14">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">Para quem</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mt-3">Feito para quem precisa do Direito</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div data-reveal className="opacity-0 translate-y-6 transition-all duration-500 rounded-2xl p-8 border border-gold/20 bg-white/5">
              <div className="h-12 w-12 rounded-xl bg-gold/10 flex items-center justify-center mb-5">
                <LayoutDashboard className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-white mb-4">Advogados</h3>
              <ul className="space-y-3 mb-6">
                {["Busca semântica de jurisprudência em 27 TJs", "Geração automática de petições com IA", "Painel completo com gestão de clientes", "Análise inteligente de documentos", "Download em PDF e DOCX"].map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-white/70"><Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />{b}</li>
                ))}
              </ul>
              <Button className="bg-gold text-navy hover:bg-gold-light w-full font-semibold" asChild>
                <Link to="/auth">Entrar como Advogado <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            <div data-reveal className="opacity-0 translate-y-6 transition-all duration-500 delay-100 rounded-2xl border border-white/10 bg-white/5 p-8">
              <div className="h-12 w-12 rounded-xl bg-gold/10 flex items-center justify-center mb-5">
                <Stethoscope className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-white mb-4">Cidadãos</h3>
              <ul className="space-y-3 mb-6">
                {["Diagnóstico jurídico em linguagem simples", "Entenda seus direitos sem jargão", "Chat com IA para tirar dúvidas", "Orientação sobre onde buscar ajuda", "Geração de petições para Juizado Especial"].map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-white/70"><Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />{b}</li>
                ))}
              </ul>
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 font-semibold" asChild>
                <Link to="/auth">Entrar como Cidadão <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="py-20 md:py-28" style={{ backgroundColor: "hsl(var(--cream))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700 text-center mb-14">
            <span className="text-sm text-gold font-semibold uppercase tracking-wider">Planos</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mt-3">Escolha o plano ideal</h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">Comece gratuitamente e evolua conforme sua necessidade.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((p, i) => (
              <div key={p.name} data-reveal className={`opacity-0 translate-y-6 transition-all duration-500 rounded-2xl border p-7 relative ${p.highlight ? "border-gold bg-white shadow-lg scale-[1.02]" : "border-border bg-white"}`} style={{ transitionDelay: `${i * 100}ms` }}>
                {p.highlight && (<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-navy text-xs font-bold px-4 py-1 rounded-full">Mais popular</div>)}
                <h3 className="font-serif text-xl font-bold text-navy">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{p.desc}</p>
                <div className="mb-6"><span className="text-4xl font-bold text-navy">{p.price}</span><span className="text-muted-foreground text-sm">{p.period}</span></div>
                <ul className="space-y-2.5 mb-7">
                  {p.features.map((f) => (<li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-gold shrink-0" />{f}</li>))}
                </ul>
                <Button className={`w-full font-semibold ${p.highlight ? "bg-gold text-navy hover:bg-gold-light" : "bg-navy text-white hover:bg-navy-medium"}`} asChild>
                  <Link to="/planos">{p.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 md:py-28 relative overflow-hidden" style={{ backgroundColor: "hsl(var(--navy))" }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, hsl(var(--gold)), transparent 70%)" }} />
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <div data-reveal className="opacity-0 translate-y-6 transition-all duration-700">
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-5">
              O direito nunca foi tão <span className="text-gold">acessível</span>
            </h2>
            <p className="text-white/50 max-w-lg mx-auto mb-8 text-lg">
              Junte-se a advogados e cidadãos que já usam a Prezado.ai para democratizar o acesso ao direito brasileiro.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-gold text-navy hover:bg-gold-light font-semibold text-base px-8" asChild>
                <Link to="/auth">Criar Conta Grátis <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" className="bg-transparent border border-white/20 text-white hover:bg-white/10 text-base" asChild>
                <a href="#funcionalidades">Conhecer a Plataforma</a>
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
                <img src={logo} alt="Prezado.ai" className="h-7" />
              </Link>
              <p className="text-sm text-white/40 leading-relaxed">Plataforma de inteligência artificial jurídica desenvolvida para o direito brasileiro.</p>
            </div>
            <div>
              <h4 className="font-sans font-semibold text-white text-sm mb-4">Plataforma</h4>
              <ul className="space-y-2">
                {[{ label: "Busca de Jurisprudência", href: "/jurisprudencia" }, { label: "Análise Jurídica", href: "/auth" }, { label: "Diagnóstico", href: "/auth" }, { label: "Petições", href: "/auth" }, { label: "Chat Jurídico", href: "/auth" }].map((l) => (
                  <li key={l.label}><Link to={l.href} className="text-sm text-white/40 hover:text-gold transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-sans font-semibold text-white text-sm mb-4">Recursos</h4>
              <ul className="space-y-2">
                {[{ label: "Calculadoras", href: "/auth" }, { label: "Painel do Advogado", href: "/auth" }, { label: "Modelos de Petição", href: "/auth" }].map((l) => (
                  <li key={l.label}><Link to={l.href} className="text-sm text-white/40 hover:text-gold transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-sans font-semibold text-white text-sm mb-4">Empresa</h4>
              <ul className="space-y-2">
                {["Sobre", "Contato", "Termos de Uso", "Política de Privacidade"].map((l) => (
                  <li key={l}><span className="text-sm text-white/40 hover:text-gold transition-colors cursor-default">{l}</span></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t pt-5 flex flex-col items-center gap-2 text-center" style={{ borderColor: "hsl(var(--gold) / 0.1)" }}>
            <p className="text-xs text-white/30">© {new Date().getFullYear()} Prezado.ai. Todos os direitos reservados.</p>
            <div className="flex gap-4 text-xs text-white/30">
              <span className="hover:text-gold transition-colors cursor-default">LGPD</span>
              <span className="hover:text-gold transition-colors cursor-default">Privacidade</span>
              <span className="hover:text-gold transition-colors cursor-default">Termos</span>
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
