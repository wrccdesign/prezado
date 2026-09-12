import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Search, FileText, Loader2, X, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import type { LegalAnalysis } from "@/types/analysis";

const SESSION_KEY = "honorifico:analise-em-andamento";


export default function Index({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
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
  const [rodada, setRodada] = useState(1);
  const [esclarecimentos, setEsclarecimentos] = useState<Record<string, string>>({});
  const [editingText, setEditingText] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const restored = useRef(false);

  // Espelho em sessionStorage: sobrevive a recarregar a página e a trocar de aba.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        text?: string;
        fileName?: string | null;
        analyzedText?: string;
        result?: LegalAnalysis | null;
        rodada?: number;
        esclarecimentos?: Record<string, string>;
      };
      if (saved.result) setResult(saved.result);
      if (saved.text) setText(saved.text);
      if (saved.analyzedText) setAnalyzedText(saved.analyzedText);
      if (saved.fileName !== undefined) setFileName(saved.fileName);
      if (saved.rodada) setRodada(saved.rodada);
      if (saved.esclarecimentos) setEsclarecimentos(saved.esclarecimentos);
    } catch {
      // estado corrompido: começa limpo
    }
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    try {
      if (!result && !text) {
        sessionStorage.removeItem(SESSION_KEY);
        return;
      }
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ text, fileName, analyzedText, result, rodada, esclarecimentos }),
      );
    } catch {
      // quota cheia: seguir sem espelho
    }
  }, [text, fileName, analyzedText, result, rodada, esclarecimentos]);


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



  const handleAnalyze = async (options?: { refine?: boolean }) => {
    if (!text.trim()) {
      toast({ title: "Texto vazio", description: "Insira um texto jurídico para análise.", variant: "destructive" });
      return;
    }

    const refine = options?.refine === true && !!result;
    const currentText = text.trim().slice(0, 15000);
    const previous = result;

    setLoading(true);
    setSaveState("idle");
    if (!refine) {
      setResult(null);
      setEsclarecimentos({});
    }

    try {
      const esclarecimentosPayload = refine
        ? Object.entries(esclarecimentos)
            .filter(([, v]) => v.trim().length > 0)
            .map(([item_original, esclarecimento]) => ({ item_original, esclarecimento: esclarecimento.trim() }))
        : [];

      const { data, error } = await supabase.functions.invoke("analyze-legal-text", {
        body: refine
          ? {
              text: currentText,
              file_name: fileName,
              rodada: rodada + 1,
              texto_alterado: currentText !== analyzedText,
              analise_anterior: {
                tipo_de_causa: previous?.tipo_de_causa,
                riscos_processuais: previous?.riscos_processuais ?? [],
                pontos_fracos: previous?.pontos_fracos ?? [],
              },
              esclarecimentos: esclarecimentosPayload,
            }
          : { text: currentText, file_name: fileName },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAnalyzedText((data.input_text as string) ?? currentText);
      setResult(data.result as LegalAnalysis);
      setRodada((data.rodada as number) ?? (refine ? rodada + 1 : 1));
      setEditingText(false);
      if (refine) setEsclarecimentos({});
      notifyUsageConsumed();
      toast({ title: refine ? "Nova análise concluída!" : "Análise concluída!" });
    } catch (err: any) {
      const { message, limitReached, burstLimited, authRequired } = await readFunctionError(err, "Tente novamente mais tarde.");
      if (refine) setResult(previous);
      toast({
        title: authRequired
          ? "Sessão expirada"
          : burstLimited
            ? "Muitas requisições"
            : limitReached
              ? "Limite mensal atingido"
              : "Erro na análise",
        description: message,
        variant: "destructive",
        action: authRequired ? (
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
            Entrar
          </Button>
        ) : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEsclarecimentoChange = (item: string, value: string) => {
    setEsclarecimentos((prev) => ({ ...prev, [item]: value }));
  };

  const handleEditText = () => {
    setText(analyzedText || text);
    setEditingText(true);
  };

  const handleNewAnalysis = () => {
    setText("");
    setFileName(null);
    setResult(null);
    setAnalyzedText("");
    setSaveState("idle");
    setShowPreview(false);
    setPartialExtraction(false);
    setRodada(1);
    setEsclarecimentos({});
    setEditingText(false);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignorar
    }

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

  if (result && !editingText) {
    const resultado = (
      <main className={embedded ? "py-2" : "container max-w-3xl py-8 sm:py-12 px-4 sm:px-6"}>
        {!embedded && (
          <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Resultado da Análise</h1>
        )}
        <AnalysisResult
          result={result}
          onNewAnalysis={handleNewAnalysis}
          onSave={user ? handleSaveAnalysis : undefined}
          saveState={saveState}
          rodada={rodada}
          esclarecimentos={esclarecimentos}
          onEsclarecimentoChange={handleEsclarecimentoChange}
          onReanalyze={() => void handleAnalyze({ refine: true })}
          onEditText={handleEditText}
          reanalyzing={loading}
        />
      </main>
    );

    if (embedded) return resultado;
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <LegalDisclaimer />
        {resultado}
        <AppFooter />
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-background"}>
      {!embedded && <AppHeader />}
      {!embedded && <LegalDisclaimer />}
      {!embedded && (
        <SEO
          title="Análise de documento com IA — Honorífico"
          description="Envie um documento ou cole um texto e receba análise jurídica estruturada com direitos, riscos e próximos passos."
          path="/analise"
          image="/og/home.jpg"
          imageAlt="Honorífico — IA jurídica brasileira"
        />
      )}
      <main className={embedded ? "py-2" : "container max-w-3xl py-8 sm:py-12 px-4 sm:px-6"}>
        {!embedded && (
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-foreground">Analisar um documento</h1>
            <p className="mt-2 sm:mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              Envie o arquivo ou cole o texto. A resposta traz o que o documento diz, os riscos e os próximos passos.
            </p>
          </div>
        )}


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

            <div className="space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.webp,.heic,.heif"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={loading || parsing}
                className={`w-full rounded-lg border bg-card px-4 py-6 text-center transition-colors disabled:opacity-60 ${
                  dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <span className="block text-sm font-medium text-foreground">
                  {parsing ? "Processando..." : "Arraste o arquivo, cole um print com Ctrl+V ou escolha do aparelho."}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  Print de conversa, foto de documento, PDF, Word ou texto. PDF até 5MB, demais formatos até 10MB.
                </span>
              </button>

              {parsing && (
                <div className="w-full space-y-1.5">
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

            {editingText && result && (
              <p className="text-sm text-muted-foreground">
                Você está revisando o texto da rodada {rodada}. A nova análise vai considerar as suas edições e os esclarecimentos escritos.
              </p>
            )}

            <Button
              className="w-full h-12 text-base font-semibold"
              size="lg"
              onClick={() => void handleAnalyze({ refine: editingText && !!result })}
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Search className="mr-2 h-5 w-5" />
              )}
              {loading
                ? "Analisando..."
                : editingText && result
                  ? "Reanalisar com as minhas edições"
                  : "Analisar Texto"}
            </Button>
            {editingText && result && (
              <Button variant="ghost" className="w-full" onClick={() => setEditingText(false)} disabled={loading}>
                Voltar para o resultado
              </Button>
            )}


          </CardContent>
        </Card>
      </main>
      {!embedded && <AppFooter />}
    </div>
  );
}
