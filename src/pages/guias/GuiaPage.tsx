import { Link, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { getGuia, guiaJsonLd } from "@/seo/guias";
import { parseBlocks, parseInline, type Block, type Inline } from "@/seo/guiasMarkdown";
import NotFound from "@/pages/NotFound";

const linkCls = "text-navy underline underline-offset-4 decoration-navy/40 hover:decoration-gold";

function Inl({ items }: { items: Inline[] }) {
  return (
    <>
      {items.map((i, k) =>
        i.t === "text" ? (
          <span key={k}>{i.v}</span>
        ) : i.t === "strong" ? (
          <strong key={k} className="font-semibold text-navy">{i.v}</strong>
        ) : i.t === "em" ? (
          <em key={k}>{i.v}</em>
        ) : (
          <Link key={k} to={i.href} className={linkCls}>{i.v}</Link>
        ),
      )}
    </>
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, k) => {
        if (b.t === "p") return <p key={k}><Inl items={b.inl} /></p>;
        if (b.t === "ul")
          return (
            <ul key={k} className="list-disc space-y-2 pl-6 marker:text-navy/40">
              {b.items.map((it, j) => <li key={j}><Inl items={it} /></li>)}
            </ul>
          );
        if (b.t === "ol")
          return (
            <ol key={k} className="list-decimal space-y-2 pl-6 marker:text-navy/50">
              {b.items.map((it, j) => <li key={j}><Inl items={it} /></li>)}
            </ol>
          );
        return (
          <div key={k} className="overflow-x-auto rounded-lg border border-cream-dark bg-white">
            <table className="w-full font-sans text-[0.95rem] tabular-nums">
              <thead>
                <tr className="border-b border-cream-dark text-left">
                  {b.head.map((c, j) => <th key={j} className="p-3 font-medium text-navy"><Inl items={c} /></th>)}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, j) => (
                  <tr key={j} className="border-b border-cream-dark last:border-0">
                    {r.map((c, x) => <td key={x} className="p-3 text-navy/80"><Inl items={c} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}

export default function GuiaPage() {
  const { pathname } = useLocation();
  const g = getGuia(pathname.replace(/\/$/, ""));
  if (!g) return <NotFound />;
  const [primary, ...secondary] = g.cta.links;

  return (
    <div className="min-h-screen flex flex-col bg-cream text-navy">
      <SEO title={g.title} description={g.description} path={g.path} ogType="article" jsonLd={guiaJsonLd(g.path)} />
      <AppHeader />
      <main className="flex-1 px-4 py-12 sm:px-6 md:py-20">
        <article className="mx-auto max-w-[720px]">
          <nav aria-label="Trilha" className="text-note text-navy/60">
            <Link to="/" className="hover:underline">Início</Link>
            <span aria-hidden="true"> / </span>
            <Link to="/guias" className="hover:underline">Guias</Link>
          </nav>
          <h1 className="text-h1 mt-4 text-navy">{g.h1}</h1>
          <p className="mt-8 border-l-[3px] border-gold pl-5 text-body-serif text-navy/90">{g.resposta}</p>

          <div className="mt-4 space-y-5 text-body-serif text-navy/80">
            {g.sections.map((s) => (
              <section key={s.heading} className="space-y-5">
                <h2 className="text-h2 pt-8 text-navy">{s.heading}</h2>
                <Blocks blocks={parseBlocks(s.markdown)} />
              </section>
            ))}

            <section className="space-y-5">
              <h2 className="text-h2 pt-8 text-navy">Perguntas frequentes</h2>
              <dl>
                {g.faq.map((f) => (
                  <div key={f.question} className="border-t border-cream-dark py-5">
                    <dt className="text-h3 text-navy">{f.question}</dt>
                    <dd className="mt-2">{f.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <section className="mt-12 rounded-lg border border-cream-dark bg-white p-6 sm:p-8">
            <h2 className="text-h2 text-navy">Calcule grátis, sem cadastro</h2>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button asChild className="h-11 rounded bg-gold px-6 font-medium text-navy hover:bg-gold-light">
                <Link to={primary.to}>{primary.label}</Link>
              </Button>
              {secondary.map((l) => <Link key={l.to} to={l.to} className={`font-sans ${linkCls}`}>{l.label}</Link>)}
            </div>
            <p className="mt-6 font-sans text-navy/70">
              <Inl items={parseInline(g.cta.plano)} />{" "}
              <Link to="/planos" className={linkCls}>Ver planos</Link>
            </p>
          </section>

          <div className="mt-10 font-sans text-note text-navy/70">
            <p className="font-medium text-navy">Guias relacionados</p>
            <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
              {g.cta.related.map((l) => <li key={l.to}><Link to={l.to} className={linkCls}>{l.label}</Link></li>)}
            </ul>
            <p className="mt-8 italic text-navy/60">{g.cta.aviso}</p>
          </div>
        </article>
      </main>
      <AppFooter />
    </div>
  );
}
