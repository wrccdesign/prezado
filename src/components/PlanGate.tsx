import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock, Crown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription, type PlanId } from "@/hooks/useSubscription";

interface PlanGateProps {
  requiredPlan: "profissional" | "escritorio";
  children: ReactNode;
  title?: string;
  description?: string;
  featureLabel?: string;
}

const PLAN_ORDER: Record<PlanId, number> = { free: 0, profissional: 1, escritorio: 2 };
const PLAN_LABEL: Record<"profissional" | "escritorio", string> = {
  profissional: "Profissional",
  escritorio: "Escritório",
};

export function usePlanAccess(required: "profissional" | "escritorio") {
  const { planId, isLoading } = useSubscription();
  const currentTier = PLAN_ORDER[planId] ?? 0;
  const requiredTier = PLAN_ORDER[required] ?? 1;
  return { allowed: currentTier >= requiredTier, loading: isLoading, planId };
}

export function PlanGate({
  requiredPlan,
  children,
  title,
  description,
  featureLabel,
}: PlanGateProps) {
  const { allowed, loading } = usePlanAccess(requiredPlan);

  if (loading) {
    return <div className="animate-pulse text-muted-foreground py-8 text-center text-sm">Carregando...</div>;
  }
  if (allowed) return <>{children}</>;

  const Icon = requiredPlan === "escritorio" ? Building2 : Crown;
  const planName = PLAN_LABEL[requiredPlan];

  return (
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none select-none [filter:blur(6px)] opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="mx-4 max-w-sm rounded-xl border bg-card p-6 text-center shadow-lg">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {title || `Recurso exclusivo do plano ${planName}`}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {description ||
              `${featureLabel || "Este recurso"} está disponível no plano ${planName}. Faça upgrade para desbloquear.`}
          </p>
          <Button asChild size="sm" className="mt-4 w-full">
            <Link to="/planos">
              <Lock className="mr-2 h-3.5 w-3.5" />
              Ver planos
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
