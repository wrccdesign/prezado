import { auth, defineMcp } from "@lovable.dev/mcp-js";
import buscarJurisprudencia from "./tools/buscar-jurisprudencia";
import verDecisao from "./tools/ver-decisao";
import buscarSumulas from "./tools/buscar-sumulas";
import meuHistorico from "./tools/meu-historico";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "honorifico",
  title: "Honorífico",
  version: "0.1.0",
  instructions:
    "Ferramentas do Honorífico, plataforma de pesquisa jurídica brasileira. Use buscar_jurisprudencia para localizar decisões com fonte, ver_decisao para o inteiro teor dos metadados, buscar_sumulas para enunciados e meu_historico para os itens salvos na conta conectada. Cite sempre o link da fonte e nunca invente número de processo ou precedente.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [buscarJurisprudencia, verDecisao, buscarSumulas, meuHistorico],
});
