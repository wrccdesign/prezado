import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  DollarSign,
  FileDown,
  Scale,
  Search,
  Stethoscope,
  Zap,
} from "lucide-react";

const SITE_URL = "https://honorifico.com.br";

const etapas = [
  {
    titulo: "Você descreve o caso",
    texto:
      "Um campo de texto livre, sem formulário e sem termos técnicos. Bastam alguns detalhes: o mínimo aceito é 20 caracteres.",
  },
  {
    titulo: "Buscamos decisões relacionadas no acervo",
    texto:
      "Antes de responder, o sistema procura decisões do nosso banco por similaridade semântica e, como reforço, por busca textual.",
  },
  {
    titulo: "A análise é montada em campos fixos",
    texto:
      "O modelo responde em uma estrutura obrigatória — nada de texto solto — para que cada parte do diagnóstico venha sempre preenchida.",
  },
  {
    titulo: "Você segue no fluxo",
    texto:
      "Do resultado é possível abrir o chat jurídico com o caso já em contexto, iniciar uma petição do tipo sugerido ou exportar tudo.",
  },
];

const saida = [
  { icon: Search, titulo: "O que está acontecendo", texto: "A leitura jurídica do caso em linguagem comum." },
  { icon: Scale, titulo: "Qual é o seu direito", texto: "O direito envolvido, com a base legal explicada sem jargão." },
  { icon: ClipboardList, titulo: "O que você pode fazer", texto: "Passo a passo prático, em itens numerados." },
  { icon: DollarSign, titulo: "Quanto pode custar ou ganhar", texto: "Estimativa com as incertezas declaradas." },
  { icon: Building2, titulo: "Onde buscar ajuda", texto: "Juizado, vara competente, PROCON ou outro caminho aplicável." },
  { icon: Zap, titulo: "Nível de urgência", texto: "Baixa, média ou alta, com a justificativa e os prazos envolvidos." },
];

export default function DiagnosticoLanding() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Diagnóstico jurídico", item: `${SITE_URL}/diagnostico` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Diagnóstico jurídico — Honorífico",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: `${SITE_URL}/diagnostico`,
      inLanguage: "pt-BR",
      description:
        "Descreva um caso em linguagem comum e receba uma análise estruturada: direito envolvido, próximos passos, custos estimados, foro e urgência.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <SEO
        title="Diagnóstico jurídico do seu caso — Honorífico"
        description="Descreva o caso em linguagem comum e receba uma análise estruturada: direito envolvido, próximos passos, custos estimados, onde entrar e nível de urgência."
        path="/diagnostico"
        jsonLd={jsonLd}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="container max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-foreground leading-tight">
              De uma situação descrita em linguagem comum a uma leitura jurídica organizada
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              O diagnóstico transforma a descrição de uma situação em linguagem comum, sem termos técnicos, em uma
              análise organizada: qual é o direito envolvido, quais passos cabem agora, onde o caso deve
              ser levado e com que urgência. Serve tanto para quem precisa organizar uma primeira análise quanto para quem ainda
              está entendendo se existe um caso ali.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button asChild size="lg">
                <Link to="/auth?mode=signup">
                  Criar conta grátis <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/planos">Ver planos</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Toda conta nova começa com 7 dias no plano Profissional, sem cartão.
            </p>
          </div>
        </section>

        {/* Como funciona */}
        <section className="border-t border-border bg-muted/30">
          <div className="container max-w-4xl px-4 sm:px-6 py-12 sm:py-14 space-y-6">
            <h2 className="text-2xl font-semibold font-serif text-foreground">Como funciona</h2>
            <ol className="grid gap-4 sm:grid-cols-2">
              {etapas.map((e, i) => (
                <li key={e.titulo} className="rounded-lg border border-border bg-background p-5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 font-medium text-foreground">{e.titulo}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{e.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* O que você recebe */}
        <section className="container max-w-4xl px-4 sm:px-6 py-12 sm:py-14 space-y-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-semibold font-serif text-foreground">O que você recebe</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A saída é sempre a mesma estrutura, com a área do Direito identificada e o tipo de peça
              sugerido para o caso. O resultado pode ser exportado em PDF ou Word.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saida.map((s) => (
              <Card key={s.titulo}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <s.icon className="h-4 w-4 text-primary" />
                    {s.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.texto}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileDown className="h-4 w-4 text-primary" />
            Exportação do diagnóstico completo em PDF e Word, com a situação descrita e o aviso legal.
          </div>
        </section>

        {/* Fontes */}
        <section className="border-t border-border bg-muted/30">
          <div className="container max-w-4xl px-4 sm:px-6 py-12 sm:py-14 space-y-4">
            <h2 className="text-2xl font-semibold font-serif text-foreground">De onde vem o embasamento</h2>
            <div className="max-w-3xl space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Antes de gerar qualquer texto, o sistema consulta o acervo de decisões do Honorífico: primeiro
                por busca vetorial, que compara o sentido do relato com o das ementas indexadas, e depois por
                busca textual quando a primeira retorna pouca coisa. As decisões encontradas — tribunal, número
                do processo, comarca, data e trecho da ementa — entram no contexto da análise.
              </p>
              <p>
                A instrução dada ao modelo é restritiva: só pode citar jurisprudência que esteja nesse contexto.
                Quando nada relevante é encontrado, ele é orientado a declarar isso e a se limitar à legislação,
                em vez de improvisar um número de processo. Súmulas e artigos só entram quando não há dúvida
                sobre o teor; do contrário, o tema é citado de forma genérica.
              </p>
              <p>
                As decisões do acervo têm página própria no site, com link para a fonte no tribunal, o que
                permite conferir cada citação.{" "}
                <Link to="/jurisprudencia" className="underline underline-offset-2 hover:text-primary">
                  Ver a consulta de jurisprudência
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Limites honestos */}
        <section className="container max-w-4xl px-4 sm:px-6 py-12 sm:py-14">
          <div className="rounded-lg border border-border p-6 space-y-3 max-w-3xl">
            <h2 className="text-xl font-semibold font-serif text-foreground">O que o diagnóstico não é</h2>
            <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
              <li>
                Não é parecer nem substitui o juízo do advogado. É um ponto de partida para a análise, que
                precisa ser conferido antes de virar orientação a outra pessoa ou peça processual.
              </li>
              <li>
                Trabalha apenas com o que você escreveu. Sem documentos e sem os autos, a leitura do caso é
                necessariamente parcial.
              </li>
              <li>
                A estimativa de custos e de resultado é indicativa. Nenhum diagnóstico prevê o desfecho de um
                processo.
              </li>
              <li>
                Prazos e valores citados devem ser confirmados na fonte oficial antes de qualquer decisão.
              </li>
            </ul>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-border">
          <div className="container max-w-3xl px-4 sm:px-6 py-14 text-center space-y-4">
            <h2 className="text-2xl font-semibold font-serif text-foreground">
              Comece por um caso concreto
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Crie uma conta para descrever a situação e receber o diagnóstico estruturado. As calculadoras
              do Honorífico continuam livres, com ou sem conta.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Button asChild size="lg">
                <Link to="/auth?mode=signup">
                  Criar conta grátis <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/calculadoras">Ver calculadoras</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
