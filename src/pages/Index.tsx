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
import { Upload, Search, FileText, Loader2, X, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AppFooter } from "@/components/AppFooter";
import type { LegalAnalysis } from "@/types/analysis";

export default function Index() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseStage, setParseStage] = useState("");
  const [result, setResult] = useState<LegalAnalysis | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [partialExtraction, setPartialExtraction] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    const maxSize = isPdf ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    const limitLabel = isPdf ? "5MB" : "10MB";

    if (file.size > maxSize) {
      toast({ title: "Arquivo muito grande", description: `O limite para ${isPdf ? "PDF" : "este formato"} é ${limitLabel}.`, variant: "destructive" });
      return;
    }

    setParsing(true);
    setFileName(file.name);
    setParseProgress(10);
    setParseStage("Enviando arquivo...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setParseProgress(30);
      setParseStage("Extraindo texto do documento...");

      // Start a timer to update stage if taking long (OCR)
      const ocrStageTimer = setTimeout(() => {
        setParseProgress(50);
        setParseStage("Aplicando OCR em documento escaneado (pode levar até 1 min)...");
      }, 8000);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
          signal: controller.signal,
        }
      );

      clearTimeout(ocrStageTimer);
      setParseProgress(80);
      setParseStage("Finalizando processamento...");

      if (!response.ok) throw new Error("Falha ao processar documento");
      const data = await response.json();
      
      if (data.ocr_timeout) {
        toast({ title: "OCR expirou", description: "O documento é muito pesado para OCR. Tente um PDF menor ou cole o texto manualmente.", variant: "destructive" });
        setFileName(null);
        return;
      }

      if (data.ocr) {
        setParseProgress(90);
        setParseStage("OCR aplicado em documento escaneado...");
      }
      
      if (data.partial) {
        setPartialExtraction(true);
      }
      
      setParseProgress(100);
      setParseStage("Concluído!");
      setText(data.text);
      setShowPreview(true);
      const ocrNote = data.ocr ? " (via OCR — documento escaneado)" : "";
      const partialNote = data.partial ? " ⚠️ Extração parcial — PDF muito grande, apenas parte do texto foi extraída." : "";
      toast({ title: "Documento processado!", description: `Texto extraído de ${file.name}${ocrNote}.${partialNote}` });
    } catch (err: any) {
      if (err?.name === "AbortError") {
        toast({ title: "Timeout no upload", description: "O processamento demorou demais. Tente um PDF menor, TXT ou cole o texto manualmente.", variant: "destructive" });
      } else {
        toast({ title: "Erro ao processar", description: "Não foi possível extrair o texto do arquivo.", variant: "destructive" });
      }
      setFileName(null);
    } finally {
      clearTimeout(timeoutId);
      setTimeout(() => {
        setParsing(false);
        setParseProgress(0);
        setParseStage("");
      }, 500);
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
    setShowPreview(false);
    setPartialExtraction(false);
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
        <AppFooter />
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
            Insira o texto ou faça upload de um documento para receber uma análise estruturada pela Prezado.ai.
          </p>
        </div>

        <Card className="animate-fade-in">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Texto para Análise</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Cole o texto jurídico ou envie um arquivo (PDF: máx 5MB / TXT e DOCX: máx 10MB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Cole aqui o texto jurídico que deseja analisar..."
              className="min-h-[200px] resize-y font-sans"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading || parsing}
            />

            {/* Text Preview after PDF extraction */}
            {fileName && text && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 w-full text-left text-sm font-medium text-foreground"
                >
                  <Eye className="h-4 w-4 text-primary" />
                  Preview do texto extraído de {fileName}
                  {showPreview ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                </button>
                {showPreview && (
                  <div className="mt-3 max-h-[300px] overflow-y-auto rounded border bg-background p-3 text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                    {text.slice(0, 3000)}
                    {text.length > 3000 && (
                      <p className="mt-2 text-primary font-sans font-medium">
                        ... e mais {text.length - 3000} caracteres
                      </p>
                    )}
                  </div>
                )}
                {text.startsWith("[Não foi possível") && (
                  <p className="mt-2 text-xs text-destructive">
                    ⚠️ A extração pode ter falhado. Tente copiar e colar o texto manualmente.
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
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

              {parsing && (
                <div className="flex-1 min-w-[200px] space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{parseStage}</span>
                    <span>{parseProgress}%</span>
                  </div>
                  <Progress value={parseProgress} className="h-2" />
                </div>
              )}

              {fileName && (
                <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{fileName}</span>
                  <button onClick={() => { setFileName(null); setShowPreview(false); }} className="text-muted-foreground hover:text-foreground">
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
