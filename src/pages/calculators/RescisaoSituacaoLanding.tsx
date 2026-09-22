import { Navigate, useParams, Link } from "react-router-dom";
import { CalculatorLanding } from "@/components/calculators/CalculatorLanding";
import { RescisaoCalc } from "@/components/calculators/RescisaoCalc";
import { RESCISAO_SITUACOES, rescisaoPath } from "@/seo/rescisaoSituacoes";

export default function RescisaoSituacaoLanding() {
  const { situacao } = useParams<{ situacao: string }>();
  const dados = RESCISAO_SITUACOES.find(s => s.slug === situacao);

  if (!dados) {
    return <Navigate to="/calculadoras/rescisao-trabalhista" replace />;
  }

  const outras = RESCISAO_SITUACOES.filter(s => s.slug !== dados.slug);

  return (
    <CalculatorLanding
      title={dados.title}
      description={dados.description}
      path={rescisaoPath(dados.slug)}
      seoTitle={`${dados.seoTitle} | Honorífico`}
      seoDescription={dados.seoDescription}
      keywords={dados.keywords}
      features={dados.features}
      content={
        <>
          {dados.paragraphs.map(p => (
            <div key={p.heading}>
              <h2 className="text-h3 text-navy">{p.heading}</h2>
              <p className="mt-3">{p.body}</p>
            </div>
          ))}

          <h2 className="text-h3 text-navy">Outras situações de rescisão</h2>
          <ul>
            {outras.map(s => (
              <li key={s.slug} className="border-t border-cream-dark py-3">
                <Link
                  to={rescisaoPath(s.slug)}
                  className="text-navy underline underline-offset-4 hover:text-gold"
                >
                  {s.title}
                </Link>
              </li>
            ))}
            <li className="border-t border-cream-dark py-3">
              <Link
                to="/calculadoras/rescisao-trabalhista"
                className="text-navy underline underline-offset-4 hover:text-gold"
              >
                Calculadora de rescisão trabalhista, todas as situações
              </Link>
            </li>
          </ul>
        </>
      }
      faq={dados.faq}
    >
      <RescisaoCalc />
    </CalculatorLanding>
  );
}
