import { useState } from "react";
import { Link } from "react-router-dom";

// Registros reais da tabela `decisions`, todos com source_url oficial.
const casos = [
  {
    id: "software",
    fato: "A empresa vendeu a licença do software, o sistema não funcionou e ela ainda cobrou a multa contratual.",
    label: "Contrato de software",
    tribunal: "TJPR, 1ª Turma Recursal",
    tipo: "Acórdão",
    numeroCnj: "0035130-32.2024.8.16.0182",
    ementa:
      "Direito civil e do consumidor. Recurso inominado. Rescisão contratual. Contrato de licença de software. Vício na prestação de serviço evidenciada. Dever de informação. Cláusula penal afastada. Provimento.",
    destaque: "Cláusula penal afastada.",
    relatoria: "Relatora Vanessa Bassani. Julgado em 28/03/2026.",
    sourceUrl:
      "https://portal.tjpr.jus.br/jurisprudencia/j/2100000036785951/Ac%C3%B3rd%C3%A3o-0035130-32.2024.8.16.0182",
    ferramenta: { label: "Calcular rescisão", href: "/calculadoras" },
  },
  {
    id: "agro",
    fato: "O dono vendeu a terra arrendada sem oferecer antes ao arrendatário, que só tinha um acordo verbal.",
    label: "Arrendamento rural",
    tribunal: "TJPR, 20ª Câmara Cível",
    tipo: "Acórdão",
    numeroCnj: "0129456-45.2024.8.16.0000",
    ementa:
      "Direito civil e processual civil. Agravo de instrumento. Tutela de urgência. Direito de preferência do arrendatário rural. Alegado arrendamento verbal. Necessidade de dilação probatória. Indeferimento mantido. Recurso desprovido.",
    destaque: "Necessidade de dilação probatória.",
    relatoria: "Relator Helder Luis Henrique Taguchi. Julgado em 08/05/2026.",
    sourceUrl:
      "https://portal.tjpr.jus.br/jurisprudencia/j/4100000031706261/Ac%C3%B3rd%C3%A3o-0129456-45.2024.8.16.0000",
    ferramenta: { label: "Ver tema contratos agrários", href: "/jurisprudencia/tema/contratos-agrarios" },
  },
  {
    id: "rmc",
    fato: "Uma aposentada que não sabe ler descobriu descontos de um cartão consignado que diz não ter contratado.",
    label: "Cartão consignado RMC",
    tribunal: "TJPR, 14ª Câmara Cível",
    tipo: "Acórdão",
    numeroCnj: "0003303-57.2021.8.16.0101",
    ementa:
      "Direito civil e direito do consumidor. Apelação cível. Ação declaratória de nulidade contratual c/c repetição de indébito e danos morais. Contrato de cartão de crédito com reserva de margem consignável (RMC). Pessoa idosa e semianalfabeta, incapaz de ler e somente apta a escrever o próprio nome.",
    destaque: "Pessoa idosa e semianalfabeta",
    relatoria: "Relator Eduardo Novacki. Julgado em 10/09/2025.",
    sourceUrl:
      "https://portal.tjpr.jus.br/jurisprudencia/j/4100000033722801/Ac%C3%B3rd%C3%A3o-0003303-57.2021.8.16.0101",
    ferramenta: { label: "Calcular repetição de indébito", href: "/calculadoras" },
  },
  {
    id: "exec",
    fato: "O devedor não paga a dívida e a única renda encontrada é o salário dele.",
    label: "Penhora de salário",
    tribunal: "TJPR, 16ª Câmara Cível",
    tipo: "Acórdão",
    numeroCnj: "0111208-94.2025.8.16.0000",
    ementa:
      "Direito processual civil. Agravo de instrumento. Execução de título extrajudicial. Penhora de verba salarial. Relativização da impenhorabilidade. Possibilidade. Recurso parcialmente conhecido e provido.",
    destaque: "Relativização da impenhorabilidade.",
    relatoria: "Relatora Vania Maria da Silva Kramer. Julgado em 22/05/2026.",
    sourceUrl:
      "https://portal.tjpr.jus.br/jurisprudencia/j/4100000035300181/Ac%C3%B3rd%C3%A3o-0111208-94.2025.8.16.0000",
    ferramenta: { label: "Atualizar o débito", href: "#calcular" },
  },
];

const memoria = [
  { mes: "08/2024", indice: "IPCA", variacao: "-0,02%", saldo: "R$ 10.123,40" },
  { mes: "09/2024", indice: "Taxa Legal", variacao: "0,10%", saldo: "R$ 10.134,52" },
  { mes: "10/2024", indice: "Taxa Legal", variacao: "0,25%", saldo: "R$ 10.159,86" },
];

function Ementa({ texto, destaque }: { texto: string; destaque: string }) {
  const i = texto.indexOf(destaque);
  if (i < 0) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, i)}
      <mark className="bg-gold/15 text-navy px-0.5 rounded-sm">
        {destaque}
      </mark>
      {texto.slice(i + destaque.length)}
    </>
  );
}

export function HeroConsole() {
  const [ativo, setAtivo] = useState(casos[0].id);
  const [copiado, setCopiado] = useState(false);
  const caso = casos.find((c) => c.id === ativo) ?? casos[0];

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(caso.numeroCnj);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch {
      /* clipboard indisponível */
    }
  };

  const ferramentaClass = "font-medium underline underline-offset-4";

  return (
    <div className="lg:-mr-6">
      <div role="tablist" aria-label="Exemplos de decisões reais" className="flex flex-wrap gap-x-5 gap-y-2 mb-4 text-sm">
        {casos.map((c, n) => {
          const sel = c.id === ativo;
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={sel}
              onClick={() => setAtivo(c.id)}
              className={`pb-1 border-b-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                sel ? "border-navy text-navy font-medium" : "border-transparent text-navy/60 hover:text-navy"
              }`}
            >
              <span className="tabular-nums text-navy/50 mr-1.5">{String(n + 1).padStart(2, "0")}</span>
              {c.label}
            </button>
          );
        })}
      </div>

      <article
        role="tabpanel"
        aria-live="polite"
        className="bg-white text-navy border border-cream-dark border-t-[3px] border-t-gold rounded-lg overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 px-6 md:px-7 py-2 border-b border-cream-dark bg-cream/50 text-note text-navy/60">
          <span>Como o Honorífico responde</span>
          <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded border border-success/30 px-1.5 py-0.5 text-success">
            <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true"><path d="M2.5 6.2l2.2 2.2 4.8-4.9" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
            Fonte verificada
          </span>
        </div>

        <ol className="relative px-6 md:px-7 py-6 space-y-6">
          <span aria-hidden="true" className="absolute left-[2.45rem] md:left-[2.7rem] top-10 bottom-10 w-px bg-navy/20" />

          <li className="relative grid grid-cols-[2rem_1fr] gap-4">
            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-navy text-cream text-sm font-medium tabular-nums">1</span>
            <div>
              <h3 className="font-serif text-lg font-semibold leading-tight">Fato</h3>
              <p key={caso.id + "f"} className="font-serif text-[1.0625rem] leading-[1.55] text-navy/80 mt-1">{caso.fato}</p>
              <p className="text-note text-navy/50 mt-1">Situação de exemplo, descrita em linguagem comum.</p>
            </div>
          </li>

          <li className="relative grid grid-cols-[2rem_1fr] gap-4">
            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-navy text-cream text-sm font-medium tabular-nums">2</span>
            <div className="min-w-0">
              <h3 className="font-serif text-lg font-semibold leading-tight">Precedente</h3>
              <p className="text-sm font-medium mt-1">{caso.tribunal}, {caso.tipo}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm text-navy/70">{caso.numeroCnj}</span>
                <button
                  type="button"
                  onClick={copiar}
                  className="rounded border border-cream-dark px-1.5 py-0.5 text-note text-navy/65 hover:border-navy/40 hover:text-navy transition-colors duration-150"
                >
                  {copiado ? "Copiado" : "Copiar"}
                </button>
              </div>
              <p key={caso.id} className="font-serif text-[1rem] leading-[1.55] line-clamp-3 border-l-2 border-cream-dark pl-3 mt-2">
                <Ementa texto={caso.ementa} destaque={caso.destaque} />
              </p>
              <a href={caso.sourceUrl} target="_blank" rel="noopener" className={`${ferramentaClass} text-note inline-block mt-2`}>
                Abrir acórdão no tribunal
              </a>
            </div>
          </li>

          <li className="relative grid grid-cols-[2rem_1fr] gap-4">
            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-navy text-cream text-sm font-medium tabular-nums">3</span>
            <div className="min-w-0">
              <h3 className="font-serif text-lg font-semibold leading-tight">Cálculo</h3>
              <p className="text-note text-navy/60 mt-1 mb-1">Exemplo de memória de cálculo anexada, IPCA e Taxa Legal</p>
              <table className="w-full text-sm tabular-nums">
                <tbody>
                  {memoria.map((r) => (
                    <tr key={r.mes} className="border-t border-cream-dark">
                      <td className="py-1">{r.mes}</td>
                      <td className="py-1">{r.indice}</td>
                      <td className="py-1 text-right">{r.variacao}</td>
                      <td className="py-1 text-right">{r.saldo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {caso.ferramenta.href.startsWith("#") ? (
                <a href={caso.ferramenta.href} className={`${ferramentaClass} text-note inline-block mt-2`}>{caso.ferramenta.label}</a>
              ) : (
                <Link to={caso.ferramenta.href} className={`${ferramentaClass} text-note inline-block mt-2`}>{caso.ferramenta.label}</Link>
              )}
            </div>
          </li>
        </ol>
      </article>
    </div>
  );
}
