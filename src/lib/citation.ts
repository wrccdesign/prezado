interface CitationInput {
  tribunal?: string | null;
  tipo_decisao?: string | null;
  numero_processo?: string | null;
  relator?: string | null;
  data_decisao?: string | null;
  resultado?: string | null;
  ementa?: string | null;
  comarca?: string | null;
  uf?: string | null;
}

export function formatCitation(d: CitationInput): string {
  const parts: string[] = ["BRASIL"];

  if (d.tribunal) parts.push(d.tribunal);
  if (d.tipo_decisao && d.numero_processo) {
    parts.push(`${d.tipo_decisao} nº ${d.numero_processo}`);
  } else if (d.numero_processo) {
    parts.push(`Processo nº ${d.numero_processo}`);
  }
  if (d.relator) parts.push(`Relator: ${d.relator}`);
  if (d.comarca && d.uf) parts.push(`${d.comarca}/${d.uf}`);
  if (d.data_decisao) {
    parts.push(
      `Julgado em ${new Date(d.data_decisao).toLocaleDateString("pt-BR")}`
    );
  }
  if (d.resultado) parts.push(`Resultado: ${d.resultado}`);

  let citation = parts.join(". ") + ".";

  if (d.ementa) {
    const trimmed = d.ementa.length > 300 ? d.ementa.slice(0, 297) + "..." : d.ementa;
    citation += ` Ementa: "${trimmed}"`;
  }

  return citation;
}
