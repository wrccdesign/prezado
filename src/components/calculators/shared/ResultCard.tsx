import type { ReactNode } from "react";

interface ResultCardProps {
  /** Rótulo curto acima do valor. */
  label: string;
  /** Valor dominante, já formatado. */
  value: string;
  /** Linha de contexto abaixo do valor. */
  meta?: ReactNode;
  /** Observações relevantes (piso/teto, isenção, etc.). */
  notes?: ReactNode;
  /** Botões de ação, empilham no mobile. */
  actions?: ReactNode;
}

/**
 * Bloco de resultado padrão das calculadoras: valor dominante primeiro,
 * contexto em seguida, ações por último.
 */
export function ResultCard({ label, value, meta, notes, actions }: ResultCardProps) {
  return (
    <div className="rounded-lg border border-cream-dark bg-white p-5 sm:p-6">
      <div className="space-y-2">
        <p className="text-note text-navy/60">{label}</p>
        <p className="tabular text-3xl text-navy sm:text-4xl">{value}</p>
        {meta && <p className="text-note text-navy/70">{meta}</p>}
        {notes}
      </div>
      {actions && <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">{actions}</div>}
    </div>
  );
}
