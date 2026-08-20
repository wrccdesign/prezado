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
  { label: "Consultas processuais (andamentos) / mês", free: 20, profissional: 400, escritorio: 1500 },
  { label: "Mensagens no Chat / mês", free: 10, profissional: 200, escritorio: 800 },
  { label: "Diagnósticos jurídicos / mês", free: 1, profissional: 60, escritorio: 200 },
  { label: "Análises de documentos / mês", free: 3, profissional: 40, escritorio: 150 },
  { label: "Leituras/OCR de documentos / mês", free: 5, profissional: 80, escritorio: 300 },
  { label: "Cálculos jurídicos / mês", free: 5, profissional: 150, escritorio: 500 },

  { label: "Petições geradas / mês", free: 0, profissional: 60, escritorio: 200 },
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
  const [cycle, setCycle] = useState<BillingCycle>("mensal");
  const [creditCents, setCreditCents] = useState<number | null>(null);
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

  // Estimate the pro-rata credit from an active monthly subscription.
  useEffect(() => {
    if (!user || cycle !== "anual" || !hasPaidPlan) {
      setCreditCents(null);
      return;
    }
    let cancelled = false;
    supabase.functions
      .invoke("billing-account", { body: { action: "credit-estimate", priceId: "profissional_anual" } })
      .then(({ data }) => {
        if (!cancelled) setCreditCents((data as { credit_cents?: number })?.credit_cents ?? 0);
      })
      .catch(() => setCreditCents(null));
    return () => {
      cancelled = true;
    };
  }, [user, cycle, hasPaidPlan]);

  const handleSubscribe = async (plan: typeof plans[number]) => {
    if (!user) {
      navigate("/auth", { state: { redirectTo: "/planos" } });
      return;
    }
    const annual = cycle === "anual" && !!plan.annualPriceId;
    const priceId = annual ? plan.annualPriceId! : plan.priceId;
    if (!priceId) return;

    // Already on a recurring plan and staying monthly: change the existing
    // subscription in-app instead of opening a second checkout.
    if (hasPaidPlan && !annual) {
      setChangingPlan(plan.id);
      try {
        const { data, error } = await supabase.functions.invoke("billing-account", {
          body: { action: "change-plan", priceId },
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
        priceId,
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
      <SEO
        title="Planos e Preços — Honorífico"
        description="Gratuito, Profissional (R$ 49/mês) e Escritório. 7 dias grátis no Profissional, sem cartão. Pagamento em reais."
        path="/planos"
        image="/og/planos.jpg"
        imageAlt="Planos e preços do Honorífico a partir de R$ 49 por mês"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Honorífico — IA jurídica",
            description:
              "Plataforma de IA jurídica brasileira: análise de documentos, petições, consulta processual e calculadoras.",
            brand: { "@type": "Brand", name: "Honorífico" },
            offers: [
              {
                "@type": "Offer",
                name: "Gratuito",
                price: "0",
                priceCurrency: "BRL",
                url: "https://honorifico.com.br/planos",
              },
              {
                "@type": "Offer",
                name: "Profissional",
                price: "49",
                priceCurrency: "BRL",
                url: "https://honorifico.com.br/planos",
              },
              {
                "@type": "Offer",
                name: "Escritório",
                price: "149",
                priceCurrency: "BRL",
                url: "https://honorifico.com.br/planos",
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início", item: "https://honorifico.com.br/" },
              { "@type": "ListItem", position: 2, name: "Planos", item: "https://honorifico.com.br/planos" },
            ],
          },
        ]}
      />
      <PaymentTestModeBanner />

      <main className="flex-1 container max-w-5xl py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-3">
            Escolha seu plano
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comece gratuitamente e evolua conforme sua necessidade. Todos os planos incluem acesso às calculadoras e busca pública.
            As cotas são mensais e renovam no primeiro dia de cada mês.
          </p>
          <p className="mt-3 text-sm font-medium text-accent">
            Toda conta nova começa com 7 dias grátis no plano Profissional — sem cartão.
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

        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setCycle("mensal")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                cycle === "mensal" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setCycle("anual")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                cycle === "anual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Anual
              <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                -30%
              </span>
            </button>
          </div>
          {cycle === "anual" && (
            <p className="text-xs text-muted-foreground text-center max-w-md">
              Pagamento único de 12 meses, à vista no Pix ou cartão. Sem renovação automática.
            </p>
          )}
          {cycle === "anual" && creditCents !== null && creditCents > 0 && (
            <p className="text-xs font-medium text-accent text-center">
              Crédito de {(creditCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} pelo
              período não usado da sua assinatura mensal será aplicado no checkout.
            </p>
          )}
        </div>


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
                  {cycle === "anual" && plan.annualPrice ? (
                    <>
                      <div className="mt-4">
                        <span className="text-3xl font-bold text-foreground">{plan.annualPrice}</span>
                        <span className="text-muted-foreground text-sm">/ano</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Equivale a {plan.annualMonthly}/mês · economia de 30%
                      </p>
                    </>
                  ) : (
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                  )}
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
                      disabled={!!user && isCurrent}
                      onClick={() => !user && navigate("/auth?mode=signup")}
                    >
                      {user ? (isCurrent ? "Plano atual" : "Incluído na sua conta") : "Criar conta grátis"}
                    </Button>

                  ) : cycle === "anual" && plan.annualPriceId ? (
                    <Button
                      className={`w-full ${plan.popular ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
                      disabled={isLoading}
                      onClick={() => handleSubscribe(plan)}
                    >
                      {isCurrent ? `Migrar para o anual` : `Assinar ${plan.name} anual`}
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
          <p>Limites são renovados mensalmente, no primeiro dia de cada mês (horário de Brasília).</p>
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
