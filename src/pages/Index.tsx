import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { AnalysisResult } from "@/components/AnalysisResult";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Search, FileText, Loader2, X } from "lucide-react";
import { AppFooter } from "@/components/AppFooter";
import type { LegalAnalysis } from "@/types/analysis";

export default function Index() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<LegalAnalysis | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "Arquivo muito grande", description: "O limite é 10MB.", variant: "destructive" });
      return;
    }

    setParsing(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Falha ao processar documento");
      const data = await response.json();
      setText(data.text);
      toast({ title: "Documento processado!", description: `Texto extraído de ${file.name}` });
    } catch (err) {
      toast({ title: "Erro ao processar", description: "Não foi possível extrair o texto do arquivo.", variant: "destructive" });
      setFileName(null);
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast({ title: "Texto vazio", description: "Insira um texto jurídico para análise.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-legal-text", {
        body: { text: text.trim(), file_name: fileName },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data.result as LegalAnalysis);
      toast({ title: "Análise concluída!" });
    } catch (err: any) {
      toast({
        title: "Erro na análise",
        description: err.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    setText("");
    setFileName(null);
    setResult(null);
  };

  if (result) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <LegalDisclaimer />
        <main className="container max-w-3xl py-6 sm:py-8 px-4 sm:px-6">
          <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-foreground">Resultado da Análise</h2>
          <AnalysisResult result={result} onNewAnalysis={handleNewAnalysis} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <LegalDisclaimer />
      <main className="container max-w-3xl py-6 sm:py-8 px-4 sm:px-6">
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Nova Análise Jurídica</h2>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Insira o texto ou faça upload de um documento para receber uma análise estruturada pelo JurisAI.
          </p>
        </div>

        <Card className="animate-fade-in">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Texto para Análise</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Cole o texto jurídico ou envie um arquivo PDF/DOCX</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Cole aqui o texto jurídico que deseja analisar..."
              className="min-h-[200px] resize-y font-sans"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading || parsing}
            />

            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={loading || parsing}
              >
                {parsing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {parsing ? "Processando..." : "Upload de Arquivo"}
              </Button>

              {fileName && (
                <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{fileName}</span>
                  <button onClick={() => { setFileName(null); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Search className="mr-2 h-5 w-5" />
              )}
              {loading ? "Analisando..." : "Analisar Texto"}
            </Button>
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
