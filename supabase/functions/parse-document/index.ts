import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

/**
 * Lightweight PDF text extraction - single pass, avoids CPU timeout
 */
function extractPdfText(bytes: Uint8Array): string {
  const raw = new TextDecoder("latin1").decode(bytes);
  const parts: string[] = [];
  const seen = new Set<string>();
  
  const regex = /\(([^)]{1,500})\)\s*Tj|\[((?:\([^)]*\)|[^\]]*){1,2000})\]\s*TJ/gi;
  let match;
  let iterations = 0;
  const MAX_ITERATIONS = 50000;
  
  while ((match = regex.exec(raw)) !== null && iterations < MAX_ITERATIONS) {
    iterations++;
    
    if (match[1]) {
      const t = match[1].replace(/\\[nrt]/g, " ").trim();
      if (t.length > 1 && !seen.has(t)) {
        seen.add(t);
        parts.push(t);
      }
    } else if (match[2]) {
      const innerRegex = /\(([^)]*)\)/g;
      let inner;
      const lineParts: string[] = [];
      while ((inner = innerRegex.exec(match[2])) !== null) {
        const t = inner[1].replace(/\\[nrt]/g, " ");
        if (t.trim()) lineParts.push(t);
      }
      const line = lineParts.join("").trim();
      if (line.length > 1 && !seen.has(line)) {
        seen.add(line);
        parts.push(line);
      }
    }
  }
  
  return parts.join(" ");
}

/**
 * OCR fallback: send the raw PDF as base64 to Gemini vision for text extraction
 */
async function ocrWithVision(bytes: Uint8Array, fileName: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.error("LOVABLE_API_KEY not available for OCR fallback");
    return "";
  }

  // Convert PDF bytes to base64
  let base64 = "";
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
    base64 += String.fromCharCode(...chunk);
  }
  base64 = btoa(base64);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
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
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`OCR vision API error [${response.status}]:`, errText);
    return "";
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || "";
  return text.trim();
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

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) throw new Error("File too large (max 10MB)");

    const fileName = file.name.toLowerCase();
    let extractedText = "";
    let usedOcr = false;

    if (fileName.endsWith(".txt")) {
      extractedText = await file.text();
    } else {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      if (fileName.endsWith(".pdf")) {
        // Step 1: Try regex-based extraction
        extractedText = extractPdfText(bytes);
        extractedText = sanitizeText(extractedText);
        
        // Step 2: If too little text, fallback to OCR via Gemini vision
        if (!extractedText || extractedText.length < 50) {
          console.log(`Regex extraction yielded ${extractedText.length} chars, falling back to OCR...`);
          const ocrText = await ocrWithVision(bytes, file.name);
          if (ocrText && ocrText.length > 20) {
            extractedText = ocrText;
            usedOcr = true;
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
        text: extractedText.slice(0, 50000),
        ocr: usedOcr,
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
