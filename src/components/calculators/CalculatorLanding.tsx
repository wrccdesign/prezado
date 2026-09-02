import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { FaqSection, buildFaqJsonLd } from "@/components/FaqSection";
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
  /** Título usado em title/og:title. Se omitido, usa `${title} | Honorífico`. */
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
    jsonLd.push(buildFaqJsonLd(faq));
  }

  return (
    <div className="min-h-screen bg-cream text-navy">
      <AppHeader />
      <SEO
        title={seoTitle || `${title} | Honorífico`}
        description={seoDescription || description}
        path={path}
        jsonLd={jsonLd}
      />
      <main className="container px-4 py-12 sm:px-6 md:py-16">
        <div className="max-w-[60ch] space-y-5">
          <h1 className="text-h1 text-navy">{title}</h1>
          <p className="text-body-serif text-navy/80">{description}</p>
          <p className="text-note text-navy/60">{keywords.join(", ")}</p>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-3">
          <div className="space-y-12 lg:col-span-2">
            <section>
              <h2 className="text-h3 text-navy">Calcule agora</h2>
              <div className="mt-5 rounded-lg border border-cream-dark bg-white p-5 sm:p-6">
                {children}
              </div>
            </section>

            <section className="border-t border-cream-dark pt-10">
              <h2 className="text-h2 text-navy">Como funciona</h2>
              <div className="mt-4 max-w-[68ch] space-y-4 text-body-serif text-navy/80 [&_a]:text-navy [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-h3 [&_h2]:text-navy [&_h2]:mt-8">
                <p>
                  O cálculo é livre, sem conta. Todos os cálculos são executados nos servidores do
                  Honorífico e acompanham a memória de cálculo ou a lista de dias não computados,
                  quando aplicável.
                </p>
                {content}
              </div>
            </section>

            {faq?.length ? (
              <section className="border-t border-cream-dark pt-10">
                <FaqSection items={faq} />
              </section>
            ) : null}
          </div>

          <aside className="space-y-10">
            <section>
              <h2 className="text-h3 text-navy">O que esta calculadora entrega</h2>
              <ul className="mt-4">
                {features.map(f => (
                  <li key={f} className="border-t border-cream-dark py-3 text-sm text-navy/80">
                    {f}
                  </li>
                ))}
              </ul>
            </section>

            <section className="border-t border-cream-dark pt-6">
              <h2 className="text-h3 text-navy">Todas as calculadoras</h2>
              <p className="mt-3 text-sm text-navy/70">
                Correção monetária, prazo processual, custas, rescisão, pensão, datas e validação de
                CPF e CNPJ, no mesmo lugar.
              </p>
              <Link
                to="/calculadoras"
                className="mt-3 inline-block text-navy underline underline-offset-4 hover:text-gold"
              >
                Ver todas
              </Link>
            </section>
          </aside>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
