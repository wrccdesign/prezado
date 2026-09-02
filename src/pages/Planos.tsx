import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SEO } from "@/components/SEO";
import { AppFooter } from "@/components/AppFooter";
import { FaqSection } from "@/components/FaqSection";
import { buildFaqJsonLd, FAQ_PLANOS } from "@/seo/faqData";
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
  { label: "Calculadoras (correção, prazo, custas TJSP, rescisão, pensão, datas, CPF/CNPJ)", free: "Ilimitado", profissional: "Ilimitado", escritorio: "Ilimitado" },
  { label: "Petições geradas / mês", free: 0, profissional: 60, escritorio: 200 },
  { label: "Consulta pública de andamentos e decisões publicadas", free: "✓", profissional: "✓", escritorio: "✓" },
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

const faqItems = FAQ_PLANOS;

const faqJsonLd = buildFaqJsonLd(faqItems);



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
    <div className="flex min-h-screen flex-col bg-cream text-navy">
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
              "Cálculos e prazos jurídicos com fonte oficial, mais petições, análise de documentos e consulta processual com IA.",
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
          faqJsonLd,
        ]}

      />
      <PaymentTestModeBanner />

      <main className="container max-w-5xl flex-1 px-4 py-12">
        <div className="max-w-[60ch] space-y-4">
          <h1 className="text-h1 text-navy">Escolha seu plano</h1>
          <p className="text-body-serif text-navy/80">
            As calculadoras são livres e ilimitadas em todos os planos, inclusive sem conta. A
            assinatura libera a IA (petições, análise de documentos, diagnóstico e chat), o
            histórico salvo e o volume de consulta processual. As cotas são mensais e renovam no
            primeiro dia de cada mês.
          </p>
          <p className="text-note text-navy/70">
            Toda conta nova começa com 7 dias grátis no plano Profissional, sem cartão.
          </p>
        </div>

        {isPastDue && (
          <div className="mt-8 rounded-lg border border-destructive/40 bg-white p-4 text-sm">
            <p className="text-destructive">Pagamento pendente</p>
            <p className="mt-1 text-navy/70">
              Sua última cobrança falhou. Atualize o meio de pagamento em{" "}
              <button className="underline underline-offset-4 hover:text-gold" onClick={() => navigate("/conta")}>
                Minha conta
              </button>{" "}
              para manter o acesso.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-2">
          <div className="inline-flex w-fit rounded border border-cream-dark bg-white p-1">
            <button
              type="button"
              onClick={() => setCycle("mensal")}
              className={`rounded-sm px-4 py-2 text-sm transition-colors ${
                cycle === "mensal" ? "bg-navy text-cream" : "text-navy/70 hover:text-navy"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setCycle("anual")}
              className={`rounded-sm px-4 py-2 text-sm transition-colors ${
                cycle === "anual" ? "bg-navy text-cream" : "text-navy/70 hover:text-navy"
              }`}
            >
              Anual, 30% menor
            </button>
          </div>
          {cycle === "anual" && (
            <p className="text-note text-navy/60">
              Pagamento único de 12 meses, à vista no cartão. Sem renovação automática.
            </p>
          )}
          {cycle === "anual" && creditCents !== null && creditCents > 0 && (
            <p className="text-note text-navy/70">
              Crédito de {(creditCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} pelo
              período não usado da sua assinatura mensal será aplicado no checkout.
            </p>
          )}
        </div>



        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = planId === plan.id;
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-lg border bg-white p-6 ${
                  plan.popular
                    ? "border-gold shadow-[0_8px_24px_hsl(var(--navy)/0.12)]"
                    : "border-cream-dark"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-h3 text-navy">{plan.name}</h2>
                  {plan.popular && <span className="text-note text-gold">Mais escolhido</span>}
                  {isCurrent && <span className="text-note text-navy/60">Seu plano</span>}
                </div>
                <p className="mt-1 text-sm text-navy/70">{plan.description}</p>

                {cycle === "anual" && plan.annualPrice ? (
                  <div className="mt-5">
                    <span className="tabular text-3xl text-navy">{plan.annualPrice}</span>
                    <span className="text-note text-navy/60">/ano</span>
                    <p className="mt-1 text-note text-navy/60">
                      Equivale a {plan.annualMonthly} por mês, economia de 30%
                    </p>
                  </div>
                ) : (
                  <div className="mt-5">
                    <span className="tabular text-3xl text-navy">{plan.price}</span>
                    <span className="text-note text-navy/60">{plan.period}</span>
                  </div>
                )}
                {plan.priceId && (
                  <p className="mt-2 text-note text-navy/60">
                    Cobrança em reais (BRL). O processamento é internacional, portanto o seu banco
                    pode aplicar IOF sobre a compra.
                  </p>
                )}

                <div className="mt-6 flex-1" />

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
                    className={`w-full ${plan.popular ? "bg-gold text-navy hover:bg-gold-light" : ""}`}
                    disabled={isLoading}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {isCurrent ? "Migrar para o anual" : `Assinar ${plan.name} anual`}
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
                    {changingPlan === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {plan.id === "escritorio" ? `Fazer upgrade para ${plan.name}` : `Mudar para ${plan.name}`}
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${plan.popular ? "bg-gold text-navy hover:bg-gold-light" : ""}`}
                    disabled={isLoading}
                    onClick={() => handleSubscribe(plan)}
                  >
                    Assinar {plan.name}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <section className="mt-14">
          <h2 className="text-h2 text-navy">O que cada plano libera</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-cream-dark">
                  <th scope="col" className="py-2 pr-4 text-note text-navy/60">Recurso</th>
                  <th scope="col" className="py-2 px-3 text-right text-note text-navy/60">Gratuito</th>
                  <th scope="col" className="py-2 px-3 text-right text-note text-navy/60">Profissional</th>
                  <th scope="col" className="py-2 pl-3 text-right text-note text-navy/60">Escritório</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feat) => (
                  <tr key={feat.label} className="border-b border-cream-dark">
                    <td className="py-2 pr-4 text-sm text-navy/80">{feat.label}</td>
                    <td className="py-2 px-3 text-right text-sm text-navy tabular">{feat.free === 0 ? "" : feat.free}</td>
                    <td className="py-2 px-3 text-right text-sm text-navy tabular">{feat.profissional === 0 ? "" : feat.profissional}</td>
                    <td className="py-2 pl-3 text-right text-sm text-navy tabular">{feat.escritorio === 0 ? "" : feat.escritorio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>


        <div className="mt-8 space-y-1 text-note text-navy/60">
          <p>Pagamentos processados de forma segura. Cancele a qualquer momento.</p>
          <p>Limites são renovados mensalmente, no primeiro dia de cada mês (horário de Brasília).</p>
        </div>

        <FaqSection items={faqItems} className="mt-14 max-w-3xl" />

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
