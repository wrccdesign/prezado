/**
 * Shared embedding utility using Voyage AI voyage-law-2
 * Specialized for Brazilian legal text
 */

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-law-2";

export async function generateEmbedding(text: string): Promise<number[]> {
  const VOYAGE_API_KEY = Deno.env.get("VOYAGE_API_KEY");
  if (!VOYAGE_API_KEY) throw new Error("VOYAGE_API_KEY not configured");

  // Truncate to ~8000 chars to stay within token limits
  const truncated = text.substring(0, 8000);

  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: [truncated],
      model: VOYAGE_MODEL,
      input_type: "document",
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Voyage AI error ${response.status}: ${errText}`);
  }

  const result = await response.json();
  const embedding = result.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Voyage AI did not return a valid embedding");
  }

  return embedding;
}

export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const VOYAGE_API_KEY = Deno.env.get("VOYAGE_API_KEY");
  if (!VOYAGE_API_KEY) throw new Error("VOYAGE_API_KEY not configured");

  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: [text.substring(0, 2000)],
      model: VOYAGE_MODEL,
      input_type: "query",
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Voyage AI query embedding error ${response.status}: ${errText}`);
  }

  const result = await response.json();
  const embedding = result.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Voyage AI did not return a valid query embedding");
  }

  return embedding;
}
