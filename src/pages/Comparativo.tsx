import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { FonteTable } from "@/components/FonteTable";

const columns = [
  "Honorífico",
  "IA generalista (ChatGPT, Claude, Gemini)",
  "Portal de jurisprudência com IA (Jus IA)",
  "Gestão de escritório (Advbox)",
];

const rows: { label: string; cells: string[] }[] = [
  {
    label: "Origem do precedente",
    cells: [
      "CNJ/DataJud, registro oficial do Judiciário",
      "Vem do modelo, sem registro oficial vinculado",
      "Acervo próprio da plataforma",
      "Não se aplica",
    ],
  },
  {
    label: "Link para conferir na fonte oficial",
    cells: [
      "Sim, para o tribunal de origem",
      "Depende do uso, sem vínculo ao registro oficial",
      "Para o acervo da própria plataforma",
      "Não se aplica",
    ],
  },
  {
    label: "Quando não há decisão",
    cells: [
      "A resposta diz que não encontrou",
      "Pode preencher o vazio",
      "Depende do acervo",
      "Não se aplica",
    ],
  },
  {
    label: "Cálculo com série oficial",
    cells: [
      "Banco Central (SGS), com memória de cálculo mês a mês",
      "Sem série oficial vinculada",
      "Não é o foco",
      "Depende do módulo",
    ],
  },
  {
    label: "Petição a partir dos fatos",
    cells: [
      "Sim, em etapas com aprovação de teses e precedentes",
      "Sim, sem fonte vinculada",
      "Sim, com o acervo da plataforma",
      "Modelos e templates",
    ],
  },
  {
    label: "Exportação",
    cells: [
      "Petição e memória de cálculo em PDF e Word",
      "Texto para copiar",
      "Depende do plano",
      "Depende do plano",
    ],
  },
];

export default function Comparativo() {
  return (
    <div className="min-h-screen font-sans bg-cream text-navy">
      <SEO
        title="Comparativo de ferramentas"
        description="Comparativo entre o Honorífico, assistentes de IA generalistas, portais de jurisprudência e sistemas de gestão."
        path="/comparativo"
      />

      <AppHeader />

      <section className="bg-cream text-navy py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <h1 className="text-h1 max-w-[20ch]">Por que a fonte importa mais que a ferramenta</h1>
          <p className="text-body-serif text-navy/80 max-w-[60ch] mt-6">
            Toda IA jurídica gera texto. A diferença está em de onde vem o precedente e se você consegue conferir antes de protocolar.
          </p>

          <div className="overflow-x-auto mt-10">
            <table className="w-full text-sm text-left min-w-[720px]">
              <thead>
                <tr className="border-b border-cream-dark font-medium align-bottom">
                  <th scope="col" className="py-3 pr-4 sticky left-0 bg-cream"></th>
                  {columns.map((c) => (
                    <th key={c} scope="col" className="py-3 pr-4 align-bottom">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-b border-cream-dark">
                    <th scope="row" className="py-3 pr-4 font-medium align-top sticky left-0 bg-cream">{r.label}</th>
                    {r.cells.map((cell, i) => (
                      <td key={i} className={`py-3 pr-4 align-top ${i === 0 ? "" : "text-navy/70"}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-note text-navy/60 mt-4">
            As colunas de terceiros descrevem a categoria de ferramenta, não uma auditoria de produto. Verifique as condições atuais em cada serviço.
          </p>
        </div>
      </section>

      <section className="bg-cream text-navy border-t border-cream-dark py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <FonteTable
            title="Sem fonte e com fonte, lado a lado"
            linkLabel="Consultar processos"
            linkTo="/jurisprudencia"
          />
        </div>
      </section>

      <section className="bg-navy py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-h2 text-cream">Comece pelo caso que está na sua mesa agora.</h2>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-5">
            <Button asChild size="lg" className="bg-gold text-navy hover:bg-gold-light">
              <Link to="/auth">Criar conta grátis</Link>
            </Button>
            <Link to="/planos" className="text-cream/72 underline underline-offset-4 hover:text-cream">
              Ver planos
            </Link>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
