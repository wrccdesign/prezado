import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "buscar_sumulas",
  title: "Buscar súmulas",
  description:
    "Busca súmulas e enunciados no acervo do Honorífico por texto livre, com filtros opcionais de tribunal e área do direito.",
  inputSchema: {
    consulta: z.string().trim().min(2).describe("Termos da busca, por exemplo: prescrição consumidor"),
    tribunal: z.string().trim().optional().describe("Sigla do tribunal, por exemplo STJ"),
    area: z.string().trim().optional().describe("Área do direito"),
    limite: z.number().int().min(1).max(20).default(10).describe("Quantidade de resultados"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ consulta, tribunal, area, limite }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.rpc("search_sumulas", {
      search_query: consulta,
      filter_tribunal: tribunal ?? undefined,
      filter_area: area ?? undefined,
      result_limit: limite,
    });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const itens = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify(itens, null, 2) }],
      structuredContent: { total: itens.length, itens },
    };
  },
});
