export interface IntegritySignal {
  tipo: "texto_minusculo" | "fora_da_pagina" | "caractere_invisivel" | "comando_para_ia";
  pagina?: number;
  trecho: string;
}

export interface IntegrityReport {
  status: "sem_sinais" | "suspeito";
  sinais: IntegritySignal[];
  verificado: string[];
}

const ROTULO: Record<IntegritySignal["tipo"], string> = {
  comando_para_ia: "Comando dirigido a uma IA",
  texto_minusculo: "Texto em fonte microscópica, ilegível na leitura humana",
  fora_da_pagina: "Texto posicionado fora da área visível da página",
  caractere_invisivel: "Caracteres invisíveis inseridos no texto",
};

/** Junta dois relatórios (leitura do arquivo e análise), sem repetir sinais. */
export function mergeIntegrity(a?: IntegrityReport | null, b?: IntegrityReport | null): IntegrityReport | null {
  if (!a && !b) return null;
  const vistos = new Set<string>();
  const sinais = [...(a?.sinais ?? []), ...(b?.sinais ?? [])].filter((s) => {
    const k = `${s.tipo}|${s.pagina ?? ""}|${s.trecho}`;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
  const verificado = Array.from(new Set([...(a?.verificado ?? []), ...(b?.verificado ?? [])]));
  return { status: sinais.length ? "suspeito" : "sem_sinais", sinais, verificado };
}

/**
 * Verificação de integridade do documento. Aponta sinais objetivos de
 * comando oculto; não afirma má-fé, que depende de juízo do advogado.
 */
export function IntegrityBlock({ report }: { report?: IntegrityReport | null }) {
  if (!report) return null;

  if (report.status === "sem_sinais") {
    return (
      <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Integridade do documento: nenhum comando oculto encontrado. Verificamos {report.verificado.join(", ")}.
      </p>
    );
  }

  return (
    <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 sm:p-5 space-y-3">
      <p className="text-sm font-medium text-destructive">Possível comando oculto neste documento</p>
      <p className="text-sm leading-relaxed text-foreground">
        Encontramos trechos que parecem escritos para induzir uma IA ou o julgador a erro, e não para leitura humana.
        Confira o original antes de concluir qualquer coisa.
      </p>
      <ul className="space-y-2">
        {report.sinais.map((s, i) => (
          <li key={i} className="rounded border border-border bg-background p-3 text-sm">
            <span className="block font-medium text-foreground">
              {ROTULO[s.tipo]}
              {s.pagina ? `, página ${s.pagina}` : ""}
            </span>
            <span className="mt-1 block break-words font-mono text-xs text-muted-foreground">{s.trecho}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Se o documento é da parte contrária e o trecho se confirmar, a conduta pode configurar litigância de má-fé
        (arts. 79 a 81 do CPC). Se o documento é seu, remova o trecho antes de protocolar.
      </p>
    </div>
  );
}
