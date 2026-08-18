import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

/** Perdas reais ao voltar ao gratuito — números iguais aos do PLAN_LIMITS. */
const PERDAS = [
  "Petições com IA deixam de estar disponíveis",
  "Buscas de jurisprudência caem de 400 para 20 por mês",
  "Chat jurídico cai de 200 para 10 mensagens por mês",
  "Análises de documentos caem de 40 para 3 por mês",
  "Cálculos jurídicos caem de 150 para 5 por mês",
];

/**
 * Faixa exibida durante o teste grátis de 7 dias do plano Profissional.
 * Nos marcos de 5º e último dia, abre também um card dispensável explicando
 * o que se perde ao voltar para o gratuito.
 */
export function TrialBanner() {
  const { isTrial, trialDaysLeft } = useSubscription();
  // Marcos: 5º dia do teste (3 dias restantes) e último dia.
  const milestone = trialDaysLeft <= 1 ? "final" : trialDaysLeft === 3 ? "dia5" : null;
  const storageKey = milestone ? `trial-milestone-dismissed:${milestone}` : "";
  const [dismissed, setDismissed] = useState(
    () => !!storageKey && localStorage.getItem(storageKey) === "1",
  );

  if (!isTrial) return null;

  const urgent = trialDaysLeft <= 3;
  const label = trialDaysLeft <= 1 ? "termina hoje" : `${trialDaysLeft} dias restantes`;

  const dismiss = () => {
    if (storageKey) localStorage.setItem(storageKey, "1");
    setDismissed(true);
  };

  return (
    <>
      <div
        className={`w-full border-b text-sm ${
          urgent
            ? "border-gold/40 bg-gold/15 text-foreground"
            : "border-border bg-muted/50 text-foreground"
        }`}
      >
        <div className="container flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 text-center">
          <Sparkles className="h-4 w-4 text-gold" />
          <span className="font-medium">Teste Profissional — {label}.</span>
          <span className="text-muted-foreground">
            Assine para não perder os limites ampliados.
          </span>
          <Link to="/planos" className="font-semibold text-gold hover:underline">
            Ver planos
          </Link>
        </div>
      </div>

      {milestone && !dismissed && (
        <div className="container px-4 py-3">
          <div className="relative rounded-lg border border-gold/40 bg-gold/10 p-4">
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dispensar aviso"
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="pr-8 font-heading text-base font-semibold text-foreground">
              {milestone === "final"
                ? "Seu teste Profissional termina hoje"
                : "Faltam 3 dias do seu teste Profissional"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ao voltar para o plano gratuito, você perde:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              {PERDAS.map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
            <Link
              to="/planos"
              className="mt-3 inline-block text-sm font-semibold text-gold hover:underline"
            >
              Manter os limites — ver planos
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
