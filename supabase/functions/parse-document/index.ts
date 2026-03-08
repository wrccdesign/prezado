import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      // For PDF/DOCX, extract raw text content
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      if (fileName.endsWith(".pdf")) {
        // Basic PDF text extraction - extract text between stream markers
        const text = new TextDecoder("latin1").decode(bytes);
        const textParts: string[] = [];
        
        // Extract text from PDF content streams
        const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
        let match;
        while ((match = streamRegex.exec(text)) !== null) {
          const streamContent = match[1];
          // Extract text operators: Tj, TJ, ' and "
          const tjRegex = /\(([^)]*)\)\s*Tj/g;
          let tjMatch;
          while ((tjMatch = tjRegex.exec(streamContent)) !== null) {
            textParts.push(tjMatch[1]);
          }
          // Also try BT...ET blocks for text
          const btRegex = /BT\s*([\s\S]*?)\s*ET/g;
          let btMatch;
          while ((btMatch = btRegex.exec(streamContent)) !== null) {
            const block = btMatch[1];
            const textInBlock = /\(([^)]*)\)/g;
            let tMatch;
            while ((tMatch = textInBlock.exec(block)) !== null) {
              textParts.push(tMatch[1]);
            }
          }
        }
        
        extractedText = textParts.join(" ").replace(/\\n/g, "\n").replace(/\s+/g, " ").trim();
        
        if (!extractedText) {
          extractedText = "[Não foi possível extrair texto do PDF. O documento pode conter apenas imagens. Tente copiar e colar o texto manualmente.]";
        }
      } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
        // Basic DOCX text extraction from XML content
        const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
        // Find XML text content in DOCX (which is a zip file)
        const xmlTextRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
        const parts: string[] = [];
        let xmlMatch;
        while ((xmlMatch = xmlTextRegex.exec(text)) !== null) {
          parts.push(xmlMatch[1]);
        }
        
        extractedText = parts.join(" ").trim();
        
        if (!extractedText) {
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
