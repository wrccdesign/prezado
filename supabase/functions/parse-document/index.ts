import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Sanitize extracted text for Brazilian legal documents
 * Handles encoding issues from tribunais (CP1252, ISO-8859-1)
 */
function sanitizeText(raw: string): string {
  // (a) Remove control characters and strange symbols, keep Latin Extended + accented chars
  let text = raw.replace(/[^\x20-\x7E\xA0-\xFF\u00C0-\u024F\n\r\t]/g, " ");
  
  // (b) Fix common encoding artifacts from CP1252/ISO-8859-1
  const encodingFixes: Record<string, string> = {
    "Ã¡": "á", "Ã ": "à", "Ã¢": "â", "Ã£": "ã", "Ã¤": "ä",
    "Ã©": "é", "Ã¨": "è", "Ãª": "ê", "Ã«": "ë",
    "Ã­": "í", "Ã¬": "ì", "Ã®": "î", "Ã¯": "ï",
    "Ã³": "ó", "Ã²": "ò", "Ã´": "ô", "Ãµ": "õ", "Ã¶": "ö",
    "Ãº": "ú", "Ã¹": "ù", "Ã»": "û", "Ã¼": "ü",
    "Ã§": "ç", "Ã‡": "Ç", "Ã±": "ñ", "Ã'": "Ñ",
    "Ã": "Á", "Ã‰": "É", "Ã": "Í", "Ã"": "Ó", "Ãš": "Ú",
    "Ã€": "À", "Ã‚": "Â", "Ãƒ": "Ã", "ÃŠ": "Ê", "Ã"": "Ô", "Ã•": "Õ",
    "\u0000": "", "\ufffd": "",
  };
  for (const [bad, good] of Object.entries(encodingFixes)) {
    text = text.split(bad).join(good);
  }
  
  // (c) Remove page break artifacts
  text = text.replace(/\.{5,}/g, " "); // sequences of dots
  text = text.replace(/_{5,}/g, " "); // sequences of underscores
  text = text.replace(/\s*-{5,}\s*/g, "\n"); // long dashes
  text = text.replace(/^\s*\d+\s*$/gm, ""); // isolated page numbers
  text = text.replace(/^\s*Página\s+\d+\s*(de\s+\d+)?\s*$/gim, ""); // "Página X de Y"
  
  // (d) Normalize whitespace
  text = text.replace(/[ \t]+/g, " "); // multiple spaces to single
  text = text.replace(/\n{3,}/g, "\n\n"); // 3+ newlines to double
  text = text.replace(/^\s+$/gm, ""); // blank lines with only spaces
  
  return text.trim();
}

/**
 * Extract text from PDF using multiple strategies and encodings
 */
function extractPdfText(bytes: Uint8Array): string {
  const textParts: string[] = [];
  
  // Try multiple decodings
  const decodings = [
    new TextDecoder("utf-8", { fatal: false }),
    new TextDecoder("latin1"),
    new TextDecoder("windows-1252", { fatal: false }),
  ];
  
  let bestText = "";
  let bestScore = -1;
  
  for (const decoder of decodings) {
    try {
      const raw = decoder.decode(bytes);
      const parts: string[] = [];
      
      // Strategy 1: Extract from PDF content streams - Tj operator
      const tjRegex = /\(([^)]*)\)\s*Tj/g;
      let match;
      while ((match = tjRegex.exec(raw)) !== null) {
        const t = match[1].replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t");
        if (t.trim()) parts.push(t);
      }
      
      // Strategy 2: TJ array operator (most common in modern PDFs)
      const tjArrayRegex = /\[((?:\([^)]*\)|[^\]]*)*)\]\s*TJ/gi;
      while ((match = tjArrayRegex.exec(raw)) !== null) {
        const arrayContent = match[1];
        const innerRegex = /\(([^)]*)\)/g;
        let innerMatch;
        const lineParts: string[] = [];
        while ((innerMatch = innerRegex.exec(arrayContent)) !== null) {
          const t = innerMatch[1].replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t");
          if (t.trim()) lineParts.push(t);
        }
        if (lineParts.length) parts.push(lineParts.join(""));
      }
      
      // Strategy 3: BT...ET text blocks
      const btRegex = /BT\s*([\s\S]*?)\s*ET/g;
      while ((match = btRegex.exec(raw)) !== null) {
        const block = match[1];
        const textInBlock = /\(([^)]*)\)/g;
        let tMatch;
        while ((tMatch = textInBlock.exec(block)) !== null) {
          const t = tMatch[1].replace(/\\n/g, "\n").replace(/\\r/g, "\r");
          if (t.trim() && !parts.includes(t)) parts.push(t);
        }
      }
      
      // Strategy 4: Look for Unicode text markers (hex encoded)
      const hexRegex = /<([0-9A-Fa-f\s]+)>\s*Tj/g;
      while ((match = hexRegex.exec(raw)) !== null) {
        const hex = match[1].replace(/\s/g, "");
        if (hex.length >= 4) {
          let decoded = "";
          for (let i = 0; i < hex.length; i += 4) {
            const charCode = parseInt(hex.substring(i, i + 4), 16);
            if (charCode > 0 && charCode < 65536) decoded += String.fromCharCode(charCode);
          }
          if (decoded.trim()) parts.push(decoded);
        }
      }
      
      const combined = parts.join(" ");
      
      // Score: prefer the decoding that produces the most readable Portuguese text
      const ptChars = (combined.match(/[a-zA-ZáàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ]/g) || []).length;
      const totalChars = combined.length || 1;
      const score = ptChars / totalChars * combined.length;
      
      if (score > bestScore) {
        bestScore = score;
        bestText = combined;
      }
    } catch {
      continue;
    }
  }
  
  return bestText;
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
        // DOCX text extraction from XML content
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
