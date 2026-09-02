import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Loader2, Check } from "lucide-react";
import { formatCitation } from "@/lib/citation";
import { SEO } from "@/components/SEO";

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
  "Explique esta decisão",
  "Redija parágrafo para petição",
  "Quais teses foram acolhidas?",
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
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ""}`,
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
    <div className="flex flex-col h-full bg-white text-navy">
      <div className="px-4 py-3 border-b border-cream-dark">
        <span className="text-sm font-medium">Assistente jurídico</span>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 px-4 py-3">
        {messages.length === 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-note text-navy/60 mb-3">Pergunte sobre esta decisão:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full text-left text-sm text-navy underline underline-offset-4 hover:text-gold py-1"
              >
                {s}
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
                    ? "bg-navy text-cream"
                    : "bg-cream text-navy"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none">
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
              <div className="bg-cream rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-navy/60" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-cream-dark">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Pergunte sobre a decisão"
            className="text-sm h-10 bg-white text-navy border border-cream-dark focus-visible:ring-gold"
            disabled={loading}
          />
          <Button size="sm" aria-label="Enviar pergunta" onClick={() => send(input)} disabled={loading || !input.trim()} className="h-10 px-3 bg-gold text-navy hover:bg-gold-light">
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
      <div className="min-h-screen flex flex-col bg-cream text-navy font-sans">
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
      <div className="min-h-screen flex flex-col bg-cream text-navy font-sans">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-navy/70">Decisão não encontrada</p>
            <Link to="/jurisprudencia" className="text-navy underline underline-offset-4 hover:text-gold text-sm mt-2 inline-block">
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

  const linhaMeta = [
    decision.tribunal,
    instanciaLabel,
    decision.resultado,
    decision.data_decisao ? new Date(decision.data_decisao).toLocaleDateString("pt-BR") : null,
    decision.comarca_pequena ? "interior" : null,
  ].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen flex flex-col bg-cream text-navy font-sans">
      <AppHeader />
      <SEO
        title={`${decision.numero_processo || "Decisão"}${decision.tribunal ? ` — ${decision.tribunal}` : ""} | Honorífico`}
        description={
          (decision.ementa || decision.resumo_ia || "Decisão judicial com ementa, metadados e análise por IA no Honorífico.")
            .replace(/\s+/g, " ")
            .slice(0, 155)
        }
        path={`/decisao/${decision.id}`}
      />
      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 overflow-y-auto">
          <div className="container px-4 py-8 max-w-3xl mx-auto">
            <Link to="/jurisprudencia" className="text-note text-navy underline underline-offset-4 hover:text-gold">
              Voltar à busca
            </Link>

            <p className="text-sm font-medium text-navy mt-6">{linhaMeta}</p>

            {decision.numero_processo && (
              <h1 className="font-mono text-xl text-navy mt-2">{decision.numero_processo}</h1>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-note">
              <button
                onClick={handleCopyCitation}
                className="text-navy underline underline-offset-4 hover:text-gold inline-flex items-center gap-1"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : null}
                {copied ? "Copiado" : "Copiar citação"}
              </button>
              {decision.source_url && (
                <a
                  href={decision.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir a decisão na fonte oficial"
                  className="text-navy underline underline-offset-4 hover:text-gold"
                >
                  Ver no tribunal
                </a>
              )}
            </div>

            <p className="text-note text-navy/60 mt-3">
              {[
                decision.relator ? `Rel. ${decision.relator}` : null,
                decision.orgao_julgador,
                decision.comarca && decision.uf ? `${decision.comarca}/${decision.uf}` : null,
                decision.numero_processo ? "Consulte pelo nº CNJ no portal do tribunal de origem" : null,
              ].filter(Boolean).join(", ")}
            </p>

            {decision.ementa && (
              <section className="mt-8 border-t border-cream-dark pt-6">
                <h2 className="text-h3 text-navy">Ementa</h2>
                <p className="text-body-serif text-navy/85 max-w-[68ch] mt-3">{decision.ementa}</p>
              </section>
            )}

            {decision.resumo_ia && (
              <section className="mt-8 border-t border-cream-dark pt-6">
                <h2 className="text-h3 text-navy">Resumo por IA</h2>
                <p className="text-body-serif text-navy/80 max-w-[68ch] mt-3">{decision.resumo_ia}</p>
              </section>
            )}

            {((decision.temas_juridicos?.length ?? 0) > 0 || (decision.legislacao_citada?.length ?? 0) > 0) && (
              <section className="mt-8 border-t border-cream-dark pt-6 grid gap-6 sm:grid-cols-2">
                {decision.temas_juridicos && decision.temas_juridicos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-navy">Temas jurídicos</h3>
                    <p className="text-note text-navy/70 mt-2">{decision.temas_juridicos.join(", ")}</p>
                  </div>
                )}
                {decision.legislacao_citada && decision.legislacao_citada.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-navy">Legislação citada</h3>
                    <p className="text-note text-navy/70 mt-2">{decision.legislacao_citada.join(", ")}</p>
                  </div>
                )}
              </section>
            )}

            {decision.full_text && (
              <section className="mt-8 border-t border-cream-dark pt-6">
                <h2 className="text-h3 text-navy">Texto completo</h2>
                <p className="text-body-serif text-navy/85 max-w-[68ch] mt-3 whitespace-pre-wrap">{decision.full_text}</p>
              </section>
            )}
          </div>
        </div>

        <aside className="hidden lg:flex w-[380px] border-l border-cream-dark flex-col bg-white">
          <ChatPanel decisionId={id} />
        </aside>

        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="h-12 px-5 rounded-md bg-gold text-navy hover:bg-gold-light">
                Assistente
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[75vh] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Assistente jurídico</SheetTitle>
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
