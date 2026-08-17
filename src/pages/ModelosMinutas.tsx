import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileText, Search, Sparkles } from "lucide-react";
import { MINUTAS, MINUTA_CATEGORIES } from "@/data/minutas";

export default function ModelosMinutas() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MINUTAS.filter((m) => {
      const matchCat = !category || m.category === category;
      const matchQ =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.shortDescription.toLowerCase().includes(q) ||
        m.keywords.some((k) => k.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }, [query, category]);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Modelos de minutas e peças jurídicas",
      description:
        "Biblioteca gratuita de modelos de minutas e peças jurídicas editáveis, com base legal e checklist de conferência.",
      url: "https://honorifico.com.br/modelos-de-minutas",
      hasPart: MINUTAS.map((m) => ({
        "@type": "CreativeWork",
        name: m.title,
        url: `https://honorifico.com.br/modelos-de-minutas/${m.slug}`,
        about: m.category,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: "https://honorifico.com.br/" },
        {
          "@type": "ListItem",
          position: 2,
          name: "Modelos de minutas",
          item: "https://honorifico.com.br/modelos-de-minutas",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <SEO
        title="Modelos de Minutas e Peças Jurídicas Editáveis — Honorífico"
        description="Biblioteca gratuita de modelos de minutas jurídicas: petição inicial, contestação, apelação, notificação extrajudicial, procuração, contratos e acordos. Com base legal e checklist."
        path="/modelos-de-minutas"
        jsonLd={jsonLd}
      />
      <main className="container py-8 sm:py-12 px-4 sm:px-6 space-y-8">
        <header className="max-w-3xl space-y-4">
          <h1 className="text-2xl sm:text-4xl font-bold font-serif text-foreground">
            Modelos de minutas e peças jurídicas
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Modelos editáveis de uso corrente na advocacia brasileira, com indicação da base legal e
            checklist de conferência antes do protocolo. Copie, exporte em PDF ou Word e adapte ao seu
            caso — ou gere uma minuta personalizada com a IA do Honorífico.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/peticao">
                <Sparkles className="mr-2 h-4 w-4" /> Gerar minuta com IA
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/calculadoras">Calculadoras jurídicas</Link>
            </Button>
          </div>
        </header>

        <section className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar modelo (ex.: contestação, apelação, acordo)"
              className="pl-9"
              aria-label="Buscar modelo de minuta"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={category === null ? "default" : "outline"}
              onClick={() => setCategory(null)}
            >
              Todas
            </Button>
            {MINUTA_CATEGORIES.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={category === c ? "default" : "outline"}
                onClick={() => setCategory(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <Card key={m.slug} className="flex flex-col">
              <CardHeader className="space-y-2">
                <Badge variant="secondary" className="w-fit">
                  {m.category}
                </Badge>
                <CardTitle className="text-lg flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-1 shrink-0 text-primary" />
                  {m.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <p className="text-sm text-muted-foreground">{m.shortDescription}</p>
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/modelos-de-minutas/${m.slug}`}>
                    Abrir modelo <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum modelo encontrado para essa busca.</p>
          )}
        </section>

        <section className="prose dark:prose-invert max-w-none">
          <h2 className="text-xl font-semibold">Como usar os modelos com segurança</h2>
          <p>
            Cada modelo é um ponto de partida estruturado, não uma peça pronta. Antes de protocolar,
            confira a competência, os prazos aplicáveis, a atualização dos valores e a existência de
            precedentes vinculantes sobre a matéria. Os campos entre colchetes devem ser substituídos
            pelos dados concretos do caso.
          </p>
          <p>
            O Honorífico não substitui a atuação de advogado(a). O uso dos modelos é de
            responsabilidade do profissional que os subscreve.
          </p>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
