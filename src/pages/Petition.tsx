import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { PetitionResult } from "@/components/PetitionResult";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileSignature } from "lucide-react";

const PETITION_TYPES = [
  "Petição Inicial Cível",
  "Petição Inicial Trabalhista",
  "Contestação",
  "Recurso de Apelação",
  "Habeas Corpus",
  "Mandado de Segurança",
  "Agravo de Instrumento",
  "Petição Inicial Criminal",
];

export default function Petition() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [petitionType, setPetitionType] = useState("");
  const [autor, setAutor] = useState("");
  const [reu, setReu] = useState("");
  const [fatos, setFatos] = useState("");
  const [fundamentos, setFundamentos] = useState("");
  const [pedidos, setPedidos] = useState("");
  const [comarca, setComarca] = useState("");
  const [vara, setVara] = useState("");

  const handleGenerate = async () => {
    if (!petitionType || !autor.trim() || !reu.trim() || !fatos.trim() || !pedidos.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha tipo, partes, fatos e pedidos.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setGeneratedText(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-petition", {
        body: {
          petition_type: petitionType,
          autor: autor.trim(),
          reu: reu.trim(),
          fatos: fatos.trim(),
          fundamentos: fundamentos.trim(),
          pedidos: pedidos.trim(),
          comarca: comarca.trim(),
          vara: vara.trim(),
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
    setPetitionType("");
    setAutor("");
    setReu("");
    setFatos("");
    setFundamentos("");
    setPedidos("");
    setComarca("");
    setVara("");
  };

  if (generatedText) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <LegalDisclaimer />
        <main className="container max-w-4xl py-8">
          <PetitionResult text={generatedText} onNewPetition={handleNewPetition} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground">Nova Petição</h2>
          <p className="mt-1 text-muted-foreground">
            Preencha os dados do caso para gerar uma petição jurídica completa.
          </p>
        </div>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">Dados da Petição</CardTitle>
            <CardDescription>Todos os campos marcados com * são obrigatórios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Tipo de Petição *</Label>
              <Select value={petitionType} onValueChange={setPetitionType} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de petição" />
                </SelectTrigger>
                <SelectContent>
                  {PETITION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Comarca</Label>
                <Input placeholder="Ex: São Paulo - SP" value={comarca} onChange={(e) => setComarca(e.target.value)} disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label>Vara</Label>
                <Input placeholder="Ex: 3ª Vara Cível" value={vara} onChange={(e) => setVara(e.target.value)} disabled={loading} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Autor / Requerente *</Label>
                <Textarea placeholder="Nome completo, CPF/CNPJ, endereço..." value={autor} onChange={(e) => setAutor(e.target.value)} disabled={loading} className="min-h-[100px]" />
              </div>
              <div className="space-y-2">
                <Label>Réu / Requerido *</Label>
                <Textarea placeholder="Nome completo, CPF/CNPJ, endereço..." value={reu} onChange={(e) => setReu(e.target.value)} disabled={loading} className="min-h-[100px]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fatos *</Label>
              <Textarea placeholder="Descreva os fatos relevantes do caso em ordem cronológica..." value={fatos} onChange={(e) => setFatos(e.target.value)} disabled={loading} className="min-h-[150px]" />
            </div>

            <div className="space-y-2">
              <Label>Fundamentos Jurídicos</Label>
              <Textarea placeholder="Cite leis, artigos e jurisprudência aplicáveis (opcional — a IA irá complementar)..." value={fundamentos} onChange={(e) => setFundamentos(e.target.value)} disabled={loading} className="min-h-[100px]" />
            </div>

            <div className="space-y-2">
              <Label>Pedidos *</Label>
              <Textarea placeholder="Liste os pedidos que deseja fazer ao juízo..." value={pedidos} onChange={(e) => setPedidos(e.target.value)} disabled={loading} className="min-h-[120px]" />
            </div>

            <Button className="w-full" size="lg" onClick={handleGenerate} disabled={loading || !petitionType || !autor.trim() || !reu.trim() || !fatos.trim() || !pedidos.trim()}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileSignature className="mr-2 h-5 w-5" />}
              {loading ? "Gerando Petição..." : "Gerar Petição"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
