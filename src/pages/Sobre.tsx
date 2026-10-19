export const WAGNER_FULL_NAME = "Wagner Rosati da Costa Carvalho";
export const WAGNER_NAME = WAGNER_FULL_NAME.split(" ")[0];

import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import antonioPhoto from "@/assets/equipe/antonio-paulo-da-costa-carvalho.webp";

const description = "Conheça quem está por trás do Honorífico e como a plataforma trabalha: fonte rastreável, transparência quando não encontra decisão e conferência automática.";

interface TeamMemberProps {
  name: string;
  credential?: string;
  role: string;
  text: string;
  photo?: string;
}

function TeamMember({ name, credential, role, text, photo }: TeamMemberProps) {
  return (
    <div className="border-t border-cream-dark pt-6">
      {photo && (
        <img src={photo} alt={name} width={240} height={300} className="mb-6 aspect-[4/5] w-60 max-w-full rounded-lg object-cover" />
      )}
      <h3 className="text-h3 text-navy">{name}</h3>
      {credential && <p className="text-reading text-navy/70 mt-1">{credential}</p>}
      <p className="text-reading font-medium text-navy mt-3">{role}</p>
      <p className="text-body-serif text-navy/75 max-w-[68ch] mt-4">{text}</p>
    </div>
  );
}

const steps = [
  { title: "Fonte primeiro.", text: "Cada precedente citado vem do acervo consultável, com link para a fonte oficial no tribunal." },
  { title: "Dizer quando não sabe.", text: "Se não há decisão localizada sobre o ponto, a resposta diz isso em vez de preencher a lacuna." },
  { title: "Conferência automática.", text: "Valores, datas e citações passam por verificação antes de chegar a você, e o resultado é exibido." },
];

export default function Sobre() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-cream text-navy">
      <SEO title="Quem faz o Honorífico" description={description} path="/sobre" />
      <AppHeader />
      <main className="flex-1">
        <section className="py-12 md:py-20 border-b border-cream-dark">
          <div className="container max-w-[1120px] mx-auto px-4 sm:px-6">
            <h1 className="text-h1 text-navy">Quem faz o Honorífico</h1>
            <p className="text-body-serif text-navy/75 max-w-[68ch] mt-6">O Honorífico nasceu de uma ideia simples: toda resposta jurídica precisa mostrar de onde veio. Quando há precedente, ele aparece com o link para o tribunal. Quando não há, a resposta diz que não encontrou.</p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container max-w-[1120px] mx-auto px-4 sm:px-6">
            <h2 className="text-h2 text-navy">As pessoas por trás da plataforma</h2>
            <div className="grid gap-12 md:grid-cols-2 mt-10">
              <TeamMember name={WAGNER_NAME} role="Criador do Honorífico" text="Designer de produto há mais de 20 anos. Criou o Honorífico para que advogados, estudantes e qualquer pessoa com uma dúvida jurídica tenham respostas claras, com a fonte à vista." />
              <TeamMember name="Antônio Paulo da Costa Carvalho" credential="Advogado, OAB/SP 29.106" role="Conteúdo jurídico e metodologia" photo={antonioPhoto} text="Mestre em Direito, com título de Master Universitario em Teorias Críticas del Derecho y la Democracia en Iberoamérica pela Universidad Internacional de Andalucía, Espanha (1999), e mestre em Instituições Jurídico-Políticas pela UFSC (2002). Foi Defensor Público em Mato Grosso do Sul (1982 a 1984) e Juiz de Direito em Mato Grosso, nas comarcas de Sinop, Rondonópolis e Cuiabá (1985 a 1997). Acompanha o conteúdo jurídico e o método de verificação de fontes da plataforma." />
            </div>
          </div>
        </section>

        <section className="pb-16 md:pb-24">
          <div className="container max-w-[1120px] mx-auto px-4 sm:px-6">
            <h2 className="text-h2 text-navy">Como trabalhamos</h2>
            <ol className="grid gap-x-8 gap-y-10 md:grid-cols-3 mt-10">
              {steps.map((step, index) => (
                <li key={step.title} className="border-t border-cream-dark pt-6">
                  <span className="font-serif text-5xl leading-none text-navy/15 tabular">0{index + 1}</span>
                  <h3 className="text-h3 text-navy mt-5">{step.title}</h3>
                  <p className="text-reading text-navy/70 max-w-[60ch] mt-3">{step.text}</p>
                </li>
              ))}
            </ol>
            <p className="text-note text-navy/60 border-t border-cream-dark mt-12 pt-6">O Honorífico é uma plataforma de informação e apoio ao trabalho jurídico. Não presta serviços de advocacia nem atende casos individuais. O acompanhamento jurídico descrito nesta página se refere ao conteúdo e à metodologia da plataforma, não a cada resposta gerada.</p>
          </div>
        </section>

        <section className="bg-navy py-16 md:py-20">
          <div className="container max-w-[1120px] mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-h2 text-cream">Comece pelo caso que está na sua mesa.</h2>
            <div className="mt-8 flex flex-wrap gap-6 justify-center items-center">
              <Button size="lg" className="bg-gold text-navy hover:bg-gold-light font-medium rounded" asChild><Link to="/auth">Criar conta grátis</Link></Button>
              <Link to="/planos" className="text-cream underline underline-offset-4 hover:text-gold">Ver planos</Link>
            </div>
          </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}