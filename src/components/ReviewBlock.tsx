export interface OutputReview {
  correcoes: string[];
  pontos_a_conferir: string[];
}

/**
 * Bloco discreto "Conferência automática": mostra o que a revisão corrigiu
 * em código e o que cabe ao usuário conferir. Sem ícone decorativo, sem emoji.
 * Se não houver nada, não renderiza.
 */
export function ReviewBlock({ review }: { review?: OutputReview | null }) {
  if (!review) return null;
  const correcoes = review.correcoes ?? [];
  const pontos = review.pontos_a_conferir ?? [];
  if (correcoes.length === 0 && pontos.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 sm:p-5 space-y-3">
      <p className="text-sm font-medium text-foreground">Conferência automática</p>
      {correcoes.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Corrigido automaticamente:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
            {correcoes.map((c, i) => (
              <li key={`c-${i}`}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {pontos.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Pontos a conferir antes de usar:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
            {pontos.map((p, i) => (
              <li key={`p-${i}`}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
