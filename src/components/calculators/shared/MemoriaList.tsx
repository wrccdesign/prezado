import { fmtBRL } from "@/lib/currency";

export interface MemoriaItem {
  rotulo: string;
  detalhe: string;
  valor: number | null;
}

/**
 * Memória de cálculo. Vira lista empilhada em telas estreitas (sem tabela
 * com overflow horizontal) e alinha valores à direita no desktop.
 */
export function MemoriaList({ items }: { items: MemoriaItem[] }) {
  return (
    <ul className="divide-y rounded-lg border">
      {items.map((l, i) => (
        <li
          key={`${l.rotulo}-${i}`}
          className="flex flex-col gap-1 p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
        >
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium">{l.rotulo}</p>
            <p className="break-words text-xs text-muted-foreground">{l.detalhe}</p>
          </div>
          <p className="text-sm font-medium sm:whitespace-nowrap sm:text-right">
            {l.valor != null ? fmtBRL(l.valor) : "—"}
          </p>
        </li>
      ))}
    </ul>
  );
}
