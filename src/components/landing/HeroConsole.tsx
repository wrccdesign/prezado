import { useState } from "react";
import { Link } from "react-router-dom";

// Registros reais da tabela `decisions`, todos com source_url oficial.
const casos = [
  {
    id: "software",
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
          <span>Registro público do Judiciário, CNJ/DataJud</span>
          <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded border border-success/30 px-1.5 py-0.5 text-success">
            <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true"><path d="M2.5 6.2l2.2 2.2 4.8-4.9" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
            Fonte verificada
          </span>
        </div>
        <header className="px-6 md:px-7 pt-5 pb-4 border-b border-cream-dark">
          <div className="flex items-start justify-between gap-4 text-sm font-medium">
            <span className="font-serif text-lg font-semibold leading-tight">{caso.tribunal}</span>
            <span className="text-navy/60 font-normal">{caso.tipo}</span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-mono text-sm text-navy/70">{caso.numeroCnj}</span>
            <button
              type="button"
              onClick={copiar}
              className="rounded border border-cream-dark px-1.5 py-0.5 text-note text-navy/65 hover:border-navy/40 hover:text-navy transition-colors duration-150"
            >
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
        </header>

        <div className="px-6 md:px-7 py-5">
          <p className="text-note text-navy/60 mb-2">Trecho da ementa</p>
          <p key={caso.id} className="font-serif text-[1.0625rem] leading-[1.6] line-clamp-5 border-l-2 border-cream-dark pl-4 animate-in fade-in duration-150 motion-reduce:animate-none">
            <Ementa texto={caso.ementa} destaque={caso.destaque} />
          </p>
          <p className="text-note text-navy/60 mt-3">{caso.relatoria}</p>
        </div>

        <div className="px-6 md:px-7 py-4 border-t border-cream-dark bg-cream/40">
          <p className="text-note text-navy/60 mb-2">Exemplo de memória de cálculo anexada</p>
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="text-left text-navy/60">
                <th className="font-medium pb-1">Mês</th>
                <th className="font-medium pb-1">Índice</th>
                <th className="font-medium pb-1 text-right">Variação</th>
                <th className="font-medium pb-1 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {memoria.map((r) => (
                <tr key={r.mes} className="border-t border-cream-dark">
                  <td className="py-1.5">{r.mes}</td>
                  <td className="py-1.5">{r.indice}</td>
                  <td className="py-1.5 text-right">{r.variacao}</td>
                  <td className="py-1.5 text-right">{r.saldo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="px-6 md:px-7 py-4 border-t border-cream-dark flex flex-wrap items-center justify-between gap-3 text-note">
          <a href={caso.sourceUrl} target="_blank" rel="noopener" className={ferramentaClass}>
            Abrir acórdão no tribunal
          </a>
          {caso.ferramenta.href.startsWith("#") ? (
            <a href={caso.ferramenta.href} className={ferramentaClass}>{caso.ferramenta.label}</a>
          ) : (
            <Link to={caso.ferramenta.href} className={ferramentaClass}>{caso.ferramenta.label}</Link>
          )}
        </footer>
      </article>
    </div>
  );
}
