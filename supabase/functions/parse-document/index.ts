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
  
  // Single combined regex pass for Tj and TJ operators
  const regex = /\(([^)]{1,500})\)\s*Tj|\[((?:\([^)]*\)|[^\]]*){1,2000})\]\s*TJ/gi;
  let match;
  let iterations = 0;
  const MAX_ITERATIONS = 50000; // Safety limit
  
  while ((match = regex.exec(raw)) !== null && iterations < MAX_ITERATIONS) {
    iterations++;
    
    if (match[1]) {
      // Simple Tj
      const t = match[1].replace(/\\[nrt]/g, " ").trim();
      if (t.length > 1 && !seen.has(t)) {
        seen.add(t);
        parts.push(t);
      }
    } else if (match[2]) {
      // TJ array
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

    if (fileName.endsWith(".txt")) {
      extractedText = await file.text();
    } else {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      if (fileName.endsWith(".pdf")) {
        extractedText = extractPdfText(bytes);
        extractedText = sanitizeText(extractedText);
        
        if (!extractedText || extractedText.length < 20) {
          extractedText = "[Não foi possível extrair texto do PDF. O documento pode conter apenas imagens escaneadas ou estar protegido. Tente copiar e colar o texto manualmente.]";
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
      JSON.stringify({ text: extractedText.slice(0, 50000) }),
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
