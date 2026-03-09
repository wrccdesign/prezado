import { useState, useRef, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AppFooter } from "@/components/AppFooter";
import { Send, Loader2, Scale, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-juris`;

// Extract metadata from AI response
function extractMetadata(text: string): { area?: string; leis: string[] } {
  const metaMatch = text.match(/<!--\s*META:\s*(\{.*?\})\s*-->/s);
  if (metaMatch) {
    try {
      const meta = JSON.parse(metaMatch[1]);
      return { area: meta.area, leis: meta.leis || [] };
    } catch {}
  }
  
  // Fallback: extract law mentions with regex
  const leis: string[] = [];
  const leiRegex = /(?:Lei|Decreto-Lei|Código)\s+(?:nº\s+)?[\d.]+\/\d{4}/gi;
  const matches = text.match(leiRegex);
  if (matches) leis.push(...[...new Set(matches)]);
  
  return { leis };
}

// Strip metadata comments from display text
function stripMeta(text: string): string {
  return text.replace(/<!--\s*META:.*?-->/gs, "").trim();
}

export default function Chat() {
  const { toast } = useToast();
  const { isLawyer } = useUserProfile();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save conversation metadata after AI responds
  const saveConversationMetadata = async (allMessages: Message[]) => {
    if (!user) return;
    const lastAssistant = [...allMessages].reverse().find(m => m.role === "assistant");
    if (!lastAssistant) return;

    const meta = extractMetadata(lastAssistant.content);
    const firstUserMsg = allMessages.find(m => m.role === "user");

    try {
      await supabase.from("chat_conversations").insert({
        user_id: user.id,
        area_do_direito: meta.area || null,
        leis_citadas: meta.leis,
        mensagem_resumo: firstUserMsg?.content?.slice(0, 200) || null,
      } as any);
    } catch (e) {
      console.error("Failed to save chat metadata:", e);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      const displayText = stripMeta(assistantSoFar);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: displayText } : m
          );
        }
        return [...prev, { role: "assistant", content: displayText }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          isLawyer,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => null);
        const errMsg = errData?.error || "Erro ao conectar com a IA.";
        toast({ title: "Erro", description: errMsg, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }

      // Save metadata after complete response
      const finalMeta = extractMetadata(assistantSoFar);
      const finalMessages: Message[] = [...newMessages, { role: "assistant", content: stripMeta(assistantSoFar) }];
      saveConversationMetadata([...newMessages, { role: "assistant", content: assistantSoFar }]);
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Falha na conexão.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <LegalDisclaimer />
      <main className="flex flex-1 flex-col container max-w-3xl py-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">Chat Jurídico</h2>
          <p className="text-xs text-muted-foreground">
            {isLawyer ? "Modo Advogado — respostas técnicas" : "Modo Cidadão — linguagem acessível"}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
                <Scale className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">JurisAI Chat</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Tire dúvidas sobre direitos, legislação brasileira, prazos processuais e muito mais.
                {!isLawyer && " Respostas adaptadas para linguagem acessível."}
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                  <Scale className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <Card
                className={`max-w-[85%] px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      components={{
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline decoration-primary/30 hover:decoration-primary font-medium"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </Card>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Scale className="h-4 w-4 text-primary-foreground" />
              </div>
              <Card className="bg-muted px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 border-t bg-background pt-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Digite sua dúvida jurídica..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="min-h-[48px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="h-12 w-12 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
