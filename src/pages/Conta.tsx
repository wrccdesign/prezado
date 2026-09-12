import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { UsageSummary } from "@/components/UsageSummary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, ArrowUpCircle, ExternalLink, Loader2, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useSubscription } from "@/hooks/useSubscription";
import { LetterheadCard } from "@/components/LetterheadCard";
import { toast } from "sonner";


interface Invoice {
  id: string;
  value: number;
  status: string;
  date: string | null;
  url?: string;
  billingType?: string;
}

interface AccessInfo {
  id: string;
  status: string;
  planId: string;
  pendingPlanId?: string | null;
  accessType?: "recurring" | "one_time";
  accessExpiresAt?: string | null;
  currentPeriodEnd: string | null;
  currentPeriodStart: string | null;
  nextPaymentUrl?: string;
  cancelAtPeriodEnd: boolean;
}

interface Summary {
  environment: "sandbox" | "live";
  subscriptions: AccessInfo[];
  invoices: Invoice[];
}


const PLAN_LABEL: Record<string, string> = {
  free: "Gratuito",
  profissional: "Profissional",
  escritorio: "Escritório",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Ativa",
  trialing: "Em teste",
  past_due: "Pagamento pendente",
  paused: "Pausada",
  canceled: "Cancelada",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function Conta() {
  const { user } = useAuth();
  const { isLawyer } = useUserProfile();
  const { isEscritorio, isTrial, trialEndsAt } = useSubscription();
  const trialEndLabel = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : null;

  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["account-summary", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("asaas-billing-account", {
        body: { action: "summary" },
      });
      if (error) throw new Error(error.message);
      return data as Summary;
    },
  });

  const run = async (action: string, payload: Record<string, unknown> = {}) => {
    setBusy(action);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-billing-account", {
        body: { action, ...payload },
      });
      if (error) throw new Error(error.message);
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      toast.success((data as { message?: string }).message || "Feito.");
      queryClient.invalidateQueries({ queryKey: ["account-summary"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar solicitação");
    } finally {
      setBusy(null);
    }
  };

  const activeSubs = data?.subscriptions ?? [];
  const sub = activeSubs[0] ?? null;
  const planId = sub?.planId ?? "free";
  const isOneTime = sub?.accessType === "one_time";
  const isPastDue = sub?.status === "past_due";
  const daysLeft = isOneTime && sub?.accessExpiresAt
    ? Math.ceil((new Date(sub.accessExpiresAt).getTime() - Date.now()) / 86400000)
    : null;
  const expiryWarning = daysLeft !== null && daysLeft <= 30;
  const pendingPlanLabel = sub?.pendingPlanId ? PLAN_LABEL[sub.pendingPlanId] ?? null : null;


  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <SEO
        title="Minha conta — Honorífico"
        description="Gerencie sua assinatura Honorífico: plano atual, próxima cobrança, faturas, upgrade e cancelamento."
        path="/conta"
      />
      <PaymentTestModeBanner />

      <main className="container max-w-3xl flex-1 px-4 py-10">
        <h1 className="font-heading text-3xl font-bold text-foreground">Minha conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>

        {data?.environment && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={data.environment === "sandbox" ? "secondary" : "outline"}>
              {data.environment === "sandbox" ? "Ambiente de teste" : "Ambiente de produção"}
            </Badge>
            <span>
              {data.environment === "sandbox"
                ? "Assinaturas feitas aqui usam cartões de teste e não valem no site publicado."
                : "Assinaturas do modo de teste (pré-visualização) não são válidas neste ambiente."}
            </span>
          </div>
        )}


        {isLoading ? (
          <div className="mt-10 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando assinatura...
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {isTrial && (
              <div className="rounded-lg border border-gold/40 bg-gold/10 p-4 text-sm">
                <p className="font-heading text-base font-semibold text-foreground">
                  Teste grátis do Profissional
                  {trialEndLabel ? ` — termina em ${trialEndLabel}` : ""}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Nada será cobrado: não há cartão cadastrado e, quando o teste terminar, a conta
                  volta sozinha ao plano Gratuito.
                </p>
                <Button size="sm" variant="outline" className="mt-3" asChild>
                  <Link to="/planos">Ver planos</Link>
                </Button>
              </div>
            )}

            {isPastDue && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div className="text-sm">
                  <p className="font-semibold text-destructive">Pagamento pendente</p>
                  <p className="mt-1 text-muted-foreground">
                    Não conseguimos processar sua última cobrança. Acesse a fatura para pagar por Pix, boleto ou cartão.
                  </p>
                  {sub?.nextPaymentUrl ? (
                    <Button size="sm" variant="outline" className="mt-3" asChild>
                      <a href={sub.nextPaymentUrl} target="_blank" rel="noopener noreferrer">
                        Pagar fatura
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="font-heading text-xl">Plano {PLAN_LABEL[planId]}</CardTitle>
                    <CardDescription>
                      {sub ? STATUS_LABEL[sub.status] || sub.status : "Sem assinatura paga"}
                    </CardDescription>
                    {pendingPlanLabel && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Muda para {pendingPlanLabel}
                        {sub?.currentPeriodEnd ? ` em ${formatShortDate(sub.currentPeriodEnd)}` : ""}.
                      </p>
                    )}
                  </div>
                  {sub?.cancelAtPeriodEnd && <Badge variant="secondary">Cancelamento agendado</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {sub && isOneTime ? (
                  <>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">Tipo de acesso</dt>
                        <dd className="font-medium text-foreground">Anual pago à vista</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Acesso ativo até</dt>
                        <dd className="font-medium text-foreground">{formatDate(sub.accessExpiresAt)}</dd>
                      </div>
                    </dl>
                    {expiryWarning && (
                      <div className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-foreground">
                        Seu acesso anual termina em {daysLeft} {daysLeft === 1 ? "dia" : "dias"}. Renove para
                        não perder os recursos pagos.
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Não há cobrança automática: ao final do período a conta volta ao plano gratuito.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button asChild>
                        <Link to="/planos">Renovar agora</Link>
                      </Button>
                    </div>
                  </>
                ) : sub ? (
                  <>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">Período atual</dt>
                        <dd className="font-medium text-foreground">
                          {formatDate(sub.currentPeriodStart)} → {formatDate(sub.currentPeriodEnd)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          {sub.cancelAtPeriodEnd ? "Acesso até" : "Próxima cobrança"}
                        </dt>
                        <dd className="font-medium text-foreground">
                          {formatDate(sub.cancelAtPeriodEnd ? sub.currentPeriodEnd : sub.currentPeriodEnd)}
                        </dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {planId === "profissional" && (
                        <Button
                          onClick={() => run("change-plan", { newPriceId: "escritorio_mensal" })}
                          disabled={busy !== null}
                        >
                          {busy === "change-plan" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowUpCircle className="mr-2 h-4 w-4" />
                          )}
                          Mudar para Escritório na próxima cobrança
                        </Button>
                      )}
                      {planId === "escritorio" && (
                        <Button
                          variant="outline"
                          onClick={() => run("change-plan", { newPriceId: "profissional_mensal" })}
                          disabled={busy !== null}
                        >
                          Mudar para Profissional na próxima cobrança
                        </Button>
                      )}
                      {sub.cancelAtPeriodEnd ? (
                        <Button variant="outline" asChild disabled={busy !== null}>
                          <Link to="/planos">Assinar novamente</Link>
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={() => setConfirmCancel(true)} disabled={busy !== null}>
                          Cancelar assinatura
                        </Button>
                      )}
                      {sub.nextPaymentUrl && (
                        <Button variant="ghost" asChild disabled={busy !== null}>
                          <a href={sub.nextPaymentUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Pagar fatura
                          </a>
                        </Button>
                      )}
                    </div>

                      <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
                      A troca de plano passa a valer na próxima cobrança. Não há cobrança nem
                      crédito proporcional agora.
                      {sub.cancelAtPeriodEnd
                        ? " O cancelamento já foi feito: o acesso continua até a data acima e, para seguir depois disso, é preciso assinar novamente."
                        : ""}
                    </p>
                  </>
                ) : (

                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Você está no plano gratuito. Faça upgrade para liberar petições, mais buscas e diagnósticos.
                    </p>
                    <Button asChild>
                      <Link to="/planos">Ver planos</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <UsageSummary />

            {!isLawyer && (
              isEscritorio ? (
                <LetterheadCard />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Assinantes do plano Escritório podem personalizar o timbre das petições com logo e
                  identificação.{" "}
                  <Link to="/planos" className="underline hover:text-foreground">
                    Ver planos
                  </Link>
                </p>
              )
            )}


            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Mudança nas cotas</p>
              <p className="mt-1">
                As cotas deixaram de ser diárias e passaram a ser <strong>mensais</strong>, com
                volumes bem maiores por mês e renovação no primeiro dia de cada mês (horário de
                Brasília). Saldo não utilizado não acumula para o mês seguinte. Esta mudança vale
                a partir de agora; se ela prejudicar seu uso, fale com{" "}
                <a className="underline" href="mailto:wrccdesign@gmail.com">wrccdesign@gmail.com</a>{" "}
                nos próximos 30 dias.
              </p>
            </div>


            <Card>

              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-lg">
                  <Receipt className="h-4 w-4" /> Faturas
                </CardTitle>
                <CardDescription>Histórico das últimas cobranças processadas.</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.invoices?.length ? (
                  <ul className="divide-y">
                    {data.invoices.map((inv) => (
                      <li key={inv.id} className="flex items-center justify-between py-3 text-sm">
                        <div>
                          <p className="font-medium text-foreground">{inv.id.slice(0, 16)}</p>
                          <p className="text-muted-foreground">{formatDate(inv.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">{formatMoney(inv.value)}</p>
                          <p className="text-muted-foreground">{STATUS_LABEL[inv.status] || inv.status}</p>
                          {inv.url && (
                            <a
                              href={inv.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs underline"
                            >
                              Ver boleto/Pix
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma fatura encontrada.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              Você continua com acesso completo até {formatDate(sub?.currentPeriodEnd)}. Depois disso, sua conta volta
              para o plano gratuito. O cancelamento é definitivo: para continuar depois dessa data,
              será preciso assinar novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmCancel(false);
                run("cancel");
              }}
            >
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AppFooter />
    </div>
  );
}
