import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "buscar_jurisprudencia",
  title: "Buscar jurisprudência",
  description:
    "Busca decisões judiciais no acervo do Honorífico por texto livre, com filtros opcionais de tribunal, UF e instância. Retorna ementa, órgão julgador e link da fonte.",
  inputSchema: {
    consulta: z.string().trim().min(2).describe("Termos da busca, por exemplo: dano moral negativação indevida"),
    tribunal: z.string().trim().optional().describe("Sigla do tribunal, por exemplo TJSP"),
    uf: z.string().trim().length(2).optional().describe("UF de duas letras, por exemplo SP"),
    instancia: z.string().trim().optional().describe("Instância da decisão"),
    limite: z.number().int().min(1).max(20).default(10).describe("Quantidade de resultados"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ consulta, tribunal, uf, instancia, limite }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.rpc("search_decisions", {
      search_query: consulta,
      filter_tribunal: tribunal ?? undefined,
      filter_uf: uf ? uf.toUpperCase() : undefined,
      filter_instancia: instancia ?? undefined,
      result_limit: limite,
    });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const itens = (data ?? []).map((d: Record<string, unknown>) => ({
      id: d.id,
      tribunal: d.tribunal,
      orgao_julgador: d.orgao_julgador,
      numero_processo: d.numero_processo,
      data_decisao: d.data_decisao,
      relator: d.relator,
      ementa: typeof d.ementa === "string" ? d.ementa.slice(0, 1200) : null,
      resultado: d.resultado,
      fonte: d.source_url,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(itens, null, 2) }],
      structuredContent: { total: itens.length, itens },
    };
  },
});
