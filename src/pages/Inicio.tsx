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
  },
  {
    to: "/jurisprudencia",
    titulo: "Jurisprudência",
    texto: "Busque decisões com link para a fonte no tribunal.",
  },
  {
    to: "/peticao",
    titulo: "Petição",
    texto: "Monte a peça em etapas, com a fundamentação conferida.",
  },
  {
    to: "/chat",
    titulo: "Chat jurídico",
    texto: "Tire dúvidas sobre um caso que você já analisou.",
  },
  {
    to: "/calculadoras",
    titulo: "Calculadoras",
    texto: "Correção, prazos, rescisão, pensão e custas, sem limite de uso.",
  },
  {
    to: "/modelos-de-minutas",
    titulo: "Modelos de minutas",
    texto: "Pontos de partida prontos para editar.",
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

      <main className="flex-1 container max-w-[1120px] py-8 px-4 sm:px-6">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground">
            {primeiroNome ? `Olá, ${primeiroNome}.` : "Olá."}
          </h1>
          <p className="mt-2 max-w-[60ch] text-sm sm:text-base text-muted-foreground">
            Comece pelo caso que está na sua mesa agora, ou escolha uma das ferramentas abaixo.
          </p>
        </header>

        {recentes.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-serif font-medium text-foreground">Continuar de onde parou</h2>
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {recentes.map((r) => (
                <li key={r.id}>
                  <Link
                    to={r.para}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-3 transition-colors hover:text-primary"
                  >
                    <span className="text-sm font-medium text-foreground">{r.titulo}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {r.tipo}, {formatDateBR(r.data)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mb-10">
          <h2 className="text-lg font-serif font-medium text-foreground">O que dá para fazer</h2>
          <div className="mt-3 grid gap-x-10 gap-y-1 sm:grid-cols-2">
            {atalhos.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="group border-b border-border py-4 transition-colors hover:border-primary/40"
              >
                <span className="block text-sm font-medium text-foreground group-hover:text-primary">
                  {a.titulo}
                </span>
                <span className="mt-1 block max-w-[60ch] text-xs leading-relaxed text-muted-foreground">
                  {a.texto}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="max-w-xl">
          <UsageSummary />
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
