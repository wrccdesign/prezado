import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { FaqSection } from "@/components/FaqSection";
import { JURISPRUDENCIA_TEMAS, jurisTemaPath } from "@/seo/jurisprudenciaTemas";
import { formatDateBR } from "@/lib/date";

export default function JurisprudenciaTemaLanding() {
  const { slug } = useParams<{ slug: string }>();
  const tema = JURISPRUDENCIA_TEMAS.find((t) => t.slug === slug);
  if (!tema) return <Navigate to="/jurisprudencia" replace />;

  const outros = JURISPRUDENCIA_TEMAS.filter((t) => t.slug !== tema.slug);
  const buscaUrl = `/jurisprudencia?q=${encodeURIComponent(tema.query)}`;

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <SEO title={tema.seoTitle} description={tema.seoDescription} path={jurisTemaPath(tema.slug)} />
      <AppHeader />

      <main className="flex-1 text-navy">
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <nav className="text-note text-navy/60 mb-6">
              <Link to="/jurisprudencia" className="underline underline-offset-4 hover:text-navy">
                Jurisprudência
              </Link>
              {" / "}
              {tema.title.replace("Jurisprudência sobre ", "")}
            </nav>
            <h1 className="text-h1 max-w-[22ch]">{tema.title}</h1>
            <p className="text-body-serif text-navy/80 max-w-[68ch] mt-6">{tema.description}</p>
          </div>
        </section>

        <section className="border-t border-cream-dark py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-h2">Base legal mais citada</h2>
            <div className="overflow-x-auto mt-8">
              <table className="w-full text-sm text-left min-w-[560px]">
                <thead>
                  <tr className="border-b border-cream-dark font-medium">
                    <th scope="col" className="py-3 pr-4">Norma</th>
                    <th scope="col" className="py-3 pr-4">O que estabelece</th>
                  </tr>
                </thead>
                <tbody>
                  {tema.legislacao.map((l) => (
                    <tr key={l.norma} className="border-b border-cream-dark">
                      <th scope="row" className="py-3 pr-4 font-medium align-top whitespace-nowrap">{l.norma}</th>
                      <td className="py-3 pr-4 align-top text-navy/80">{l.conteudo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-12 grid gap-10 md:grid-cols-2">
              {tema.paragraphs.map((p) => (
                <div key={p.heading}>
                  <h3 className="text-h3">{p.heading}</h3>
                  <p className="text-body-serif text-navy/80 mt-3 max-w-[60ch]">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-cream-dark py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-h2">Decisões do acervo</h2>
            <p className="text-navy/70 mt-3 max-w-[60ch]">
              Registros reais, com número do processo e link para o tribunal de origem.
            </p>
            <ol className="mt-8">
              {tema.decisoes.map((d) => (
                <li key={d.id} className="border-t border-cream-dark py-6">
                  <p className="font-medium">
                    {d.tribunal}, {d.tipo}, relatoria de {d.relator}, julgado em {formatDateBR(d.data)}
                  </p>
                  <p className="font-mono text-sm text-navy/70 mt-1">{d.numero}</p>
                  <p className="text-body-serif text-navy/80 mt-3 max-w-[68ch] line-clamp-4">{d.ementa}</p>
                  <div className="mt-3 flex flex-wrap gap-5 text-sm">
                    <a href={d.fonte} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-navy/70">
                      Ver fonte no tribunal
                    </a>
                    <Link to={`/decisao/${d.id}`} className="underline underline-offset-4 hover:text-navy/70">
                      Abrir a decisão
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
            <Button asChild size="lg" className="mt-8 bg-gold text-navy hover:bg-gold-light">
              <Link to={buscaUrl}>Pesquisar mais decisões</Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-cream-dark py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-h3">Para seguir com o caso</h2>
              <ul className="mt-4">
                {tema.ferramentas.map((f) => (
                  <li key={f.to} className="border-t border-cream-dark py-3">
                    <Link to={f.to} className="underline underline-offset-4 hover:text-navy/70">{f.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-h3">Outros temas</h2>
              <ul className="mt-4">
                {outros.map((t) => (
                  <li key={t.slug} className="border-t border-cream-dark py-3">
                    <Link to={jurisTemaPath(t.slug)} className="underline underline-offset-4 hover:text-navy/70">{t.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-t border-cream-dark py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
            <FaqSection items={tema.faq} />
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
