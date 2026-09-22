// Mensagens de conversa vindas do cliente.
//
// O papel (role) de cada mensagem pertence ao servidor: o cliente só pode
// enviar turnos de "user" e "assistant". Aceitar "system" permitiria que o
// chamador reescrevesse as instruções do modelo.

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_MESSAGES = 40;
const MAX_CONTENT = 20_000;

/**
 * Normaliza a lista de mensagens do cliente: descarta papéis não permitidos,
 * converte o conteúdo em texto e aplica limites de tamanho.
 * Lança quando não sobra nenhuma mensagem utilizável.
 */
export function sanitizeChatMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) throw new Error("Mensagens não fornecidas");

  const cleaned: ChatMessage[] = [];
  for (const raw of input.slice(-MAX_MESSAGES)) {
    if (!raw || typeof raw !== "object") continue;
    const { role, content } = raw as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;
    const text = content.trim();
    if (!text) continue;
    cleaned.push({ role, content: text.slice(0, MAX_CONTENT) });
  }

  if (cleaned.length === 0) throw new Error("Mensagens não fornecidas");
  return cleaned;
}
