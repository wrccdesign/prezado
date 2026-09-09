import { Link } from "react-router-dom";

export const fonteRows: { label: string; sem: string; com: string }[] = [
  { label: "Tribunal", sem: "Pode vir inventado ou omitido", com: "Vem do registro oficial consultado" },
  { label: "Número do processo", sem: "Formato plausível, sem garantia de existir", com: "Número CNJ real, com botão de copiar" },
  { label: "Conferência", sem: "Não há link", com: "Link direto para a fonte no CNJ/DataJud" },
  { label: "Quando não há decisão", sem: "A resposta preenche o vazio", com: "A resposta diz que não encontrou" },
  { label: "Origem da fonte", sem: "Não informada", com: "CNJ/DataJud, registro oficial do Judiciário, não um acervo privado" },
];

interface FonteTableProps {
  title: string;
  intro?: string;
  note?: string;
  linkLabel?: string;
  linkTo?: string;
}

export function FonteTable({
  title,
  intro,
  note = "Coluna da esquerda é ilustrativa e não se refere a nenhuma ferramenta específica.",
  linkLabel,
  linkTo,
}: FonteTableProps) {
  return (
    <>
      <h2 className="text-h2">{title}</h2>
      {intro ? <p className="text-body-serif text-navy/80 max-w-[60ch] mt-3">{intro}</p> : null}

      <div className="mt-8 overflow-hidden rounded-lg border border-cream-dark bg-white">
        <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-cream-dark bg-cream-dark/45 font-medium">
              <th scope="col" className="px-5 py-4"></th>
              <th scope="col" className="px-5 py-4 text-navy/60">Sem fonte verificável</th>
              <th scope="col" className="border-l border-gold/20 px-5 py-4 text-navy">No Honorífico</th>
            </tr>
          </thead>
          <tbody>
            {fonteRows.map((r) => (
              <tr key={r.label} className="border-b border-cream-dark last:border-b-0">
                <th scope="row" className="px-5 py-4 font-medium align-top">{r.label}</th>
                <td className="px-5 py-4 text-navy/60 align-top">{r.sem}</td>
                <td className="border-l border-gold/20 px-5 py-4 align-top">{r.com}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {note ? <p className="text-note text-navy/60 mt-4">{note}</p> : null}
      {linkLabel && linkTo ? (
        <Link to={linkTo} className="mt-4 inline-block font-medium underline underline-offset-4">
          {linkLabel}
        </Link>
      ) : null}
    </>
  );
}
