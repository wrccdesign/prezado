export function firstDisplayName(name: string): string {
  const first = name.trim().split(/\s+/)[0] || "";
  return first.charAt(0).toLocaleUpperCase("pt-BR") + first.slice(1);
}

export function analysisDisplayTitle(result: unknown): string {
  if (!result || typeof result !== "object" || Array.isArray(result)) return "Análise de documentos";
  const data = result as Record<string, unknown>;
  if (typeof data.tipo_de_causa === "string" && data.tipo_de_causa.trim()) return data.tipo_de_causa.trim();
  if (typeof data.resumo === "string" && data.resumo.trim()) {
    const summary = data.resumo.trim();
    return summary.length > 120 ? `${summary.slice(0, 117).trimEnd()}...` : summary;
  }
  return "Análise de documentos";
}