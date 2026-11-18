import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HeroMiniCorrecao } from "@/components/landing/HeroMiniCorrecao";

type Aba = "perguntar" | "calcular" | "buscar";
const abas: { id: Aba; label: string }[] = [
  { id: "perguntar", label: "Perguntar" },
  { id: "calcular", label: "Calcular" },
  { id: "buscar", label: "Buscar jurisprudência" },
];
const sugestoes = [
  "Qual o prazo para contestar no procedimento comum?",
  "Quando cabe penhora de salário?",
  "Como fica o 13º na rescisão sem justa causa?",
];

export function HeroAskConsole() {
  const navigate = useNavigate();
  const [aba, setAba] = useState<Aba>("perguntar");
  const [pergunta, setPergunta] = useState("");
  const [busca, setBusca] = useState("");

  const perguntar = (q: string) => {
    const t = q.trim();
    if (t) navigate(`/chat?q=${encodeURIComponent(t)}`);
  };

  return (
    <div className="rounded-lg border border-cream-dark border-t-2 border-t-gold bg-white text-left shadow-[0_8px_24px_hsl(var(--navy)/0.08)]">
      <div role="tablist" aria-label="O que você quer fazer" className="flex gap-6 overflow-x-auto px-5 md:px-7 border-b border-cream-dark">
        {abas.map((a) => {
          const sel = a.id === aba;
          return (
            <button
              key={a.id}
              id={`aba-${a.id}`}
              role="tab"
              aria-selected={sel}
              aria-controls={`painel-${a.id}`}
              onClick={() => setAba(a.id)}
              className={`shrink-0 whitespace-nowrap py-3.5 -mb-px border-b-2 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                sel ? "border-gold text-navy font-medium" : "border-transparent text-navy/60 hover:text-navy"
              }`}
            >
              {a.label}
            </button>
          );
        })}
      </div>

      <div id={`painel-${aba}`} role="tabpanel" aria-labelledby={`aba-${aba}`} className="p-5 md:p-7 animate-in fade-in duration-200 motion-reduce:animate-none">
        {aba === "perguntar" && (
          <form onSubmit={(e) => { e.preventDefault(); perguntar(pergunta); }}>
            <label htmlFor="hero-pergunta" className="sr-only">Escreva sua pergunta jurídica</label>
            <Textarea
              id="hero-pergunta"
              rows={3}
              maxLength={2000}
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); perguntar(pergunta); } }}
              placeholder="Ex.: Qual o prazo para recurso inominado no juizado especial cível?"
              className="resize-none rounded border-navy/25 bg-white text-base text-navy placeholder:text-navy/45 transition-colors duration-150 focus-visible:border-navy focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-note text-navy/55">1 pergunta por dia sem conta.</p>
              <Button type="submit" size="lg" className="h-11 bg-gold text-navy hover:bg-gold-light font-medium rounded px-7">Perguntar</Button>
            </div>
            <ul className="mt-4 flex flex-col gap-1.5 text-sm">
              {sugestoes.map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => perguntar(s)} className="text-left text-navy/65 underline-offset-4 hover:text-navy hover:underline transition-colors duration-150">
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </form>
        )}

        {aba === "calcular" && (
          <div>
            <p className="font-sans text-sm font-medium text-navy">Correção monetária e juros, Lei 14.905/2024</p>
            <HeroMiniCorrecao bare />
            <Link to="/calculadoras" className="mt-3 inline-block text-sm font-medium text-navy underline underline-offset-4">Ver as 7 calculadoras</Link>
          </div>
        )}

        {aba === "buscar" && (
          <form onSubmit={(e) => { e.preventDefault(); const q = busca.trim(); if (q) navigate(`/jurisprudencia?q=${encodeURIComponent(q)}`); }}>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                maxLength={2000}
                placeholder="Descreva a situação ou cole o número CNJ"
                aria-label="Buscar processo ou decisão"
                className="h-12 flex-1 rounded border-navy/25 text-base text-navy placeholder:text-navy/45 focus-visible:border-navy focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button type="submit" size="lg" className="h-12 bg-gold text-navy hover:bg-gold-light font-medium rounded px-7">Buscar</Button>
            </div>
            <p className="text-note text-navy/55 mt-3">Sem conta, cada busca mostra até 3 decisões.</p>
          </form>
        )}
      </div>

      <p className="px-5 md:px-7 py-3.5 border-t border-cream-dark text-note text-navy/60">
        Calculadoras: grátis e sem cadastro. IA: 1 pergunta por dia grátis; planos a partir de R$ 49/mês, com 7 dias grátis sem cartão.{" "}
        <Link to="/planos" className="font-medium text-navy underline underline-offset-4">Ver planos</Link>
      </p>
    </div>
  );
}
