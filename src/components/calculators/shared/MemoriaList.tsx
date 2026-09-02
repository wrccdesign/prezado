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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-cream-dark">
            <th scope="col" className="py-2 pr-4 text-note text-navy/60">
              Etapa
            </th>
            <th scope="col" className="py-2 pr-4 text-note text-navy/60">
              Detalhe
            </th>
            <th scope="col" className="py-2 text-right text-note text-navy/60">
              Valor
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((l, i) => (
            <tr key={`${l.rotulo}-${i}`} className="border-b border-cream-dark align-top">
              <td className="py-2 pr-4 text-sm text-navy">{l.rotulo}</td>
              <td className="py-2 pr-4 text-note text-navy/70">{l.detalhe}</td>
              <td className="py-2 text-right text-sm text-navy tabular whitespace-nowrap">
                {l.valor != null ? fmtBRL(l.valor) : ""}
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
