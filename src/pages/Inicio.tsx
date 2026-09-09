import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { UsageSummary } from "@/components/UsageSummary";
import { formatDateBR } from "@/lib/date";
import {
  BriefcaseBusiness,
  Calculator,
  FileSearch,
  FileSignature,
  Files,
  MessageCircle,
  Scale,
} from "lucide-react";

type Recente = {
  id: string;
  titulo: string;
  tipo: string;
  data: string;
  para: string;
};

const ATALHOS = [
  {
    to: "/analise",
    titulo: "Meu caso",
    texto: "Envie um documento ou descreva a situação e receba direitos, riscos e próximos passos.",
    icon: FileSearch,
  },
  {
    to: "/jurisprudencia",
    titulo: "Jurisprudência",
    texto: "Busque decisões com link para a fonte no tribunal.",
    icon: Scale,
  },
  {
    to: "/peticao",
    titulo: "Petição",
    texto: "Monte a peça em etapas, com a fundamentação conferida.",
    icon: FileSignature,
  },
  {
    to: "/chat",
    titulo: "Chat jurídico",
    texto: "Tire dúvidas sobre um caso que você já analisou.",
    icon: MessageCircle,
  },
  {
    to: "/calculadoras",
    titulo: "Calculadoras",
    texto: "Correção, prazos, rescisão, pensão e custas, sem limite de uso.",
    icon: Calculator,
  },
  {
    to: "/modelos-de-minutas",
    titulo: "Modelos de minutas",
    texto: "Pontos de partida prontos para editar.",
    icon: Files,
  },
];

export default function Inicio() {
  const { user } = useAuth();
  const { isLawyer } = useUserProfile();
  const [recentes, setRecentes] = useState<Recente[]>([]);

  const primeiroNome = (() => {
    const nome =
      (user?.user_metadata?.full_name as string | undefined) ||
      (user?.user_metadata?.name as string | undefined) ||
      "";
    return nome.trim().split(" ")[0] || "";
  })();

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      const [analyses, petitions] = await Promise.all([
        supabase.from("analyses").select("id, file_name, created_at").order("created_at", { ascending: false }).limit(3),
        supabase.from("petitions").select("id, petition_type, created_at").order("created_at", { ascending: false }).limit(3),
      ]);

      const itens: Recente[] = [
        ...(analyses.data ?? []).map((a) => ({
          id: `a-${a.id}`,
          titulo: a.file_name || "Texto analisado",
          tipo: "Análise",
          data: a.created_at,
          para: "/historico",
        })),
        ...(petitions.data ?? []).map((p) => ({
          id: `p-${p.id}`,
          titulo: p.petition_type || "Petição",
          tipo: "Petição",
          data: p.created_at,
          para: "/historico",
        })),
      ]
        .sort((x, y) => (x.data < y.data ? 1 : -1))
        .slice(0, 3);

      if (ativo) setRecentes(itens);
    };
    carregar();
    return () => {
      ativo = false;
    };
  }, [user?.id]);

  const atalhos = isLawyer
    ? [
        ...ATALHOS,
        {
          to: "/painel-advogado",
          titulo: "Painel do advogado",
          texto: "Clientes, petições e modelos do escritório.",
          icon: BriefcaseBusiness,
        },
      ]
    : ATALHOS;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <SEO
        title="Início — Honorífico"
        description="Por onde começar: seu caso, jurisprudência, petição, chat e calculadoras."
        path="/"
      />
      <LegalDisclaimer />

      <main className="flex-1 bg-cream">
        <div className="container max-w-[1120px] px-4 py-10 sm:px-6 md:py-14">
        <header className="mb-10 border-b border-border pb-8 md:mb-12 md:pb-10">
          <h1 className="text-h2 text-navy">
            {primeiroNome ? `Olá, ${primeiroNome}.` : "Olá."}
          </h1>
          <p className="mt-3 max-w-[60ch] text-body-serif text-navy/70">
            Comece pelo caso que está na sua mesa agora, ou escolha uma das ferramentas abaixo.
          </p>
        </header>

        {recentes.length > 0 && (
          <section className="mb-12 md:mb-16">
            <div className="flex items-end justify-between gap-6 border-b border-border pb-4">
              <div>
                <h2 className="text-h3 text-navy">Continuar de onde parou</h2>
                <p className="mt-1 text-note text-navy/60">Seus trabalhos mais recentes, prontos para retomar.</p>
              </div>
              <Link to="/historico" className="hidden shrink-0 text-sm font-medium text-navy underline decoration-navy/30 underline-offset-4 transition-colors hover:decoration-gold sm:inline">
                Ver histórico
              </Link>
            </div>
            <ul className="mt-4 grid gap-3 md:grid-cols-3">
              {recentes.map((r, index) => {
                const RecentIcon = r.tipo === "Petição" ? FileSignature : FileSearch;
                return (
                <li key={r.id} className={index === 0 ? "md:col-span-1" : undefined}>
                  <Link
                    to={r.para}
                    className="group grid min-h-[96px] h-full grid-cols-[auto_1fr] items-center gap-x-4 rounded-lg border border-border bg-card p-4 transition-colors duration-150 hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream md:min-h-[148px] md:flex md:flex-col md:items-start md:p-5"
                  >
                    <RecentIcon aria-hidden="true" className="h-5 w-5 text-navy/60 transition-colors duration-150 group-hover:text-gold" strokeWidth={1.75} />
                    <span className="line-clamp-1 text-base font-medium text-navy md:mt-5 md:line-clamp-2">{r.titulo}</span>
                    <span className="col-start-2 mt-1 text-note text-navy/55 tabular-nums md:mt-auto md:pt-3">{r.tipo}, {formatDateBR(r.data)}</span>
                  </Link>
                </li>
              )})}
            </ul>
            <Link to="/historico" className="mt-4 inline-block text-sm font-medium text-navy underline decoration-navy/30 underline-offset-4 sm:hidden">
              Ver histórico
            </Link>
          </section>
        )}

        <section className="mb-12 md:mb-16">
          <div className="max-w-2xl">
            <h2 className="text-h2 text-navy">O que você pode fazer</h2>
            <p className="mt-2 text-body-serif text-navy/70">Escolha o ponto de partida. Cada ferramenta preserva o trabalho para você continuar depois.</p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {atalhos.map((a) => {
              const Icon = a.icon;
              return (
              <Link
                key={a.to}
                to={a.to}
                className="group flex min-h-[190px] flex-col rounded-lg border border-border bg-card p-5 transition-colors duration-150 hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-cream text-navy transition-colors duration-150 group-hover:border-gold group-hover:text-gold">
                  <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="mt-6 block font-serif text-xl font-medium text-navy">{a.titulo}</span>
                <span className="mt-2 block max-w-[38ch] text-sm leading-relaxed text-navy/65">
                  {a.texto}
                </span>
              </Link>
            )})}
          </div>
        </section>

        <section className="max-w-2xl border-t border-border pt-10">
          <UsageSummary />
        </section>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
