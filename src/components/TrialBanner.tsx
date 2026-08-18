import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Faixa exibida durante o teste grátis de 7 dias do plano Profissional.
 * Fica em tom de alerta nos últimos 3 dias (5º dia em diante).
 */
export function TrialBanner() {
  const { isTrial, trialDaysLeft } = useSubscription();
  if (!isTrial) return null;

  const urgent = trialDaysLeft <= 3;
  const label =
    trialDaysLeft <= 1
      ? "termina hoje"
      : `${trialDaysLeft} dias restantes`;

  return (
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
  );
}
