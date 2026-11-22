/**
 * Espelha a política RLS "Decisoes publicaveis sao legiveis".
 * Funções que leem decisions com service role por id vindo do cliente
 * devem filtrar por esta regra, para não expor registros não publicáveis.
 */
export function isPublishableDecision(d: {
  numero_processo?: unknown;
  ementa?: unknown;
  resumo_ia?: unknown;
} | null | undefined): boolean {
  if (!d) return false;
  const num = typeof d.numero_processo === "string" ? d.numero_processo : null;
  if (!num || num.includes("<UNKNOWN>")) return false;
  const ementa = typeof d.ementa === "string" ? d.ementa : "";
  const resumo = typeof d.resumo_ia === "string" ? d.resumo_ia : "";
  return ementa.length >= 50 || resumo.length >= 30;
}
