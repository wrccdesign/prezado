import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_PDF_SIZE = 5 * 1024 * 1024;   // 5MB for PDFs
const MAX_OTHER_SIZE = 10 * 1024 * 1024; // 10MB for TXT/DOCX
const OCR_CHUNK_SIZE = 2 * 1024 * 1024;  // 2MB chunks for OCR
const OCR_TIMEOUT_MS = 55000;
const MAX_TEXT_LENGTH = 50000;

function sanitizeText(raw: string): string {
  let text = raw.replace(/[^\x20-\x7E\xA0-\xFF\u00C0-\u024F\n\r\t]/g, " ");
  text = text.replace(/\.{5,}/g, " ");
  text = text.replace(/_{5,}/g, " ");
  text = text.replace(/\s*-{5,}\s*/g, "\n");
  text = text.replace(/^\s*\d+\s*$/gm, "");
  text = text.replace(/^\s*Página\s+\d+\s*(de\s+\d+)?\s*$/gim, "");
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/^\s+$/gm, "");
  return text.trim();
}

function isReadableText(text: string): boolean {
  if (!text || text.length < 5) return false;
  const printable = text.match(/[a-zA-ZÀ-ÿ0-9\s.,;:!?()'"\/\-]/g);
  const ratio = (printable?.length || 0) / text.length;
  return ratio > 0.6;
}

function extractPdfText(bytes: Uint8Array): string {
  try {
    const raw = new TextDecoder("latin1").decode(bytes);
    const cleaned = raw.replace(/stream[\r\n][\s\S]*?endstream/gi, " ");
    const parts: string[] = [];
    const seen = new Set<string>();
    const MAX_ITERATIONS = 50000;
    let iterations = 0;

    const tjRegex = /\(([^)]{1,500})\)\s*Tj/gi;
    let match;
    while ((match = tjRegex.exec(cleaned)) !== null && iterations < MAX_ITERATIONS) {
      iterations++;
      const t = match[1].replace(/\\[nrt]/g, " ").replace(/\\(.)/g, "$1").trim();
      if (t.length > 1 && isReadableText(t) && !seen.has(t)) {
        seen.add(t);
        parts.push(t);
      }
    }

    const arrayRegex = /\[([^\]]{1,5000})\]\s*TJ/gi;
    while ((match = arrayRegex.exec(cleaned)) !== null && iterations < MAX_ITERATIONS) {
      iterations++;
      const innerRegex = /\(([^)]*)\)/g;
      let inner;
      const lineParts: string[] = [];
      while ((inner = innerRegex.exec(match[1])) !== null) {
        const t = inner[1].replace(/\\[nrt]/g, " ").replace(/\\(.)/g, "$1");
        if (t.trim()) lineParts.push(t);
      }
      const line = lineParts.join("").trim();
      if (line.length > 1 && isReadableText(line) && !seen.has(line)) {
        seen.add(line);
        parts.push(line);
      }
    }

    return parts.join(" ");
  } catch (e) {
    console.error("extractPdfText failed:", e);
    return "";
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function ocrWithVision(
  bytes: Uint8Array,
  fileName: string,
  retries = 1
): Promise<{ text: string; timedOut: boolean }> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.error("LOVABLE_API_KEY not available for OCR fallback");
    return { text: "", timedOut: false };
  }

  const base64 = bytesToBase64(bytes);

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      console.log(`OCR retry attempt ${attempt}...`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS);

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Extraia TODO o texto deste documento PDF escaneado (${fileName}). Retorne APENAS o texto extraído, sem comentários, explicações ou formatação markdown. Mantenha a estrutura original de parágrafos. Se houver tabelas, formate-as de forma legível. Texto em português do Brasil.`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:application/pdf;base64,${base64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 16000,
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`OCR API error [${response.status}]:`, errText);
        if (attempt < retries) continue;
        return { text: "", timedOut: false };
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || "";
      if (text.trim().length > 20) {
        return { text: text.trim(), timedOut: false };
      }
      if (attempt < retries) continue;
      return { text: text.trim(), timedOut: false };
    } catch (e) {
      clearTimeout(timeout);
      if (e instanceof DOMException && e.name === "AbortError") {
        console.error(`OCR timed out (attempt ${attempt + 1})`);
        if (attempt < retries) continue;
        return { text: "", timedOut: true };
      }
      console.error("OCR fetch error:", e);
      if (attempt < retries) continue;
      return { text: "", timedOut: false };
    }
  }

  return { text: "", timedOut: false };
}

async function processLargePdfOcr(
  bytes: Uint8Array,
  fileName: string
): Promise<{ text: string; timedOut: boolean; partial: boolean }> {
  if (bytes.length <= OCR_CHUNK_SIZE) {
    const result = await ocrWithVision(bytes, fileName, 1);
    return { ...result, partial: false };
  }

  // Truncate to first OCR_CHUNK_SIZE bytes for OCR
  console.log(`PDF is ${(bytes.length / 1024 / 1024).toFixed(1)}MB, truncating to ${(OCR_CHUNK_SIZE / 1024 / 1024).toFixed(1)}MB for OCR...`);
  const truncated = bytes.subarray(0, OCR_CHUNK_SIZE);
  const result = await ocrWithVision(truncated, fileName, 1);
  return { ...result, partial: result.text.length > 20 };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      throw new Error("Expected multipart/form-data");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) throw new Error("No file provided");

    const fileName = file.name.toLowerCase();
    const isPdf = fileName.endsWith(".pdf");
    const maxSize = isPdf ? MAX_PDF_SIZE : MAX_OTHER_SIZE;

    if (file.size > maxSize) {
      const limitMb = Math.round(maxSize / 1024 / 1024);
      throw new Error(`Arquivo muito grande (máximo ${limitMb}MB para ${isPdf ? "PDF" : "este formato"})`);
    }

    let extractedText = "";
    let usedOcr = false;
    let partialExtraction = false;

    if (fileName.endsWith(".txt")) {
      extractedText = await file.text();
    } else {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      if (isPdf) {
        // Step 1: regex extraction
        extractedText = extractPdfText(bytes);
        extractedText = sanitizeText(extractedText);

        if (extractedText && extractedText.length >= 50 && !isReadableText(extractedText)) {
          console.log(`Extracted text failed readability check (${extractedText.length} chars), falling back to OCR...`);
          extractedText = "";
        }

        // Step 2: OCR fallback with chunking
        if (!extractedText || extractedText.length < 50) {
          console.log(`Regex extraction yielded ${extractedText.length} chars, falling back to OCR...`);
          const ocrResult = await processLargePdfOcr(bytes, file.name);

          if (ocrResult.timedOut && (!extractedText || extractedText.length < 20)) {
            return new Response(
              JSON.stringify({ text: "", ocr: false, ocr_timeout: true }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          if (ocrResult.text && ocrResult.text.length > 20) {
            extractedText = ocrResult.text;
            usedOcr = true;
            partialExtraction = ocrResult.partial;
          }
        }

        if (!extractedText || extractedText.length < 20) {
          extractedText = "[Não foi possível extrair texto do PDF. O documento pode estar protegido ou corrompido. Tente copiar e colar o texto manualmente.]";
        }
      } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
        const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
        const xmlTextRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
        const parts: string[] = [];
        let xmlMatch;
        while ((xmlMatch = xmlTextRegex.exec(text)) !== null) {
          parts.push(xmlMatch[1]);
        }
        extractedText = sanitizeText(parts.join(" "));
        if (!extractedText || extractedText.length < 10) {
          extractedText = "[Não foi possível extrair texto do documento. Tente copiar e colar o texto manualmente.]";
        }
      } else {
        throw new Error("Formato não suportado. Use PDF, DOCX ou TXT.");
      }
    }

    return new Response(
      JSON.stringify({
        text: extractedText.slice(0, MAX_TEXT_LENGTH),
        ocr: usedOcr,
        partial: partialExtraction,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("parse-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
