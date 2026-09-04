import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { readFunctionError } from "@/lib/usageLimit";
import { notifyUsageConsumed } from "@/hooks/useUsage";
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
import { SEO } from "@/components/SEO";
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
  const [analyzedText, setAnalyzedText] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [showPreview, setShowPreview] = useState(false);
  const [partialExtraction, setPartialExtraction] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;

    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    const maxSize = isPdf ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    const limitLabel = isPdf ? "5MB" : "10MB";

    if (file.size > maxSize) {
      toast({ title: "Arquivo muito grande", description: `O limite para ${isPdf ? "PDF" : "este formato"} é ${limitLabel}.`, variant: "destructive" });
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setParsing(true);
    setFileName(file.name);
    setParseProgress(10);
    setParseStage(isImage ? "Lendo a imagem..." : "Enviando arquivo...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setParseProgress(30);
      setParseStage(isImage ? "Reconhecendo o texto..." : "Extraindo texto do documento...");

      // Start a timer to update stage if taking long (OCR)
      const ocrStageTimer = setTimeout(() => {
        setParseProgress(50);
        setParseStage(
          isImage
            ? "Reconhecendo o texto da imagem (pode levar até 1 min)..."
            : "Aplicando OCR em documento escaneado (pode levar até 1 min)...",
        );
      }, 8000);


      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ""}`,
          },
          body: formData,
          signal: controller.signal,
        }
      );

      clearTimeout(ocrStageTimer);
      setParseProgress(80);
      setParseStage("Finalizando processamento...");

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.error || "Falha ao processar documento");
      }
      const data = await response.json();
      
      if (data.ocr_timeout) {
        toast({
          title: isImage ? "Não consegui ler a imagem" : "OCR expirou",
          description: isImage
            ? "Tente um print mais nítido, sem corte, ou cole o texto da conversa."
            : "O documento é muito pesado para OCR. Tente um PDF menor ou cole o texto manualmente.",
          variant: "destructive",
        });
        setFileName(null);
        return;
      }

      const extracted: string = data.text ?? "";
      if (isImage && (extracted.trim().length < 10 || extracted.startsWith("[Não foi possível"))) {
        toast({
          title: "Não consegui ler o texto dessa imagem",
          description: "Tente um print mais nítido, sem corte, ou cole o texto da conversa.",
          variant: "destructive",
        });
        setFileName(null);
        return;
      }

      if (data.ocr) {
        setParseProgress(90);
        setParseStage(isImage ? "Texto reconhecido..." : "OCR aplicado em documento escaneado...");
      }
      
      if (data.partial) {
        setPartialExtraction(true);
      }
      
      setParseProgress(100);
      setParseStage("Concluído!");
      setText(extracted);
      setShowPreview(true);
      notifyUsageConsumed();
      const ocrNote = data.ocr && !isImage ? " (via OCR — documento escaneado)" : "";
      const partialNote = data.partial ? " ⚠️ Extração parcial — PDF muito grande, apenas parte do texto foi extraída." : "";
      toast({
        title: isImage ? "Imagem lida!" : "Documento processado!",
        description: `Texto extraído de ${file.name}${ocrNote}.${partialNote}`,
      });

    } catch (err: any) {
      if (err?.name === "AbortError") {
        toast({ title: "Timeout no upload", description: "O processamento demorou demais. Tente um PDF menor, TXT ou cole o texto manualmente.", variant: "destructive" });
      } else {
        const { message, limitReached, burstLimited } = await readFunctionError(
          err,
          "Não foi possível extrair o texto do arquivo.",
        );
        toast({
          title: burstLimited ? "Muitas requisições" : limitReached ? "Limite mensal atingido" : "Erro ao processar",
          description: message,
          variant: "destructive",
        });
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (loading || parsing) return;
    const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;
    e.preventDefault();
    const named = file.name && file.name !== "image.png"
      ? file
      : new File([file], `print-${Date.now()}.png`, { type: file.type });
    void processFile(named);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (loading || parsing) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };



  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast({ title: "Texto vazio", description: "Insira um texto jurídico para análise.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);
    setSaveState("idle");

    try {
      const { data, error } = await supabase.functions.invoke("analyze-legal-text", {
        body: { text: text.trim().slice(0, 15000), file_name: fileName },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAnalyzedText((data.input_text as string) ?? text.trim().slice(0, 15000));
      setResult(data.result as LegalAnalysis);
      notifyUsageConsumed();
      toast({ title: "Análise concluída!" });
    } catch (err: any) {
      const { message, limitReached, burstLimited } = await readFunctionError(err, "Tente novamente mais tarde.");
      toast({
        title: burstLimited ? "Muitas requisições" : limitReached ? "Limite mensal atingido" : "Erro na análise",
        description: message,
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
    setAnalyzedText("");
    setSaveState("idle");
    setShowPreview(false);
    setPartialExtraction(false);
  };

  const handleSaveAnalysis = async () => {
    if (!result || !user) return;
    setSaveState("saving");
    const { error } = await supabase.from("analyses").insert({
      user_id: user.id,
      input_text: analyzedText,
      file_name: fileName,
      result: result as unknown as never,
    });
    if (error) {
      setSaveState("idle");
      toast({ title: "Erro ao salvar", description: "Tente novamente.", variant: "destructive" });
      return;
    }
    setSaveState("saved");
    toast({ title: "Salvo no histórico" });
  };

  if (result) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <LegalDisclaimer />
        <main className="container max-w-3xl py-8 sm:py-12 px-4 sm:px-6">
          <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Resultado da Análise</h1>
          <AnalysisResult
            result={result}
            onNewAnalysis={handleNewAnalysis}
            onSave={user ? handleSaveAnalysis : undefined}
            saveState={saveState}
          />
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <LegalDisclaimer />
      <SEO
        title="Análise Jurídica com IA — Honorífico"
        description="Envie um documento ou cole um texto e receba análise jurídica estruturada com direitos, riscos e próximos passos."
        path="/"
        image="/og/home.jpg"
        imageAlt="Honorífico — IA jurídica brasileira"
      />
      <main className="container max-w-3xl py-8 sm:py-12 px-4 sm:px-6">
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-foreground">Análise Jurídica com Inteligência Artificial</h1>
          <p className="mt-2 sm:mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
            Insira o texto ou faça upload de um documento para receber uma análise estruturada pela Honorífico.
          </p>
        </div>

        <Card className="animate-fade-in">
          <CardHeader className="pb-4 space-y-1.5">
            <CardTitle className="text-lg sm:text-xl font-semibold">Texto para Análise</CardTitle>
            <CardDescription className="text-xs sm:text-sm leading-relaxed">Print de conversa, foto de documento, PDF, Word ou texto. Lemos o texto da imagem.</CardDescription>
          </CardHeader>
          <CardContent
            className="space-y-5"
            onPaste={handlePaste}
            onDragOver={(e) => { e.preventDefault(); if (!dragging) setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >

            <Textarea
              placeholder="Cole aqui o texto jurídico que deseja analisar..."
              className="min-h-[180px] sm:min-h-[240px] resize-y font-sans text-sm sm:text-base leading-relaxed"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading || parsing}
            />

            {/* Text Preview after PDF extraction */}
            {fileName && text && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 w-full text-left text-sm font-medium text-foreground"
                >
                  <Eye className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">Preview do texto extraído de {fileName}</span>
                  {showPreview ? <ChevronUp className="h-4 w-4 ml-auto shrink-0" /> : <ChevronDown className="h-4 w-4 ml-auto shrink-0" />}
                </button>
                {showPreview && (
                  <div className="mt-3 max-h-[240px] sm:max-h-[320px] overflow-y-auto rounded-md border bg-background p-3 text-xs leading-relaxed font-mono whitespace-pre-wrap break-words text-muted-foreground">
                    {text.slice(0, 3000)}
                    {text.length > 3000 && (
                      <p className="mt-2 text-primary font-sans font-medium">
                        ... e mais {text.length - 3000} caracteres
                      </p>
                    )}
                  </div>
                )}
                {text.startsWith("[Não foi possível") && (
                  <p className="mt-3 text-xs leading-relaxed text-destructive">
                    ⚠️ A extração pode ter falhado. Tente copiar e colar o texto manualmente.
                  </p>
                )}
                {partialExtraction && !text.startsWith("[Não foi possível") && (
                  <p className="mt-3 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
                    ⚠️ Extração parcial — o PDF é grande e apenas parte do texto foi processada via OCR. Para melhores resultados, use um PDF menor ou cole o texto manualmente.
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.webp,.heic,.heif"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full sm:w-auto"
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
                <div className="w-full sm:flex-1 sm:min-w-[200px] space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{parseStage}</span>
                    <span className="shrink-0 tabular-nums">{parseProgress}%</span>
                  </div>
                  <Progress value={parseProgress} className="h-2" />
                </div>
              )}

              {fileName && (
                <div className="flex w-full sm:w-auto max-w-full items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-foreground">{fileName}</span>
                  <button onClick={() => { setFileName(null); setShowPreview(false); }} className="ml-auto shrink-0 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <Button
              className="w-full h-12 text-base font-semibold"
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
