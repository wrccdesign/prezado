/**
 * Shared embedding utility using Voyage AI voyage-law-2
 * Specialized for Brazilian legal text.
 *
 * - Envio em LOTE (a API aceita vários textos por chamada)
 * - Retry com backoff exponencial + jitter em 429 e 5xx (respeita Retry-After)
 * - Consumo registrado em `ai_usage` (a Voyage era o único provedor invisível)
 */

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-law-2";

/** A Voyage aceita até 128 textos por chamada; 32 mantém o payload pequeno. */
export const VOYAGE_BATCH_SIZE = 32;

const MAX_ATTEMPTS = 5;

async function logUsage(tokens: number, functionName: string, userId?: string, environment = "live") {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key || tokens <= 0) return;
    await fetch(`${url}/rest/v1/ai_usage`, {
      method: "POST",
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        user_id: userId ?? null,
        function_name: functionName,
        model: VOYAGE_MODEL,
        input_tokens: tokens,
        output_tokens: 0,
        environment,
      }),
    });
  } catch (e) {
    // Telemetria nunca derruba a operação principal.
    console.error("[embeddings] falha ao registrar ai_usage:", e);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface EmbedOptions {
  inputType: "document" | "query";
  functionName?: string;
  userId?: string;
  environment?: string;
}

async function callVoyage(texts: string[], opts: EmbedOptions): Promise<number[][]> {
  const VOYAGE_API_KEY = Deno.env.get("VOYAGE_API_KEY");
  if (!VOYAGE_API_KEY) throw new Error("VOYAGE_API_KEY not configured");

  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VOYAGE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: texts,
        model: VOYAGE_MODEL,
        input_type: opts.inputType,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const rows = result.data;
      if (!Array.isArray(rows) || rows.length !== texts.length) {
        throw new Error("Voyage AI did not return the expected number of embeddings");
      }
      const tokens = result.usage?.total_tokens ?? 0;
      await logUsage(tokens, opts.functionName ?? "embeddings", opts.userId, opts.environment);
      // A ordem de retorno segue `index`, mas ordenamos por garantia.
      return rows
        .slice()
        .sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0))
        .map((r: any) => {
          if (!Array.isArray(r.embedding)) throw new Error("Voyage AI returned an invalid embedding");
          return r.embedding as number[];
        });
    }

    lastError = await response.text();
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === MAX_ATTEMPTS) {
      throw new Error(`Voyage AI error ${response.status}: ${lastError}`);
    }

    const retryAfter = Number(response.headers.get("Retry-After"));
    const backoff = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : Math.min(2 ** attempt * 1000, 30000) + Math.random() * 1000;
    console.warn(`[embeddings] ${response.status} — retry ${attempt}/${MAX_ATTEMPTS} em ${Math.round(backoff)}ms`);
    await sleep(backoff);
  }

  throw new Error(`Voyage AI error após ${MAX_ATTEMPTS} tentativas: ${lastError}`);
}

/** Gera embeddings de documentos em lote, dividindo automaticamente por VOYAGE_BATCH_SIZE. */
export async function generateEmbeddings(
  texts: string[],
  opts: { functionName?: string; userId?: string; environment?: string } = {},
): Promise<number[][]> {
  const truncated = texts.map((t) => (t ?? "").substring(0, 8000));
  const out: number[][] = [];
  for (let i = 0; i < truncated.length; i += VOYAGE_BATCH_SIZE) {
    const chunk = truncated.slice(i, i + VOYAGE_BATCH_SIZE);
    const vectors = await callVoyage(chunk, { inputType: "document", ...opts });
    out.push(...vectors);
  }
  return out;
}

export async function generateEmbedding(
  text: string,
  opts: { functionName?: string; userId?: string; environment?: string } = {},
): Promise<number[]> {
  const [vector] = await generateEmbeddings([text], opts);
  return vector;
}

export async function generateQueryEmbedding(
  text: string,
  opts: { functionName?: string; userId?: string; environment?: string } = {},
): Promise<number[]> {
  const [vector] = await callVoyage([text.substring(0, 2000)], { inputType: "query", ...opts });
  return vector;
}

/** Formata um vetor para o literal aceito pelo pgvector. */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
