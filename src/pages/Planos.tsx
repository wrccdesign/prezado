import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SEO } from "@/components/SEO";
import { AppFooter } from "@/components/AppFooter";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, Crown, Building2, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, type PlanId } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PlanFeature {
  label: string;
  free: string | number;
  profissional: string | number;
  escritorio: string | number;
}

const features: PlanFeature[] = [
  { label: "Buscas de jurisprudência / dia", free: 5, profissional: 50, escritorio: 200 },
  { label: "Mensagens no Chat / dia", free: 3, profissional: 30, escritorio: 100 },
  { label: "Diagnósticos jurídicos / dia", free: 2, profissional: 15, escritorio: 50 },
  { label: "Análises de documentos / dia", free: 3, profissional: 30, escritorio: 100 },
  { label: "Leituras/OCR de documentos / dia", free: 5, profissional: 50, escritorio: 150 },
  { label: "Cálculos jurídicos / dia", free: 10, profissional: 100, escritorio: 300 },
  { label: "Petições geradas / dia", free: 0, profissional: 10, escritorio: 30 },
  {
    label: "Calculadoras (prazo, correção, rescisão, pensão, datas, CPF/CNPJ)",
    free: "✓",
    profissional: "✓",
    escritorio: "✓",
  },
  { label: "Busca pública de decisões", free: "✓", profissional: "✓", escritorio: "✓" },
  { label: "Modelos de minutas e petições", free: "✓", profissional: "✓", escritorio: "✓" },
  { label: "Exportação em PDF e Word", free: "✓", profissional: "✓", escritorio: "✓" },
  { label: "Histórico de consultas", free: "✓", profissional: "✓", escritorio: "✓" },
  { label: "Painel do advogado (clientes, petições, modelos)", free: "—", profissional: "✓", escritorio: "✓" },
];


type BillingCycle = "mensal" | "anual";

const plans: {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  annualPrice?: string;
  annualMonthly?: string;
  annualPriceId?: string;
  description: string;
  icon: typeof User;
  priceId?: string;
  popular?: boolean;
}[] = [
  {
    id: "free",
    name: "Gratuito",
    price: "R$ 0",
    period: "para sempre",
    description: "Acesso básico para conhecer a plataforma",
    icon: User,
  },
  {
    id: "profissional",
    name: "Profissional",
    price: "R$ 49",
    period: "/mês",
    annualPrice: "R$ 409",
    annualMonthly: "R$ 34,08",
    annualPriceId: "profissional_anual",
    description: "Para advogados que precisam de mais produtividade",
    icon: Crown,
    priceId: "profissional_mensal",
    popular: true,
  },
  {
    id: "escritorio",
    name: "Escritório",
    price: "R$ 149",
    period: "/mês",
    annualPrice: "R$ 1.249",
    annualMonthly: "R$ 104,08",
    annualPriceId: "escritorio_anual",
    description: "Para escritórios com alto volume de trabalho",
    icon: Building2,
    priceId: "escritorio_mensal",
  },
];


export default function Planos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { planId, isLoading, subscription } = useSubscription();
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const hasPaidPlan = planId !== "free";
  const [changingPlan, setChangingPlan] = useState<PlanId | null>(null);
  const isPastDue = subscription?.status === "past_due";


  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Pagamento realizado! Ativando seu plano...");
      // Webhook can take a few seconds — poll the subscription query.
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        window.dispatchEvent(new Event("refetch-subscription"));
        if (attempts >= 6) clearInterval(interval);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [searchParams, user?.id]);




  const handleSubscribe = async (plan: typeof plans[number]) => {
    if (!user) {
      navigate("/auth", { state: { redirectTo: "/planos" } });
      return;
    }
    if (!plan.priceId) return;

    // Already paying: change the existing subscription in-app instead of
    // opening a second checkout.
    if (hasPaidPlan) {
      setChangingPlan(plan.id);
      try {
        const { data, error } = await supabase.functions.invoke("billing-account", {
          body: { action: "change-plan", priceId: plan.priceId },
        });
        if (error) throw new Error(error.message);
        if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
        toast.success((data as { message?: string }).message || "Plano atualizado.");
        window.dispatchEvent(new Event("refetch-subscription"));
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Erro ao trocar de plano");
      } finally {
        setChangingPlan(null);
      }
      return;
    }

    try {
      openCheckout({
        priceId: plan.priceId,
        returnUrl: `${window.location.origin}/planos?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Erro ao iniciar checkout: " + message);
    }
  };


  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <SEO title="Planos e Preços — Honorífico" description="Compare os planos Gratuito, Profissional e Escritório do Honorífico. Assine e desbloqueie todas as ferramentas de IA jurídica." path="/planos" />
      <PaymentTestModeBanner />

      <main className="flex-1 container max-w-5xl py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-3">
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comece gratuitamente e evolua conforme sua necessidade. Todos os planos incluem acesso às calculadoras e busca pública.
          </p>
        </div>

        {isPastDue && (
          <div className="mb-8 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <p className="font-semibold text-destructive">Pagamento pendente</p>
            <p className="mt-1 text-muted-foreground">
              Sua última cobrança falhou. Atualize o meio de pagamento em{" "}
              <button className="underline font-medium" onClick={() => navigate("/conta")}>
                Minha conta
              </button>{" "}
              para manter o acesso.
            </p>
          </div>
        )}



        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => {
            const isCurrent = planId === plan.id;
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.popular
                    ? "border-accent shadow-lg ring-2 ring-accent/20"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-accent text-accent-foreground px-3 py-1 text-xs font-semibold">
                      Mais popular
                    </Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">
                      Seu plano
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <plan.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-heading">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  {plan.priceId && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Cobrança em reais (BRL). O processamento é internacional, portanto o
                      seu banco pode aplicar IOF sobre a compra.
                    </p>
                  )}
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-6 flex-1">
                    {features.map((feat) => {
                      const val = feat[plan.id];
                      const isBlocked = val === 0;
                      return (
                        <li key={feat.label} className="flex items-center gap-2 text-sm">
                          {isBlocked ? (
                            <X className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                          ) : (
                            <Check className="h-4 w-4 text-accent shrink-0" />
                          )}
                          <span className={isBlocked ? "text-muted-foreground line-through" : "text-foreground"}>
                            {feat.label}
                            {typeof val === "number" && val > 0 && (
                              <span className="font-semibold text-accent ml-1">({val})</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {plan.id === "free" ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isCurrent}
                      onClick={() => !user && navigate("/auth")}
                    >
                      {isCurrent ? "Plano atual" : user ? "Plano atual" : "Criar conta grátis"}
                    </Button>
                  ) : isCurrent ? (
                    <Button variant="outline" className="w-full" onClick={() => navigate("/conta")}>
                      Gerenciar assinatura
                    </Button>
                  ) : hasPaidPlan ? (
                    <Button
                      variant={plan.id === "escritorio" ? "default" : "outline"}
                      className="w-full"
                      disabled={changingPlan !== null}
                      onClick={() => handleSubscribe(plan)}
                    >
                      {changingPlan === plan.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {plan.id === "escritorio" ? `Fazer upgrade para ${plan.name}` : `Mudar para ${plan.name}`}
                    </Button>

                  ) : (
                    <Button
                      className={`w-full ${plan.popular ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
                      disabled={isLoading}
                      onClick={() => handleSubscribe(plan)}
                    >
                      Assinar {plan.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>Pagamentos processados de forma segura. Cancele a qualquer momento.</p>
          <p>Limites são renovados diariamente à meia-noite (horário de Brasília).</p>
        </div>
      </main>

      <Dialog open={isOpen} onOpenChange={(open) => !open && closeCheckout()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Finalizar assinatura</DialogTitle>
          </DialogHeader>
          {checkoutElement}
        </DialogContent>
      </Dialog>

      <AppFooter />
    </div>
  );
}
