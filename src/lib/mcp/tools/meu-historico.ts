import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "meu_historico",
  title: "Meu histórico",
  description:
    "Lista os itens salvos na conta de quem está conectado: análises, petições e cálculos, do mais recente para o mais antigo.",
  inputSchema: {
    tipo: z
      .enum(["analises", "peticoes", "calculos"])
      .default("analises")
      .describe("Tipo de item do histórico"),
    limite: z.number().int().min(1).max(50).default(10).describe("Quantidade de itens"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ tipo, limite }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const tabela = tipo === "analises" ? "analyses" : tipo === "peticoes" ? "petitions" : "calculos";
    const colunas =
      tipo === "analises"
        ? "id,created_at,file_name,input_text,result"
        : tipo === "peticoes"
          ? "id,created_at,petition_type,generated_text"
          : "*";

    const { data, error } = await supabase
      .from(tabela)
      .select(colunas)
      .order("created_at", { ascending: false })
      .limit(limite);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const itens = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify(itens, null, 2) }],
      structuredContent: { tipo, total: itens.length, itens },
    };
  },
});
