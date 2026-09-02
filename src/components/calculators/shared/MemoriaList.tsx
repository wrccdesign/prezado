import { fmtBRL } from "@/lib/currency";

export interface MemoriaItem {
  rotulo: string;
  detalhe: string;
  valor: number | null;
}

/**
 * Memória de cálculo em tabela real: rótulo, detalhe e valor.
 * Rola na horizontal apenas quando a tela não comporta as três colunas.
 */
export function MemoriaList({ items }: { items: MemoriaItem[] }) {
  return (
    <ul className="divide-y divide-cream-dark rounded-lg border border-cream-dark bg-white">
      {items.map((l, i) => (
        <li key={`${l.rotulo}-${i}`} className="flex items-baseline justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-navy">{l.rotulo}</p>
            <p className="text-note text-navy/60">{l.detalhe}</p>
          </div>
          <p className="text-sm font-medium text-navy tabular whitespace-nowrap">
            {l.valor != null ? fmtBRL(l.valor) : <span className="text-navy/50">sem valor</span>}
          </p>
        </li>
      ))}
    </ul>
  );
}
