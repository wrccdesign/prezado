import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "ver_decisao",
  title: "Ver decisão",
  description:
    "Retorna os dados completos de uma decisão do acervo a partir do seu identificador, incluindo ementa, legislação citada e link da fonte.",
  inputSchema: {
    id: z.string().uuid().describe("Identificador da decisão, obtido em buscar_jurisprudencia"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("decisions")
      .select(
        "id,tribunal,orgao_julgador,comarca,uf,instancia,numero_processo,data_decisao,relator,tipo_decisao,resultado,resultado_descricao,ementa,resumo_ia,legislacao_citada,jurisprudencias_citadas,temas_juridicos,source,source_url",
      )
      .eq("id", id)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Decisão não encontrada" }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { decisao: data },
    };
  },
});
