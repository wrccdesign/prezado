import { Link } from "react-router-dom";
import { Check, X, Minus, Share2, Shield, Users, Briefcase, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppFooter } from "@/components/AppFooter";
import logo from "@/assets/logo.png";
import { toast } from "@/hooks/use-toast";

const features = [
  { name: "Diagnóstico jurídico com IA", prezado: "full", jusbrasil: "none", advbox: "none", chatgpt: "partial" },
  { name: "Geração de petições estruturadas", prezado: "full", jusbrasil: "none", advbox: "partial", chatgpt: "partial" },
  { name: "Chat com legislação brasileira", prezado: "full", jusbrasil: "none", advbox: "none", chatgpt: "partial" },
  { name: "Jurisprudência real (DataJud/CNJ)", prezado: "full", jusbrasil: "full", advbox: "none", chatgpt: "none" },
  { name: "Calculadoras trabalhistas", prezado: "full", jusbrasil: "none", advbox: "partial", chatgpt: "none" },
  { name: "Painel do advogado", prezado: "full", jusbrasil: "none", advbox: "full", chatgpt: "none" },
  { name: "Linguagem acessível ao cidadão", prezado: "full", jusbrasil: "partial", advbox: "none", chatgpt: "partial" },
  { name: "Fontes oficiais verificadas", prezado: "full", jusbrasil: "full", advbox: "none", chatgpt: "none" },
  { name: "Exportação PDF/DOCX ABNT", prezado: "full", jusbrasil: "none", advbox: "partial", chatgpt: "none" },
  { name: "Preço acessível", prezado: "full", jusbrasil: "partial", advbox: "none", chatgpt: "partial" },
];

type Support = "full" | "partial" | "none";

function StatusIcon({ status }: { status: Support }) {
  if (status === "full") return <Check className="h-5 w-5 text-emerald-500" />;
  if (status === "partial") return <Minus className="h-5 w-5 text-amber-500" />;
  return <X className="h-5 w-5 text-red-400/60" />;
}

const differentials = [
  { icon: Briefcase, title: "Plataforma Integrada", desc: "Diagnóstico, petições, jurisprudência, calculadoras e chat — tudo em um só lugar." },
  { icon: Users, title: "Público Híbrido", desc: "Feito tanto para advogados quanto para cidadãos, com linguagem clara e acessível." },
  { icon: Shield, title: "IA Anti-Alucinação", desc: "Fontes oficiais do STF, STJ e Planalto. Cada citação é rastreável e verificável." },
  { icon: Globe, title: "100% Brasileiro", desc: "Desenvolvido para o direito brasileiro, com base na legislação e jurisprudência nacional." },
];

export default function Comparativo() {
  const handleShare = async () => {
    const url = window.location.href;
    const text = "Conheça o Prezado.ai — a plataforma jurídica mais completa do Brasil.";
    if (navigator.share) {
      try { await navigator.share({ title: "Prezado.ai", text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado!", description: "Cole onde quiser para compartilhar." });
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--navy))" }}>
      {/* Hero */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at 30% 20%, hsl(var(--gold) / 0.25), transparent 60%)" }} />
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-3xl">
          <Link to="/">
            <img src={logo} alt="Prezado.ai" className="h-10 mx-auto mb-8" />
          </Link>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold mb-5 leading-tight" style={{ color: "hsl(var(--cream))" }}>
            Por que o <span style={{ color: "hsl(var(--gold))" }}>Prezado.ai</span>?
          </h1>
          <p className="text-base sm:text-lg leading-relaxed mb-8" style={{ color: "hsl(var(--cream) / 0.65)" }}>
            A única plataforma jurídica brasileira que une diagnóstico, peticionamento, jurisprudência verificada e calculadoras — com inteligência artificial de verdade.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="rounded-full font-sans font-semibold text-sm px-8" style={{ background: "hsl(var(--gold))", color: "hsl(var(--navy))" }}>
              <Link to="/auth">Criar conta grátis</Link>
            </Button>
            <Button variant="outline" size="lg" onClick={handleShare} className="rounded-full font-sans font-semibold text-sm px-8 gap-2 border-white/20 hover:border-white/40" style={{ color: "hsl(var(--cream))" }}>
              <Share2 className="h-4 w-4" /> Compartilhar
            </Button>
          </div>
        </div>
      </section>

      {/* Tabela comparativa */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: "hsl(218 60% 7%)" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-center mb-3" style={{ color: "hsl(var(--cream))" }}>
            Comparativo de Mercado
          </h2>
          <p className="text-center mb-10 text-sm" style={{ color: "hsl(var(--cream) / 0.5)" }}>
            Veja como o Prezado.ai se posiciona frente às principais ferramentas do mercado jurídico.
          </p>

          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "hsl(var(--gold) / 0.15)" }}>
            <table className="w-full text-sm" style={{ backgroundColor: "hsl(218 50% 9%)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid hsl(var(--gold) / 0.12)" }}>
                  <th className="text-left py-4 px-4 sm:px-6 font-sans font-semibold" style={{ color: "hsl(var(--cream) / 0.7)" }}>Funcionalidade</th>
                  <th className="text-center py-4 px-3 font-sans font-bold" style={{ color: "hsl(var(--gold))" }}>Prezado.ai</th>
                  <th className="text-center py-4 px-3 font-sans font-semibold" style={{ color: "hsl(var(--cream) / 0.5)" }}>JusBrasil</th>
                  <th className="text-center py-4 px-3 font-sans font-semibold hidden sm:table-cell" style={{ color: "hsl(var(--cream) / 0.5)" }}>Advbox</th>
                  <th className="text-center py-4 px-3 font-sans font-semibold hidden sm:table-cell" style={{ color: "hsl(var(--cream) / 0.5)" }}>ChatGPT</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <tr key={i} style={{ borderBottom: i < features.length - 1 ? "1px solid hsl(var(--gold) / 0.06)" : "none" }}>
                    <td className="py-3.5 px-4 sm:px-6 font-sans" style={{ color: "hsl(var(--cream) / 0.8)" }}>{f.name}</td>
                    <td className="py-3.5 px-3 text-center"><div className="flex justify-center"><StatusIcon status={f.prezado as Support} /></div></td>
                    <td className="py-3.5 px-3 text-center"><div className="flex justify-center"><StatusIcon status={f.jusbrasil as Support} /></div></td>
                    <td className="py-3.5 px-3 text-center hidden sm:table-cell"><div className="flex justify-center"><StatusIcon status={f.advbox as Support} /></div></td>
                    <td className="py-3.5 px-3 text-center hidden sm:table-cell"><div className="flex justify-center"><StatusIcon status={f.chatgpt as Support} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-6 justify-center mt-6 text-xs font-sans" style={{ color: "hsl(var(--cream) / 0.4)" }}>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> Completo</span>
            <span className="flex items-center gap-1.5"><Minus className="h-3.5 w-3.5 text-amber-500" /> Parcial</span>
            <span className="flex items-center gap-1.5"><X className="h-3.5 w-3.5 text-red-400/60" /> Ausente</span>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: "hsl(var(--navy))" }}>
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-center mb-12" style={{ color: "hsl(var(--cream))" }}>
            Nossos Diferenciais
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {differentials.map((d, i) => (
              <div key={i} className="rounded-xl p-6 transition-all hover:-translate-y-1" style={{ backgroundColor: "hsl(218 50% 12%)", border: "1px solid hsl(var(--gold) / 0.1)" }}>
                <div className="h-11 w-11 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "hsl(var(--gold) / 0.12)" }}>
                  <d.icon className="h-5 w-5" style={{ color: "hsl(var(--gold))" }} />
                </div>
                <h3 className="font-sans font-semibold text-base mb-2" style={{ color: "hsl(var(--cream))" }}>{d.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--cream) / 0.55)" }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 sm:py-20 text-center" style={{ backgroundColor: "hsl(218 60% 7%)" }}>
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-4" style={{ color: "hsl(var(--cream))" }}>
            Pronto para transformar sua prática jurídica?
          </h2>
          <p className="text-sm mb-8" style={{ color: "hsl(var(--cream) / 0.5)" }}>
            Comece a usar o Prezado.ai gratuitamente e descubra o poder da IA jurídica brasileira.
          </p>
          <Button asChild size="lg" className="rounded-full font-sans font-bold text-sm px-10" style={{ background: "hsl(var(--gold))", color: "hsl(var(--navy))" }}>
            <Link to="/auth">Começar agora</Link>
          </Button>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
