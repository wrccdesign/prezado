import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { GUIAS, GUIAS_HEADING } from "@/seo/guias";

export default function GuiasIndex() {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-navy">
      <SEO title="Guias | Honorífico" description="Guias sobre correção monetária e juros." path="/guias" />
      <AppHeader />
      <main className="flex-1 px-4 py-12 sm:px-6 md:py-20">
        <div className="mx-auto max-w-[720px]">
          <h1 className="text-h1 text-navy">{GUIAS_HEADING}</h1>
          <p className="mt-6 text-body-serif text-navy/75">Correção monetária e juros depois da Lei 14.905/2024, com base legal e exemplos.</p>
          <ul className="mt-10">
            {GUIAS.map((g) => (
              <li key={g.path} className="border-t border-cream-dark py-6">
                <Link to={g.path} className="text-h3 text-navy underline-offset-4 hover:underline">{g.h1}</Link>
                <p className="mt-2 font-sans text-navy/70">{g.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
