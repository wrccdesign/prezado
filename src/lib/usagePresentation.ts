export const USAGE_LABELS: Record<string, string> = {
  search: "Buscas de jurisprudência", chat: "Chat jurídico", diagnostico: "Diagnósticos",
  peticao: "Petições", analise: "Análises de documentos", documento: "Leituras/OCR de documentos",
};

export function visibleUsageActions<T extends { action: string; label: string; limit: number }>(actions: T[], isAdmin = false): T[] {
  return actions.filter((a) => Object.hasOwn(USAGE_LABELS, a.action))
    .map((a) => ({ ...a, label: USAGE_LABELS[a.action], limit: isAdmin ? -1 : a.limit }));
}

export function canIncreaseLimits(plan?: string, isAdmin = false): boolean {
  return !!plan && !isAdmin && plan !== "admin" && plan !== "escritorio";
}