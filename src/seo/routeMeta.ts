// Fonte única de verdade das meta tags por rota pública.
// Consumido no cliente (páginas via Helmet/SEO) e no build (plugin
// "static-route-meta" em vite.config.ts). Sem imports de React ou de
// APIs de browser — este arquivo roda também em Node.
// Ao alterar as rotas aqui, atualize também public/sitemap.xml.

export type RouteMeta = {
  path: string;
  title: string;
  description: string;
  ogImage: string;
};

export const SITE_URL = "https://honorifico.com.br";

const OG_DEFAULT = "/og/home.jpg";

export const ROUTE_META: RouteMeta[] = [
  {
    path: "/",
    title: "Do caso à petição, com fonte — Honorífico",
    description:
      "Plataforma jurídica com diagnóstico do caso, consulta processual no acervo do CNJ, análise de peças, petições e cálculos pelas séries do Banco Central.",
    ogImage: OG_DEFAULT,
  },
  {
    path: "/calculadoras",
    title: "Calculadoras jurídicas grátis — Honorífico",
    description:
      "Sete calculadoras gratuitas: custas do TJSP, correção monetária e juros, prazo processual, rescisão, pensão alimentícia, CPF/CNPJ e operações com datas.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/calculadoras/correcao-monetaria-juros-lei-14905",
    title: "Correção monetária e juros — Honorífico",
    description:
      "Atualize valores por IPCA, INPC, IGP-M, Selic e Taxa Legal com séries do Banco Central e juros da Lei 14.905/2024. Memória de cálculo mês a mês, grátis.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/calculadoras/prazo-processual",
    title: "Prazo processual em dias úteis — Honorífico",
    description:
      "Conte prazos em dias úteis do CPC com feriados forenses, suspensões e recesso, a partir da disponibilização no DJe e da publicação. Grátis, sem login.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/calculadoras/validador-cpf-cnpj",
    title: "Validador de CPF e CNPJ — Honorífico",
    description:
      "Confira os dígitos verificadores de CPF e CNPJ pelo algoritmo de módulo 11. O número é processado no navegador, sem consulta à Receita Federal.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/calculadoras/operacoes-datas",
    title: "Operações com datas — Honorífico",
    description:
      "Some ou subtraia dias úteis e corridos, calcule a diferença entre duas datas e veja se a data cai em dia útil. Para prazos contratuais e controle interno.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/calculadoras/custas-tjsp",
    title: "Custas processuais do TJSP — Honorífico",
    description:
      "Taxa judiciária do TJSP pela Lei 11.608/2003: 1,5% do valor da causa, UFESP vigente, piso de 5 e teto de 3.000 UFESPs, com memória de cálculo detalhada.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/calculadoras/rescisao-trabalhista",
    title: "Cálculo de rescisão trabalhista — Honorífico",
    description:
      "Saldo de salário, aviso prévio, 13º e férias proporcionais, FGTS e multa, na dispensa sem justa causa, no pedido de demissão e no acordo do art. 484-A.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/calculadoras/pensao-alimenticia",
    title: "Cálculo de pensão alimentícia — Honorífico",
    description:
      "Estime a faixa de pensão pelo binômio necessidade e possibilidade do art. 1.694 do Código Civil, considerando renda, filhos, moradia e padrão de vida.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/diagnostico",
    title: "Diagnóstico jurídico do caso — Honorífico",
    description:
      "Descreva o caso em linguagem comum e receba uma análise estruturada: direito envolvido, próximos passos, custos estimados, onde entrar e nível de urgência.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/jurisprudencia",
    title: "Consulta processual e jurisprudência — Honorífico",
    description:
      "Consulte processos de 33 tribunais com dados oficiais do CNJ e link para a fonte. Acervo de jurisprudência com ementa em expansão e resumo por IA.",
    ogImage: "/og/jurisprudencia.jpg",
  },

  {
    path: "/modelos-de-minutas",
    title: "Modelos de minutas jurídicas — Honorífico",
    description:
      "Minutas editáveis e gratuitas: petição inicial, contestação, apelação, notificação, procuração, contrato de honorários e acordo, com base legal citada.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/modelos-de-minutas/peticao-inicial-cobranca",
    title: "Petição inicial de cobrança — Honorífico",
    description:
      "Modelo editável de petição inicial de cobrança pelo procedimento comum (art. 319 do CPC), com fatos, fundamentação, pedidos, valor da causa e checklist.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/modelos-de-minutas/contestacao-civel",
    title: "Modelo de contestação cível — Honorífico",
    description:
      "Modelo editável de contestação cível (arts. 335 a 342 do CPC) com preliminares, prescrição, impugnação específica dos fatos, pedidos finais e checklist.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/modelos-de-minutas/reclamacao-trabalhista",
    title: "Reclamação trabalhista — Honorífico",
    description:
      "Modelo editável de reclamação trabalhista com pedidos líquidos (art. 840, §1º, da CLT), verbas rescisórias, horas extras e requerimentos processuais.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/modelos-de-minutas/notificacao-extrajudicial",
    title: "Notificação extrajudicial — Honorífico",
    description:
      "Modelo editável de notificação extrajudicial para constituição em mora, com prazo para cumprimento, advertência sobre medidas judiciais e checklist de envio.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/modelos-de-minutas/procuracao-ad-judicia",
    title: "Procuração ad judicia — Honorífico",
    description:
      "Modelo editável de procuração ad judicia et extra com poderes especiais do art. 105 do CPC, para representação judicial e extrajudicial do cliente.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/modelos-de-minutas/recurso-apelacao",
    title: "Recurso de apelação — Honorífico",
    description:
      "Modelo editável de recurso de apelação (arts. 1.009 a 1.014 do CPC): petição de interposição, razões recursais, preliminares e pedido de reforma.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/modelos-de-minutas/contrato-prestacao-servicos-advocaticios",
    title: "Contrato de honorários — Honorífico",
    description:
      "Modelo editável de contrato de honorários advocatícios: objeto, honorários fixos e de êxito, reembolso de despesas, hipóteses de rescisão e foro eleito.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/modelos-de-minutas/acordo-extrajudicial-homologacao",
    title: "Acordo extrajudicial — Honorífico",
    description:
      "Modelo editável de acordo extrajudicial com petição conjunta de homologação judicial (arts. 515, III, e 725, VIII, do CPC), com cláusulas e checklist.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/comparativo",
    title: "Comparativo de ferramentas — Honorífico",
    description:
      "Como o Honorífico se posiciona frente a JusBrasil, Advbox e assistentes generalistas em cálculo com fonte, consulta ao acervo do CNJ e geração de peças.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/planos",
    title: "Planos e preços — Honorífico",
    description:
      "Gratuito, Profissional a R$ 49/mês e Escritório. Sete dias de teste no Profissional, sem cartão, cobrança em reais e cancelamento a qualquer momento.",
    ogImage: "/og/planos.jpg",
  },
  {
    path: "/mapa-do-site",
    title: "Mapa do site — Honorífico",
    description:
      "Todas as páginas públicas do Honorífico reunidas: calculadoras, consulta processual, modelos de minutas, comparativo, planos e documentos legais.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/termos",
    title: "Termos e condições de uso — Honorífico",
    description:
      "Condições de uso do Honorífico: contratação e planos, cotas de uso, responsabilidades das partes, propriedade intelectual e encerramento da conta.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/reembolso",
    title: "Política de reembolso — Honorífico",
    description:
      "Como pedir reembolso de uma assinatura do Honorífico: prazo de 30 dias, forma de solicitação, situações cobertas e prazo para devolução do valor pago.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
  {
    path: "/privacidade",
    title: "Aviso de privacidade — Honorífico",
    description:
      "Como o Honorífico trata dados pessoais: base legal conforme a LGPD, finalidades de uso, compartilhamento com operadores, retenção e direitos do titular.",
    ogImage: OG_DEFAULT, // TODO: OG própria
  },
];

export function getRouteMeta(path: string): RouteMeta | undefined {
  const normalized = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return ROUTE_META.find((m) => m.path === normalized);
}
