/**
 * PONTO ÚNICO DE CHAMADA DE IA DO PROJETO.
 *
 * Nenhuma edge function deve chamar um endpoint de IA diretamente — use este módulo.
 *
 * ── CONFORMIDADE (NÃO ALTERAR SEM ENTENDER A CONSEQUÊNCIA) ────────────────────
 * A `GEMINI_API_KEY` DEVE pertencer a um projeto Google Cloud com FATURAMENTO
 * ATIVO (nível PAGO da Generative Language API). O nível GRATUITO do Google AI
 * Studio permite que o Google use o conteúdo enviado para melhorar seus produtos.
 * Nós processamos petições, contratos e documentos de clientes de advogados —
 * usar o nível gratuito seria uma violação de confidencialidade. Não "economize"
 * trocando por uma chave gratuita.
 *
 * ── SEM FALLBACK PARA O GATEWAY DO LOVABLE ───────────────────────────────────
 * Se `GEMINI_API_KEY` não estiver configurada, a chamada FALHA com erro explícito.
 * Um fallback silencioso para `LOVABLE_API_KEY` voltaria a consumir os créditos do
 * workspace de desenvolvimento (o que pode pausar o app publicado) sem ninguém
 * perceber — exatamente o problema que esta camada resolve.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_OPENAI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

/** Modelos por variável de ambiente — nunca hardcoded nas functions. */
export const MODEL_MAIN = Deno.env.get("GEMINI_MODEL_MAIN") || "gemini-flash-latest";
export const MODEL_LIGHT = Deno.env.get("GEMINI_MODEL_LIGHT") || "gemini-flash-lite-latest";

export type ModelTier = "main" | "light";

export function resolveModel(tier: ModelTier): string {
  return tier === "light" ? MODEL_LIGHT : MODEL_MAIN;
}

function getApiKey(): string {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) {
    console.error(
      "[ai] GEMINI_API_KEY não configurada — chamada de IA abortada. " +
        "Configure a secret GEMINI_API_KEY (nível pago da Google Generative Language API).",
    );
    throw new Error("Serviço de IA não configurado. Contate o suporte.");
  }
  return key;
}

export class AIError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

/** Mensagem útil ao usuário, sem vazar corpo do upstream nem a chave. */
function userMessageFor(status: number): string {
  if (status === 429) return "Serviço de IA está sobrecarregado no momento. Tente novamente em alguns instantes.";
  if (status === 402 || status === 403) return "Serviço de IA temporariamente indisponível. Tente novamente mais tarde.";
  if (status >= 500) return "Serviço de IA instável no momento. Tente novamente em alguns instantes.";
  return "Não foi possível processar sua solicitação de IA agora.";
}

export interface AIUsageMeta {
  functionName: string;
  userId?: string | null;
  environment?: string;
}

interface AIRequestOptions extends AIUsageMeta {
  model?: ModelTier;
  messages: unknown[];
  tools?: unknown[];
  tool_choice?: unknown;
  temperature?: number;
  /** Timeout apenas para chamadas não-streaming. */
  timeoutMs?: number;
}

const MAX_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 60_000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function logUsage(
  meta: AIUsageMeta,
  model: string,
  usage: { prompt_tokens?: number; completion_tokens?: number } | undefined,
) {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return;
    const supa = createClient(url, serviceKey);
    await supa.from("ai_usage").insert({
      user_id: meta.userId ?? null,
      function_name: meta.functionName,
      model,
      input_tokens: usage?.prompt_tokens ?? 0,
      output_tokens: usage?.completion_tokens ?? 0,
      environment: meta.environment ?? "live",
    });
  } catch (e) {
    // Nunca derrubar a chamada por falha de log.
    console.error("[ai] falha ao registrar ai_usage:", e instanceof Error ? e.message : e);
  }
}

/** POST cru para a camada compatível com OpenAI do Google, com retry em 429/5xx. */
async function postChat(body: Record<string, unknown>, timeoutMs?: number): Promise<Response> {
  const apiKey = getApiKey();
  let lastStatus = 500;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let controller: AbortController | undefined;
    let timer: number | undefined;
    if (timeoutMs) {
      controller = new AbortController();
      timer = setTimeout(() => controller!.abort(), timeoutMs) as unknown as number;
    }

    try {
      const res = await fetch(GOOGLE_OPENAI_BASE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller?.signal,
      });
      if (timer) clearTimeout(timer);

      if (res.ok) return res;

      lastStatus = res.status;
      const errText = await res.text().catch(() => "");
      console.error(`[ai] upstream ${res.status} (tentativa ${attempt}/${MAX_ATTEMPTS}):`, errText.slice(0, 500));

      // 4xx (exceto 429) não é retentável.
      if (res.status !== 429 && res.status < 500) {
        throw new AIError(userMessageFor(res.status), res.status);
      }
    } catch (e) {
      if (timer) clearTimeout(timer);
      if (e instanceof AIError) throw e;
      console.error(`[ai] erro de rede (tentativa ${attempt}/${MAX_ATTEMPTS}):`, e instanceof Error ? e.message : e);
    }

    if (attempt < MAX_ATTEMPTS) await sleep(500 * 2 ** (attempt - 1));
  }

  throw new AIError(userMessageFor(lastStatus), lastStatus >= 500 ? 503 : lastStatus);
}

/** Chamada não-streaming. Retorna o JSON no formato OpenAI (choices/message/tool_calls). */
export async function aiChat(opts: AIRequestOptions): Promise<any> {
  const model = resolveModel(opts.model ?? "main");
  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
  };
  if (opts.tools) body.tools = opts.tools;
  if (opts.tool_choice) body.tool_choice = opts.tool_choice;
  if (typeof opts.temperature === "number") body.temperature = opts.temperature;

  const res = await postChat(body, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const data = await res.json();
  await logUsage(opts, model, data?.usage);
  return data;
}

/** Atalho: retorna apenas o texto da primeira escolha. */
export async function aiChatText(opts: AIRequestOptions): Promise<string> {
  const data = await aiChat(opts);
  return data?.choices?.[0]?.message?.content ?? "";
}

/** Atalho: retorna os argumentos (já parseados) do primeiro tool call. */
export async function aiChatTool<T = any>(opts: AIRequestOptions): Promise<T | null> {
  const data = await aiChat(opts);
  const call = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) return null;
  try {
    return JSON.parse(call.function.arguments) as T;
  } catch {
    return null;
  }
}

/**
 * Chamada em streaming. Retorna o corpo SSE pronto para repassar ao cliente,
 * registrando o `usage` do chunk final sem bloquear o stream.
 */
export async function aiChatStream(opts: AIRequestOptions): Promise<ReadableStream<Uint8Array>> {
  const model = resolveModel(opts.model ?? "main");
  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
    stream: true,
    stream_options: { include_usage: true },
  };
  if (opts.tools) body.tools = opts.tools;
  if (opts.tool_choice) body.tool_choice = opts.tool_choice;
  if (typeof opts.temperature === "number") body.temperature = opts.temperature;

  // Sem timeout de corte: streaming longo é normal.
  const res = await postChat(body);
  const upstream = res.body;
  if (!upstream) throw new AIError(userMessageFor(502), 502);

  const decoder = new TextDecoder();
  let buffer = "";
  let usage: { prompt_tokens?: number; completion_tokens?: number } | undefined;

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(chunk);
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          if (json?.usage) usage = json.usage;
        } catch {
          // chunk parcial — ignora
        }
      }
    },
    flush() {
      // Não aguarda: log é best-effort.
      logUsage(opts, model, usage);
    },
  });

  return upstream.pipeThrough(transform);
}
