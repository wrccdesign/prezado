import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Search, Scale, ClipboardList, DollarSign, Building2, Zap, ArrowRight, MessageCircle, Loader2, Stethoscope } from "lucide-react";
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

export default function Diagnostico() {
  const navigate = useNavigate();
  const [situacao, setSituacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Diagnostico | null>(null);

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
        throw new Error(data.error || "Erro ao processar diagnóstico");
      }

      setResult(data.diagnostico);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível gerar o diagnóstico.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePetition = () => {
    if (!result) return;
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
    navigate("/chat", {
      state: {
        initialMessage: `Quero saber mais sobre minha situação: ${situacao}`,
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
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-foreground">Seu Diagnóstico</h2>
              <Badge className={`${URGENCIA_CONFIG[result.urgencia].color} text-xs px-2.5 py-1`}>
                <Zap className="h-3 w-3 mr-1" />
                Urgência {URGENCIA_CONFIG[result.urgencia].label}
              </Badge>
            </div>

            {/* O que está acontecendo */}
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

            {/* Qual é o seu direito */}
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

            {/* O que você pode fazer */}
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

            {/* Custos e ganhos */}
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

            {/* Onde entrar */}
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

            {/* Urgência */}
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

            <Separator />

            {/* Action Buttons */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={handleGeneratePetition} className="h-12 text-sm">
                <ArrowRight className="mr-2 h-4 w-4" />
                Gerar petição para este caso
              </Button>
              <Button variant="outline" onClick={handleChatMore} className="h-12 text-sm">
                <MessageCircle className="mr-2 h-4 w-4" />
                Falar mais sobre isso
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
