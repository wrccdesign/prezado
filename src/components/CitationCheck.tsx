export interface CitationReport {
  items: Array<{
    tipo: "processo" | "sumula" | "artigo";
    texto: string;
    status?: "verificado" | "nao_encontrado" | "nao_verificavel";
  }>;
  verificados: number;
  nao_encontrados: number;
  nao_verificaveis: number;
}

function plural(n: number, um: string, muitos: string) {
  return n === 1 ? um : muitos;
}

/**
 * Bloco discreto de verificação de citações. O acervo é parcial: um número
 * correto pode legitimamente não estar nele, por isso nunca falamos em
 * citação inexistente ou inválida.
 */
export function CitationCheck({ report }: { report?: CitationReport | null }) {
  if (!report || report.items.length === 0) return null;

  const frases: string[] = [];
  if (report.verificados > 0) {
    frases.push(
      `${report.verificados} ${plural(report.verificados, "citação verificada", "citações verificadas")} no acervo.`,
    );
  }
  if (report.nao_encontrados > 0) {
    frases.push(
      `${report.nao_encontrados} ${plural(report.nao_encontrados, "não localizada", "não localizadas")} no nosso acervo.`,
    );
  }
  if (report.nao_verificaveis > 0) {
    frases.push(
      `${report.nao_verificaveis} ${plural(report.nao_verificaveis, "não verificável", "não verificáveis")} nesta fase.`,
    );
  }

  const naoEncontrados = report.items.filter((i) => i.status === "nao_encontrado");

  return (
    <div className="mt-6 border-t border-cream-dark pt-4">
      <p className="text-note text-navy/70">{frases.join(" ")}</p>
      {naoEncontrados.length > 0 && (
        <p className="text-note text-navy/50 mt-1">
          Não localizado no nosso acervo: {naoEncontrados.map((i) => i.texto).join(", ")}. Confira na
          fonte oficial antes de usar.
        </p>
      )}
    </div>
  );
}
