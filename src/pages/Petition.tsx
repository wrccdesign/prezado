import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { PetitionResult } from "@/components/PetitionResult";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileSignature } from "lucide-react";
import { AppFooter } from "@/components/AppFooter";

const TIPO_ACAO = [
  "Indenização por danos morais e/ou materiais",
  "Revisão contratual",
  "Obrigação de fazer / não fazer",
  "Rescisão contratual",
  "Reclamação trabalhista",
  "Ação de alimentos",
  "Ação de despejo",
  "Ação de cobrança",
  "Outro",
];

const VARA_JUIZO = [
  "Cível",
  "Consumidor",
  "Trabalho",
  "Federal",
  "Família",
  "Juizado Especial",
  "Outro",
];

export default function Petition() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [tipoAcao, setTipoAcao] = useState("");
  const [varaJuizo, setVaraJuizo] = useState("");
  const [fatos, setFatos] = useState("");
  const [pedidos, setPedidos] = useState("");

  const handleGenerate = async () => {
    if (!tipoAcao || !fatos.trim() || !pedidos.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha tipo de ação, fatos e pedido principal.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setGeneratedText(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-petition", {
        body: {
          tipo_acao: tipoAcao,
          vara_juizo: varaJuizo,
          fatos: fatos.trim(),
          pedidos: pedidos.trim(),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedText(data.generated_text);
      toast({ title: "Petição gerada com sucesso!" });
    } catch (err: any) {
      toast({
        title: "Erro ao gerar petição",
        description: err.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewPetition = () => {
    setGeneratedText(null);
    setTipoAcao("");
    setVaraJuizo("");
    setFatos("");
    setPedidos("");
  };

  if (generatedText) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <LegalDisclaimer />
        <main className="container max-w-4xl py-8">
          <PetitionResult text={generatedText} petitionType={tipoAcao} onNewPetition={handleNewPetition} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <LegalDisclaimer />
      <main className="container max-w-3xl py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground">Nova Petição</h2>
          <p className="mt-1 text-muted-foreground">
            Descreva os fatos do caso e a IA vai gerar a petição com fundamentação jurídica completa.
          </p>
        </div>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Dados do Caso</CardTitle>
            <CardDescription>Todos os campos marcados com * são obrigatórios. A IA irá inferir e sugerir os fundamentos jurídicos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Ação *</Label>
                <Select value={tipoAcao} onValueChange={setTipoAcao} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de ação" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_ACAO.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vara / Juízo *</Label>
                <Select value={varaJuizo} onValueChange={setVaraJuizo} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a vara" />
                  </SelectTrigger>
                  <SelectContent>
                    {VARA_JUIZO.map((vara) => (
                      <SelectItem key={vara} value={vara}>{vara}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descreva o que aconteceu *</Label>
              <Textarea 
                placeholder="Descreva os fatos relevantes do caso em ordem cronológica. Inclua datas, valores, nomes das partes envolvidas e qualquer detalhe relevante..."
                value={fatos} 
                onChange={(e) => setFatos(e.target.value)} 
                disabled={loading} 
                className="min-h-[200px]" 
              />
              <p className="text-xs text-muted-foreground">
                Quanto mais detalhes você fornecer, melhor será a petição gerada. A IA irá identificar e sugerir a fundamentação jurídica adequada.
              </p>
            </div>

            <div className="space-y-2">
              <Label>O que seu cliente quer? *</Label>
              <Textarea 
                placeholder="Ex: Indenização por danos morais no valor de R$ 20.000,00; rescisão do contrato com devolução dos valores pagos; condenação ao pagamento de multa contratual..."
                value={pedidos} 
                onChange={(e) => setPedidos(e.target.value)} 
                disabled={loading} 
                className="min-h-[120px]" 
              />
            </div>

            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleGenerate} 
              disabled={loading || !tipoAcao || !fatos.trim() || !pedidos.trim()}
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileSignature className="mr-2 h-5 w-5" />}
              {loading ? "Gerando Petição..." : "Gerar Petição"}
            </Button>
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
