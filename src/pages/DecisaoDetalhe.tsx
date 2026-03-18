import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Calendar, MapPin, Scale, Send, Loader2, Sparkles, MessageCircle,
  ExternalLink, BookOpen, FileText, Lightbulb, Copy, Check, Gavel,
} from "lucide-react";
import { formatCitation } from "@/lib/citation";

type Msg = { role: "user" | "assistant"; content: string };

interface Decision {
  id: string;
  tribunal: string | null;
  instancia: string | null;
  uf: string | null;
  comarca: string | null;
  numero_processo: string | null;
  data_decisao: string | null;
  relator: string | null;
  tipo_decisao: string | null;
  resultado: string | null;
  resultado_descricao: string | null;
  temas_juridicos: string[] | null;
  ramos_direito: string[] | null;
  legislacao_citada: string[] | null;
  ementa: string | null;
  resumo_ia: string | null;
  full_text: string | null;
  orgao_julgador: string | null;
  source_url: string | null;
  comarca_pequena: boolean | null;
}

const SUGGESTIONS = [
  { label: "Explique esta decisão", icon: BookOpen },
  { label: "Redija parágrafo para petição", icon: FileText },
  { label: "Quais teses foram acolhidas?", icon: Lightbulb },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-decisao`;

async function streamChat({
  messages, decisionId, onDelta, onDone, onError,
}: {
  messages: Msg[]; decisionId: string;
  onDelta: (t: string) => void; onDone: () => void; onError: (e: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, decisionId }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
    onError(err.error || `Erro ${resp.status}`);
    return;
  }
  if (!resp.body) { onError("Sem resposta"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;

  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone();
}

function resultadoColor(r: string | null) {
  if (!r) return "bg-muted text-muted-foreground";
  if (r.includes("procedente") && !r.includes("improcedente")) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  if (r === "improcedente") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  if (r === "provido") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
}

function ChatPanel({ decisionId }: { decisionId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((p) => {
        const last = p[p.length - 1];
        if (last?.role === "assistant")
          return p.map((m, i) => (i === p.length - 1 ? { ...m, content: assistantSoFar } : m));
        return [...p, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        decisionId,
        onDelta: upsert,
        onDone: () => setLoading(false),
        onError: (e) => {
          toast({ title: "Erro", description: e, variant: "destructive" });
          setLoading(false);
        },
      });
    } catch {
      toast({ title: "Erro", description: "Falha na conexão", variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold">Assistente Jurídico</span>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 px-4 py-3">
        {messages.length === 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-muted-foreground mb-3">Pergunte sobre esta decisão:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => send(s.label)}
                className="flex items-center gap-2 w-full text-left text-sm px-3 py-2 rounded-lg bg-accent/5 hover:bg-accent/10 text-accent transition-colors"
              >
                <s.icon className="h-4 w-4 flex-shrink-0" />
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Pergunte sobre a decisão..."
            className="text-sm h-9"
            disabled={loading}
          />
          <Button size="sm" onClick={() => send(input)} disabled={loading || !input.trim()} className="h-9 px-3">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DecisaoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loadingDec, setLoadingDec] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase.from("decisions").select("*").eq("id", id).single();
      if (error) {
        toast({ title: "Erro", description: "Decisão não encontrada", variant: "destructive" });
      } else {
        setDecision(data as unknown as Decision);
      }
      setLoadingDec(false);
    })();
  }, [id]);

  if (loadingDec) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <main className="flex-1 container px-4 py-8 max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
        <AppFooter />
      </div>
    );
  }

  if (!decision || !id) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Decisão não encontrada</p>
            <Link to="/jurisprudencia" className="text-accent hover:underline text-sm mt-2 inline-block">
              Voltar à busca
            </Link>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  const instanciaLabel = decision.instancia === "1grau" ? "1º Grau" : decision.instancia === "2grau" ? "2º Grau" : decision.instancia === "superior" ? "Superior" : decision.instancia;

  const handleCopyCitation = async () => {
    const citation = formatCitation(decision);
    await navigator.clipboard.writeText(citation);
    setCopied(true);
    toast({ title: "Citação copiada!", description: "Formatada no padrão processual brasileiro." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Decision content */}
        <div className="flex-1 overflow-y-auto">
          <div className="container px-4 py-6 max-w-3xl mx-auto">
            <Link to="/jurisprudencia" className="inline-flex items-center gap-1 text-sm text-accent hover:underline mb-4">
              <ArrowLeft className="h-4 w-4" /> Voltar à busca
            </Link>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {decision.tribunal && <Badge variant="secondary" className="font-semibold">{decision.tribunal}</Badge>}
              {decision.resultado && <Badge className={resultadoColor(decision.resultado)}>{decision.resultado}</Badge>}
              {instanciaLabel && <Badge variant="outline">{instanciaLabel}</Badge>}
              {decision.comarca_pequena && (
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                  <MapPin className="h-3 w-3 mr-0.5" /> Interior
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mb-1">
              {decision.numero_processo && (
                <h1 className="font-serif text-xl font-bold">{decision.numero_processo}</h1>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCitation}
                className="h-8 gap-1.5 text-xs flex-shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado!" : "Copiar Citação"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
              {decision.relator && <span>Rel. {decision.relator}</span>}
              {decision.orgao_julgador && (
                <span className="flex items-center gap-1">
                  <Gavel className="h-3.5 w-3.5" />
                  {decision.orgao_julgador}
                </span>
              )}
              {decision.data_decisao && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(decision.data_decisao).toLocaleDateString("pt-BR")}
                </span>
              )}
              {decision.comarca && decision.uf && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {decision.comarca}/{decision.uf}
                </span>
              )}
              {decision.source_url && (
                <a href={decision.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" /> Fonte original
                </a>
              )}
            </div>

            {/* Ementa */}
            {decision.ementa && (
              <Card className="mb-4">
                <CardContent className="pt-4">
                  <h2 className="font-serif text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Ementa</h2>
                  <p className="text-sm leading-relaxed">{decision.ementa}</p>
                </CardContent>
              </Card>
            )}

            {/* AI Summary */}
            {decision.resumo_ia && (
              <Card className="mb-4 border-accent/20 bg-accent/5">
                <CardContent className="pt-4">
                  <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-accent">
                    <Sparkles className="h-4 w-4" /> Resumo IA
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{decision.resumo_ia}</p>
                </CardContent>
              </Card>
            )}

            {/* Temas & Legislação */}
            <div className="grid gap-4 sm:grid-cols-2 mb-4">
              {decision.temas_juridicos && decision.temas_juridicos.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Temas Jurídicos</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {decision.temas_juridicos.map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t}</Badge>)}
                  </div>
                </div>
              )}
              {decision.legislacao_citada && decision.legislacao_citada.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Legislação Citada</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {decision.legislacao_citada.map((l, i) => <Badge key={i} variant="outline" className="text-xs">{l}</Badge>)}
                  </div>
                </div>
              )}
            </div>

            {/* Full text */}
            {decision.full_text && (
              <Card className="mb-6">
                <CardContent className="pt-4">
                  <h2 className="font-serif text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Texto Completo</h2>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{decision.full_text}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Chat sidebar - desktop */}
        <aside className="hidden lg:flex w-[380px] border-l border-border flex-col bg-background">
          <ChatPanel decisionId={id} />
        </aside>

        {/* Chat FAB - mobile */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-full shadow-lg h-14 w-14">
                <MessageCircle className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[75vh] p-0 rounded-t-xl">
              <SheetHeader className="sr-only">
                <SheetTitle>Chat Assistente</SheetTitle>
              </SheetHeader>
              <ChatPanel decisionId={id} />
            </SheetContent>
          </Sheet>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
