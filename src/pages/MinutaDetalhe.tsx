import { Link, useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Copy, Download, FileDown, Sparkles } from "lucide-react";
import { getMinuta, minutaToPlainText, MINUTAS } from "@/data/minutas";
import { exportToPDF, exportToDOCX, slugify } from "@/lib/exportDocument";
import { useToast } from "@/hooks/use-toast";
import NotFound from "./NotFound";

export default function MinutaDetalhe() {
  const { slug } = useParams();
  const minuta = getMinuta(slug);
  const { toast } = useToast();

  if (!minuta) return <NotFound />;

  const sections = minuta.sections.map((s) => ({ heading: s.heading, body: s.body }));
  const filename = slugify(minuta.title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(minutaToPlainText(minuta));
      toast({ title: "Modelo copiado", description: "O texto está na área de transferência." });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const related = MINUTAS.filter((m) => m.slug !== minuta.slug && m.category === minuta.category).slice(0, 3);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: minuta.title,
      description: minuta.metaDescription,
      step: minuta.sections.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.heading,
        text: s.body.slice(0, 300),
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
        {
          "@type": "ListItem",
          position: 3,
          name: minuta.title,
          item: `https://honorifico.com.br/modelos-de-minutas/${minuta.slug}`,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <SEO
        title={`${minuta.title} — Modelo Editável | Honorífico`}
        description={minuta.metaDescription}
        path={`/modelos-de-minutas/${minuta.slug}`}
        jsonLd={jsonLd}
      />
      <main className="container py-8 sm:py-12 px-4 sm:px-6 space-y-8">
        <Link
          to="/modelos-de-minutas"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Todos os modelos
        </Link>

        <header className="max-w-3xl space-y-4">
          <Badge variant="secondary">{minuta.category}</Badge>
          <h1 className="text-2xl sm:text-4xl font-bold font-serif text-foreground">{minuta.title}</h1>
          <p className="text-base text-muted-foreground">{minuta.shortDescription}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCopy} variant="outline" size="sm">
              <Copy className="mr-2 h-4 w-4" /> Copiar texto
            </Button>
            <Button
              onClick={() => exportToPDF(minuta.title, sections, filename)}
              variant="outline"
              size="sm"
            >
              <FileDown className="mr-2 h-4 w-4" /> PDF
            </Button>
            <Button
              onClick={() => exportToDOCX(minuta.title, sections, filename)}
              variant="outline"
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" /> Word
            </Button>
            <Button asChild size="sm">
              <Link to="/peticao">
                <Sparkles className="mr-2 h-4 w-4" /> Adaptar com IA
              </Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold font-serif text-foreground">Conteúdo do modelo</h2>
            {minuta.sections.map((s) => (
              <Card key={s.heading}>
                <CardHeader>
                  <CardTitle className="text-base">{s.heading}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                    {s.body}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold leading-none tracking-tight">Base legal</h2>
              </CardHeader>
              <CardContent className="space-y-2">
                {minuta.baseLegal.map((b) => (
                  <p key={b} className="text-sm text-muted-foreground">
                    {b}
                  </p>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Checklist antes do protocolo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {minuta.checklist.map((c) => (
                  <div key={c} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{c}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {related.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Modelos relacionados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      to={`/modelos-de-minutas/${r.slug}`}
                      className="block text-sm text-primary hover:underline"
                    >
                      {r.title}
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>
        </div>

        <p className="text-xs text-muted-foreground max-w-3xl">
          Conteúdo informativo. Os campos entre colchetes devem ser preenchidos com os dados do caso
          concreto, e a peça deve ser revisada por advogado(a) habilitado(a) antes do protocolo.
        </p>
      </main>
      <AppFooter />
    </div>
  );
}
