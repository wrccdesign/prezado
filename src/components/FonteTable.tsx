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

      <div className="overflow-x-auto">
        <table className="mt-10 w-full text-sm text-left">
          <thead>
            <tr className="border-b border-cream-dark font-medium">
              <th scope="col" className="py-3 pr-4"></th>
              <th scope="col" className="py-3 pr-4">Sem fonte verificável</th>
              <th scope="col" className="py-3">No Honorífico</th>
            </tr>
          </thead>
          <tbody>
            {fonteRows.map((r) => (
              <tr key={r.label} className="border-b border-cream-dark">
                <th scope="row" className="py-3 pr-4 font-medium align-top">{r.label}</th>
                <td className="py-3 pr-4 text-navy/70 align-top">{r.sem}</td>
                <td className="py-3 align-top">{r.com}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
