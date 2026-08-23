import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export interface CalculatorFaq {
  question: string;
  answer: string;
}

interface CalculatorLandingProps {
  title: string;
  description: string;
  path: string;
  keywords: string[];
  features: string[];
  /** Título usado em <title>/og:title. Se omitido, usa `${title} — Honorífico`. */
  seoTitle?: string;
  /** Meta description. Se omitida, usa `description`. */
  seoDescription?: string;
  /** Conteúdo editorial adicional, exibido abaixo de "Como funciona". */
  content?: React.ReactNode;
  /** Perguntas frequentes: renderizadas na página e marcadas como FAQPage. */
  faq?: CalculatorFaq[];
  children: React.ReactNode;
}

const SITE_URL = "https://honorifico.com.br";

export function CalculatorLanding({
  title,
  description,
  path,
  keywords,
  features,
  seoTitle,
  seoDescription,
  content,
  faq,
  children,
}: CalculatorLandingProps) {
  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Calculadoras", item: `${SITE_URL}/calculadoras` },
        { "@type": "ListItem", position: 3, name: title, item: `${SITE_URL}${path}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: title,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: `${SITE_URL}${path}`,
      description,
      inLanguage: "pt-BR",
      offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    },
  ];

  if (faq?.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map(f => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <SEO
        title={seoTitle || `${title} — Honorífico`}
        description={seoDescription || description}
        path={path}
        jsonLd={jsonLd}
      />
      <main className="container py-8 sm:py-12 px-4 sm:px-6 space-y-8">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-2xl sm:text-4xl font-bold font-serif text-foreground">{title}</h1>
          <p className="text-base sm:text-lg text-muted-foreground">{description}</p>
          <div className="flex flex-wrap gap-2">
            {keywords.map(k => (
              <span key={k} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {k}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Calcule agora</CardTitle>
              </CardHeader>
              <CardContent>{children}</CardContent>
            </Card>

            <div className="prose dark:prose-invert max-w-none">
              <h2 className="text-xl font-semibold">Como funciona</h2>
              <p>
                Esta calculadora foi desenvolvida para advogados, estudantes de Direito e cidadãos que
                precisam de resultados precisos com base em dados oficiais. Todos os cálculos são
                executados nos servidores do Honorífico e acompanham a memória de cálculo ou a lista
                de dias não computados, quando aplicável.
              </p>
              {content}
            </div>

            {faq?.length ? (
              <section className="prose dark:prose-invert max-w-none">
                <h2 className="text-xl font-semibold">Perguntas frequentes</h2>
                <dl className="space-y-4 not-prose">
                  {faq.map(f => (
                    <div key={f.question} className="rounded-lg border border-border p-4">
                      <dt className="font-medium text-foreground">{f.question}</dt>
                      <dd className="mt-2 text-sm text-muted-foreground">{f.answer}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por que usar?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {features.map(f => (
                  <div key={f} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{f}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <p className="font-medium text-foreground">Acesse todas as calculadoras</p>
                <p className="text-sm text-muted-foreground">
                  O Honorífico reúne ferramentas jurídicas práticas em um só lugar.
                </p>
                <Button asChild className="w-full">
                  <Link to="/calculadoras">
                    Ver todas <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
