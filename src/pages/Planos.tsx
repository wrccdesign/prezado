import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SEO } from "@/components/SEO";
import { AppFooter } from "@/components/AppFooter";
import { FaqSection } from "@/components/FaqSection";
import { buildFaqJsonLd, FAQ_PLANOS } from "@/seo/faqData";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Crown, Building2, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, type PlanId } from "@/hooks/useSubscription";
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
 { label: "Painel do advogado (clientes, petições, modelos)", free: "", profissional: "✓", escritorio: "✓" },
 { label: "Timbre personalizado nas petições (logo e identificação)", free: "", profissional: "", escritorio: "✓" },

];



type BillingCycle = "mensal" | "anual";
type MonthlyBillingType = "CREDIT_CARD" | "PIX";

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
  const { planId, isLoading, subscription, isTrial, trialEndsAt } = useSubscription();
  // Teste grátis não é assinatura: não permite troca de plano, só contratação.
  const hasPaidPlan = planId !== "free" && !isTrial;
  const trialEndLabel = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : null;
  const [changingPlan, setChangingPlan] = useState<PlanId | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("mensal");
  
  const [pendingPriceId, setPendingPriceId] = useState<string | null>(null);
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [monthlyBillingType, setMonthlyBillingType] = useState<MonthlyBillingType>("CREDIT_CARD");
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const isPastDue = subscription?.status === "past_due";


  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Pagamento realizado! Ativando seu plano...");
      // Webhook can take a few seconds, poll the subscription query.
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        window.dispatchEvent(new Event("refetch-subscription"));
        if (attempts >= 6) clearInterval(interval);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [searchParams, user?.id]);

  // Asaas não faz rateio proporcional: alterações valem na cobrança seguinte.

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
        const { data, error } = await supabase.functions.invoke("asaas-billing-account", {
          body: { action: "change-plan", newPriceId: priceId },
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

    setPendingPriceId(priceId);
  };

  const startCheckout = async () => {
    if (!pendingPriceId) return;
    const digits = cpfCnpj.replace(/\D/g, "");
    if (digits.length !== 11 && digits.length !== 14) {
      toast.error("Informe um CPF ou CNPJ válido.");
      return;
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      toast.error("Informe um telefone com DDD.");
      return;
    }
    setIsCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-create-checkout", {
        body: {
          priceId: pendingPriceId,
          cpfCnpj: digits,
          phone: phoneDigits,
          billingType: pendingPriceId.endsWith("_mensal") ? monthlyBillingType : undefined,
          returnUrl: `${window.location.origin}/planos?checkout=success`,
        },
      });
      if (error) {
        // A função devolve a mensagem legível no corpo da resposta.
        let detail = "";
        const context = (error as { context?: Response }).context;
        if (context && typeof context.json === "function") {
          const body = await context.json().catch(() => null);
          detail = (body as { error?: string } | null)?.error ?? "";
        }
        throw new Error(detail || error.message);
      }
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      const checkoutUrl = (data as { checkoutUrl?: string }).checkoutUrl;
      if (!checkoutUrl) throw new Error("URL de checkout não retornada");
      const opened = window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        toast.error("Seu navegador bloqueou a janela de pagamento.", {
          description: "Toque em abrir para continuar.",
          action: {
            label: "Abrir pagamento",
            onClick: () => window.open(checkoutUrl, "_blank", "noopener,noreferrer"),
          },
          duration: 15000,
        });
      }
      setIsCheckoutLoading(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message.toLowerCase().includes("pix")) {
        setMonthlyBillingType("CREDIT_CARD");
        toast.error(message);
      } else {
        toast.error(
          message
            ? "Não foi possível iniciar o pagamento: " + message
            : "Não foi possível iniciar o pagamento. Tente novamente em instantes.",
        );
      }
      setIsCheckoutLoading(false);
    }

  };



  return (
    <div className="flex min-h-screen flex-col bg-cream text-navy">
      <AppHeader />

      <SEO
        title="Planos e Preços | Honorífico"
        description="Gratuito, Profissional (R$ 49/mês) e Escritório. 7 dias grátis no Profissional, sem cartão. Pagamento em reais."
        path="/planos"
        image="/og/planos.jpg"
        imageAlt="Planos e preços do Honorífico a partir de R$ 49 por mês"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Honorífico, IA jurídica",
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
          {isTrial && (
            <p className="text-note text-navy/70">
              Você está no teste grátis do Profissional
              {trialEndLabel ? `. Ele termina em ${trialEndLabel}` : ""} e depois a conta volta
              para o plano Gratuito. Nada foi cobrado.
            </p>
          )}
          {hasPaidPlan && cycle === "mensal" && (
            <p className="text-note text-navy/70">
              Ao trocar de plano, a alteração passa a valer na próxima cobrança. Não há cobrança
              nem crédito proporcional agora.
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
                  {isCurrent && (
                    <span className="text-note text-navy/60">
                      {isTrial
                        ? trialEndLabel
                          ? `Teste grátis, termina em ${trialEndLabel}`
                          : "Teste grátis"
                        : "Seu plano"}
                    </span>
                  )}
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
                    Cobrança em reais (BRL), processada no Brasil. No mensal, escolha cartão com
                    cobrança automática ou Pix com pagamento manual a cada mês. O anual aceita Pix e cartão.
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
                    {isCurrent && !isTrial ? "Migrar para o anual" : `Assinar ${plan.name} anual`}
                  </Button>
                ) : isTrial ? (
                  <Button
                    className={`w-full ${plan.popular ? "bg-gold text-navy hover:bg-gold-light" : ""}`}
                    disabled={isLoading}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {`Assinar ${plan.name}`}
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

        <Dialog open={!!pendingPriceId} onOpenChange={(open) => { if (!open) { setPendingPriceId(null); setCpfCnpj(""); setPhone(""); setMonthlyBillingType("CREDIT_CARD"); } }}>
          <DialogContent className="bg-cream text-navy border-cream-dark">
            <DialogHeader>
              <DialogTitle>Dados para a cobrança</DialogTitle>
              <DialogDescription>
                Precisamos do CPF/CNPJ e do telefone do responsável pelo pagamento.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {pendingPriceId?.endsWith("_mensal") && (
                <div className="space-y-2">
                  <Label>Forma de pagamento mensal</Label>
                  <RadioGroup
                    value={monthlyBillingType}
                    onValueChange={(value) => setMonthlyBillingType(value as MonthlyBillingType)}
                    className="gap-3"
                  >
                    <label className="flex cursor-pointer items-start gap-3 rounded border border-cream-dark bg-white p-3">
                      <RadioGroupItem value="CREDIT_CARD" id="billing-card" className="mt-0.5" />
                      <span>
                        <span className="block text-sm text-navy">Cartão de crédito</span>
                        <span className="block text-note text-navy/60">Cobrança automática todo mês.</span>
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3 rounded border border-cream-dark bg-white p-3">
                      <RadioGroupItem value="PIX" id="billing-pix" className="mt-0.5" />
                      <span>
                        <span className="block text-sm text-navy">Pix</span>
                        <span className="block text-note text-navy/60">Pagamento manual da nova cobrança a cada mês.</span>
                      </span>
                    </label>
                  </RadioGroup>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  className="bg-white border-cream-dark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone com DDD</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                  className="bg-white border-cream-dark"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setPendingPriceId(null); setCpfCnpj(""); setPhone(""); setMonthlyBillingType("CREDIT_CARD"); }}>
                Cancelar
              </Button>
              <Button
                onClick={startCheckout}
                disabled={isCheckoutLoading}
                className="bg-gold text-navy hover:bg-gold-light"
              >
                {isCheckoutLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Continuar para pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>


      <AppFooter />
    </div>
  );
}
