import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";
import { requireQuota } from "../_shared/calculo-guard.ts";
import { aiChatText } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-payment-env, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_PDF_SIZE = 5 * 1024 * 1024;   // 5MB for PDFs
const MAX_OTHER_SIZE = 10 * 1024 * 1024; // 10MB for TXT/DOCX
const MAX_OCR_SIZE = 2 * 1024 * 1024;    // acima disso, OCR não é seguro: recusamos
const MAX_PDF_PAGES = 60;                // teto de páginas lidas por documento
const OCR_TIMEOUT_MS = 55000;
const MAX_TEXT_LENGTH = 50000;

const IMAGE_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

/**
 * Limpeza mínima: nada aqui pode apagar conteúdo do documento.
 * Sem deduplicação, sem remover linhas só com dígitos (artigo ou valor em
 * linha própria é conteúdo legítimo numa petição).
 */
function sanitizeText(raw: string): string {
  let text = raw.replace(/\r\n?/g, "\n");
  // caracteres de controle, menos quebra de linha e tabulação
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  text = text.replace(/[ \t\u00A0]+/g, " ");
  text = text.replace(/[ \t]+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

/** Verificação global: o texto extraído tem cara de texto de verdade? */
function looksLikeText(text: string): boolean {
  if (!text || text.trim().length < 50) return false;
  const letters = text.match(/[a-zA-ZÀ-ÿ]/g)?.length ?? 0;
  return letters / text.length > 0.35;
}

type PdfExtraction = {
  text: string;
  pagesRead: number;
  pagesTotal: number;
  encrypted?: boolean;
};

/**
 * Extração real via unpdf (build serverless do pdf.js): descomprime os streams,
 * resolve ToUnicode (acentuação correta) e preserva quebras de linha.
 */
async function extractPdfText(bytes: Uint8Array): Promise<PdfExtraction> {
  try {
    const doc = await getDocumentProxy(bytes);
    const pagesTotal = doc.numPages;
    const pagesRead = Math.min(pagesTotal, MAX_PDF_PAGES);
    const pages: string[] = [];

    for (let i = 1; i <= pagesRead; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      let pageText = "";
      for (const item of content.items as Array<{ str?: string; hasEOL?: boolean }>) {
        if (typeof item.str !== "string") continue;
        pageText += item.str;
        if (item.hasEOL) pageText += "\n";
      }
      pages.push(pageText.trim());
    }

    return { text: pages.join("\n\n"), pagesRead, pagesTotal };
  } catch (e) {
    const name = (e as { name?: string })?.name ?? "";
    const message = e instanceof Error ? e.message : String(e);
    if (name === "PasswordException" || /password/i.test(message)) {
      return { text: "", pagesRead: 0, pagesTotal: 0, encrypted: true };
    }
    console.error("extractPdfText failed:", message);
    return { text: "", pagesRead: 0, pagesTotal: 0 };
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
  retries = 1,
  userId?: string,
  mimeType = "application/pdf",
): Promise<{ text: string; timedOut: boolean }> {
  const base64 = bytesToBase64(bytes);

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      console.log(`OCR retry attempt ${attempt}...`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }

    try {
      const text = await aiChatText({
        model: "light",
        functionName: "parse-document",
        userId,
        timeoutMs: OCR_TIMEOUT_MS,
        temperature: 0.1,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extraia TODO o texto deste documento digitalizado (${fileName}). Retorne APENAS o texto extraído, sem comentários, explicações ou formatação markdown. Mantenha a estrutura original de parágrafos. Se houver tabelas, formate-as de forma legível. Texto em português do Brasil.`,
              },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
            ],
          },
        ],
      });

      if (text.trim().length > 20 || attempt >= retries) {
        return { text: text.trim(), timedOut: false };
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        console.error(`OCR timed out (attempt ${attempt + 1})`);
        if (attempt < retries) continue;
        return { text: "", timedOut: true };
      }
      console.error("OCR error:", e instanceof Error ? e.message : e);
      if (attempt < retries) continue;
      return { text: "", timedOut: false };
    }
  }

  return { text: "", timedOut: false };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireQuota(req, "documento", corsHeaders);
  if (auth instanceof Response) return auth;
  const _userId = auth.userId;

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
    let pagesRead: number | undefined;
    let pagesTotal: number | undefined;

    if (fileName.endsWith(".txt")) {
      extractedText = sanitizeText(await file.text());
    } else {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      if (isPdf) {
        const extraction = await extractPdfText(bytes);

        if (extraction.encrypted) {
          return new Response(
            JSON.stringify({
              error: "Este PDF está protegido por senha. Remova a proteção e envie de novo, ou cole o texto manualmente.",
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        extractedText = sanitizeText(extraction.text);
        pagesRead = extraction.pagesRead || undefined;
        pagesTotal = extraction.pagesTotal || undefined;
        if (extraction.pagesTotal > extraction.pagesRead) partialExtraction = true;

        // Plano B: PDF escaneado, sem camada de texto.
        if (!looksLikeText(extractedText)) {
          if (bytes.length > MAX_OCR_SIZE) {
            return new Response(
              JSON.stringify({
                error: `Este PDF não tem texto selecionável (parece digitalizado) e é grande demais para leitura por imagem (máximo ${Math.round(MAX_OCR_SIZE / 1024 / 1024)}MB). Envie um arquivo menor ou cole o texto manualmente.`,
              }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }

          console.log(`Camada de texto ausente ou insuficiente (${extractedText.length} chars), acionando OCR...`);
          const ocrResult = await ocrWithVision(bytes, file.name, 1, _userId);

          if (ocrResult.timedOut && extractedText.length < 20) {
            return new Response(
              JSON.stringify({ text: "", ocr: false, ocr_timeout: true }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }

          if (ocrResult.text && ocrResult.text.length > 20) {
            extractedText = sanitizeText(ocrResult.text);
            usedOcr = true;
            pagesRead = undefined;
            pagesTotal = undefined;
            partialExtraction = false;
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
      } else if (IMAGE_MIME[fileName.slice(fileName.lastIndexOf("."))]) {
        const mime = IMAGE_MIME[fileName.slice(fileName.lastIndexOf("."))];
        const ocrResult = await ocrWithVision(bytes, file.name, 1, _userId, mime);

        if (ocrResult.timedOut) {
          return new Response(
            JSON.stringify({ text: "", ocr: false, ocr_timeout: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        if (ocrResult.text && ocrResult.text.length > 10) {
          extractedText = sanitizeText(ocrResult.text);
          usedOcr = true;
        } else {
          extractedText = "[Não foi possível ler texto nesta imagem. Tente uma foto mais nítida, com o documento bem enquadrado e iluminado, ou cole o texto manualmente.]";
        }
      } else {
        throw new Error("Formato não suportado. Use PDF, DOCX, TXT ou imagem (JPG, PNG, WEBP, HEIC).");
      }
    }

    // Corte por caractere também é leitura parcial.
    const truncated = extractedText.length > MAX_TEXT_LENGTH;
    if (truncated) partialExtraction = true;

    return new Response(
      JSON.stringify({
        text: extractedText.slice(0, MAX_TEXT_LENGTH),
        ocr: usedOcr,
        partial: partialExtraction,
        ...(pagesRead ? { pages_read: pagesRead } : {}),
        ...(pagesTotal ? { pages_total: pagesTotal } : {}),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("parse-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
