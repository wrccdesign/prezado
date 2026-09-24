import { Navigate, useParams, Link } from "react-router-dom";
import { CalculatorLanding } from "@/components/calculators/CalculatorLanding";
import { CorrecaoCalc } from "@/components/calculators/CorrecaoCalc";
import { CORRECAO_INDICES, CORRECAO_BASE_PATH, correcaoPath } from "@/seo/correcaoIndices";

export default function CorrecaoIndiceLanding() {
  const { indice } = useParams<{ indice: string }>();
  const dados = CORRECAO_INDICES.find((i) => i.slug === indice);

  if (!dados) {
    return <Navigate to={CORRECAO_BASE_PATH} replace />;
  }

  const outros = CORRECAO_INDICES.filter((i) => i.slug !== dados.slug);

  return (
    <CalculatorLanding
      title={dados.title}
      description={dados.description}
      path={correcaoPath(dados.slug)}
      seoTitle={`${dados.seoTitle} | Honorífico`}
      seoDescription={dados.seoDescription}
      keywords={dados.keywords}
      features={dados.features}
      content={
        <>
          {dados.paragraphs.map((p) => (
            <div key={p.heading}>
              <h2 className="text-h3 text-navy">{p.heading}</h2>
              <p className="mt-3">{p.body}</p>
            </div>
          ))}

          <h2 className="text-h3 text-navy">Outros índices de atualização</h2>
          <ul>
            {outros.map((i) => (
              <li key={i.slug} className="border-t border-cream-dark py-3">
                <Link
                  to={correcaoPath(i.slug)}
                  className="text-navy underline underline-offset-4 hover:text-gold"
                >
                  {i.title}
                </Link>
              </li>
            ))}
            <li className="border-t border-cream-dark py-3">
              <Link
                to={CORRECAO_BASE_PATH}
                className="text-navy underline underline-offset-4 hover:text-gold"
              >
                Calculadora de correção monetária e juros, todos os índices
              </Link>
            </li>
          </ul>
        </>
      }
      faq={dados.faq}
    >
      <CorrecaoCalc />
    </CalculatorLanding>
  );
}
