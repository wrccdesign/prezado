import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import Index from "@/pages/Index";
import Diagnostico from "@/pages/Diagnostico";

type Aba = "documento" | "situacao";

/**
 * Porta de entrada única do caso: mesma promessa, duas formas de começar.
 * A aba inicial depende da rota, para não quebrar os links antigos.
 */
export default function MeuCaso() {
  const location = useLocation();
  const inicial: Aba = location.pathname.startsWith("/diagnostico") ? "situacao" : "documento";
  const [aba, setAba] = useState<Aba>(inicial);

  const tab = (id: Aba, titulo: string, apoio: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setAba(id)}
      aria-pressed={aba === id}
      className={`flex-1 rounded-lg border p-4 text-left transition-colors ${
        aba === id
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <span className="block text-sm font-medium text-foreground">{titulo}</span>
      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{apoio}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <PaymentTestModeBanner />
      <SEO
        title="Meu caso — Honorífico"
        description="Envie um documento ou descreva sua situação e receba uma leitura jurídica com direitos, riscos e próximos passos."
        path={location.pathname.startsWith("/diagnostico") ? "/diagnostico" : "/analise"}
      />
      <LegalDisclaimer />

      <main className="flex-1 container max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground">Meu caso</h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            Comece pelo que você tem em mãos. A resposta traz o que está acontecendo, qual é o
            direito e o que fazer em seguida.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {tab("documento", "Tenho um documento", "Contrato, notificação, print de conversa, PDF ou foto.")}
          {tab("situacao", "Vou descrever a situação", "Conte com suas palavras o que aconteceu, sem termo técnico.")}
        </div>

        {/* Ambas as abas ficam montadas: alternar não pode apagar texto, arquivo ou resultado já gerado. */}
        <div className="mt-6">
          <div hidden={aba !== "documento"}>
            <Index embedded />
          </div>
          <div hidden={aba !== "situacao"}>
            <Diagnostico embedded />
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
