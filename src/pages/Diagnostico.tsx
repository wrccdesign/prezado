import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { SEO } from "@/components/SEO";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PaywallBlur } from "@/components/PaywallBlur";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

import { AppFooter } from "@/components/AppFooter";
import { Search, Scale, ClipboardList, DollarSign, Building2, Zap, ArrowRight, MessageCircle, Loader2, Stethoscope, Sparkles, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Diagnostico {
  o_que_esta_acontecendo: string;
  qual_seu_direito: string;
  o_que_voce_pode_fazer: string[];
  estimativa_custos_ganhos: string;
  onde_entrar: string;
  urgencia: "baixa" | "media" | "alta";
  explicacao_urgencia: string;
  area_do_direito: string;
  tipo_peticao_sugerida: string;
}

const URGENCIA_CONFIG = {
  baixa: { label: "Baixa", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  media: { label: "Média", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  alta: { label: "Alta", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

const TEASER_ACTION = "diagnostico_completo_free";

export default function Diagnostico() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [situacao, setSituacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Diagnostico | null>(null);
  const [teaserAvailable, setTeaserAvailable] = useState(false);
  const [teaserUsedThisSession, setTeaserUsedThisSession] = useState(false);

  // Verificar se o usuário free já usou o teaser diário
  useEffect(() => {
    if (!user || isPro) {
      setTeaserAvailable(false);
      return;
    }
    const checkTeaser = async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("usage_tracking")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action", TEASER_ACTION)
        .gte("created_at", startOfDay.toISOString());
      setTeaserAvailable((count ?? 0) === 0);
    };
    checkTeaser();
  }, [user, isPro]);

  // Free tem tudo desbloqueado se: é pro OU tem teaser disponível OU acabou de usar o teaser nesta sessão
  const fullAccess = isPro || teaserAvailable || teaserUsedThisSession;
  const locked = !fullAccess;

  const handleAnalyze = async () => {
    if (situacao.trim().length < 20) {
      toast({ title: "Descreva melhor sua situação", description: "Preciso de mais detalhes para ajudar você (mínimo 20 caracteres).", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Faça login para continuar", variant: "destructive" });
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnostico-juridico`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ situacao: situacao.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 && data?.limit_reached) {
          toast({
            title: "Limite diário atingido",
            description: data.error || "Você atingiu o limite de diagnósticos do plano gratuito.",
            variant: "destructive",
            action: (
              <Button variant="outline" size="sm" onClick={() => navigate("/planos")}>
                Ver planos
              </Button>
            ),
          });
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Erro ao processar diagnóstico");
      }

      setResult(data.diagnostico);

      // Consumir teaser diário se aplicável
      if (!isPro && teaserAvailable && user) {
        await supabase.from("usage_tracking").insert({
          user_id: user.id,
          action: TEASER_ACTION,
        });
        setTeaserAvailable(false);
        setTeaserUsedThisSession(true);
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível gerar o diagnóstico.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePetition = () => {
    if (!result) return;
    if (locked) {
      navigate("/planos");
      return;
    }
    navigate("/peticao", {
      state: {
        fromDiagnostico: true,
        tipo: result.tipo_peticao_sugerida,
        situacao: situacao,
        diagnostico: result,
      },
    });
  };

  const handleChatMore = () => {
    if (!result) return;
    if (locked) {
      navigate("/planos");
      return;
    }
    const diagnosticoSummary = `## Diagnóstico Jurídico\n\n**Área:** ${result.area_do_direito}\n**Urgência:** ${URGENCIA_CONFIG[result.urgencia].label}\n\n**O que está acontecendo:**\n${result.o_que_esta_acontecendo}\n\n**Seu direito:**\n${result.qual_seu_direito}\n\n**O que você pode fazer:**\n${result.o_que_voce_pode_fazer.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n**Custos/Ganhos:**\n${result.estimativa_custos_ganhos}\n\n**Onde buscar ajuda:**\n${result.onde_entrar}`;

    navigate("/chat", {
      state: {
        fromDiagnostico: true,
        situacao: situacao.trim(),
        diagnosticoSummary,
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <LegalDisclaimer />

      <main className="flex-1 container py-6 sm:py-8 px-4 sm:px-6 max-w-3xl mx-auto">
        {!result ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-2">
                <Stethoscope className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
                Diagnóstico Jurídico
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Descreva sua situação em linguagem simples.
                <br />
                <span className="text-sm">Não precisa saber termos jurídicos — eu entendo você.</span>
              </p>
              {!isPro && teaserAvailable && (
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Seu diagnóstico completo grátis de hoje está disponível
                </div>
              )}
            </div>

            {/* Input */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Textarea
                  value={situacao}
                  onChange={(e) => setSituacao(e.target.value)}
                  placeholder={"Ex: Fui demitido sem receber meu acerto.\n\nMeu locador não quer devolver meu depósito.\n\nSofri um acidente e a empresa não quer pagar."}
                  className="min-h-[160px] text-base resize-none"
                  disabled={loading}
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={loading || situacao.trim().length < 20}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analisando sua situação...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Analisar minha situação
                    </>
                  )}
                </Button>
                {situacao.trim().length > 0 && situacao.trim().length < 20 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Descreva um pouco mais ({situacao.trim().length}/20 caracteres mínimos)
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Back button */}
            <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
              ← Nova consulta
            </Button>

            {/* Urgency Badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-foreground">Seu Diagnóstico</h2>
              <Badge className={`${URGENCIA_CONFIG[result.urgencia].color} text-xs px-2.5 py-1`}>
                <Zap className="h-3 w-3 mr-1" />
                Urgência {URGENCIA_CONFIG[result.urgencia].label}
              </Badge>
              {!isPro && teaserUsedThisSession && (
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Diagnóstico completo grátis de hoje
                </Badge>
              )}
            </div>

            {/* SEMPRE VISÍVEIS — 2 primeiros cards */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  🔍 O que está acontecendo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{result.o_que_esta_acontecendo}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary" />
                  ⚖️ Qual é o seu direito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{result.qual_seu_direito}</p>
              </CardContent>
            </Card>

            {/* BLOQUEÁVEIS — 4 cards restantes */}
            <PaywallBlur locked={locked}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    📋 O que você pode fazer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {result.o_que_voce_pode_fazer.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </PaywallBlur>

            <PaywallBlur locked={locked}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    💰 Quanto pode custar / ganhar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{result.estimativa_custos_ganhos}</p>
                </CardContent>
              </Card>
            </PaywallBlur>

            <PaywallBlur locked={locked}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    🏛️ Onde buscar ajuda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{result.onde_entrar}</p>
                </CardContent>
              </Card>
            </PaywallBlur>

            <PaywallBlur locked={locked}>
              <Card className={result.urgencia === "alta" ? "border-destructive/30" : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    ⚡ Sobre a urgência
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{result.explicacao_urgencia}</p>
                </CardContent>
              </Card>
            </PaywallBlur>

            {/* Banner de conversão para free bloqueado */}
            {locked && (
              <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="pt-6 space-y-3 text-center">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    Desbloqueie o diagnóstico completo
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Veja o passo a passo, estimativa de custos, onde buscar ajuda, gere petições e converse com o chat jurídico ilimitado.
                  </p>
                  <Button size="lg" onClick={() => navigate("/planos")} className="mt-2">
                    Ver planos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="border-t border-border" />

            {/* Action Buttons */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                onClick={handleGeneratePetition}
                className="h-12 text-sm"
                variant={locked ? "outline" : "default"}
              >
                {locked ? <Lock className="mr-2 h-4 w-4" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                {locked ? "Gerar petição (Profissional)" : "Gerar petição para este caso"}
              </Button>
              <Button
                variant="outline"
                onClick={handleChatMore}
                className="h-12 text-sm"
              >
                {locked ? <Lock className="mr-2 h-4 w-4" /> : <MessageCircle className="mr-2 h-4 w-4" />}
                {locked ? "Falar mais (Profissional)" : "Falar mais sobre isso"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              ⚠️ Este diagnóstico é uma orientação inicial gerada por inteligência artificial.
              Não substitui a consulta com um advogado. Para casos urgentes, procure assistência jurídica presencial.
            </p>
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
