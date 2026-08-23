import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { minutas } from "@/data/minutas";

const SITE_URL = "https://honorifico.com.br";

const calculadoras = [
  {
    to: "/calculadoras/correcao-monetaria-juros-lei-14905",
    label: "Correção monetária e juros (Lei 14.905/2024)",
    hint: "IPCA, INPC, IGP-M, Selic e Taxa Legal com memória de cálculo mês a mês.",
  },
  {
    to: "/calculadoras/prazo-processual",
    label: "Prazo processual",
    hint: "Dias úteis ou corridos, com feriados, suspensões forenses e regra do DJe.",
  },
  {
    to: "/calculadoras/custas-tjsp",
    label: "Custas processuais do TJSP",
    hint: "Taxa judiciária pela Lei 11.608/2003, UFESP vigente, piso, teto e isenções.",
  },
  {
    to: "/calculadoras/operacoes-datas",
    label: "Operações com datas",
    hint: "Soma e subtração de dias úteis ou corridos e diferença entre duas datas.",
  },
  {
    to: "/calculadoras/validador-cpf-cnpj",
    label: "Validador de CPF e CNPJ",
    hint: "Conferência dos dígitos verificadores, sem enviar o número a órgãos públicos.",
  },
];

const plataforma = [
  { to: "/", label: "Início" },
  { to: "/jurisprudencia", label: "Jurisprudência" },
  { to: "/diagnostico", label: "Diagnóstico jurídico" },
  { to: "/peticao", label: "Gerador de petições" },
  { to: "/chat", label: "Chat jurídico" },
  { to: "/calculadoras", label: "Todas as calculadoras" },
  { to: "/modelos-de-minutas", label: "Modelos de minutas" },
  { to: "/comparativo", label: "Comparativo" },
];

const conta = [
  { to: "/planos", label: "Planos e preços" },
  { to: "/conta", label: "Minha conta" },
  { to: "/historico", label: "Histórico" },
  { to: "/painel-advogado", label: "Painel do advogado" },
  { to: "/auth", label: "Entrar ou criar conta" },
];

const legal = [
  { to: "/termos", label: "Termos e condições" },
  { to: "/reembolso", label: "Política de reembolso" },
  { to: "/privacidade", label: "Aviso de privacidade" },
];

function LinkList({ items }: { items: { to: string; label: string }[] }) {
  return (
    <ul className="space-y-2">
      {items.map(i => (
        <li key={i.to}>
          <Link to={i.to} className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
            {i.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function MapaDoSite() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <SEO
        title="Mapa do Site — Honorífico"
        description="Navegue por todas as páginas do Honorífico: as cinco calculadoras jurídicas, jurisprudência, petições, modelos de minutas, planos e páginas legais."
        path="/mapa-do-site"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Mapa do site", item: `${SITE_URL}/mapa-do-site` },
          ],
        }}
      />

      <main className="container flex-1 py-8 sm:py-12 px-4 sm:px-6 space-y-10">
        <header className="max-w-3xl space-y-3">
          <h1 className="text-2xl sm:text-4xl font-bold font-serif text-foreground">Mapa do site</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Todas as páginas públicas do Honorífico em um só lugar, começando pelas calculadoras jurídicas.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold font-serif text-foreground">Calculadoras jurídicas</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {calculadoras.map(c => (
              <li key={c.to} className="rounded-lg border border-border p-4">
                <Link to={c.to} className="font-medium text-foreground hover:text-primary underline-offset-4 hover:underline">
                  {c.label}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{c.hint}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold font-serif text-foreground">Plataforma</h2>
            <LinkList items={plataforma} />
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold font-serif text-foreground">Conta e planos</h2>
            <LinkList items={conta} />
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold font-serif text-foreground">Legal</h2>
            <LinkList items={legal} />
          </section>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold font-serif text-foreground">Modelos de minutas</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {minutas.map(m => (
              <li key={m.slug}>
                <Link
                  to={`/modelos-de-minutas/${m.slug}`}
                  className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                >
                  {m.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
