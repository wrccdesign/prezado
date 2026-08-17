import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
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
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoice_number: string | null;
  status: string;
  billed_at: string | null;
  currency: string | null;
  total: string | null;
}

interface Summary {
  environment: "sandbox" | "live";
  plan_id: "free" | "profissional" | "escritorio";
  subscription: {
    id: string;
    status: string;
    plan_id: string;
    current_period_start: string | null;
    current_period_end: string | null;
    next_billed_at: string | null;
    cancel_at_period_end: boolean;
  } | null;
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

function formatMoney(total: string | null, currency: string | null) {
  if (!total) return "—";
  const value = Number(total) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency || "BRL" }).format(value);
}

export default function Conta() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["account-summary", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("paddle-account", {
        body: { action: "summary" },
      });
      if (error) throw new Error(error.message);
      return data as Summary;
    },
  });

  const run = async (action: string, payload: Record<string, unknown> = {}) => {
    setBusy(action);
    try {
      const { data, error } = await supabase.functions.invoke("paddle-account", {
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

  const openPortal = async () => {
    setBusy("portal");
    try {
      const { data, error } = await supabase.functions.invoke("paddle-customer-portal");
      if (error || !data?.url) throw new Error(data?.error || "Portal indisponível");
      window.open(data.url, "_blank", "noopener");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao abrir portal");
    } finally {
      setBusy(null);
    }
  };

  const sub = data?.subscription ?? null;
  const planId = data?.plan_id ?? "free";
  const isPastDue = sub?.status === "past_due";

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

        {isLoading ? (
          <div className="mt-10 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando assinatura...
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {isPastDue && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div className="text-sm">
                  <p className="font-semibold text-destructive">Pagamento pendente</p>
                  <p className="mt-1 text-muted-foreground">
                    Não conseguimos processar sua última cobrança. Atualize o meio de pagamento para não perder o acesso.
                  </p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={openPortal} disabled={busy === "portal"}>
                    Atualizar pagamento
                  </Button>
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
                  </div>
                  {sub?.cancel_at_period_end && <Badge variant="secondary">Cancelamento agendado</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {sub ? (
                  <>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground">Período atual</dt>
                        <dd className="font-medium text-foreground">
                          {formatDate(sub.current_period_start)} → {formatDate(sub.current_period_end)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          {sub.cancel_at_period_end ? "Acesso até" : "Próxima cobrança"}
                        </dt>
                        <dd className="font-medium text-foreground">
                          {formatDate(sub.cancel_at_period_end ? sub.current_period_end : sub.next_billed_at)}
                        </dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {planId === "profissional" && (
                        <Button
                          onClick={() => run("change-plan", { priceId: "escritorio_mensal" })}
                          disabled={busy !== null}
                        >
                          {busy === "change-plan" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowUpCircle className="mr-2 h-4 w-4" />
                          )}
                          Fazer upgrade para Escritório
                        </Button>
                      )}
                      {planId === "escritorio" && (
                        <Button
                          variant="outline"
                          onClick={() => run("change-plan", { priceId: "profissional_mensal" })}
                          disabled={busy !== null}
                        >
                          Mudar para Profissional na renovação
                        </Button>
                      )}
                      {sub.cancel_at_period_end ? (
                        <Button variant="outline" onClick={() => run("resume")} disabled={busy !== null}>
                          Reativar assinatura
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={() => setConfirmCancel(true)} disabled={busy !== null}>
                          Cancelar assinatura
                        </Button>
                      )}
                      <Button variant="ghost" onClick={openPortal} disabled={busy !== null}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Portal de pagamento
                      </Button>
                    </div>
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
                          <p className="font-medium text-foreground">{inv.invoice_number || inv.id.slice(0, 16)}</p>
                          <p className="text-muted-foreground">{formatDate(inv.billed_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">{formatMoney(inv.total, inv.currency)}</p>
                          <p className="text-muted-foreground">{STATUS_LABEL[inv.status] || inv.status}</p>
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
              Você continua com acesso completo até {formatDate(sub?.current_period_end)}. Depois disso, sua conta volta
              para o plano gratuito. Você pode reativar a qualquer momento antes dessa data.
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
