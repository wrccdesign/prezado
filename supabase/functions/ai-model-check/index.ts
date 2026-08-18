// TEMPORÁRIO: valida nomes de modelos do Gemini e function calling. Será removido.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async () => {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return new Response(JSON.stringify({ error: "no key" }), { status: 500 });

  const list = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`);
  const listJson = await list.json();
  const names = (listJson.models ?? [])
    .filter((m: any) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
    .map((m: any) => m.name.replace("models/", ""));

  const candidates = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
  ];

  const results: Record<string, any> = {};
  for (const model of candidates) {
    try {
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Responda apenas: ok" }],
          tools: [{
            type: "function",
            function: {
              name: "echo",
              description: "ecoa",
              parameters: { type: "object", properties: { v: { type: "string" } }, required: ["v"], additionalProperties: false },
            },
          }],
          tool_choice: { type: "function", function: { name: "echo" } },
        }),
      });
      const j = await r.json();
      results[model] = {
        status: r.status,
        tool_call: j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? null,
        usage: j?.usage ?? null,
        error: j?.error?.message?.slice(0, 200) ?? null,
      };
    } catch (e) {
      results[model] = { error: String(e).slice(0, 200) };
    }
  }

  return new Response(JSON.stringify({ available: names, results }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});
